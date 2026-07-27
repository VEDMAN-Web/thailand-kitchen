const asyncHandler = require("../utils/asyncHandler");
const {
  SITE_IDS,
  HomePage,
  Category,
  Product,
  Blog,
  LegalPage,
  GalleryItem,
  CatalogueItem,
  FaqItem,
} = require("../model/cmsModels");

const SITES = [
  { id: "thailand-kitchen", name: "Thailand Kitchen", enabled: true },
  { id: "varsovia-kitchen", name: "Varsovia Kitchen", enabled: true },
];

const DEFAULT_HOME_SECTIONS = {
  hero: {
    subtitle: "Thailand Kitchens",
    title: "Craft kitchens with soul",
    description: "Thai heritage meets modern living",
    buttonText: "Free Consultation",
    image: "/products/Kitchen2.png",
    videoUrl: "",
  },
  statistics: {
    items: [
      { label: "Years", value: "15", suffix: "+" },
      { label: "Cities", value: "12", suffix: "" },
      { label: "Kitchens", value: "800", suffix: "+" },
    ],
  },
  advantages: {
    items: [
      {
        title: "Craftsmanship",
        description: "Precision joinery and teak soul.",
        icon: "",
      },
      {
        title: "Custom Design",
        description: "Layouts tailored to your island home.",
        icon: "",
      },
      {
        title: "Full Install",
        description: "From consultation to handover.",
        icon: "",
      },
    ],
  },
  story: {
    title: "Our Story",
    subtitle: "About Us",
    description:
      "We believe in the soul of teak wood and the precision of ancient joining techniques.",
    image: "/slider/crafted-with-passion.png",
  },
  transition: {
    pillars: [
      { title: "Consult", description: "Understand your space and lifestyle.", icon: "" },
      { title: "Design", description: "Plan layouts and materials together.", icon: "" },
      { title: "Craft", description: "Build with precision and care.", icon: "" },
      { title: "Install", description: "Deliver and install as one team.", icon: "" },
    ],
  },
  testimonials: {
    items: [
      {
        name: "Sarah M.",
        role: "Homeowner, Samui",
        quote: "Beautiful craftsmanship and a smooth install from start to finish.",
        image: "",
        rating: 5,
      },
    ],
  },
  catalogue: {
    items: [
      {
        title: "2026 EDITION",
        category: "Minimal",
        image: "/catlog/catlog.png",
        pdfUrl: "",
        fileName: "catalogue-minimal.pdf",
        downloadName: "Thailand-Kitchens-Catalogue-Minimal.pdf",
      },
      {
        title: "2026 EDITION",
        category: "Classic",
        image: "/catlog/catlog (1).png",
        pdfUrl: "",
        fileName: "catalogue-classic.pdf",
        downloadName: "Thailand-Kitchens-Catalogue-Classic.pdf",
      },
      {
        title: "2026 EDITION",
        category: "Modern",
        image: "/catlog/catlog (2).png",
        pdfUrl: "",
        fileName: "catalogue-modern.pdf",
        downloadName: "Thailand-Kitchens-Catalogue-Modern.pdf",
      },
    ],
  },
  partners: {
    logos: [{ name: "Partner", image: "/brand/brand.png" }],
  },
  faq: {
    items: [
      {
        question: "How long does a custom kitchen take?",
        answer: "Typical projects take 8–12 weeks from design sign-off to install.",
      },
      {
        question: "Do you install across Thailand?",
        answer: "Yes — we primarily serve Pattaya, Samui, and surrounding areas.",
      },
    ],
  },
  footer: {
    email: "hi@thailandkitchens.com",
    phone: "+66 64 683 9777",
    address: "Pattaya & Samui, Thailand",
    facebook: "https://www.facebook.com/ThailandKitchens/",
    instagram: "",
    line: "",
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

function asStringArray(value) {
  if (Array.isArray(value)) {
    return value.map((v) => String(v || "").trim()).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Migrate legacy field names + fill empty sections so admin "ready" checks pass
 * and the website always has usable content.
 */
function normalizeHomeSections(raw = {}) {
  const defaults = structuredClone(DEFAULT_HOME_SECTIONS);
  const src = raw && typeof raw === "object" ? raw : {};

  const heroSrc = src.hero || {};
  const hero = {
    ...defaults.hero,
    ...heroSrc,
    buttonText:
      heroSrc.buttonText || heroSrc.cta || defaults.hero.buttonText,
    description:
      heroSrc.description ||
      heroSrc.subtitle ||
      defaults.hero.description,
    subtitle:
      heroSrc.subtitle && heroSrc.subtitle !== heroSrc.description
        ? heroSrc.subtitle
        : heroSrc.eyebrow || defaults.hero.subtitle,
    title: heroSrc.title || defaults.hero.title,
    image: heroSrc.image || defaults.hero.image,
    videoUrl: heroSrc.videoUrl || "",
  };

  const storySrc = src.story || {};
  const story = {
    ...defaults.story,
    ...storySrc,
    description:
      storySrc.description || storySrc.text || defaults.story.description,
    subtitle: storySrc.subtitle || defaults.story.subtitle,
    image: storySrc.image || defaults.story.image,
  };

  const transitionSrc = src.transition || {};
  const pillarsRaw = Array.isArray(transitionSrc.pillars)
    ? transitionSrc.pillars
    : Array.isArray(transitionSrc.items)
      ? transitionSrc.items
      : [];
  const transition = {
    pillars:
      pillarsRaw.length > 0
        ? pillarsRaw.map((p, i) => ({
            title: p.title || defaults.transition.pillars[i]?.title || "",
            description:
              p.description ||
              defaults.transition.pillars[i]?.description ||
              "",
            icon: p.icon || "",
          }))
        : defaults.transition.pillars,
  };

  const partnersSrc = src.partners || {};
  const logosRaw = Array.isArray(partnersSrc.logos)
    ? partnersSrc.logos
    : Array.isArray(partnersSrc.items)
      ? partnersSrc.items
      : [];
  const partners = {
    logos:
      logosRaw.length > 0
        ? logosRaw.map((l) => ({
            name: l.name || l.title || "Partner",
            image: l.image || l.logo || "",
          }))
        : defaults.partners.logos,
  };

  const statsItems =
    Array.isArray(src.statistics?.items) && src.statistics.items.length
      ? src.statistics.items.map((it) => ({
          label: it.label || "",
          value: String(it.value || "").replace(/\+$/, "") || it.value || "",
          suffix:
            it.suffix != null
              ? it.suffix
              : String(it.value || "").endsWith("+")
                ? "+"
                : "",
        }))
      : defaults.statistics.items;

  const advantagesItems =
    Array.isArray(src.advantages?.items) && src.advantages.items.length
      ? src.advantages.items
      : defaults.advantages.items;

  const testimonialsItems =
    Array.isArray(src.testimonials?.items) && src.testimonials.items.length
      ? src.testimonials.items
      : defaults.testimonials.items;

  const catalogueItems =
    Array.isArray(src.catalogue?.items) && src.catalogue.items.length
      ? src.catalogue.items.map((c) => ({
          title: c.title || "Catalogue",
          category: c.category || "",
          image: c.image || "",
          pdfUrl: c.pdfUrl || "",
          fileName: c.fileName || "",
          downloadName: c.downloadName || c.fileName || "",
        }))
      : defaults.catalogue.items;

  const faqItems =
    Array.isArray(src.faq?.items) && src.faq.items.length
      ? src.faq.items
      : defaults.faq.items;

  const footerSrc = src.footer || {};
  const footer = {
    ...defaults.footer,
    ...footerSrc,
  };

  return {
    hero,
    statistics: { items: statsItems },
    advantages: { items: advantagesItems },
    story,
    transition,
    testimonials: { items: testimonialsItems },
    catalogue: { items: catalogueItems },
    partners,
    faq: { items: faqItems },
    footer,
  };
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

  const sections = normalizeHomeSections(home.sections || {});

  // Persist normalized shape so admin "ready" state stays consistent
  const before = JSON.stringify(home.sections || {});
  const after = JSON.stringify(sections);
  if (before !== after) {
    home.sections = sections;
    home.markModified("sections");
    await home.save();
  }

  return res.json({ success: true, home: { sections } });
});

const updateHome = asyncHandler(async (req, res) => {
  const { siteId } = req.params;
  if (!assertSite(siteId)) {
    return res.status(400).json({ success: false, message: "Invalid site" });
  }

  const sections = normalizeHomeSections(req.body.sections || {});
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
    icon: String(req.body.icon || ""),
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
        icon: String(req.body.icon || ""),
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
    icon: String(req.body.icon || ""),
    gallery: asStringArray(req.body.gallery),
    pdfUrl: String(req.body.pdfUrl || ""),
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
        icon: String(req.body.icon || ""),
        gallery: asStringArray(req.body.gallery),
        pdfUrl: String(req.body.pdfUrl || ""),
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
    gallery: asStringArray(req.body.gallery),
    category: String(req.body.category || ""),
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
        gallery: asStringArray(req.body.gallery),
        category: String(req.body.category || ""),
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
        title:
          String(req.body.title || "").trim() ||
          (type === "privacy" ? "Privacy Policy" : "Terms & Conditions"),
        content: String(req.body.content || ""),
      },
    },
    { upsert: true, new: true }
  );

  return res.json({ success: true, page });
});

