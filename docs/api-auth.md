# 3.1 POST `/api/auth/register`

## Què fa?

Crea un usuari nou a la base de dades.

## Idea de rols (molt important)

* El registre està **obert a tothom**.
* El client **NO pot enviar el rol** directament (per seguretat).
* Per defecte, qualsevol registre crea un usuari amb rol: **`ALUMNE`**.
* Si l’usuari marca que vol ser professor (`isTeacher=true`), ha d’introduir un **PIN secret** (`teacherPin`).
  * Si el PIN és correcte → es crea amb rol **`PROFESSOR`**.
  * Si el PIN és incorrecte → es retorna error i **no** es crea el compte de professor.

> El PIN es valida al servidor contra la variable d’entorn: `TEACHER_SIGNUP_PIN`

## Request (què envies)

**URL**

* `POST /api/auth/register`

**Headers**

* `Content-Type: application/json`

### Body (JSON) - registre alumne

```json
{
  "nom": "Dalia",
  "cognom": "Martínez",
  "email": "dalia@example.com",
  "password": "Password123!",
}
```

### Body (JSON) - registre professor (checkbox activat)

```json
{
  "nom": "Dalia",
  "cognom": "Martínez",
  "email": "dalia@example.com",
  "password": "Password123!",
  "isTeacher": true,
  "teacherPin": "123456"
}
```

### Regles (molt clares)

* `nom`: obligatori, string, mínim 2 caràcters
* `cognom`: obligatori, string, mínim 2 caràcters
* `email`: obligatori, format email
* `password`: obligatori, mínim 8 caràcters (o 10 si voleu)
* `isTeacher`: opcional, boolean (per defecte `false`)
* `teacherPin`: **obligatori només** si `isTeacher=true`

## Response èxit (201)

```json
{
  "ok": true,
  "user": {
    "id": "uuid...",
    "nom": "Dalia",
    "cognom": "Martínez",
    "email": "dalia@example.com",
    "rol": "ALUMNE",
    "created_at": "2026-01-20T..."
  }
}
```

✅ Importantíssim: **mai** retornis `password_hash`.

## Errors

### 400 Bad Request (dades incorrectes)

Exemple:

```json
{ "ok": false, "error": "Invalid email" }
```

### 409 Conflict (email ja existeix)

```json
{ "ok": false, "error": "Email already in use" }
```

---

# 3.2 POST `/api/auth/login`

## Què fa?

Comprova email+password i retorna un **JWT**.

## Request

**URL**

* `POST /api/auth/login`

**Headers**

* `Content-Type: application/json`

**Body**

```json
{
  "email": "dalia@example.com",
  "password": "Password123!"
}
```

## Response èxit (200)

```json
{
  "ok": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Què hi ha dins el token?

Ha de portar com a mínim:

* `sub` = userId
* `email`
* `role`

Això és perquè el middleware `requireAuth` pugui omplir `req.user`.

## Errors

### 400 Bad Request (falten camps)

```json
{ "ok": false, "error": "Missing email or password" }
```

### 401 Unauthorized (credencials malament)

**Mateix missatge tant si l’email existeix com si no** (per seguretat):

```json
{ "ok": false, "error": "Invalid credentials" }
```