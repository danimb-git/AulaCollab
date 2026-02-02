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

async function listClassesForUser({ user }) {
  // ADMIN → totes les classes
  if (user.role === "ADMIN") {
    return prisma.classes.findMany({
      orderBy: { created_at: "desc" },
    });
  }

  // PROFESSOR → classes que ha creat
  if (user.role === "PROFESSOR") {
    return prisma.classes.findMany({
      where: { professor_id: user.id },
      orderBy: { created_at: "desc" },
    });
  }

  // ALUMNE → classes on és membre
  return prisma.classes.findMany({
    where: {
      class_members: {
        some: { user_id: user.id },
      },
    },
    orderBy: { created_at: "desc" },
  });
}
function isAdmin(user) {
  return user?.role === "ADMIN";
}

async function canAccessClass({ classId, user }) {
  const c = await prisma.classes.findUnique({ where: { id: classId } });
  if (!c) return { ok: false, status: 404, error: "Class not found" };

  if (isAdmin(user)) return { ok: true, classObj: c };

  // Owner (professor de la classe)
  if (c.professor_id === user.id) return { ok: true, classObj: c };

  // Member?
  const member = await prisma.class_members.findUnique({
    where: { class_id_user_id: { class_id: classId, user_id: user.id } },
  });

  if (!member) return { ok: false, status: 403, error: "Forbidden" };

  return { ok: true, classObj: c };
}

async function getClassDetail({ classId, user }) {
  const access = await canAccessClass({ classId, user });
  if (!access.ok) return access;

  const detail = await prisma.classes.findUnique({
    where: { id: classId },
    include: {
      // Professor owner (relació "users" a Prisma)
      users: {
        select: { id: true, nom: true, cognom: true, email: true, rol: true },
      },
      // Membres + info usuari
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

  return { ok: true, data: detail };
}

async function addMembersByEmail({ classId, emails, user }) {
  const c = await prisma.classes.findUnique({ where: { id: classId } });
  if (!c) return { ok: false, status: 404, error: "Class not found" };

  // només admin o owner
  if (user.role !== "ADMIN" && c.professor_id !== user.id) {
    return { ok: false, status: 403, error: "Only owner can add members" };
  }

  const cleaned = [...new Set(emails.map(e => String(e || "").trim().toLowerCase()).filter(Boolean))];

  const added = [];
  const alreadyMember = [];
  const notFound = [];

  for (const email of cleaned) {
    const u = await prisma.users.findUnique({ where: { email } });
    if (!u) { notFound.push(email); continue; }

    const exists = await prisma.class_members.findUnique({
      where: { class_id_user_id: { class_id: classId, user_id: u.id } },
    });

    if (exists) { alreadyMember.push(email); continue; }

    await prisma.class_members.create({
      data: { class_id: classId, user_id: u.id },
    });

    added.push(email);
  }

  return { ok: true, data: { classId, added, alreadyMember, notFound } };
}

async function removeMember({ classId, memberId, user }) {
  const c = await prisma.classes.findUnique({ where: { id: classId } });
  if (!c) return { ok: false, status: 404, error: "Class not found" };

  // només admin o owner
  if (user.role !== "ADMIN" && c.professor_id !== user.id) {
    return { ok: false, status: 403, error: "Only owner can remove members" };
  }

  // no deixar treure l'owner
  if (memberId === c.professor_id) {
    return { ok: false, status: 400, error: "Cannot remove class owner" };
  }

  const exists = await prisma.class_members.findUnique({
    where: { class_id_user_id: { class_id: classId, user_id: memberId } },
  });

  if (!exists) return { ok: false, status: 404, error: "Member not found in class" };

  await prisma.class_members.delete({
    where: { class_id_user_id: { class_id: classId, user_id: memberId } },
  });

  return { ok: true, data: { classId, removedUserId: memberId } };
}



module.exports = {
  createClass,
  listClassesForUser,
  getClassDetail,
  addMembersByEmail,
  removeMember,
};

