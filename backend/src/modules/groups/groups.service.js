const { v4: uuidv4 } = require("uuid");
const prisma = require("../../db/prisma");

function isAdmin(user) {
  return user?.role === "ADMIN";
}

async function isMemberOfClass({ classId, userId }) {
  const membership = await prisma.class_members.findUnique({
    where: { class_id_user_id: { class_id: classId, user_id: userId } },
  });
  return !!membership;
}

async function createGroup({ nom, descripcio, ownerId, classId }) {
  const groupId = uuidv4();

  let classConnect = undefined;

  if (classId) {
    const c = await prisma.classes.findUnique({ where: { id: classId } });
    if (!c) {
      return { ok: false, status: 400, error: "Linked class not found" };
    }

    // Si el grup està lligat a una classe, el creador ha de ser professor/owner
    // o membre de la classe.
    const isMember = await isMemberOfClass({ classId, userId: ownerId });
    if (!isMember && c.professor_id !== ownerId) {
      return {
        ok: false,
        status: 403,
        error: "You must belong to the class to create a group for it",
      };
    }

    classConnect = { connect: { id: classId } };
  }

  const created = await prisma.work_groups.create({
    data: {
      id: groupId,
      nom,
      descripcio: typeof descripcio === "string" ? descripcio : null,
      owner_id: ownerId,
      ...(classConnect ? { classes: classConnect } : {}),
      group_members: {
        // afegim owner com a membre
        create: {
          user_id: ownerId,
          member_role: "OWNER",
        },
      },
    },
  });

  return { ok: true, data: created };
}

async function listGroupsForUser({ user }) {
  if (isAdmin(user)) {
    return prisma.work_groups.findMany({
      orderBy: { created_at: "desc" },
    });
  }

  return prisma.work_groups.findMany({
    where: {
      OR: [
        { owner_id: user.id },
        {
          group_members: {
            some: { user_id: user.id },
          },
        },
      ],
    },
    orderBy: { created_at: "desc" },
  });
}

async function canAccessGroup({ groupId, user }) {
  const g = await prisma.work_groups.findUnique({ where: { id: groupId } });
  if (!g) return { ok: false, status: 404, error: "Group not found" };

  if (isAdmin(user)) return { ok: true, group: g };
  if (g.owner_id === user.id) return { ok: true, group: g };

  const membership = await prisma.group_members.findUnique({
    where: { group_id_user_id: { group_id: groupId, user_id: user.id } },
  });

  if (!membership) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return { ok: true, group: g };
}

async function canManageGroup({ groupId, user }) {
  const g = await prisma.work_groups.findUnique({ where: { id: groupId } });
  if (!g) return { ok: false, status: 404, error: "Group not found" };

  if (isAdmin(user) || g.owner_id === user.id) {
    return { ok: true, group: g };
  }

  return {
    ok: false,
    status: 403,
    error: "Only group owner or admin can manage this group",
  };
}

async function getGroupDetail({ groupId, user }) {
  const access = await canAccessGroup({ groupId, user });
  if (!access.ok) return access;

  const detail = await prisma.work_groups.findUnique({
    where: { id: groupId },
    include: {
      owner: {
        select: { id: true, nom: true, cognom: true, email: true, rol: true },
      },
      classes: {
        select: { id: true, nom: true, professor_id: true },
      },
      group_members: {
        include: {
          users: {
            select: {
              id: true,
              nom: true,
              cognom: true,
              email: true,
              rol: true,
            },
          },
        },
        orderBy: { joined_at: "asc" },
      },
    },
  });

  return { ok: true, data: detail };
}

async function updateGroup({ groupId, user, nom, descripcio }) {
  const manage = await canManageGroup({ groupId, user });
  if (!manage.ok) return manage;

  const dataToUpdate = {};
  if (typeof nom === "string") {
    dataToUpdate.nom = nom;
  }
  if (descripcio !== undefined) {
    dataToUpdate.descripcio =
      typeof descripcio === "string" ? descripcio : null;
  }

  const updated = await prisma.work_groups.update({
    where: { id: groupId },
    data: dataToUpdate,
  });

  return { ok: true, data: updated };
}

