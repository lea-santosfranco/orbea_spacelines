// Valide req.query, req.params ou req.body avec un schéma Zod.
// Les données nettoyées sont rangées dans req.validated (req.query est en lecture seule avec Express 5).
export function validate(schemas) {
  return (req, res, next) => {
    req.validated = {};

    for (const [key, schema] of Object.entries(schemas)) {
      const result = schema.safeParse(req[key]);

      if (!result.success) {
        return res.status(400).json({
          error: 'Données invalides',
          details: result.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }

      req.validated[key] = result.data;
    }

    next();
  };
}