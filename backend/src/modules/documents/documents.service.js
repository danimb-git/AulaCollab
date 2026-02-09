const path = require("path");
const { v4: uuidv4 } = require("uuid");
const prisma = require("../../db/prisma");
const classesService = require("../classes/classes.service");
const groupsService = require("../groups/groups.service");

const backendRoot = path.resolve(__dirname, "../../..");

function toAbsolutePath(storagePath) {
  return path.resolve(backendRoot, storagePath);
}

async function createForClass({ classId, file, user }) {
  // Només ADMIN o professor propietari
  const c = await prisma.classes.findUnique({ where: { id: classId } });
  if (!c) return { ok: false, status: 404, error: "Class not found" };

  if (user.role !== "ADMIN" && c.professor_id !== user.id) {
    return { ok: false, status: 403, error: "Only owner can upload" };
  }

  const doc = await prisma.documents.create({
    data: {
      id: uuidv4(),
      nom: file.originalname,
      storage_path: file.storagePath,
      uploader_id: user.id,
      class_id: classId,
      group_id: null,
    },
  });

  return { ok: true, data: doc };
}

async function createForGroup({ groupId, file, user }) {
  const access = await groupsService.canAccessGroup({ groupId, user });
  if (!access.ok) return access;

  const doc = await prisma.documents.create({
    data: {
      id: uuidv4(),
      nom: file.originalname,
      storage_path: file.storagePath,
      uploader_id: user.id,
      class_id: null,
      group_id: groupId,
    },
  });

  return { ok: true, data: doc };
}

async function listByClass({ classId, user }) {
  const access = await classesService.getClassDetail({ classId, user });
  if (!access.ok) return access;

  const docs = await prisma.documents.findMany({
    where: { class_id: classId },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      nom: true,
      uploader_id: true,
      created_at: true,
    },
  });

  return { ok: true, data: docs };
}

async function listByGroup({ groupId, user }) {
  const access = await groupsService.canAccessGroup({ groupId, user });
  if (!access.ok) return access;

  const docs = await prisma.documents.findMany({
    where: { group_id: groupId },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      nom: true,
      uploader_id: true,
      created_at: true,
    },
  });

  return { ok: true, data: docs };
}

async function getClassDocument({ classId, docId, user }) {
  const access = await classesService.getClassDetail({ classId, user });
  if (!access.ok) return access;

  const doc = await prisma.documents.findUnique({ where: { id: docId } });
  if (!doc || doc.class_id !== classId) {
    return { ok: false, status: 404, error: "Document not found" };
  }

  return { ok: true, data: { ...doc, absolutePath: toAbsolutePath(doc.storage_path) } };
}

async function getGroupDocument({ groupId, docId, user }) {
  const access = await groupsService.canAccessGroup({ groupId, user });
  if (!access.ok) return access;

  const doc = await prisma.documents.findUnique({ where: { id: docId } });
  if (!doc || doc.group_id !== groupId) {
    return { ok: false, status: 404, error: "Document not found" };
  }

  return { ok: true, data: { ...doc, absolutePath: toAbsolutePath(doc.storage_path) } };
}

module.exports = {
  createForClass,
  createForGroup,
  listByClass,
  listByGroup,
  getClassDocument,
  getGroupDocument,
};
