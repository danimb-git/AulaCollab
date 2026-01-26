/*
signAccessToken(...) → per crear tokens

verifyAccessToken(token) → per validar-los
*/

const jwt = require("jsonwebtoken");
const env = require("./env");

/**
 * Crea un access token.
 * payload: informació que vols guardar dins del token (ex: { sub, email, role })
 */
function signAccessToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

/**
 * Verifica un token i retorna el payload si és vàlid.
 * Si el token és dolent o ha caducat, llança error.
 */
function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
};
