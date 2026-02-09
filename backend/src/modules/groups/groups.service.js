const prisma = require("../../db/prisma");

function isAdmin(user) {
  return user?.role === "ADMIN";
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

  if (user.role !== "ALUMNE") {
    return { ok: false, status: 403, error: "Only students can access groups" };
  }

  const member = await isMember(groupId, user.id);
  if (!member) return { ok: false, status: 403, error: "Forbidden" };

  return { ok: true, group };
}

module.exports = {
  getGroupById,
  isMember,
  canAccessGroup,
  isAdmin,
};
