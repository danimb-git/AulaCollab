const { v4: uuidv4 } = require("uuid");
const prisma = require("../../db/prisma");

function isAdmin(user) {
  return user?.role === "ADMIN";
}

function isStudent(user) {
  return user?.role === "ALUMNE";
}

async function getGroupById(groupId) {
  return prisma.work_groups.findUnique({ where: { id: groupId } });
}

async function isMember(groupId, userId) {
  const member = await prisma.group_members.findUnique({
    where: { group_id_user_id: { group_id: groupId, user_id: userId } },
  });
  return Boolean(member);
}

async function canAccessGroup({ groupId, user }) {
  const group = await getGroupById(groupId);
  if (!group) return { ok: false, status: 404, error: "Group not found" };

  if (isAdmin(user)) return { ok: true, group };

  if (!isStudent(user)) {
    return { ok: false, status: 403, error: "Only students can access groups" };
  }

  const member = await isMember(groupId, user.id);
  if (!member) return { ok: false, status: 403, error: "Forbidden" };

  return { ok: true, group };
}

async function canManageGroup({ groupId, user }) {
  const group = await getGroupById(groupId);
  if (!group) return { ok: false, status: 404, error: "Group not found" };

  if (isAdmin(user)) return { ok: true, group };

  if (!isStudent(user)) {
    return { ok: false, status: 403, error: "Only students can manage groups" };
  }

  if (group.owner_id !== user.id) {
    return { ok: false, status: 403, error: "Only group owner can manage this group" };
  }

  return { ok: true, group };
}

async function createGroup({ nom, descripcio, ownerId, classId, user }) {
  if (!isStudent(user) && !isAdmin(user)) {
    return { ok: false, status: 403, error: "Only students or admins can create groups" };
  }

  if (classId) {
    const c = await prisma.classes.findUnique({ where: { id: classId } });
    if (!c) return { ok: false, status: 404, error: "Class not found" };
  }

  const id = uuidv4();

  const group = await prisma.work_groups.create({
    data: {
      id,
      nom,
      descripcio: typeof descripcio === "string" ? descripcio : null,
      owner_id: ownerId,
      class_id: classId || null,
      group_members: {
        create: {
          user_id: ownerId,
          member_role: "OWNER",
        },
      },
    },
  });

  return { ok: true, data: group };
}

async function listGroupsForUser({ user }) {
  if (isAdmin(user)) {
    const groups = await prisma.work_groups.findMany({
      orderBy: { created_at: "desc" },
    });
    return { ok: true, data: groups };
  }

  if (!isStudent(user)) {
    return { ok: false, status: 403, error: "Only students can list groups" };
  }

  const groups = await prisma.work_groups.findMany({
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

  return { ok: true, data: groups };
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
      group_members: {
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

  let targetUser = null;
  if (targetUserId) {
    targetUser = await prisma.users.findUnique({ where: { id: targetUserId } });
  } else if (targetEmail) {
    targetUser = await prisma.users.findUnique({ where: { email: targetEmail } });
  }

  if (!targetUser) {
    return { ok: false, status: 404, error: "User not found" };
  }

  const exists = await prisma.group_members.findUnique({
    where: { group_id_user_id: { group_id: groupId, user_id: targetUser.id } },
  });

  if (exists) {
    return { ok: true, data: { groupId, added: [], alreadyMember: [targetUser.id] } };
  }

  await prisma.group_members.create({
    data: {
      group_id: groupId,
      user_id: targetUser.id,
      member_role: memberRole || null,
    },
  });

  return { ok: true, data: { groupId, added: [targetUser.id], alreadyMember: [] } };
}

async function removeMember({ groupId, memberId, user }) {
  const manage = await canManageGroup({ groupId, user });
  if (!manage.ok) return manage;
  const group = manage.group;

  if (memberId === group.owner_id) {
    return { ok: false, status: 400, error: "Cannot remove group owner" };
  }

  const exists = await prisma.group_members.findUnique({
    where: { group_id_user_id: { group_id: groupId, user_id: memberId } },
  });

  if (!exists) return { ok: false, status: 404, error: "Member not found in group" };

  await prisma.group_members.delete({
    where: { group_id_user_id: { group_id: groupId, user_id: memberId } },
  });

  return { ok: true, data: { groupId, removedUserId: memberId } };
}

async function updateMember({ groupId, memberId, user, memberRole }) {
  const manage = await canManageGroup({ groupId, user });
  if (!manage.ok) return manage;
  const group = manage.group;

  if (memberId === group.owner_id) {
    return { ok: false, status: 400, error: "Cannot update role for group owner" };
  }

  const exists = await prisma.group_members.findUnique({
    where: { group_id_user_id: { group_id: groupId, user_id: memberId } },
  });

  if (!exists) return { ok: false, status: 404, error: "Member not found in group" };

  const updated = await prisma.group_members.update({
    where: { group_id_user_id: { group_id: groupId, user_id: memberId } },
    data: { member_role: memberRole },
  });

  return { ok: true, data: updated };
}

module.exports = {
  getGroupById,
  isMember,
  canAccessGroup,
  isAdmin,
  canManageGroup,
  createGroup,
  listGroupsForUser,
  getGroupDetail,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
  updateMember,
};
