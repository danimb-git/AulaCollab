const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const env = require("../../config/env");

function sanitizeFilename(name) {
  return String(name || "file")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 200);
}

function createUpload(kind) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const id = req.params.id;
      if (!id) return cb(new Error("Missing id param"));

      const baseDir = path.resolve(__dirname, "../../../uploads", kind, id);
      try {
        fs.mkdirSync(baseDir, { recursive: true });
      } catch (e) {
        return cb(e);
      }
      return cb(null, baseDir);
    },
    filename: (req, file, cb) => {
      const safeName = sanitizeFilename(file.originalname);
      const filename = `${uuidv4()}_${safeName}`;
      cb(null, filename);
    },
  });

  return multer({
    storage,
    limits: {
      fileSize: env.FILE_UPLOAD_MAX_BYTES,
    },
  });
}

module.exports = { createUpload };
