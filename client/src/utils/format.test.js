import { describe, expect, it } from 'vitest';
import { formatDate, formatDuration, formatPrice, formatSeats } from './format.js';

// Intl insère des espaces insécables : on les remplace par des espaces simples pour comparer
const normalize = (text) => text.replace(/\s/g, ' ');

describe('formatPrice', () => {
  it('convertit les centimes en euros, sans décimales pour un montant rond', () => {
    expect(normalize(formatPrice(4500000))).toBe('45 000 €');
  });

  it('affiche les centimes quand il y en a', () => {
    expect(normalize(formatPrice(750))).toBe('7,50 €');
  });
});

describe('formatDate', () => {
  it('lit une date AAAA-MM-JJ sans décalage de fuseau horaire', () => {
    expect(formatDate('2027-03-14')).toBe('14 mars 2027');
    expect(formatDate('2027-01-01')).toBe('1 janvier 2027');
  });
});

describe('accords', () => {
  it('accorde jours et places au singulier et au pluriel', () => {
    expect(formatDuration(1)).toBe('1 jour');
    expect(formatDuration(6)).toBe('6 jours');
    expect(formatSeats(1)).toBe('1 place restante');
    expect(formatSeats(3)).toBe('3 places restantes');
  });
});
