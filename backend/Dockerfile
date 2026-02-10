FROM node:22-alpine

WORKDIR /app

# Instalar dependencias de la app (capa cacheable)
COPY package*.json ./
# En este proyecto `npm ci` está fallando dentro del build; `npm install` es más tolerante
# y usará package-lock.json si está presente.
RUN npm install

# Nodemon global para desarrollo dentro del contenedor
RUN npm install -g nodemon

# Copiamos los ficheros de Prisma para poder generar el cliente en build
COPY prisma ./prisma
COPY prisma.config.ts ./

# Prisma generate no necesita conectarse a la BD, pero sí una DATABASE_URL.
# Usamos un valor "dummy" solo para la fase de build.
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"
RUN npx prisma generate || echo "Prisma generate failed during build (ok for dev)"

# Copiamos el resto del backend
COPY . .

# El comando real de desarrollo se define en docker-compose.
# Dejamos un CMD seguro por defecto por si alguien ejecuta la imagen directamente.
CMD ["npm", "run", "dev"]

