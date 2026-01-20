# 3.1 POST `/api/auth/register`

## Què fa?

Crea un usuari nou a la base de dades.

## Request (què envies)

**URL**

* `POST /api/auth/register`

**Headers**

* `Content-Type: application/json`

**Body (JSON)**

```json
{
  "nom": "Dalia",
  "cognom": "Martínez",
  "email": "dalia@example.com",
  "password": "Password123!",
  "rol": "ALUMNE"
}
```

### Regles (molt clares)

* `nom`: obligatori, string, mínim 2 caràcters
* `cognom`: obligatori, string, mínim 2 caràcters
* `email`: obligatori, format email
* `password`: obligatori, mínim 8 caràcters (o 10 si voleu)
* `rol`: opcional o obligatori (ara decidim)

  * si el voleu **simple i segur**: el rol **no es pot enviar** i sempre és `ALUMNE`
  * si el voleu **flexible**: es pot enviar i ha de ser `ALUMNE|PROFESSOR|ADMIN`

👉 **Recomanació per començar:** que `rol` sigui **opcional** i per defecte sigui `ALUMNE`.
Així no us creeu “admins” per error.

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

Això és perquè el middleware `requireAuth` (que ja has fet) pugui omplir `req.user`.

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

---

# Decisió important ara (1 línia)

✅ `rol` al register és **opcional** i si no ve → `ALUMNE`.
