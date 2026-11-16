// Données de démonstration d'Orbéa Spacelines
// Lancement : npm run db:seed (vide les tables puis les remplit)

import crypto from 'node:crypto';
import argon2 from 'argon2';
import { variantLabel } from '../src/utils/variantLabel.js';
import { prisma } from '../src/config/prisma.js';

// ---------- Outils ----------

const euros = (amount) => Math.round(amount * 100);

const CLASS_MULTIPLIERS = { ECONOMY: 1, BUSINESS: 1.6, FIRST: 2.5 };
const CLASS_SEATS = { ECONOMY: 12, BUSINESS: 6, FIRST: 2 };

// Crée les 3 classes pour chaque date de départ
function tripVariants(basePrice, departureDates, { soldOut = false } = {}) {
  return departureDates.flatMap((date) =>
    Object.keys(CLASS_MULTIPLIERS).map((travelClass) => ({
      departureDate: new Date(date),
      travelClass,
      priceCents: euros(basePrice * CLASS_MULTIPLIERS[travelClass]),
      stock: soldOut ? 0 : CLASS_SEATS[travelClass],
    })),
  );
}

function images(slug, name) {
  return [
    { url: `/images/products/${slug}-1.webp`, altText: name, position: 0 },
    { url: `/images/products/${slug}-2.webp`, altText: `${name}, autre vue`, position: 1 },
  ];
}

// ---------- Données ----------

const categories = [
  { name: 'Orbite terrestre', slug: 'orbite-terrestre', productType: 'TRIP' },
  { name: 'Lune', slug: 'lune', productType: 'TRIP' },
  { name: 'Mars', slug: 'mars', productType: 'TRIP' },
  { name: 'Vêtements', slug: 'vetements', productType: 'GOODIE' },
  { name: 'Accessoires', slug: 'accessoires', productType: 'GOODIE' },
  { name: 'Décoration', slug: 'decoration', productType: 'GOODIE' },
];

const trips = [
  {
    category: 'orbite-terrestre',
    name: 'Lever de soleil orbital',
    slug: 'lever-de-soleil-orbital',
    durationDays: 3,
    description:
      "Trois jours en orbite basse pour assister à seize levers de soleil par jour. Le voyage idéal pour un premier pas dans l'espace.",
    variants: tripVariants(45000, ['2027-03-14', '2027-06-20']),
  },
  {
    category: 'orbite-terrestre',
    name: 'Séjour à la station Horizon',
    slug: 'sejour-station-horizon',
    durationDays: 7,
    description:
      "Une semaine à bord de la station Horizon : vie en apesanteur, observation de la Terre et sortie encadrée dans le module panoramique.",
    variants: tripVariants(95000, ['2027-04-05', '2027-09-12']),
  },
  {
    category: 'lune',
    name: 'Survol lunaire',
    slug: 'survol-lunaire',
    durationDays: 6,
    description:
      'Un aller-retour autour de la Lune, avec le passage au-dessus de sa face cachée et le lever de Terre depuis le hublot.',
    variants: tripVariants(180000, ['2027-05-18', '2027-10-02']),
  },
  {
    category: 'lune',
    name: 'Base Tranquillité',
    slug: 'base-tranquillite',
    durationDays: 12,
    description:
      'Douze jours sur la base Tranquillité, avec marche lunaire, exploration en rover et nuits sous un ciel sans atmosphère.',
    variants: tripVariants(320000, ['2027-07-08', '2027-11-21']),
  },
  {
    category: 'mars',
    name: 'Expédition Olympus',
    slug: 'expedition-olympus',
    durationDays: 210,
    description:
      "L'expédition au pied d'Olympus Mons, le plus grand volcan du système solaire. Un voyage de sept mois pour les plus aventureux.",
    variants: tripVariants(550000, ['2027-08-30', '2028-01-15']),
  },
  {
    category: 'mars',
    name: 'Croisière Phobos',
    slug: 'croisiere-phobos',
    durationDays: 240,
    description:
      'Une croisière en orbite martienne avec escale sur Phobos, la plus grande lune de Mars. Toutes les places sont réservées.',
    variants: tripVariants(600000, ['2027-09-10'], { soldOut: true }),
  },
];

const SIZES = ['S', 'M', 'L', 'XL'];

