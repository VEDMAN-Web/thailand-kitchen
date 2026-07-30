const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { upload } = require("../config/upload");
const { uploadFile, deleteUpload } = require("../controller/uploadController");

const router = express.Router();

// JWT-protected media uploads for admin CMS
router.post("/", protect, upload.single("file"), uploadFile);
router.delete("/", protect, deleteUpload);

module.exports = router;
