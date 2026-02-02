const { v4: uuidv4 } = require("uuid");
const prisma = require("../../db/prisma");

async function createClass({ nom, descripcio, professorId }) {
  const classId = uuidv4();

  const newClass = await prisma.classes.create({
    data: {
      id: classId,
      nom,
      descripcio,
      professor_id: professorId,
      class_members: {
        create: { user_id: professorId },
      },
    },
  });

  return newClass;
}

// ✅ Llista classes on l’usuari és membre
async function listMyClasses(userId) {
  const rows = await prisma.class_members.findMany({
    where: { user_id: userId },
    include: {
      classes: true,
    },
    orderBy: {
      joined_at: "desc",
    },
  });

  // aplanem
  return rows.map((r) => r.classes);
}

// ✅ Detall classe + membres + rol meu (PROFESSOR si sóc professor_id)
async function getClassDetail({ classId, userId }) {
  // comprovar accés (ha de ser membre)
  const membership = await prisma.class_members.findUnique({
    where: { class_id_user_id: { class_id: classId, user_id: userId } },
  });

  if (!membership) return null;

  const cls = await prisma.classes.findUnique({
    where: { id: classId },
    include: {
      class_members: {
        include: {
          users: {
            select: { id: true, nom: true, cognom: true, email: true, rol: true },
          },
        },
        orderBy: { joined_at: "asc" },
      },
    },
  });

  if (!cls) return null;

  const roleInClass = cls.professor_id === userId ? "PROFESSOR" : "ALUMNE";

  const members = cls.class_members.map((cm) => ({
    id: cm.users.id,
    nom: cm.users.nom,
    cognom: cm.users.cognom,
    email: cm.users.email,
    rol: cm.users.rol,
    joinedAt: cm.joined_at,
  }));

  return {
    id: cls.id,
    nom: cls.nom,
    descripcio: cls.descripcio,
    professorId: cls.professor_id,
    createdAt: cls.created_at,
    role: roleInClass,
    members,
  };
}

// ✅ Afegir membres per email (real)
async function addMembersByEmail({ classId, emails }) {
  // Normalitzem emails
  const normalized = [...new Set(emails.map((e) => String(e).trim().toLowerCase()).filter(Boolean))];

  // 1) busquem quins usuaris existeixen
  const users = await prisma.users.findMany({
    where: { email: { in: normalized } },
    select: { id: true, email: true },
  });

  const foundEmails = new Set(users.map((u) => u.email));
  const notFound = normalized.filter((e) => !foundEmails.has(e));

  // 2) mirem quins ja eren membres
  const memberships = await prisma.class_members.findMany({
    where: {
      class_id: classId,
      user_id: { in: users.map((u) => u.id) },
    },
    select: { user_id: true },
  });

  const alreadyMemberIds = new Set(memberships.map((m) => m.user_id));

  const alreadyMembers = users
    .filter((u) => alreadyMemberIds.has(u.id))
    .map((u) => u.email);

  // 3) els que s’han d’afegir
  const toAdd = users.filter((u) => !alreadyMemberIds.has(u.id));

  if (toAdd.length > 0) {
    await prisma.class_members.createMany({
      data: toAdd.map((u) => ({
        class_id: classId,
        user_id: u.id,
      })),
      skipDuplicates: true,
    });
  }

  const added = toAdd.map((u) => u.email);

  return { classId, added, alreadyMembers, notFound };
}

module.exports = {
  createClass,
  listMyClasses,
  getClassDetail,
  addMembersByEmail,
};
