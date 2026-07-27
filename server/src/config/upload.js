const path = require("path");
const fs = require("fs");
const multer = require("multer");

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

function ensureUploadDirs() {
  for (const dir of ["images", "icons", "pdfs", "misc"]) {
    const full = path.join(UPLOAD_ROOT, dir);
    if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
  }
}

ensureUploadDirs();

const ALLOWED_IMAGE = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

const ALLOWED_PDF = new Set(["application/pdf"]);

function folderFor(kind, mime) {
  if (kind === "icon") return "icons";
  if (kind === "pdf" || ALLOWED_PDF.has(mime)) return "pdfs";
  if (ALLOWED_IMAGE.has(mime)) return "images";
  return "misc";
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const kind = String(req.body?.kind || req.query?.kind || "image").toLowerCase();
    const folder = folderFor(kind, file.mimetype);
    const dest = path.join(UPLOAD_ROOT, folder);
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname || "").toLowerCase() || "";
    const safe = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safe);
  },
});

function fileFilter(req, file, cb) {
  const kind = String(req.body?.kind || req.query?.kind || "image").toLowerCase();
  if (kind === "pdf") {
    if (ALLOWED_PDF.has(file.mimetype) || file.originalname?.toLowerCase().endsWith(".pdf")) {
      return cb(null, true);
    }
    return cb(new Error("Only PDF files are allowed"));
  }
  if (ALLOWED_IMAGE.has(file.mimetype)) return cb(null, true);
  if (kind === "any" && (ALLOWED_IMAGE.has(file.mimetype) || ALLOWED_PDF.has(file.mimetype))) {
    return cb(null, true);
  }
  return cb(new Error("Unsupported file type. Use image or PDF."));
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

function publicUrlFor(req, absolutePath) {
  const rel = path.relative(UPLOAD_ROOT, absolutePath).split(path.sep).join("/");
  // Prefer same-origin relative URL so Next.js admin/client rewrites work.
  // Set PUBLIC_API_URL only when files must be absolute (e.g. CDN / separate media host).
  if (process.env.PUBLIC_API_URL?.trim()) {
    return `${process.env.PUBLIC_API_URL.replace(/\/+$/, "")}/uploads/${rel}`;
  }
  return `/uploads/${rel}`;
}

function hasCloudinary() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

module.exports = {
  UPLOAD_ROOT,
  upload,
  publicUrlFor,
  hasCloudinary,
  ensureUploadDirs,
};
