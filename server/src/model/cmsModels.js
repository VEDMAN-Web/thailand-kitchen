const mongoose = require("mongoose");

const SITE_IDS = ["thailand-kitchen", "varsovia-kitchen"];

const homePageSchema = new mongoose.Schema(
  {
    siteId: {
      type: String,
      enum: SITE_IDS,
      required: true,
      unique: true,
    },
    sections: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

const categorySchema = new mongoose.Schema(
  {
    siteId: { type: String, enum: SITE_IDS, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    siteId: { type: String, enum: SITE_IDS, required: true, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    category: { type: String, default: "" },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

productSchema.index({ siteId: 1, slug: 1 }, { unique: true });

const blogSchema = new mongoose.Schema(
  {
    siteId: { type: String, enum: SITE_IDS, required: true, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    excerpt: { type: String, default: "" },
    content: { type: String, default: "" },
    image: { type: String, default: "" },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

blogSchema.index({ siteId: 1, slug: 1 }, { unique: true });

const legalPageSchema = new mongoose.Schema(
  {
    siteId: { type: String, enum: SITE_IDS, required: true },
    type: { type: String, enum: ["privacy", "terms"], required: true },
    title: { type: String, required: true },
    content: { type: String, default: "" },
  },
  { timestamps: true }
);

legalPageSchema.index({ siteId: 1, type: 1 }, { unique: true });

module.exports = {
  SITE_IDS,
  HomePage: mongoose.model("CmsHomePage", homePageSchema),
  Category: mongoose.model("CmsCategory", categorySchema),
  Product: mongoose.model("CmsProduct", productSchema),
  Blog: mongoose.model("CmsBlog", blogSchema),
  LegalPage: mongoose.model("CmsLegalPage", legalPageSchema),
};
