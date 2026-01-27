/*
sempre retorna { error: { code, message, details } } (details només si existeix)

si és desconegut → 500 / INTERNAL_ERROR / Unexpected error
*/

function errorHandler(err, req, res, next) {
  // Si Express detecta que ja s'han enviat headers, deleguem a l'handler per defecte
  if (res.headersSent) return next(err);

  // Si és un error creat per apiError(), tindrà status i code.
  const status = Number.isInteger(err.status) ? err.status : 500;
  const code = typeof err.code === "string" ? err.code : "INTERNAL_ERROR";
  const message =
    typeof err.message === "string" && err.message.trim().length > 0
      ? err.message
      : "Unexpected error";

  // details és opcional
  const details = err.details !== undefined ? err.details : undefined;

  // (Opcional però recomanat) Log intern per debug
  // En prod: podries loguejar menys, però ara ajuda molt.
  // NO retornem stack al client.
  console.error("[API_ERROR]", {
    method: req.method,
    path: req.originalUrl,
    status,
    code,
    message,
    details,
  });

  return res.status(status).json({
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  });
}

module.exports = errorHandler;
