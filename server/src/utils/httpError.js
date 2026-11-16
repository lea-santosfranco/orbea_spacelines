// Erreur avec un code HTTP, interceptée par le gestionnaire d'erreurs central
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
