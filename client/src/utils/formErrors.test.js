import { describe, expect, it } from 'vitest';
import { fieldErrors } from './formErrors.js';

describe('fieldErrors', () => {
  it('garde le premier message de chaque champ', () => {
    const error = {
      details: [
        { field: 'password', message: 'Trop court' },
        { field: 'password', message: 'Il manque un chiffre' },
        { field: 'email', message: 'Adresse invalide' },
      ],
    };
    expect(fieldErrors(error)).toEqual({ password: 'Trop court', email: 'Adresse invalide' });
  });

  it('renvoie un objet vide sans détails', () => {
    expect(fieldErrors(new Error('Réseau'))).toEqual({});
  });
});
