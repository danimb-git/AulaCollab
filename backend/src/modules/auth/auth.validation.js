// validation: mira si el body està bé abans de fer res.

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

  // Checkbox: isTeacher hauria de ser boolean, però si no ve el tractem com false
  const finalIsTeacher = isTeacher === true;

  // Si vol ser professor, teacherPin és obligatori
  let finalTeacherPin = null;
  if (finalIsTeacher) {
    if (!isNonEmptyString(teacherPin)) {
      return {
        ok: false,
        error: "Missing teacherPin (required when isTeacher=true)",
      };
    }
    finalTeacherPin = teacherPin.trim();
  }

  // Retornem dades "netejes"
  return {
    ok: true,
    value: {
      nom: nom.trim(),
      cognom: cognom.trim(),
      email: email.trim().toLowerCase(),
      password,
      isTeacher: finalIsTeacher,
      teacherPin: finalTeacherPin,
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
};
