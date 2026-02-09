const fs = require("fs");
const path = require("path");
const documentsService = require("./documents.service");

function safeUnlink(filePath) {
  try {
    if (filePath) fs.unlinkSync(filePath);
  } catch (e) {
    // ignore cleanup errors
  }
}

async function uploadForClass(req, res) {
  const classId = req.params.id;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ ok: false, error: "Missing file" });
  }

  try {
    const backendRoot = path.resolve(__dirname, "../../..");
    file.storagePath = path.relative(backendRoot, file.path);

    const result = await documentsService.createForClass({
      classId,
      file,
      user: req.user,
    });

    if (!result.ok) {
      safeUnlink(file.path);
      return res.status(result.status).json({ ok: false, error: result.error });
    }

    return res.status(201).json({ ok: true, data: result.data });
  } catch (e) {
    safeUnlink(file.path);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
}

async function uploadForGroup(req, res) {
  const groupId = req.params.id;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ ok: false, error: "Missing file" });
  }

  try {
    const backendRoot = path.resolve(__dirname, "../../..");
    file.storagePath = path.relative(backendRoot, file.path);

    const result = await documentsService.createForGroup({
      groupId,
      file,
      user: req.user,
    });

    if (!result.ok) {
      safeUnlink(file.path);
      return res.status(result.status).json({ ok: false, error: result.error });
    }

    return res.status(201).json({ ok: true, data: result.data });
  } catch (e) {
    safeUnlink(file.path);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
}

async function listClassDocuments(req, res) {
  const classId = req.params.id;

  try {
    const result = await documentsService.listByClass({ classId, user: req.user });
    if (!result.ok) {
      return res.status(result.status).json({ ok: false, error: result.error });
    }

    return res.json({ ok: true, data: result.data });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
}

async function listGroupDocuments(req, res) {
  const groupId = req.params.id;

  try {
    const result = await documentsService.listByGroup({ groupId, user: req.user });
    if (!result.ok) {
      return res.status(result.status).json({ ok: false, error: result.error });
    }

    return res.json({ ok: true, data: result.data });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
}

async function downloadClassDocument(req, res) {
  const classId = req.params.id;
  const docId = req.params.docId;

  try {
    const result = await documentsService.getClassDocument({
      classId,
      docId,
      user: req.user,
    });

    if (!result.ok) {
      return res.status(result.status).json({ ok: false, error: result.error });
    }

    if (!fs.existsSync(result.data.absolutePath)) {
      return res.status(404).json({ ok: false, error: "File not found on disk" });
    }

    return res.download(result.data.absolutePath, result.data.nom);
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
}

async function downloadGroupDocument(req, res) {
  const groupId = req.params.id;
  const docId = req.params.docId;

  try {
    const result = await documentsService.getGroupDocument({
      groupId,
      docId,
      user: req.user,
    });

    if (!result.ok) {
      return res.status(result.status).json({ ok: false, error: result.error });
    }

    if (!fs.existsSync(result.data.absolutePath)) {
      return res.status(404).json({ ok: false, error: "File not found on disk" });
    }

    return res.download(result.data.absolutePath, result.data.nom);
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
}

module.exports = {
  uploadForClass,
  uploadForGroup,
  listClassDocuments,
  listGroupDocuments,
  downloadClassDocument,
  downloadGroupDocument,
};