const goodies = [
  {
    category: 'vetements',
    name: 'T-shirt Orbéa',
    slug: 't-shirt-orbea',
    description: 'T-shirt en coton bio, logo Orbéa brodé sur le cœur.',
    variants: SIZES.map((size) => ({ size, priceCents: euros(29), stock: size === 'XL' ? 0 : 25 })),
  },
  {
    category: 'vetements',
    name: 'Sweat Horizon',
    slug: 'sweat-horizon',
    description: "Sweat à capuche bleu nuit, imprimé de la courbe lumineuse d'une planète.",
    variants: SIZES.map((size) => ({ size, priceCents: euros(59), stock: 15 })),
  },
  {
    category: 'accessoires',
    name: 'Casquette Mission',
    slug: 'casquette-mission',
    description: 'Casquette brodée aux couleurs de la mission, réglable.',
    variants: [{ size: 'Unique', priceCents: euros(24), stock: 30 }],
  },
  {
    category: 'accessoires',
    name: 'Mug Lever de Terre',
    slug: 'mug-lever-de-terre',
    description: 'Mug en céramique illustré du lever de Terre vu depuis la Lune.',
    variants: [{ size: 'Unique', priceCents: euros(16), stock: 40 }],
  },
  {
    category: 'accessoires',
    name: 'Patch de mission',
    slug: 'patch-de-mission',
    description: "Écusson brodé thermocollant, le même que celui des équipages d'Orbéa.",
    variants: [{ size: 'Unique', priceCents: euros(9), stock: 4 }],
  },
  {
    category: 'accessoires',
    name: 'Gourde isotherme',
    slug: 'gourde-isotherme',
    description: 'Gourde en inox, garde les boissons fraîches 24 h et chaudes 12 h.',
    variants: [{ size: 'Unique', priceCents: euros(32), stock: 0 }],
  },
  {
    category: 'decoration',
    name: 'Maquette du lanceur',
    slug: 'maquette-du-lanceur',
    description: "Maquette au 1/200 du lanceur Orbéa, à assembler, avec socle d'exposition.",
    variants: [{ size: 'Unique', priceCents: euros(79), stock: 10 }],
  },
  {
    category: 'decoration',
    name: 'Affiche Olympus Mons',
    slug: 'affiche-olympus-mons',
    description: 'Affiche 50 × 70 cm, illustration rétro du volcan martien au lever du soleil.',
    variants: [{ size: 'Unique', priceCents: euros(19), stock: 20 }],
  },
];

// ---------- Exécution ----------

async function clearDatabase() {
  // Ordre inverse des dépendances, pour respecter les clés étrangères
  await prisma.favorite.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
}

async function seedUsers() {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const clientPassword = process.env.SEED_CLIENT_PASSWORD;

  if (!adminPassword || !clientPassword) {
    throw new Error('SEED_ADMIN_PASSWORD et SEED_CLIENT_PASSWORD doivent être définis dans server/.env');
  }

  await prisma.user.create({
    data: {
      email: 'admin@orbea.test',
      passwordHash: await argon2.hash(adminPassword),
      firstName: 'Admin',
      lastName: 'Orbéa',
      role: 'ADMIN',
      consentAt: new Date(),
    },
  });

  await prisma.user.create({
    data: {
      email: 'client@orbea.test',
      passwordHash: await argon2.hash(clientPassword),
      firstName: 'Camille',
      lastName: 'Martin',
      address: '12 rue des Étoiles',
      postalCode: '33000',
      city: 'Bordeaux',
      consentAt: new Date(),
    },
  });
}

async function seedCatalog() {
  const categoryIds = {};
  for (const category of categories) {
    const created = await prisma.category.create({ data: category });
    categoryIds[category.slug] = created.id;
  }

  const products = [
    ...trips.map((trip) => ({ ...trip, type: 'TRIP' })),
    ...goodies.map((goodie) => ({ ...goodie, type: 'GOODIE' })),
  ];

  for (const { category, variants, ...product } of products) {
    await prisma.product.create({
      data: {
        ...product,
        categoryId: categoryIds[category],
        images: { create: images(product.slug, product.name) },
        variants: { create: variants },
      },
    });
  }

  return products.length;
}

// ---------- Commandes de démonstration (pour le tableau de bord) ----------

