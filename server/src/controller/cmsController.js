const asyncHandler = require("../utils/asyncHandler");
const {
  SITE_IDS,
  HomePage,
  Category,
  Product,
  Blog,
  LegalPage,
} = require("../model/cmsModels");

const SITES = [
  { id: "thailand-kitchen", name: "Thailand Kitchen", enabled: true },
  { id: "varsovia-kitchen", name: "Varsovia Kitchen", enabled: true },
];

const DEFAULT_HOME_SECTIONS = {
  hero: {
    title: "Craft kitchens with soul",
    subtitle: "Thai heritage meets modern living",
    cta: "Explore Products",
    image: "/HeroSection/hero.jpg",
  },
  statistics: {
    items: [
      { label: "Projects", value: "120+" },
      { label: "Years", value: "10+" },
      { label: "Clients", value: "500+" },
    ],
  },
  advantages: {
    items: [
      { title: "Craftsmanship", description: "Precision joinery and teak soul." },
      { title: "Custom Design", description: "Layouts tailored to your island home." },
      { title: "Full Install", description: "From consultation to handover." },
    ],
  },
  story: {
    title: "Our Story",
    text: "We believe in the soul of teak wood and the precision of ancient joining techniques.",
  },
  transition: {
    items: [
      { title: "Consult" },
      { title: "Design" },
      { title: "Craft" },
      { title: "Install" },
    ],
  },
  testimonials: { items: [] },
  catalogue: { items: [] },
  partners: { items: [] },
  faq: { items: [] },
  footer: {
    email: "hi@thailandkitchens.com",
    phone: "+66 64 683 9777",
    address: "Pattaya & Samui, Thailand",
  },
};

function assertSite(siteId) {
  return SITE_IDS.includes(siteId);
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const listSites = asyncHandler(async (_req, res) => {
  return res.json({ success: true, sites: SITES });
});

const getHome = asyncHandler(async (req, res) => {
  const { siteId } = req.params;
  if (!assertSite(siteId)) {
    return res.status(400).json({ success: false, message: "Invalid site" });
  }

  let home = await HomePage.findOne({ siteId });
  if (!home) {
    home = await HomePage.create({
      siteId,
      sections: structuredClone(DEFAULT_HOME_SECTIONS),
    });
  }

  return res.json({ success: true, home: { sections: home.sections || {} } });
});

const updateHome = asyncHandler(async (req, res) => {
  const { siteId } = req.params;
  if (!assertSite(siteId)) {
    return res.status(400).json({ success: false, message: "Invalid site" });
  }

  const sections = req.body.sections || {};
  const home = await HomePage.findOneAndUpdate(
    { siteId },
    { $set: { sections } },
    { upsert: true, new: true }
  );

  return res.json({ success: true, home: { sections: home.sections || {} } });
});

const resetHome = asyncHandler(async (req, res) => {
  const { siteId } = req.params;
  if (!assertSite(siteId)) {
    return res.status(400).json({ success: false, message: "Invalid site" });
  }

  const home = await HomePage.findOneAndUpdate(
    { siteId },
    { $set: { sections: structuredClone(DEFAULT_HOME_SECTIONS) } },
    { upsert: true, new: true }
  );

  return res.json({ success: true, home: { sections: home.sections || {} } });
});

const listCategories = asyncHandler(async (req, res) => {
  const { siteId } = req.params;
  if (!assertSite(siteId)) {
    return res.status(400).json({ success: false, message: "Invalid site" });
  }
  const items = await Category.find({ siteId }).sort({ createdAt: -1 });
  return res.json({ success: true, items });
});

const createCategory = asyncHandler(async (req, res) => {
  const { siteId } = req.params;
  if (!assertSite(siteId)) {
    return res.status(400).json({ success: false, message: "Invalid site" });
  }
  const item = await Category.create({
    siteId,
    title: String(req.body.title || "").trim(),
    description: String(req.body.description || ""),
    image: String(req.body.image || ""),
  });
  return res.status(201).json({ success: true, item });
});

const updateCategory = asyncHandler(async (req, res) => {
  const { siteId, id } = req.params;
  const item = await Category.findOneAndUpdate(
    { _id: id, siteId },
    {
      $set: {
        title: String(req.body.title || "").trim(),
        description: String(req.body.description || ""),
        image: String(req.body.image || ""),
      },
    },
    { new: true }
  );
  if (!item) {
    return res.status(404).json({ success: false, message: "Category not found" });
  }
  return res.json({ success: true, item });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const { siteId, id } = req.params;
  const item = await Category.findOneAndDelete({ _id: id, siteId });
  if (!item) {
    return res.status(404).json({ success: false, message: "Category not found" });
  }
  return res.json({ success: true, message: "Deleted" });
});

const listProducts = asyncHandler(async (req, res) => {
  const { siteId } = req.params;
  if (!assertSite(siteId)) {
    return res.status(400).json({ success: false, message: "Invalid site" });
  }
  const items = await Product.find({ siteId }).sort({ createdAt: -1 });
  return res.json({ success: true, items });
});

const createProduct = asyncHandler(async (req, res) => {
  const { siteId } = req.params;
  if (!assertSite(siteId)) {
    return res.status(400).json({ success: false, message: "Invalid site" });
  }

  const title = String(req.body.title || "").trim();
  const slug = slugify(req.body.slug || title);
  if (!title || !slug) {
    return res
      .status(400)
      .json({ success: false, message: "Title and slug are required" });
  }

  const item = await Product.create({
    siteId,
    title,
    slug,
    description: String(req.body.description || ""),
    image: String(req.body.image || ""),
    category: String(req.body.category || ""),
    featured: Boolean(req.body.featured),
  });

  return res.status(201).json({ success: true, item });
});

const updateProduct = asyncHandler(async (req, res) => {
  const { siteId, id } = req.params;
  const title = String(req.body.title || "").trim();
  const slug = slugify(req.body.slug || title);

  const item = await Product.findOneAndUpdate(
    { _id: id, siteId },
    {
      $set: {
        title,
        slug,
        description: String(req.body.description || ""),
        image: String(req.body.image || ""),
        category: String(req.body.category || ""),
        featured: Boolean(req.body.featured),
      },
    },
    { new: true }
  );

  if (!item) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }
  return res.json({ success: true, item });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { siteId, id } = req.params;
  const item = await Product.findOneAndDelete({ _id: id, siteId });
  if (!item) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }
  return res.json({ success: true, message: "Deleted" });
});

