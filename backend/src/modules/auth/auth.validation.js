// validation: mira si el body està bé abans de fer res.

const ALLOWED_ROLES = ["ALUMNE", "PROFESSOR", "ADMIN"];

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function isValidEmail(email) {
  // Regex simple (suficient per projecte)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateRegisterBody(body) {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { nom, cognom, email, password, rol } = body;

  if (!isNonEmptyString(nom) || nom.trim().length < 2) {
    return { ok: false, error: "Invalid nom (min 2 characters)" };
  }

  if (!isNonEmptyString(cognom) || cognom.trim().length < 2) {
    return { ok: false, error: "Invalid cognom (min 2 characters)" };
  }

  if (!isNonEmptyString(email) || !isValidEmail(email.trim())) {
    return { ok: false, error: "Invalid email" };
  }

  if (!isNonEmptyString(password) || password.length < 8) {
    return { ok: false, error: "Invalid password (min 8 characters)" };
  }

  // Rol: recomanació = opcional i per defecte ALUMNE
  let finalRole = "ALUMNE";
  if (rol !== undefined) {
    if (!isNonEmptyString(rol) || !ALLOWED_ROLES.includes(rol.trim())) {
      return { ok: false, error: `Invalid rol (allowed: ${ALLOWED_ROLES.join(", ")})` };
    }
    finalRole = rol.trim();
  }

  // Retornem dades "netejes"
  return {
    ok: true,
    value: {
      nom: nom.trim(),
      cognom: cognom.trim(),
      email: email.trim().toLowerCase(),
      password, // la password NO la trimegem (per si volen espais dins)
      rol: finalRole,
    },
  };
}

function validateLoginBody(body) {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { email, password } = body;

  if (!isNonEmptyString(email) || !isValidEmail(email.trim())) {
    return { ok: false, error: "Invalid email" };
  }

  if (!isNonEmptyString(password)) {
    return { ok: false, error: "Missing password" };
  }

  return {
    ok: true,
    value: {
      email: email.trim().toLowerCase(),
      password,
    },
  };
}

module.exports = {
  validateRegisterBody,
  validateLoginBody,
  ALLOWED_ROLES,
};
