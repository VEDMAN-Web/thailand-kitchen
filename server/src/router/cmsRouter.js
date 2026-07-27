const express = require("express");
const cms = require("../controller/cmsController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Public reads (website + admin bootstrapping)
router.get("/sites", cms.listSites);
router.get("/:siteId/home", cms.getHome);
router.get("/:siteId/categories", cms.listCategories);
router.get("/:siteId/products", cms.listProducts);
router.get("/:siteId/blogs", cms.listBlogs);
router.get("/:siteId/legal/:type", cms.getLegal);

// Protected writes (admin panel)
router.put("/:siteId/home", protect, cms.updateHome);
router.post("/:siteId/home/reset", protect, cms.resetHome);

router.post("/:siteId/categories", protect, cms.createCategory);
router.put("/:siteId/categories/:id", protect, cms.updateCategory);
router.delete("/:siteId/categories/:id", protect, cms.deleteCategory);

router.post("/:siteId/products", protect, cms.createProduct);
router.put("/:siteId/products/:id", protect, cms.updateProduct);
router.delete("/:siteId/products/:id", protect, cms.deleteProduct);

router.post("/:siteId/blogs", protect, cms.createBlog);
router.put("/:siteId/blogs/:id", protect, cms.updateBlog);
router.delete("/:siteId/blogs/:id", protect, cms.deleteBlog);

router.put("/:siteId/legal/:type", protect, cms.updateLegal);

module.exports = router;