const listGallery = asyncHandler(async (req, res) => {
  const { siteId } = req.params;
  if (!assertSite(siteId)) {
    return res.status(400).json({ success: false, message: "Invalid site" });
  }
  const items = await GalleryItem.find({ siteId }).sort({
    sortOrder: 1,
    createdAt: -1,
  });
  return res.json({ success: true, items });
});

const createGalleryItem = asyncHandler(async (req, res) => {
  const { siteId } = req.params;
  if (!assertSite(siteId)) {
    return res.status(400).json({ success: false, message: "Invalid site" });
  }
  const item = await GalleryItem.create({
    siteId,
    title: String(req.body.title || "").trim() || "Gallery image",
    image: String(req.body.image || ""),
    filter: String(req.body.filter || "Style & Color"),
    tall: Boolean(req.body.tall),
    wide: Boolean(req.body.wide),
    sortOrder: Number(req.body.sortOrder) || 0,
  });
  return res.status(201).json({ success: true, item });
});

const updateGalleryItem = asyncHandler(async (req, res) => {
  const { siteId, id } = req.params;
  const item = await GalleryItem.findOneAndUpdate(
    { _id: id, siteId },
    {
      $set: {
        title: String(req.body.title || "").trim() || "Gallery image",
        image: String(req.body.image || ""),
        filter: String(req.body.filter || "Style & Color"),
        tall: Boolean(req.body.tall),
        wide: Boolean(req.body.wide),
        sortOrder: Number(req.body.sortOrder) || 0,
      },
    },
    { new: true }
  );
  if (!item) {
    return res.status(404).json({ success: false, message: "Not found" });
  }
  return res.json({ success: true, item });
});