const demoCustomers = [
  { firstName: 'Inès', lastName: 'Moreau', city: 'Lyon', postalCode: '69003' },
  { firstName: 'Hugo', lastName: 'Lefèvre', city: 'Nantes', postalCode: '44000' },
  { firstName: 'Sofia', lastName: 'Pereira', city: 'Toulouse', postalCode: '31000' },
];

// Générateur pseudo-aléatoire à graine fixe : le seed produit toujours les mêmes données
function seededRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 1103515245 + 12345) % 2147483648;
    return value / 2147483648;
  };
}

async function seedDemoOrders() {
  const random = seededRandom(42);
  const pick = (list) => list[Math.floor(random() * list.length)];
  const clientPassword = await argon2.hash(process.env.SEED_CLIENT_PASSWORD);

  const customers = [await prisma.user.findUnique({ where: { email: 'client@orbea.test' } })];
  for (const customer of demoCustomers) {
    customers.push(
      await prisma.user.create({
        data: {
          ...customer,
          email: `${customer.firstName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}@orbea.test`,
          passwordHash: clientPassword,
          address: '1 place de la Comète',
          consentAt: new Date(),
        },
      }),
    );
  }

  const variants = await prisma.variant.findMany({ where: { stock: { gt: 2 } }, include: { product: true } });
  const trips = variants.filter((variant) => variant.product.type === 'TRIP' && variant.travelClass !== 'FIRST');
  const goodies = variants.filter((variant) => variant.product.type === 'GOODIE');

  let count = 0;
  for (let daysAgo = 110; daysAgo >= 2; daysAgo -= 4 + Math.floor(random() * 5)) {
    const paidAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    // On ne choisit que des variantes qui ont encore assez de stock (la base refuse un stock négatif)
    const quantity = () => 1 + Math.floor(random() * 2);
    const available = (list, qty) => list.filter((variant) => variant.stock >= qty);
    const lines = [];
    const tripQty = quantity();
    if (random() < 0.6 && available(trips, tripQty).length) {
      lines.push({ variant: pick(available(trips, tripQty)), quantity: tripQty });
    }
    const goodieQty = quantity();
    if ((random() < 0.7 || lines.length === 0) && available(goodies, goodieQty).length) {
      lines.push({ variant: pick(available(goodies, goodieQty)), quantity: goodieQty });
    }
    if (lines.length === 0) continue;

    const hasGoodies = lines.some((line) => line.variant.product.type === 'GOODIE');
    const customer = pick(customers);
    const subtotalCents = lines.reduce((sum, line) => sum + line.variant.priceCents * line.quantity, 0);
    // Les plus anciennes sont terminées, les plus récentes encore en cours
    const status = daysAgo > 30 ? 'COMPLETED' : hasGoodies && daysAgo > 10 ? 'SHIPPED' : 'PAID';
    const date = paidAt.toISOString().slice(0, 10).replaceAll('-', '');

    await prisma.order.create({
      data: {
        userId: customer.id,
        number: `ORB-${date}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        status,
        subtotalCents,
        shippingCents: 0,
        totalCents: subtotalCents,
        paidAt,
        createdAt: paidAt,
        ...(hasGoodies && {
          shippingName: `${customer.firstName} ${customer.lastName}`,
          shippingAddress: customer.address,
          shippingPostalCode: customer.postalCode,
          shippingCity: customer.city,
        }),
        items: {
          create: lines.map((line) => ({
            variantId: line.variant.id,
            productName: line.variant.product.name,
            variantLabel: variantLabel(line.variant),
            unitPriceCents: line.variant.priceCents,
            quantity: line.quantity,
          })),
        },
      },
    });

    // Les places et articles vendus sortent du stock, comme lors d'un vrai paiement
    for (const line of lines) {
      await prisma.variant.update({ where: { id: line.variant.id }, data: { stock: { decrement: line.quantity } } });
      line.variant.stock -= line.quantity;
    }
    count += 1;
  }
  return { orders: count, customers: demoCustomers.length };
}

async function main() {
  await clearDatabase();
  await seedUsers();
  const productCount = await seedCatalog();
  const demo = await seedDemoOrders();
  console.log(
    `Seed terminé : ${categories.length} catégories, ${productCount} produits, ${2 + demo.customers} utilisateurs, ${demo.orders} commandes de démonstration.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });