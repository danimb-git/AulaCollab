const prisma = require("../../db/prisma");

// Aquest servei assumeix que existeix prisma.user
// Quan recupereu el schema amb els companys, confirmareu el nom real (User/users/etc)

async function createUser({ email, passwordHash, name, role }) {
  return prisma.user.create({
    data: { email, passwordHash, name, role },
  });
}

async function findUserByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

module.exports = { createUser, findUserByEmail };