const deleteGalleryItem = asyncHandler(async (req, res) => {
  const { siteId, id } = req.params;
  const item = await GalleryItem.findOneAndDelete({ _id: id, siteId });
  if (!item) {
    return res.status(404).json({ success: false, message: "Not found" });
  }
  return res.json({ success: true, message: "Deleted" });
});

const listCatalogues = asyncHandler(async (req, res) => {
  const { siteId } = req.params;
  if (!assertSite(siteId)) {
    return res.status(400).json({ success: false, message: "Invalid site" });
  }
  const items = await CatalogueItem.find({ siteId }).sort({
    sortOrder: 1,
    createdAt: -1,
  });
  return res.json({ success: true, items });
});

const createCatalogue = asyncHandler(async (req, res) => {
  const { siteId } = req.params;
  if (!assertSite(siteId)) {
    return res.status(400).json({ success: false, message: "Invalid site" });
  }
  const item = await CatalogueItem.create({
    siteId,
    title: String(req.body.title || "").trim() || "Catalogue",
    category: String(req.body.category || ""),
    image: String(req.body.image || ""),
    pdfUrl: String(req.body.pdfUrl || ""),
    fileName: String(req.body.fileName || ""),
    downloadName: String(req.body.downloadName || ""),
    sortOrder: Number(req.body.sortOrder) || 0,
  });
  return res.status(201).json({ success: true, item });
});

