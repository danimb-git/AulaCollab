/**
 * Crea un error controlat per l'API
 * Després el errorHandler el convertirà al format:
 * { error: { code, message, details } }
 */
function apiError(status, code, message, details) {
  const err = new Error(message);

  err.status = status;
  err.code = code;

  if (details !== undefined) {
    err.details = details;
  }

  return err;
}

// Helpers per llegibilitat
function badRequest(code, message, details) {
  return apiError(400, code, message, details);
}

function unauthorized(code, message, details) {
  return apiError(401, code, message, details);
}

function forbidden(code, message, details) {
  return apiError(403, code, message, details);
}

function notFound(code, message, details) {
  return apiError(404, code, message, details);
}

function conflict(code, message, details) {
  return apiError(409, code, message, details);
}

module.exports = {
  apiError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict
};
