import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';

// Une commande compte dans les ventes dès qu'elle est payée (et tant qu'elle n'est pas annulée)
const SOLD = Prisma.sql`('PAID', 'SHIPPED', 'COMPLETED')`;

// Lundi 00:00 UTC de la semaine d'une date (même découpage que date_trunc('week') de PostgreSQL)
function weekStart(date) {
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const offset = (day.getUTCDay() + 6) % 7; // lundi = 0
  day.setUTCDate(day.getUTCDate() - offset);
  return day;
}

// Les requêtes ci-dessous sont écrites en SQL (agrégations, jointures, GROUP BY).
// $queryRaw avec des ${…} envoie des requêtes paramétrées : aucune injection SQL possible.
export async function getDashboardStats({ period }) {
  const since = new Date(Date.now() - period * 24 * 60 * 60 * 1000);

  const [[totals], weekly, byType, topProducts, departures, [fill]] = await Promise.all([
    prisma.$queryRaw`
      SELECT COALESCE(SUM(total_cents), 0)::bigint AS revenue, COUNT(*)::int AS orders
      FROM orders
      WHERE paid_at >= ${since} AND status IN ${SOLD}`,

    prisma.$queryRaw`
      SELECT date_trunc('week', paid_at) AS week, SUM(total_cents)::bigint AS revenue, COUNT(*)::int AS orders
      FROM orders
      WHERE paid_at >= ${since} AND status IN ${SOLD}
      GROUP BY week
      ORDER BY week`,

    prisma.$queryRaw`
      SELECT p.type::text AS type, SUM(oi.unit_price_cents * oi.quantity)::bigint AS revenue, SUM(oi.quantity)::int AS quantity
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      JOIN variants v ON v.id = oi.variant_id
      JOIN products p ON p.id = v.product_id
      WHERE o.paid_at >= ${since} AND o.status IN ${SOLD}
      GROUP BY p.type`,

    prisma.$queryRaw`
      SELECT p.id, p.name, p.type::text AS type, SUM(oi.quantity)::int AS quantity,
             SUM(oi.unit_price_cents * oi.quantity)::bigint AS revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      JOIN variants v ON v.id = oi.variant_id
      JOIN products p ON p.id = v.product_id
      WHERE o.paid_at >= ${since} AND o.status IN ${SOLD}
      GROUP BY p.id, p.name, p.type
      ORDER BY revenue DESC
      LIMIT 5`,

    // Prochains départs : places vendues (commandes payées) et places restantes (stock)
    prisma.$queryRaw`
      SELECT v.id, p.name, v.departure_date AS "departureDate", v.travel_class::text AS "travelClass", v.stock,
             COALESCE(SUM(oi.quantity) FILTER (WHERE o.status IN ${SOLD}), 0)::int AS sold
      FROM variants v
      JOIN products p ON p.id = v.product_id
      LEFT JOIN order_items oi ON oi.variant_id = v.id
      LEFT JOIN orders o ON o.id = oi.order_id
      WHERE v.departure_date >= CURRENT_DATE AND v.is_active AND NOT p.is_archived
      GROUP BY v.id, p.name
      ORDER BY v.departure_date, v.travel_class
      LIMIT 8`,

    // Taux de remplissage moyen sur tous les départs à venir
    prisma.$queryRaw`
      SELECT COALESCE(SUM(sold), 0)::int AS sold, COALESCE(SUM(stock), 0)::int AS remaining
      FROM (
        SELECT v.stock, COALESCE(SUM(oi.quantity) FILTER (WHERE o.status IN ${SOLD}), 0) AS sold
        FROM variants v
        JOIN products p ON p.id = v.product_id
        LEFT JOIN order_items oi ON oi.variant_id = v.id
        LEFT JOIN orders o ON o.id = oi.order_id
        WHERE v.departure_date >= CURRENT_DATE AND v.is_active AND NOT p.is_archived
        GROUP BY v.id
      ) AS departures`,
  ]);

  const revenueCents = Number(totals.revenue);
  const capacity = fill.sold + fill.remaining;

  // Une entrée par semaine de la période, y compris les semaines sans vente (à 0)
  const byWeek = new Map(weekly.map((row) => [weekStart(new Date(row.week)).toISOString(), row]));
  const revenueByWeek = [];
  for (let week = weekStart(since); week <= new Date(); week.setUTCDate(week.getUTCDate() + 7)) {
    const row = byWeek.get(week.toISOString());
    revenueByWeek.push({
      week: week.toISOString().slice(0, 10),
      revenueCents: row ? Number(row.revenue) : 0,
      orders: row ? row.orders : 0,
    });
  }

  const typeRow = (type) => byType.find((row) => row.type === type);

  return {
    period,
    kpis: {
      revenueCents,
      paidOrders: totals.orders,
      averageOrderCents: totals.orders ? Math.round(revenueCents / totals.orders) : 0,
      averageFillRate: capacity ? fill.sold / capacity : 0,
    },
    revenueByWeek,
    salesByType: ['TRIP', 'GOODIE'].map((type) => ({
      type,
      revenueCents: Number(typeRow(type)?.revenue ?? 0),
      quantity: typeRow(type)?.quantity ?? 0,
    })),
    topProducts: topProducts.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      quantity: row.quantity,
      revenueCents: Number(row.revenue),
    })),
    upcomingDepartures: departures.map((row) => ({
      id: row.id,
      name: row.name,
      departureDate: row.departureDate.toISOString().slice(0, 10),
      travelClass: row.travelClass,
      sold: row.sold,
      capacity: row.sold + row.stock,
      fillRate: row.sold + row.stock ? row.sold / (row.sold + row.stock) : 0,
    })),
  };
}