const updateCatalogue = asyncHandler(async (req, res) => {
  const { siteId, id } = req.params;
  const item = await CatalogueItem.findOneAndUpdate(
    { _id: id, siteId },
    {
      $set: {
        title: String(req.body.title || "").trim() || "Catalogue",
        category: String(req.body.category || ""),
        image: String(req.body.image || ""),
        pdfUrl: String(req.body.pdfUrl || ""),
        fileName: String(req.body.fileName || ""),
        downloadName: String(req.body.downloadName || ""),
        sortOrder: Number(req.body.sortOrder) || 0,
      },
    },
    { new: true }
  );
  if (!item) {
    return res.status(404).json({ success: false, message: "Not found" });
  }
  return res.json({ success: true, item });
});

const deleteCatalogue = asyncHandler(async (req, res) => {
  const { siteId, id } = req.params;
  const item = await CatalogueItem.findOneAndDelete({ _id: id, siteId });
  if (!item) {
    return res.status(404).json({ success: false, message: "Not found" });
  }
  return res.json({ success: true, message: "Deleted" });
});

const listFaqs = asyncHandler(async (req, res) => {
  const { siteId } = req.params;
  if (!assertSite(siteId)) {
    return res.status(400).json({ success: false, message: "Invalid site" });
  }
  const items = await FaqItem.find({ siteId }).sort({
    sortOrder: 1,
    createdAt: -1,
  });
  return res.json({ success: true, items });
});

const createFaq = asyncHandler(async (req, res) => {
  const { siteId } = req.params;
  if (!assertSite(siteId)) {
    return res.status(400).json({ success: false, message: "Invalid site" });
  }
  const question = String(req.body.question || "").trim();
  if (!question) {
    return res.status(400).json({ success: false, message: "Question required" });
  }
  const item = await FaqItem.create({
    siteId,
    question,
    answer: String(req.body.answer || ""),
    sortOrder: Number(req.body.sortOrder) || 0,
  });
  return res.status(201).json({ success: true, item });
});

const updateFaq = asyncHandler(async (req, res) => {
  const { siteId, id } = req.params;
  const question = String(req.body.question || "").trim();
  if (!question) {
    return res.status(400).json({ success: false, message: "Question required" });
  }
  const item = await FaqItem.findOneAndUpdate(
    { _id: id, siteId },
    {
      $set: {
        question,
        answer: String(req.body.answer || ""),
        sortOrder: Number(req.body.sortOrder) || 0,
      },
    },
    { new: true }
  );
  if (!item) {
    return res.status(404).json({ success: false, message: "Not found" });
  }
  return res.json({ success: true, item });
});

const deleteFaq = asyncHandler(async (req, res) => {
  const { siteId, id } = req.params;
  const item = await FaqItem.findOneAndDelete({ _id: id, siteId });
  if (!item) {
    return res.status(404).json({ success: false, message: "Not found" });
  }
  return res.json({ success: true, message: "Deleted" });
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
  listGallery,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  listCatalogues,
  createCatalogue,
  updateCatalogue,
  deleteCatalogue,
  listFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
};
