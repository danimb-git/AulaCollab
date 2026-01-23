/* 
controller: rep la petició, decideix què respondre (200/400/401…).

Register:
Valida que el body sigui correcte (si no → 400)
Fa hash de la password amb bcrypt (mai guardem password “en pla”)
Crida authService.createUser(...) perquè el service:
generi l’UUID
insereixi a la DB
Respon 201 amb l’usuari (sense password)
Si l’email ja existeix:
el service ha de llençar un error amb code: "EMAIL_EXISTS"
i el controller retorna 409

Login:
Valida email i password (si no → 400)
Busca usuari per email
Si no existeix → 401 “Invalid credentials”
Compara password amb bcrypt
Si és correcte → crea JWT amb sub/email/role
Retorna { accessToken }

*/
const bcrypt = require("bcrypt");
const { signAccessToken } = require("../../config/jwt");
const {
  validateRegisterBody,
  validateLoginBody,
} = require("./auth.validation");
const authService = require("./auth.service");

// Ajustable: "quants rounds" de bcrypt (10 està bé per projecte)
const BCRYPT_SALT_ROUNDS = 10;

/*
POST /api/auth/register

Registre obert a tothom:
 - Si isTeacher=false -> rol = ALUMNE
 - Si isTeacher=true -> cal teacherPin correcte -> rol = PROFESSOR
*/
async function register(req, res) {
  // 1) Validació del body
  const v = validateRegisterBody(req.body);
  if (!v.ok) {
    return res.status(400).json({ ok: false, error: v.error });
  }

  const { nom, cognom, email, password, isTeacher, teacherPin } = v.value;

  try {
    // 2) Decidir rol de forma segura (NO ve del client)
    let rol = "ALUMNE";

    if (isTeacher) {
      const expectedPin = process.env.TEACHER_SIGNUP_PIN;

      // Si el servidor no està ben configurat, millor retornar 500 clar
      if (!expectedPin || String(expectedPin).trim() === "") {
        console.error("Missing TEACHER_SIGNUP_PIN in .env");
        return res
          .status(500)
          .json({ ok: false, error: "Server misconfigured" });
      }

      if (teacherPin !== expectedPin) {
        // PIN incorrecte -> no permetem crear professor
        return res
          .status(401)
          .json({ ok: false, error: "Invalid teacher pin" });
      }

      rol = "PROFESSOR";
    }

    // 3) Hash de password
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // 4) Crear usuari via service (DB)
    // El service ha d'encarregar-se de generar UUID i inserir a la DB.
    const user = await authService.createUser({
      nom,
      cognom,
      email,
      passwordHash,
      rol,
    });

    // 5) Resposta OK (MAI retornem passwordHash)
    return res.status(201).json({
      ok: true,
      user: {
        id: user.id,
        nom: user.nom,
        cognom: user.cognom,
        email: user.email,
        rol: user.rol,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    // Cas típic: email ja existeix
    if (err && err.code === "EMAIL_EXISTS") {
      return res.status(409).json({ ok: false, error: "Email already in use" });
    }

    console.error("register error:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
}

/**
 * POST /api/auth/login
 */
async function login(req, res) {
  // 1) Validació del body
  const v = validateLoginBody(req.body);
  if (!v.ok) {
    return res.status(400).json({ ok: false, error: v.error });
  }

  const { email, password } = v.value;

  try {
    // 2) Buscar usuari per email
    const user = await authService.getUserByEmail(email);

    // 3) Si no existeix -> 401 (mateix missatge sempre)
    if (!user) {
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

    // 4) Comparar password
    const okPassword = await bcrypt.compare(password, user.password_hash);
    if (!okPassword) {
      return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

    // 5) Crear JWT (IMPORTANT: payload amb sub/email/role)
    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.rol,
    });

    // 6) Retornar token
    return res.status(200).json({ ok: true, accessToken });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
}

module.exports = {
  register,
  login,
};