const listBlogs = asyncHandler(async (req, res) => {
  const { siteId } = req.params;
  if (!assertSite(siteId)) {
    return res.status(400).json({ success: false, message: "Invalid site" });
  }
  const items = await Blog.find({ siteId }).sort({ createdAt: -1 });
  return res.json({ success: true, items });
});

const createBlog = asyncHandler(async (req, res) => {
  const { siteId } = req.params;
  if (!assertSite(siteId)) {
    return res.status(400).json({ success: false, message: "Invalid site" });
  }

  const title = String(req.body.title || "").trim();
  const slug = slugify(req.body.slug || title);
  if (!title || !slug) {
    return res
      .status(400)
      .json({ success: false, message: "Title and slug are required" });
  }

  const item = await Blog.create({
    siteId,
    title,
    slug,
    excerpt: String(req.body.excerpt || ""),
    content: String(req.body.content || ""),
    image: String(req.body.image || ""),
    published: req.body.published !== false,
  });

  return res.status(201).json({ success: true, item });
});

const updateBlog = asyncHandler(async (req, res) => {
  const { siteId, id } = req.params;
  const title = String(req.body.title || "").trim();
  const slug = slugify(req.body.slug || title);

  const item = await Blog.findOneAndUpdate(
    { _id: id, siteId },
    {
      $set: {
        title,
        slug,
        excerpt: String(req.body.excerpt || ""),
        content: String(req.body.content || ""),
        image: String(req.body.image || ""),
        published: req.body.published !== false,
      },
    },
    { new: true }
  );

  if (!item) {
    return res.status(404).json({ success: false, message: "Blog not found" });
  }
  return res.json({ success: true, item });
});

const deleteBlog = asyncHandler(async (req, res) => {
  const { siteId, id } = req.params;
  const item = await Blog.findOneAndDelete({ _id: id, siteId });
  if (!item) {
    return res.status(404).json({ success: false, message: "Blog not found" });
  }
  return res.json({ success: true, message: "Deleted" });
});

const getLegal = asyncHandler(async (req, res) => {
  const { siteId, type } = req.params;
  if (!assertSite(siteId) || !["privacy", "terms"].includes(type)) {
    return res.status(400).json({ success: false, message: "Invalid request" });
  }

  let page = await LegalPage.findOne({ siteId, type });
  if (!page) {
    page = await LegalPage.create({
      siteId,
      type,
      title: type === "privacy" ? "Privacy Policy" : "Terms & Conditions",
      content: "",
    });
  }

  return res.json({ success: true, page });
});

const updateLegal = asyncHandler(async (req, res) => {
  const { siteId, type } = req.params;
  if (!assertSite(siteId) || !["privacy", "terms"].includes(type)) {
    return res.status(400).json({ success: false, message: "Invalid request" });
  }

  const page = await LegalPage.findOneAndUpdate(
    { siteId, type },
    {
      $set: {
        title: String(req.body.title || "").trim() ||
          (type === "privacy" ? "Privacy Policy" : "Terms & Conditions"),
        content: String(req.body.content || ""),
      },
    },
    { upsert: true, new: true }
  );

  return res.json({ success: true, page });
});

module.exports = {
  listSites,
  getHome,
  updateHome,
  resetHome,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  listBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
  getLegal,
  updateLegal,
};
