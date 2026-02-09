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

  // PROFESSOR → classes que ha creat o on és membre
  if (user.role === "PROFESSOR") {
    return prisma.classes.findMany({
      where: {
        OR: [
          { professor_id: user.id },
          {
            class_members: {
              some: { user_id: user.id },
            },
          },
        ],
      },
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

function isOwnerOfClass(classObj, user) {
  return classObj.professor_id === user.id;
}

async function canAccessClass({ classId, user }) {
  const c = await prisma.classes.findUnique({ where: { id: classId } });
  if (!c) return { ok: false, status: 404, error: "Class not found" };

  if (isAdmin(user)) return { ok: true, classObj: c };

  // Owner (professor de la classe)
  if (isOwnerOfClass(c, user)) return { ok: true, classObj: c };

  // Member?
  const member = await prisma.class_members.findUnique({
    where: { class_id_user_id: { class_id: classId, user_id: user.id } },
  });

  if (!member) return { ok: false, status: 403, error: "Forbidden" };

  return { ok: true, classObj: c };
}

async function canManageClass({ classId, user }) {
  const c = await prisma.classes.findUnique({ where: { id: classId } });
  if (!c) return { ok: false, status: 404, error: "Class not found" };

  if (isAdmin(user) || isOwnerOfClass(c, user)) {
    return { ok: true, classObj: c };
  }

  return {
    ok: false,
    status: 403,
    error: "Only class owner or admin can manage this class",
  };
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
  const manage = await canManageClass({ classId, user });
  if (!manage.ok) return manage;
  const c = manage.classObj;

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
  const manage = await canManageClass({ classId, user });
  if (!manage.ok) return manage;
  const c = manage.classObj;

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

async function leaveClass({ classId, user }) {
  const c = await prisma.classes.findUnique({ where: { id: classId } });
  if (!c) return { ok: false, status: 404, error: "Class not found" };

  // L'owner (professor) no pot "deixar" la seva pròpia classe.
  if (c.professor_id === user.id) {
    return { ok: false, status: 400, error: "Class owner cannot leave the class" };
  }

  const membership = await prisma.class_members.findUnique({
    where: { class_id_user_id: { class_id: classId, user_id: user.id } },
  });

  if (!membership) {
    return { ok: false, status: 404, error: "You are not a member of this class" };
  }

  await prisma.class_members.delete({
    where: { class_id_user_id: { class_id: classId, user_id: user.id } },
  });

  return { ok: true, data: { classId, leftUserId: user.id } };
}


  // l'owner no pot abandonar (no hi ha transferència d'owner en aquest mòdul)
  if (c.professor_id === user.id) {
    return { ok: false, status: 400, error: "Class owner cannot leave the class" };
  }

  const exists = await prisma.class_members.findUnique({
    where: { class_id_user_id: { class_id: classId, user_id: user.id } },
  });

  if (!exists) return { ok: false, status: 404, error: "You are not a member of this class" };

  await prisma.class_members.delete({
    where: { class_id_user_id: { class_id: classId, user_id: user.id } },
  });

  return { ok: true, data: { classId, leftUserId: user.id } };
}

async function updateClass({ classId, user, nom, descripcio }) {
  const manage = await canManageClass({ classId, user });
  if (!manage.ok) return manage;

  const dataToUpdate = {};
  if (typeof nom === "string") {
    dataToUpdate.nom = nom;
  }
  if (descripcio !== undefined) {
    dataToUpdate.descripcio =
      typeof descripcio === "string" ? descripcio : null;
  }

  const updated = await prisma.classes.update({
    where: { id: classId },
    data: dataToUpdate,
  });

  return { ok: true, data: updated };
}

async function deleteClass({ classId, user }) {
  const manage = await canManageClass({ classId, user });
  if (!manage.ok) return manage;

  // ON DELETE CASCADE a class_members ja s'encarrega de netejar membres
  await prisma.classes.delete({
    where: { id: classId },
  });

  return { ok: true, data: { deletedClassId: classId } };
}

async function updateMember({ classId, memberId, user, roleInClass }) {
  const manage = await canManageClass({ classId, user });
  if (!manage.ok) return manage;
  const c = manage.classObj;

  // no permetre canviar el rol del owner via aquesta ruta
  if (memberId === c.professor_id) {
    return {
      ok: false,
      status: 400,
      error: "Cannot update role for class owner",
    };
  }

  const exists = await prisma.class_members.findUnique({
    where: { class_id_user_id: { class_id: classId, user_id: memberId } },
  });

  if (!exists) {
    return { ok: false, status: 404, error: "Member not found in class" };
  }

  const updated = await prisma.class_members.update({
    where: { class_id_user_id: { class_id: classId, user_id: memberId } },
    data: { role_in_class: roleInClass },
  });

  return { ok: true, data: updated };
}

module.exports = {
  createClass,
  listClassesForUser,
  getClassDetail,
  addMembersByEmail,
  removeMember,
  leaveClass,
  updateClass,
  deleteClass,
  updateMember,
};
