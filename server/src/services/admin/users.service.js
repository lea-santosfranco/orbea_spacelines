import { prisma } from '../../config/prisma.js';
import { HttpError } from '../../utils/httpError.js';

export async function listAdminUsers({ q, status, page, limit }) {
  const where = {
    anonymizedAt: null, // Les comptes supprimés (anonymisés) ne sont plus des utilisateurs à gérer
    ...(status && { isActive: status === 'active' }),
    ...(q && {
      OR: [
        { email: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { firstName: { contains: q, mode: 'insensitive' } },
      ],
    }),
  };

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: { select: { orders: { where: { paidAt: { not: null } } } } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items: users.map(({ _count, ...user }) => ({ ...user, orderCount: _count.orders })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// Un compte désactivé ne peut plus se connecter, mais ses commandes restent consultables par l'agence
export async function setUserActive(adminUser, id, isActive) {
  if (adminUser.id === id) throw new HttpError(409, 'Vous ne pouvez pas désactiver votre propre compte');

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.anonymizedAt) throw new HttpError(404, 'Utilisateur introuvable');
  if (user.role === 'ADMIN') throw new HttpError(409, 'Un compte administrateur ne peut pas être désactivé ici');

  const updated = await prisma.user.update({ where: { id }, data: { isActive } });
  return { id: updated.id, isActive: updated.isActive };
}
