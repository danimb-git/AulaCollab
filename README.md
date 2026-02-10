**AulaCollab**

### Backend en Docker (PostgreSQL + API)

Esta sección explica cómo levantar solo el backend (API Node/Express + Prisma + PostgreSQL) usando Docker Compose.

#### 1. Preparar variables de entorno

- **No** commitees ficheros con secretos reales (`.env`).
- En la raíz del repo tienes un ejemplo: `.env.example`.

1. Copia el ejemplo a un `.env` local:

   ```bash
   cp .env.example .env
   ```

2. Ajusta los valores si lo necesitas (usuario, password, nombre de BD, secretos JWT, etc.):

   - `DB_NAME`, `DB_USER`, `DB_PASSWORD`: se usan tanto por el contenedor de Postgres como por el backend.
   - `JWT_SECRET`, `JWT_EXPIRES_IN`, `TEACHER_SIGNUP_PIN`: usados por el backend.

> Docker Compose cargará automáticamente las variables de `.env` (mismo directorio que `docker-compose.yml`).

#### 2. Servicios de Docker Compose

- **db**:
  - Imagen `postgres:16-alpine`.
  - Volumen persistente `db_data` para los datos.
  - Variables `POSTGRES_*` derivadas de `DB_NAME`, `DB_USER`, `DB_PASSWORD`.
  - Healthcheck con `pg_isready` para que el backend espere a que la BD esté lista.

- **api**:
  - Se construye desde `./backend` con el `Dockerfile` dev (`nodemon`).
  - Se conecta a la BD usando el nombre de servicio `db` (no `localhost`).
  - Monta el código fuente (`./backend:/app`) para **hot reload**.
  - Usa un volumen anónimo en `/app/node_modules` para evitar conflictos con Windows.
  - Comando de arranque:
    - `npm ci` (instala dependencias en el volumen anónimo).
    - `npx prisma generate` (genera cliente Prisma dentro del contenedor).
    - `npm run migrate` (ejecuta las migraciones SQL de `backend/migrations/` en modo seguro).
    - `nodemon src/server.js` (servidor en modo desarrollo con recarga en caliente).

#### 3. Comandos básicos (desarrollo)

Desde la **raíz del repo**:

- **Levantar todo (build + up)**:

  ```bash
  docker compose up --build
  ```

- **Parar y mantener datos**:

  ```bash
  docker compose down
  ```

- **Parar y borrar también los datos de Postgres**:

  ```bash
  docker compose down -v
  ```

#### 4. Opción "production-like" (sin volúmenes ni nodemon)

Hay un fichero adicional `docker-compose.prod.yml` que ajusta solo el servicio `api` para un uso más parecido a producción:

- No monta los volúmenes del código.
- No usa `nodemon`, arranca con `node src/server.js`.
- Sigue ejecutando `npm run migrate` en el arranque para aplicar las migraciones SQL.

Ejemplo de uso:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

Para parar:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
```

#### 5. Verificar que todo funciona

- **API levantada**:
  - El backend escucha en el puerto `3000` (ver `backend/src/config/env.js` y `backend/src/server.js`).
  - Prueba un endpoint de salud:

    ```bash
    curl http://localhost:3000/api/health
    ```

- **Conexión Prisma/BD correcta**:
  - El script `npm run migrate` (ejecutado en el arranque del contenedor `api`) aplica las migraciones SQL y escribe en la tabla `schema_migrations`.
  - Puedes comprobar el estado desde dentro del contenedor `api`:

    ```bash
    docker compose exec api node scripts/check-db.js
    ```

- **Contenedores sanos**:
  - Comprueba el estado:

    ```bash
    docker compose ps
    ```

  - El servicio `db` debe aparecer como `healthy` gracias al `healthcheck` de `pg_isready`.

- **Persistencia de datos**:
  1. Crea datos (usuarios, clases, etc.) usando la API.
  2. Para los contenedores sin borrar volúmenes:

     ```bash
     docker compose down
     ```

  3. Vuelve a levantar:

     ```bash
     docker compose up
     ```

  4. Los datos deberían seguir presentes (gracias al volumen `db_data`).
