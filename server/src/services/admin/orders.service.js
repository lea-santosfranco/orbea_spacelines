import { prisma } from '../../config/prisma.js';
import { stripe } from '../../config/stripe.js';
import { HttpError } from '../../utils/httpError.js';

// Transitions autorisées entre statuts (le passage à « Payée » est réservé à Stripe)
function allowedTransitions(order, hasGoodies) {
  switch (order.status) {
    case 'PENDING_PAYMENT':
      return ['CANCELLED'];
    case 'PAID':
      // « Expédiée » n'a de sens que s'il y a des goodies à envoyer ; un voyage seul passe directement à « Terminée »
      return hasGoodies ? ['SHIPPED', 'CANCELLED'] : ['COMPLETED', 'CANCELLED'];
    case 'SHIPPED':
      return ['COMPLETED', 'CANCELLED'];
    default:
      return []; // Terminée ou annulée : plus aucun changement possible
  }
}

const orderInclude = {
  user: { select: { id: true, firstName: true, lastName: true, email: true, anonymizedAt: true } },
  items: { include: { variant: { select: { product: { select: { type: true } } } } } },
};

function customerOf(user) {
  return user.anonymizedAt
    ? { id: user.id, name: 'Client supprimé', email: null, anonymized: true }
    : { id: user.id, name: `${user.firstName} ${user.lastName}`, email: user.email, anonymized: false };
}

function toAdminOrder(order) {
  const hasGoodies = order.items.some((item) => item.variant.product.type === 'GOODIE');
  return {
    id: order.id,
    number: order.number,
    status: order.status,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
    customer: customerOf(order.user),
    subtotalCents: order.subtotalCents,
    shippingCents: order.shippingCents,
    totalCents: order.totalCents,
    hasGoodies,
    shipping: order.shippingAddress
      ? {
          name: order.shippingName,
          address: order.shippingAddress,
          postalCode: order.shippingPostalCode,
          city: order.shippingCity,
        }
      : null,
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      variantLabel: item.variantLabel,
      unitPriceCents: item.unitPriceCents,
      quantity: item.quantity,
      type: item.variant.product.type,
    })),
    allowedTransitions: allowedTransitions(order, hasGoodies),
  };
}

export async function listAdminOrders({ status, q, page, limit }) {
  const where = {
    ...(status && { status }),
    ...(q && {
      OR: [
        { number: { contains: q, mode: 'insensitive' } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { user: { lastName: { contains: q, mode: 'insensitive' } } },
      ],
    }),
  };

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: orderInclude,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    items: orders.map((order) => {
      const full = toAdminOrder(order);
      return {
        id: full.id,
        number: full.number,
        status: full.status,
        createdAt: full.createdAt,
        customer: full.customer,
        totalCents: full.totalCents,
        itemCount: full.items.reduce((sum, item) => sum + item.quantity, 0),
        hasGoodies: full.hasGoodies,
      };
    }),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getAdminOrder(id) {
  const order = await prisma.order.findUnique({ where: { id }, include: orderInclude });
  if (!order) throw new HttpError(404, 'Commande introuvable');
  return toAdminOrder(order);
}

// Rembourse le client via Stripe (l'identifiant du paiement est retrouvé à partir de la session)
async function refund(order) {
  if (!order.stripeSessionId || !stripe) {
    throw new HttpError(502, 'Remboursement impossible : paiement Stripe introuvable');
  }
  try {
    const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
    if (session.payment_intent) await stripe.refunds.create({ payment_intent: session.payment_intent });
  } catch (error) {
    console.error(error);
    throw new HttpError(502, 'Le remboursement Stripe a échoué : la commande n’a pas été annulée');
  }
}

export async function updateOrderStatus(id, status) {
  const order = await prisma.order.findUnique({ where: { id }, include: orderInclude });
  if (!order) throw new HttpError(404, 'Commande introuvable');

  const current = toAdminOrder(order);
  if (!current.allowedTransitions.includes(status)) {
    throw new HttpError(409, 'Ce changement de statut n’est pas autorisé');
  }

  const wasPaid = ['PAID', 'SHIPPED'].includes(order.status);

  if (status === 'CANCELLED' && wasPaid) {
    // Annuler une commande payée : remboursement d'abord, puis remise en stock des places et articles
    await refund(order);
    await prisma.$transaction([
      prisma.order.update({ where: { id }, data: { status } }),
      ...order.items.map((item) =>
        prisma.variant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } }),
      ),
    ]);
  } else {
    // Condition sur l'ancien statut : si deux admins agissent en même temps, un seul changement passe
    const updated = await prisma.order.updateMany({ where: { id, status: order.status }, data: { status } });
    if (updated.count === 0) throw new HttpError(409, 'La commande a été modifiée entre-temps, rechargez la page');
  }

  return getAdminOrder(id);
}