async function deleteGroup({ groupId, user }) {
  const manage = await canManageGroup({ groupId, user });
  if (!manage.ok) return manage;

  await prisma.work_groups.delete({ where: { id: groupId } });

  return { ok: true, data: { deletedGroupId: groupId } };
}

async function addMember({ groupId, user, targetEmail, targetUserId, memberRole }) {
  const manage = await canManageGroup({ groupId, user });
  if (!manage.ok) return manage;
  const g = manage.group;

  let targetUser = null;

  if (targetEmail) {
    const normalized = String(targetEmail || "").trim().toLowerCase();
    targetUser = await prisma.users.findUnique({ where: { email: normalized } });
    if (!targetUser) {
      return { ok: false, status: 404, error: "User with given email not found" };
    }
  } else if (targetUserId) {
    targetUser = await prisma.users.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return { ok: false, status: 404, error: "User with given id not found" };
    }
  } else {
    return {
      ok: false,
      status: 400,
      error: "Either email or userId must be provided",
    };
  }

  // Si el grup pertany a una classe, nomès es poden afegir membres
  // que també siguin membres (o professor) d'aquesta classe.
  if (g.class_id) {
    const c = await prisma.classes.findUnique({ where: { id: g.class_id } });
    if (!c) {
      return {
        ok: false,
        status: 500,
        error: "Linked class not found for this group",
      };
    }

    const isMember = await isMemberOfClass({
      classId: g.class_id,
      userId: targetUser.id,
    });

    if (!isMember && c.professor_id !== targetUser.id) {
      return {
        ok: false,
        status: 400,
        error: "User must belong to the linked class to join this group",
      };
    }
  }

  const exists = await prisma.group_members.findUnique({
    where: {
      group_id_user_id: { group_id: groupId, user_id: targetUser.id },
    },
  });

  if (exists) {
    return {
      ok: true,
      data: {
        groupId,
        userId: targetUser.id,
        alreadyMember: true,
      },
    };
  }

  const created = await prisma.group_members.create({
    data: {
      group_id: groupId,
      user_id: targetUser.id,
      member_role: memberRole || null,
    },
  });

  return {
    ok: true,
    data: {
      groupId,
      membership: created,
      alreadyMember: false,
    },
  };
}

async function removeMember({ groupId, memberId, user }) {
  const manage = await canManageGroup({ groupId, user });
  if (!manage.ok) return manage;
  const g = manage.group;

  if (memberId === g.owner_id) {
    return {
      ok: false,
      status: 400,
      error: "Cannot remove group owner",
    };
  }

  const exists = await prisma.group_members.findUnique({
    where: { group_id_user_id: { group_id: groupId, user_id: memberId } },
  });

  if (!exists) {
    return { ok: false, status: 404, error: "Member not found in group" };
  }

  await prisma.group_members.delete({
    where: { group_id_user_id: { group_id: groupId, user_id: memberId } },
  });

  return { ok: true, data: { groupId, removedUserId: memberId } };
}

async function updateMember({ groupId, memberId, user, memberRole }) {
  const manage = await canManageGroup({ groupId, user });
  if (!manage.ok) return manage;
  const g = manage.group;

  if (memberId === g.owner_id) {
    return {
      ok: false,
      status: 400,
      error: "Cannot update role for group owner",
    };
  }

  const exists = await prisma.group_members.findUnique({
    where: { group_id_user_id: { group_id: groupId, user_id: memberId } },
  });

  if (!exists) {
    return { ok: false, status: 404, error: "Member not found in group" };
  }

  const updated = await prisma.group_members.update({
    where: { group_id_user_id: { group_id: groupId, user_id: memberId } },
    data: { member_role: memberRole },
  });

  return { ok: true, data: updated };
}

module.exports = {
  createGroup,
  listGroupsForUser,
  getGroupDetail,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
  updateMember,
};

