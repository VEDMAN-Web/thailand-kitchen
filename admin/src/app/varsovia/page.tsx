"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Check,
  ChevronDown,
  ImagePlus,
  Loader2,
  Plus,
  Pencil,
  Save,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import AdminShell from "@/components/AdminShell";
import MediaUpload from "@/components/MediaUpload";
import { mergeVarsoviaSiteDefaults } from "./siteDefaults";
import {
  generateBlogImageWithAI,
  generateBlogWithAI,
} from "@/services/adminAPI";
import { toPublicMediaUrl } from "@/lib/publicMediaUrl";
import {
  createVarsoviaRecord,
  deleteVarsoviaRecord,
  getVarsoviaSite,
  listVarsoviaRecords,
  localizedValue,
  updateVarsoviaRecord,
  updateVarsoviaSite,
  varsoviaErrorMessage,
  uploadVarsoviaMedia,
  type LocaleCode,
  type VarsoviaRecord,
  type VarsoviaResource,
} from "@/services/varsoviaAPI";

type MediaKind = "image" | "icon" | "pdf";
type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "json"
  | "string-list"
  | "localized-string-list"
  | "stats-list"
  | "process-list"
  | "faq-list"
  | "showcase-meta-list"
  | "tool-list"
  | "spec-list"
  | "content-sections"
  | "strength-list"
  | "office-list"
  | "search-page-list"
  | "footer-nav"
  | "select";
type Field = {
  key: string;
  label: string;
  type?: FieldType;
  localized?: boolean;
  required?: boolean;
  /** Shows an Upload button next to the URL input (image / logo / PDF). */
  media?: MediaKind;
  /** For localized-string-list: stores each entry as `{ [itemKey]: localizedMap }`. */
  itemKey?: string;
  /** Options for `select` fields. */
  options?: { value: string; label: string }[];
};
/** Gallery-style listing (image cards + search + category filter). */
type CardListConfig = {
  imageKey: string;
  subtitleKey?: string;
  subtitleSuffix?: string;
  descriptionKey: string;
  searchPlaceholder: string;
  createLabel: string;
  emptyLabel: string;
  fallbackBadge: string;
};

type ResourceConfig = {
  label: string;
  singular: string;
  titleKey: string;
  fields: Field[];
  card?: CardListConfig;
};

const LOCALES: { id: LocaleCode; label: string }[] = [
  { id: "en", label: "English" },
  { id: "th", label: "Thai" },
  { id: "pl", label: "Polish" },
];

const VISIBLE_FIELD: Field = {
  key: "visible",
  label: "Visible on website",
  type: "boolean",
};

type SiteSection = {
  id: string;
  title: string;
  description: string;
  fields: Field[];
};

const SITE_SECTIONS: SiteSection[] = [
  {
    id: "hero",
    title: "Hero",
    description: "Homepage hero banner, headline and call-to-action buttons.",
    fields: [
      { key: "heroEyebrow", label: "Hero Eyebrow", localized: true },
      { key: "heroHeadline", label: "Hero Headline", localized: true },
      { key: "heroSubtitle", label: "Hero Subtitle", localized: true, type: "textarea" },
      { key: "heroImage", label: "Hero Image URL", media: "image" },
      { key: "heroPrimaryCtaLabel", label: "Primary CTA Label", localized: true },
      { key: "heroPrimaryCtaHref", label: "Primary CTA Link" },
      { key: "heroSecondaryCtaLabel", label: "Secondary CTA Label", localized: true },
      { key: "heroSecondaryCtaHref", label: "Secondary CTA Link" },
    ],
  },
  {
    id: "about",
    title: "About",
    description: "Home about block and the About page copy and imagery.",
    fields: [
      { key: "aboutTitle", label: "About Title", localized: true },
      { key: "aboutSubtitle", label: "About Subtitle", localized: true },
      { key: "aboutCtaLabel", label: "About CTA Label", localized: true },
      { key: "aboutCtaHref", label: "About CTA Link" },
      { key: "aboutPageTitle", label: "About Page Title", localized: true },
      { key: "aboutValuesSectionTitle", label: "About Values Section Title", localized: true },
      { key: "aboutValuesSectionSubtitle", label: "About Values Section Subtitle", localized: true },
      { key: "aboutStoryTitle", label: "About Story Title", localized: true },
      { key: "aboutProcessTitle", label: "About Process Title", localized: true },
      { key: "aboutProcessSubtitle", label: "About Process Subtitle", localized: true },
      { key: "aboutText", label: "About Text", localized: true, type: "textarea" },
      { key: "aboutIntro", label: "About Intro", localized: true, type: "textarea" },
      { key: "aboutStory", label: "About Story", localized: true, type: "textarea" },
      { key: "aboutHeroSubtitle", label: "About Hero Subtitle", localized: true },
      { key: "aboutImages", label: "About Images", type: "string-list", media: "image" },
    ],
  },
  {
    id: "stats",
    title: "Statistics, Vision & Process",
    description: "Counter statistics plus the vision, mission, values and process steps.",
    fields: [
      { key: "stats", label: "Statistics", type: "stats-list" },
      { key: "statsImage", label: "Statistics Image URL", media: "image" },
      { key: "vision.title", label: "Vision Title", localized: true },
      { key: "vision.text", label: "Vision Text", localized: true, type: "textarea" },
      { key: "mission.title", label: "Mission Title", localized: true },
      { key: "mission.text", label: "Mission Text", localized: true, type: "textarea" },
      { key: "values.title", label: "Values Title", localized: true },
      { key: "values.text", label: "Values Text", localized: true, type: "textarea" },
      { key: "processSteps", label: "Process Steps", type: "process-list" },
    ],
  },
  {
    id: "products",
    title: "Products",
    description: "Products section heading and call-to-action labels.",
    fields: [
      { key: "productsTitle", label: "Products Section Title", localized: true },
      { key: "productsSubtitle", label: "Products Section Subtitle", localized: true },
      { key: "productsItemCtaLabel", label: "Product Card CTA Label", localized: true },
      { key: "productsCtaLabel", label: "Products Section CTA Label", localized: true },
      { key: "productsCtaHref", label: "Products Section CTA Link" },
    ],
  },
  {
    id: "catalogue",
    title: "Catalogue",
    description: "Catalogue section heading and cover wording.",
    fields: [
      { key: "catalogueTitle", label: "Catalogue Section Title", localized: true },
      { key: "catalogueSubtitle", label: "Catalogue Section Subtitle", localized: true },
      { key: "catalogueYear", label: "Catalogue Cover Year", localized: true },
      { key: "catalogueCoverTitle", label: "Catalogue Cover Title", localized: true },
      { key: "catalogueDownloadLabel", label: "Catalogue Download Label", localized: true },
    ],
  },
  {
    id: "projects",
    title: "Featured Projects",
    description: "Featured projects heading and call-to-action.",
    fields: [
      { key: "projectsTitle", label: "Projects Section Title", localized: true },
      { key: "projectsSubtitle", label: "Projects Section Subtitle", localized: true },
      { key: "projectsCtaLabel", label: "Projects CTA Label", localized: true },
      { key: "projectsCtaHref", label: "Projects CTA Link" },
    ],
  },
  {
    id: "testimonials",
    title: "Testimonials",
    description: "Testimonials section heading.",
    fields: [
      { key: "testimonialsTitle", label: "Testimonials Section Title", localized: true },
      { key: "testimonialsSubtitle", label: "Testimonials Section Subtitle", localized: true },
    ],
  },
  {
    id: "coreStrengths",
    title: "Core Strengths",
    description: "Core strengths heading and the individual strength cards.",
    fields: [
      { key: "coreStrengthsTitle", label: "Core Strengths Title", localized: true },
      { key: "coreStrengthsSubtitle", label: "Core Strengths Subtitle", localized: true },
      { key: "coreStrengths", label: "Core Strengths", type: "strength-list" },
    ],
  },
  {
    id: "partners",
    title: "Partners",
    description: "Partners section heading.",
    fields: [
      { key: "partnersTitle", label: "Partners Section Title", localized: true },
      { key: "partnersSubtitle", label: "Partners Section Subtitle", localized: true },
    ],
  },
  {
    id: "contact",
    title: "Contact",
    description: "Contact section heading, gallery and company contact details.",
    fields: [
      { key: "contactTitle", label: "Contact Section Title", localized: true },
      { key: "contactSubtitle", label: "Contact Section Subtitle", localized: true },
      { key: "contactImages", label: "Contact Images", type: "string-list", media: "image" },
      { key: "phone", label: "Phone" },
      { key: "email", label: "Email" },
      { key: "address", label: "Address", localized: true, type: "textarea" },
      { key: "contactPhone", label: "Footer Contact Phone" },
      { key: "mobileWhatsapp", label: "Footer Mobile / WhatsApp Number" },
    ],
  },
  {
    id: "sectionVisibility",
    title: "Section Visibility",
    description: "Show or hide each homepage section on the live website.",
    fields: [
      { key: "sectionVisibility.hero", label: "Show Hero", type: "boolean" },
      { key: "sectionVisibility.about", label: "Show About", type: "boolean" },
      { key: "sectionVisibility.stats", label: "Show Statistics", type: "boolean" },
      { key: "sectionVisibility.products", label: "Show Products", type: "boolean" },
      { key: "sectionVisibility.catalogues", label: "Show Catalogues", type: "boolean" },
      { key: "sectionVisibility.projects", label: "Show Projects", type: "boolean" },
      { key: "sectionVisibility.testimonials", label: "Show Testimonials", type: "boolean" },
      { key: "sectionVisibility.coreStrengths", label: "Show Core Strengths", type: "boolean" },
      { key: "sectionVisibility.partners", label: "Show Partners", type: "boolean" },
      { key: "sectionVisibility.contact", label: "Show Contact", type: "boolean" },
    ],
  },
  {
    id: "footer",
    title: "Footer & Social",
    description:
      "Footer bio, social links, offices, and the dynamic footer navigation columns.",
    fields: [
      { key: "footerBio", label: "Footer Description", localized: true, type: "textarea" },
      { key: "socialLinks.whatsapp", label: "WhatsApp URL" },
      { key: "socialLinks.instagram", label: "Instagram URL" },
      { key: "socialLinks.x", label: "X URL" },
      { key: "socialLinks.facebook", label: "Facebook URL" },
      { key: "whatsappUrl", label: "Footer WhatsApp Link" },
      { key: "facebookUrl", label: "Footer Facebook Link" },
      { key: "footerOffices", label: "Footer Offices", type: "office-list" },
      {
        key: "footerNavigation",
        label: "Footer Navigation",
        type: "footer-nav",
      },
    ],
  },
  {
    id: "teamPage",
    title: "Team Page",
    description: "Team page copy, statistics and design tools.",
    fields: [
      { key: "teamPage.heroTitle", label: "Team Page Hero Title", localized: true },
      { key: "teamPage.heroSubtitle", label: "Team Page Hero Subtitle", localized: true },
      { key: "teamPage.intro", label: "Team Page Intro", localized: true, type: "textarea" },
      { key: "teamPage.designTitle", label: "Design Team Title", localized: true },
      { key: "teamPage.designBody", label: "Design Team Body", localized: true, type: "textarea" },
      { key: "teamPage.architectTitle", label: "Architect Team Title", localized: true },
      { key: "teamPage.architectBody", label: "Architect Team Body", localized: true, type: "textarea" },
      { key: "teamPage.toolsTitle", label: "Design Tools Title", localized: true },
      { key: "teamPage.toolsBody", label: "Design Tools Body", localized: true, type: "textarea" },
      { key: "teamPage.stats", label: "Team Page Stats", type: "stats-list" },
      { key: "teamPage.tools", label: "Design Tools", type: "tool-list" },
    ],
  },
  {
    id: "qualitySale",
    title: "Quality After Sales",
    description: "Quality after-sales page copy, support steps and FAQs.",
    fields: [
      { key: "qualitySale.heroTitle", label: "Quality Sale Hero Title", localized: true },
      { key: "qualitySale.heroSubtitle", label: "Quality Sale Hero Subtitle", localized: true },
      { key: "qualitySale.heroBody", label: "Quality Sale Hero Body", localized: true, type: "textarea" },
      { key: "qualitySale.supportTitle", label: "Quality Sale Support Title", localized: true },
      { key: "qualitySale.supportSubtitle", label: "Quality Sale Support Subtitle", localized: true },
      { key: "qualitySale.faqTitle", label: "Quality Sale FAQ Title", localized: true },
      { key: "qualitySale.faqSubtitle", label: "Quality Sale FAQ Subtitle", localized: true },
      { key: "qualitySale.gallery", label: "Quality Sale Gallery", type: "string-list", media: "image" },
      { key: "qualitySale.steps", label: "Quality Sale Steps", type: "process-list" },
      { key: "qualitySale.faqs", label: "Quality Sale FAQs", type: "faq-list" },
    ],
  },
  {
    id: "showcase",
    title: "Showcase",
    description: "Heading and subtitle shown for each showcase tab.",
    fields: [
      { key: "showcaseMeta", label: "Showcase Tab Meta", type: "showcase-meta-list" },
    ],
  },
  {
    id: "navigation",
    title: "Navigation & Search",
    description: "Header menu, showcase mega menu, and navbar search result pages.",
    fields: [
      {
        key: "mainNavigation",
        label: "Main Navigation (JSON)",
        type: "json",
      },
      { key: "searchPages", label: "Search Result Pages", type: "search-page-list" },
    ],
  },
  {
    id: "inquiryForm",
    title: "Inquiry Form",
    description:
      "Contact page and catalogue download form fields (labels, required flags, options).",
    fields: [
      {
        key: "inquiryForm",
        label: "Inquiry Form (JSON)",
        type: "json",
      },
    ],
  },
  {
    id: "sectionCopy",
    title: "Section Headings",
    description:
      "Override the heading and subtitle for individual homepage sections.",
    fields: [
      { key: "sectionCopy.products.title", label: "Products Heading", localized: true },
      { key: "sectionCopy.products.subtitle", label: "Products Subheading", localized: true },
      { key: "sectionCopy.partners.title", label: "Partners Heading", localized: true },
      { key: "sectionCopy.partners.subtitle", label: "Partners Subheading", localized: true },
      { key: "sectionCopy.coreStrengths.title", label: "Core Strengths Heading", localized: true },
      { key: "sectionCopy.coreStrengths.subtitle", label: "Core Strengths Subheading", localized: true },
    ],
  },
  {
    id: "interior",
    title: "Interior Catalogue",
    description:
      "Choose whether the interior listing shows only your CMS projects or merges them with the built-in samples.",
    fields: [
      {
        key: "interiorCatalogMode",
        label: "Interior Catalogue Source",
        type: "select",
        options: [
          { value: "hybrid", label: "Hybrid — sample projects + CMS projects" },
          { value: "api", label: "CMS only — show just my projects" },
        ],
      },
    ],
  },
];

const CONFIGS: Record<VarsoviaResource, ResourceConfig> = {
  products: {
    label: "Products",
    singular: "Product",
    titleKey: "title",
    card: {
      imageKey: "image",
      subtitleSuffix: "layout",
      descriptionKey: "description",
      searchPlaceholder: "Search product inventory...",
      createLabel: "Create Product",
      emptyLabel: "No products found.",
      fallbackBadge: "Kitchen",
    },
    fields: [
      { key: "title", label: "Title", localized: true, required: true },
      { key: "description", label: "Description", localized: true, type: "textarea" },
      { key: "fullDescription", label: "Full Description", localized: true, type: "textarea" },
      { key: "slug", label: "Slug" },
      { key: "image", label: "Image URL", media: "image" },
      { key: "gallery", label: "Gallery Images", type: "string-list", media: "image" },
      { key: "features", label: "Features", type: "localized-string-list", itemKey: "text" },
      { key: "specs", label: "Specifications", type: "spec-list" },
      { key: "category", label: "Category" },
      { key: "featured", label: "Featured", type: "boolean" },
      VISIBLE_FIELD,
      { key: "order", label: "Order", type: "number" },
    ],
  },
  projects: {
    label: "Interior Projects",
    singular: "Project",
    titleKey: "title",
    card: {
      imageKey: "coverImage",
      subtitleKey: "location",
      descriptionKey: "description",
      searchPlaceholder: "Search interior projects...",
      createLabel: "Create Project",
      emptyLabel: "No interior projects found.",
      fallbackBadge: "Interior",
    },
    fields: [
      { key: "title", label: "Title", localized: true, required: true },
      { key: "description", label: "Description", localized: true, type: "textarea" },
      { key: "location", label: "Location", localized: true },
      { key: "slug", label: "Slug" },
      { key: "coverImage", label: "Cover Image URL", media: "image" },
      { key: "gallery", label: "Gallery Images", type: "string-list", media: "image" },
      { key: "category", label: "Category" },
      { key: "subcategory", label: "Subcategory" },
      { key: "shape", label: "Shape" },
      { key: "style", label: "Style" },
      { key: "color", label: "Color" },
      { key: "material", label: "Material" },
      { key: "finish", label: "Finish" },
      { key: "featured", label: "Featured", type: "boolean" },
      { key: "interiorCatalog", label: "Show in Interior Catalogue", type: "boolean" },
      { key: "isNew", label: "New", type: "boolean" },
      { key: "price", label: "Price", type: "number" },
      VISIBLE_FIELD,
      { key: "order", label: "Order", type: "number" },
    ],
  },
  blogs: {
    label: "Blogs",
    singular: "Blog",
    titleKey: "title",
    card: {
      imageKey: "image",
      subtitleKey: "author.name",
      descriptionKey: "excerpt",
      searchPlaceholder: "Search blogs...",
      createLabel: "Create Blog",
      emptyLabel: "No blogs found.",
      fallbackBadge: "Design",
    },
    fields: [
      { key: "title", label: "Title", localized: true, required: true },
      { key: "excerpt", label: "Excerpt", localized: true, type: "textarea" },
      { key: "content", label: "Content", localized: true, type: "textarea" },
      { key: "category", label: "Category", localized: true },
      { key: "sections", label: "Content Sections", type: "content-sections" },
      { key: "readTime", label: "Read Time", localized: true },
      { key: "author.name", label: "Author Name", localized: true },
      { key: "date", label: "Date" },
      { key: "author.avatar", label: "Author Avatar URL", media: "image" },
      { key: "image", label: "Cover Image URL", media: "image" },
      { key: "views", label: "Views", type: "number" },
      VISIBLE_FIELD,
      { key: "order", label: "Order", type: "number" },
    ],
  },
  faqs: {
    label: "FAQs",
    singular: "FAQ",
    titleKey: "question",
    fields: [
      { key: "question", label: "Question", localized: true, required: true },
      { key: "answer", label: "Answer", localized: true, type: "textarea", required: true },
      { key: "category", label: "Category", localized: true },
      VISIBLE_FIELD,
      { key: "order", label: "Order", type: "number" },
    ],
  },
  testimonials: {
    label: "Testimonials",
    singular: "Testimonial",
    titleKey: "name",
    fields: [
      { key: "name", label: "Name", localized: true, required: true },
      { key: "role", label: "Role", localized: true },
      { key: "quote", label: "Quote", localized: true, type: "textarea", required: true },
      { key: "image", label: "Photo", media: "image" },
      { key: "rating", label: "Rating (1-5)", type: "number" },
      VISIBLE_FIELD,
      { key: "order", label: "Order", type: "number" },
    ],
  },
  catalogues: {
    label: "Catalogues",
    singular: "Catalogue",
    titleKey: "title",
    fields: [
      { key: "title", label: "Title", localized: true, required: true },
      { key: "category", label: "Category", localized: true },
      { key: "coverImage", label: "Cover Image", media: "image" },
      { key: "downloadUrl", label: "PDF File", media: "pdf" },
      { key: "fileName", label: "Legacy file name (optional)" },
      { key: "downloadName", label: "Download name" },
      VISIBLE_FIELD,
      { key: "order", label: "Order", type: "number" },
    ],
  },
  showcases: {
    label: "Showcases",
    singular: "Showcase",
    titleKey: "title",
    fields: [
      { key: "title", label: "Title", localized: true, required: true },
      { key: "category", label: "Category", localized: true },
      { key: "location", label: "Location", localized: true },
      { key: "typeLabel", label: "Type Label", localized: true },
      { key: "typeValue", label: "Type Value", localized: true },
      { key: "supplyArea", label: "Supply Area", localized: true },
      { key: "image", label: "Image URL", media: "image" },
      { key: "gallery", label: "Gallery Images", type: "string-list", media: "image" },
      VISIBLE_FIELD,
      { key: "order", label: "Order", type: "number" },
    ],
  },
  "team-members": {
    label: "Team",
    singular: "Team Member",
    titleKey: "name",
    fields: [
      { key: "name", label: "Name", localized: true, required: true },
      { key: "role", label: "Role", localized: true },
      { key: "image", label: "Image URL", media: "image" },
      { key: "teamType", label: "Team Type (Italian / Headquarter)" },
      VISIBLE_FIELD,
      { key: "order", label: "Order", type: "number" },
    ],
  },
  partners: {
    label: "Partners",
    singular: "Partner",
    titleKey: "name",
    fields: [
      { key: "name", label: "Name", localized: true, required: true },
      { key: "logo", label: "Logo URL", media: "icon" },
      { key: "website", label: "Website" },
      VISIBLE_FIELD,
      { key: "order", label: "Order", type: "number" },
    ],
  },
  showrooms: {
    label: "Showrooms",
    singular: "Showroom",
    titleKey: "name",
    fields: [
      { key: "name", label: "Name", localized: true, required: true },
      { key: "location", label: "Location", localized: true },
      { key: "address", label: "Address", localized: true, type: "textarea" },
      { key: "image", label: "Image URL", media: "image" },
      VISIBLE_FIELD,
      { key: "order", label: "Order", type: "number" },
    ],
  },
};

const RESOURCE_IDS = Object.keys(CONFIGS) as VarsoviaResource[];

function getAtPath(source: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, source);
}

function setAtPath(
  source: Record<string, unknown>,
  path: string,
  value: unknown
) {
  const keys = path.split(".");
  const copy = structuredClone(source);
  let current = copy;
  keys.slice(0, -1).forEach((key) => {
    const next = current[key];
    if (!next || typeof next !== "object" || Array.isArray(next)) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  });
  current[keys[keys.length - 1]] = value;
  return copy;
}

function normalizeRecord(record?: VarsoviaRecord) {
  if (!record) return {} as Record<string, unknown>;
  const copy = structuredClone(record) as Record<string, unknown>;
  delete copy._id;
  delete copy.__v;
  delete copy.createdAt;
  delete copy.updatedAt;
  return copy;
}

/** Rewrite admin-origin /uploads URLs so the public Varsovia site can load them. */
function sanitizeRecordMediaUrls(form: Record<string, unknown>) {
  const next = { ...form };
  for (const key of ["image", "coverImage", "avatar", "logo", "pdfUrl"] as const) {
    if (typeof next[key] === "string") {
      next[key] = toPublicMediaUrl(next[key] as string);
    }
  }
  if (Array.isArray(next.gallery)) {
    next.gallery = next.gallery.map((item) =>
      typeof item === "string" ? toPublicMediaUrl(item) : item
    );
  }
  if (Array.isArray(next.sections)) {
    next.sections = next.sections.map((section) => {
      if (!section || typeof section !== "object") return section;
      const row = { ...(section as Record<string, unknown>) };
      if (typeof row.image === "string") row.image = toPublicMediaUrl(row.image);
      return row;
    });
  }
  return next;
}

function errorMessage(error: unknown) {
  return varsoviaErrorMessage(error);
}

export default function VarsoviaManagerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F5F7] p-8 text-sm text-[#6B7280]">
          Loading Varsovia CMS…
        </div>
      }
    >
      <VarsoviaManagerContent />
    </Suspense>
  );
}

function VarsoviaManagerContent() {
  const search = useSearchParams();
  const requested = search.get("resource") || "site";
  const active =
    requested === "site" || RESOURCE_IDS.includes(requested as VarsoviaResource)
      ? requested
      : "site";

  return (
    <AdminShell title="Varsovia Kitchen CMS">
      {active === "site" ? (
        <SiteSettings />
      ) : active === "testimonials" ? (
        <TestimonialsInlineEditor />
      ) : active === "faqs" ? (
        <FaqsInlineEditor />
      ) : active === "catalogues" ? (
        <CataloguesInlineEditor />
      ) : (
        <ResourceManager resource={active as VarsoviaResource} />
      )}
    </AdminShell>
  );
}

function SiteSettings() {
  const [content, setContent] = useState<Record<string, unknown>>({});
  const [locale, setLocale] = useState<LocaleCode>("en");
  const [loadingContent, setLoadingContent] = useState(false);
  const [savingContent, setSavingContent] = useState<string | null>(null);

  const loadContent = useCallback(async () => {
    setLoadingContent(true);
    try {
      const loaded = normalizeRecord(
        (await getVarsoviaSite()) as VarsoviaRecord
      );
      setContent(mergeVarsoviaSiteDefaults(loaded));
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoadingContent(false);
    }
  }, []);

  useEffect(() => {
    void loadContent();
  }, [loadContent]);

  const updateContentField = (field: Field, value: unknown) => {
    if (field.localized) {
      const existing = getAtPath(content, field.key);
      const localized: Record<string, unknown> =
        existing && typeof existing === "object" && !Array.isArray(existing)
          ? { ...(existing as Record<string, unknown>) }
          : { en: typeof existing === "string" ? existing : "" };
      localized[locale] = value;
      setContent(setAtPath(content, field.key, localized));
      return;
    }
    setContent(setAtPath(content, field.key, value));
  };

  const saveContent = async (section?: SiteSection) => {
    setSavingContent(section?.id ?? "all");
    try {
      const updated = await updateVarsoviaSite(content);
      setContent(
        mergeVarsoviaSiteDefaults(
          normalizeRecord(updated as VarsoviaRecord)
        )
      );
      toast.success(
        section ? `${section.title} content saved` : "Varsovia website content updated"
      );
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSavingContent(null);
    }
  };

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Site Settings</h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          Manage multilingual Varsovia website content. Connected through your
          admin login — same as Thailand Kitchen.
        </p>
      </div>

      <div className="rounded-xl border border-[#DDE1E7] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E8EAED] px-5 py-4">
          <div>
            <h3 className="font-bold text-[#1A2332]">Website Content</h3>
            <p className="mt-1 text-xs text-[#6B7280]">
              Every field from the Varsovia site-content schema.
            </p>
          </div>
          <div className="flex gap-2">
            {LOCALES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLocale(item.id)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                  locale === item.id
                    ? "bg-[#1A2332] text-white"
                    : "bg-[#F0F2F5] text-[#5C6370]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {loadingContent ? (
          <p className="p-6 text-sm text-[#6B7280]">Loading website content…</p>
        ) : (
          <div className="space-y-5 p-5">
            {SITE_SECTIONS.map((section) => (
              <div
                key={section.id}
                className="overflow-hidden rounded-xl border border-[#E8EAED]"
              >
                <div className="border-b border-[#E8EAED] bg-[#F9FAFB] px-4 py-3">
                  <h4 className="text-sm font-bold text-[#1A2332]">
                    {section.title}
                  </h4>
                  <p className="mt-0.5 text-xs text-[#6B7280]">
                    {section.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
                  {section.fields.map((field) => {
                    const raw = getAtPath(content, field.key);
                    const structured =
                      field.type === "string-list" ||
                      field.type === "localized-string-list" ||
                      field.type === "stats-list" ||
                      field.type === "process-list" ||
                      field.type === "faq-list" ||
                      field.type === "showcase-meta-list" ||
                      field.type === "tool-list" ||
                      field.type === "spec-list" ||
                      field.type === "content-sections" ||
                      field.type === "strength-list" ||
                      field.type === "office-list" ||
                      field.type === "search-page-list" ||
                      field.type === "footer-nav";
                    const value = field.localized
                      ? localizedValue(raw, locale)
                      : structured
                        ? raw
                      : field.type === "json"
                        ? raw === undefined
                          ? ""
                          : typeof raw === "string"
                            ? raw
                            : JSON.stringify(raw, null, 2)
                        : raw;

                    return (
                      <FieldControl
                        key={`${field.key}-${field.localized ? locale : "shared"}`}
                        field={field}
                        value={value}
                        locale={locale}
                        onChange={(next) => {
                          if (field.type !== "json") {
                            updateContentField(field, next);
                            return;
                          }
                          try {
                            updateContentField(
                              field,
                              String(next).trim() ? JSON.parse(String(next)) : []
                            );
                          } catch {
                            updateContentField(field, next);
                          }
                        }}
                      />
                    );
                  })}
                </div>

                <div className="flex justify-end border-t border-[#E8EAED] bg-[#FCFCFD] px-4 py-3">
                  <button
                    type="button"
                    onClick={() => void saveContent(section)}
                    disabled={savingContent !== null}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#1A2332] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    <Save size={16} />
                    {savingContent === section.id ? "Saving…" : "Save Content"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

type CatalogueDraft = {
  clientKey: string;
  _id?: string;
  title: unknown;
  category: unknown;
  coverImage: string;
  downloadUrl: string;
  fileName: string;
  downloadName: string;
  visible: boolean;
  order: number;
};

function toCatalogueDraft(item?: VarsoviaRecord, index = 0): CatalogueDraft {
  return {
    clientKey: item?._id || `catalogue-new-${index}-${Date.now()}`,
    _id: item?._id,
    title: item?.title ?? emptyLocalized(),
    category: item?.category ?? emptyLocalized(),
    coverImage: String(item?.coverImage ?? item?.image ?? ""),
    downloadUrl: String(item?.downloadUrl ?? item?.pdfUrl ?? ""),
    fileName: String(item?.fileName ?? ""),
    downloadName: String(item?.downloadName ?? ""),
    visible: item?.visible !== false,
    order: Number(item?.order ?? index) || index,
  };
}

function CataloguesInlineEditor() {
  const [drafts, setDrafts] = useState<CatalogueDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locale, setLocale] = useState<LocaleCode>("en");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listVarsoviaRecords("catalogues");
      setDrafts(rows.map((item, index) => toCatalogueDraft(item, index)));
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const complete = drafts.length >= 1;

  const updateDraft = (clientKey: string, patch: Partial<CatalogueDraft>) => {
    setDrafts((prev) =>
      prev.map((item) =>
        item.clientKey === clientKey ? { ...item, ...patch } : item
      )
    );
  };

  const addDraft = () => {
    setDrafts((prev) => [...prev, toCatalogueDraft(undefined, prev.length)]);
  };

  const removeDraft = async (draft: CatalogueDraft) => {
    if (draft._id) {
      if (
        !confirm(
          `Remove "${localizedValue(draft.title, locale) || "catalogue"}"?`
        )
      ) {
        return;
      }
      try {
        await deleteVarsoviaRecord("catalogues", draft._id);
        toast.success("Catalogue deleted");
      } catch (error) {
        toast.error(errorMessage(error));
        return;
      }
    }
    setDrafts((prev) => prev.filter((item) => item.clientKey !== draft.clientKey));
  };

  const saveAll = async () => {
    const invalid = drafts.some(
      (draft) => !localizedValue(draft.title, "en").trim()
    );
    if (invalid) {
      toast.error("Each catalogue needs an English title");
      setLocale("en");
      return;
    }

    try {
      setSaving(true);
      for (let index = 0; index < drafts.length; index += 1) {
        const draft = drafts[index];
        const payload = {
          title: draft.title,
          category: draft.category,
          coverImage: draft.coverImage,
          downloadUrl: draft.downloadUrl,
          fileName: draft.fileName,
          downloadName: draft.downloadName,
          visible: draft.visible,
          order: index,
        };
        if (draft._id) {
          await updateVarsoviaRecord("catalogues", draft._id, payload);
        } else {
          await createVarsoviaRecord("catalogues", payload);
        }
      }
      toast.success("Catalogues saved");
      await load();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const fieldClass =
    "w-full rounded-lg border border-[#E2E5EA] bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A2332]/15 focus:border-[#1A2332]";

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-[#E8EAED] bg-white p-5 lg:p-6">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#1A2332]">Free Catalogue</h2>
            <p className="mt-0.5 text-sm text-[#6B7280]">
              3 downloadable PDF catalogs
            </p>
          </div>
          {complete ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2.5 py-1 text-xs font-semibold text-[#166534]">
              <Check className="h-3.5 w-3.5" />
              Complete
            </span>
          ) : null}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {(["en", "th", "pl"] as LocaleCode[]).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setLocale(code)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase ${
                locale === code
                  ? "bg-[#1A2332] text-white"
                  : "bg-[#F3F4F6] text-[#5C6370]"
              }`}
            >
              {code}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-[#6B7280]">Loading…</p>
        ) : (
          <div className="space-y-4">
            {drafts.map((draft, index) => (
              <div
                key={draft.clientKey}
                className="space-y-3 rounded-xl border border-[#E8EAED] p-4"
              >
                <div className="flex justify-between">
                  <span className="text-xs font-bold uppercase text-[#5C6370]">
                    Catalogue #{index + 1}
                  </span>
                  <button
                    type="button"
                    className="text-xs text-red-600"
                    onClick={() => void removeDraft(draft)}
                  >
                    Remove
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#5C6370]">
                      Title
                    </label>
                    <input
                      type="text"
                      value={localizedValue(draft.title, locale)}
                      onChange={(event) =>
                        updateDraft(draft.clientKey, {
                          title: writeLocalizedField(
                            draft.title,
                            locale,
                            event.target.value
                          ),
                        })
                      }
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#5C6370]">
                      Category
                    </label>
                    <input
                      type="text"
                      value={localizedValue(draft.category, locale)}
                      onChange={(event) =>
                        updateDraft(draft.clientKey, {
                          category: writeLocalizedField(
                            draft.category,
                            locale,
                            event.target.value
                          ),
                        })
                      }
                      className={fieldClass}
                    />
                  </div>
                </div>

                <MediaUpload
                  label="Cover Image"
                  kind="image"
                  value={draft.coverImage}
                  onChange={(value) =>
                    updateDraft(draft.clientKey, { coverImage: value })
                  }
                  uploadFile={uploadVarsoviaMedia}
                />

                <MediaUpload
                  label="PDF File"
                  kind="pdf"
                  value={draft.downloadUrl}
                  onChange={(value) =>
                    updateDraft(draft.clientKey, { downloadUrl: value })
                  }
                  uploadFile={uploadVarsoviaMedia}
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#5C6370]">
                      Legacy file name (optional)
                    </label>
                    <input
                      type="text"
                      value={draft.fileName}
                      onChange={(event) =>
                        updateDraft(draft.clientKey, {
                          fileName: event.target.value,
                        })
                      }
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-[#5C6370]">
                      Download name
                    </label>
                    <input
                      type="text"
                      value={draft.downloadName}
                      onChange={(event) =>
                        updateDraft(draft.clientKey, {
                          downloadName: event.target.value,
                        })
                      }
                      className={fieldClass}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addDraft}
              className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[#CBD5E1] px-3 py-2 text-xs font-semibold text-[#1A2332] hover:bg-[#F8FAFC]"
            >
              <Plus className="h-3.5 w-3.5" />
              Add catalogue
            </button>
          </div>
        )}

        <div className="mt-8 flex items-center gap-2 border-t border-[#E8EAED] pt-5">
          <button
            type="button"
            onClick={() => void saveAll()}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1A2332] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#243044] disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save Section"}
          </button>
          <button
            type="button"
            onClick={() => void load()}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 rounded-lg bg-[#DC2626] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#B91C1C] disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
            Reload
          </button>
        </div>
      </div>
    </section>
  );
}

type FaqDraft = {
  clientKey: string;
  _id?: string;
  question: unknown;
  answer: unknown;
  category: unknown;
  visible: boolean;
  order: number;
};

function toFaqDraft(item?: VarsoviaRecord, index = 0): FaqDraft {
  return {
    clientKey: item?._id || `faq-new-${index}-${Date.now()}`,
    _id: item?._id,
    question: item?.question ?? emptyLocalized(),
    answer: item?.answer ?? emptyLocalized(),
    category: item?.category ?? emptyLocalized(),
    visible: item?.visible !== false,
    order: Number(item?.order ?? index) || index,
  };
}

function FaqsInlineEditor() {
  const [drafts, setDrafts] = useState<FaqDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locale, setLocale] = useState<LocaleCode>("en");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listVarsoviaRecords("faqs");
      setDrafts(rows.map((item, index) => toFaqDraft(item, index)));
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const complete = drafts.length >= 1;

  const updateDraft = (clientKey: string, patch: Partial<FaqDraft>) => {
    setDrafts((prev) =>
      prev.map((item) =>
        item.clientKey === clientKey ? { ...item, ...patch } : item
      )
    );
  };

  const addDraft = () => {
    setDrafts((prev) => [...prev, toFaqDraft(undefined, prev.length)]);
  };

  const removeDraft = async (draft: FaqDraft) => {
    if (draft._id) {
      if (
        !confirm(
          `Remove "${localizedValue(draft.question, locale) || "FAQ"}"?`
        )
      ) {
        return;
      }
      try {
        await deleteVarsoviaRecord("faqs", draft._id);
        toast.success("FAQ deleted");
      } catch (error) {
        toast.error(errorMessage(error));
        return;
      }
    }
    setDrafts((prev) => prev.filter((item) => item.clientKey !== draft.clientKey));
  };

  const saveAll = async () => {
    const invalid = drafts.some(
      (draft) =>
        !localizedValue(draft.question, "en").trim() ||
        !localizedValue(draft.answer, "en").trim()
    );
    if (invalid) {
      toast.error("Each FAQ needs an English question and answer");
      setLocale("en");
      return;
    }

    try {
      setSaving(true);
      for (let index = 0; index < drafts.length; index += 1) {
        const draft = drafts[index];
        const payload = {
          question: draft.question,
          answer: draft.answer,
          category: draft.category,
          visible: draft.visible,
          order: index,
        };
        if (draft._id) {
          await updateVarsoviaRecord("faqs", draft._id, payload);
        } else {
          await createVarsoviaRecord("faqs", payload);
        }
      }
      toast.success("FAQs saved");
      await load();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const fieldClass =
    "w-full rounded-lg border border-[#E2E5EA] bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A2332]/15 focus:border-[#1A2332]";

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-[#E8EAED] bg-white p-5 lg:p-6">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#1A2332]">FAQ Section</h2>
            <p className="mt-0.5 text-sm text-[#6B7280]">
              Frequently asked questions
            </p>
          </div>
          {complete ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2.5 py-1 text-xs font-semibold text-[#166534]">
              <Check className="h-3.5 w-3.5" />
              Complete
            </span>
          ) : null}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {(["en", "th", "pl"] as LocaleCode[]).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setLocale(code)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase ${
                locale === code
                  ? "bg-[#1A2332] text-white"
                  : "bg-[#F3F4F6] text-[#5C6370]"
              }`}
            >
              {code}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-[#6B7280]">Loading…</p>
        ) : (
          <div className="space-y-4">
            {drafts.map((draft, index) => (
              <div
                key={draft.clientKey}
                className="space-y-3 rounded-xl border border-[#E8EAED] p-4"
              >
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-xs text-red-600"
                    onClick={() => void removeDraft(draft)}
                  >
                    Remove
                  </button>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#5C6370]">
                    Question #{index + 1}
                  </label>
                  <input
                    type="text"
                    value={localizedValue(draft.question, locale)}
                    onChange={(event) =>
                      updateDraft(draft.clientKey, {
                        question: writeLocalizedField(
                          draft.question,
                          locale,
                          event.target.value
                        ),
                      })
                    }
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#5C6370]">
                    Answer
                  </label>
                  <textarea
                    rows={4}
                    value={localizedValue(draft.answer, locale)}
                    onChange={(event) =>
                      updateDraft(draft.clientKey, {
                        answer: writeLocalizedField(
                          draft.answer,
                          locale,
                          event.target.value
                        ),
                      })
                    }
                    className={`${fieldClass} resize-y`}
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addDraft}
              className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[#CBD5E1] px-3 py-2 text-xs font-semibold text-[#1A2332] hover:bg-[#F8FAFC]"
            >
              <Plus className="h-3.5 w-3.5" />
              Add FAQ
            </button>
          </div>
        )}

        <div className="mt-8 flex items-center gap-2 border-t border-[#E8EAED] pt-5">
          <button
            type="button"
            onClick={() => void saveAll()}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1A2332] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#243044] disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save Section"}
          </button>
          <button
            type="button"
            onClick={() => void load()}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 rounded-lg bg-[#DC2626] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#B91C1C] disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
            Reload
          </button>
        </div>
      </div>
    </section>
  );
}

type TestimonialDraft = {
  clientKey: string;
  _id?: string;
  name: unknown;
  role: unknown;
  quote: unknown;
  image: string;
  rating: number;
  visible: boolean;
  order: number;
};

function emptyLocalized(value = "") {
  return { en: value, th: "", pl: "" };
}

function toTestimonialDraft(item?: VarsoviaRecord, index = 0): TestimonialDraft {
  return {
    clientKey: item?._id || `new-${index}-${Date.now()}`,
    _id: item?._id,
    name: item?.name ?? emptyLocalized(),
    role: item?.role ?? emptyLocalized(),
    quote: item?.quote ?? emptyLocalized(),
    image: String(item?.image ?? ""),
    rating: Number(item?.rating ?? 5) || 5,
    visible: item?.visible !== false,
    order: Number(item?.order ?? index) || index,
  };
}

function writeLocalizedField(
  current: unknown,
  locale: LocaleCode,
  value: string
) {
  const base =
    current && typeof current === "object" && !Array.isArray(current)
      ? { ...(current as Record<string, string>) }
      : {
          en: typeof current === "string" ? current : "",
          th: "",
          pl: "",
        };
  base[locale] = value;
  return base;
}

function TestimonialsInlineEditor() {
  const [drafts, setDrafts] = useState<TestimonialDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locale, setLocale] = useState<LocaleCode>("en");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listVarsoviaRecords("testimonials");
      setDrafts(rows.map((item, index) => toTestimonialDraft(item, index)));
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const complete = drafts.length >= 1;

  const updateDraft = (clientKey: string, patch: Partial<TestimonialDraft>) => {
    setDrafts((prev) =>
      prev.map((item) =>
        item.clientKey === clientKey ? { ...item, ...patch } : item
      )
    );
  };

  const addDraft = () => {
    setDrafts((prev) => [
      ...prev,
      toTestimonialDraft(undefined, prev.length),
    ]);
  };

  const removeDraft = async (draft: TestimonialDraft) => {
    if (draft._id) {
      if (!confirm(`Remove "${localizedValue(draft.name, locale) || "testimonial"}"?`)) {
        return;
      }
      try {
        await deleteVarsoviaRecord("testimonials", draft._id);
        toast.success("Testimonial deleted");
      } catch (error) {
        toast.error(errorMessage(error));
        return;
      }
    }
    setDrafts((prev) => prev.filter((item) => item.clientKey !== draft.clientKey));
  };

  const saveAll = async () => {
    const invalid = drafts.some(
      (draft) =>
        !localizedValue(draft.name, "en").trim() ||
        !localizedValue(draft.quote, "en").trim()
    );
    if (invalid) {
      toast.error("Each testimonial needs an English name and quote");
      setLocale("en");
      return;
    }

    try {
      setSaving(true);
      for (let index = 0; index < drafts.length; index += 1) {
        const draft = drafts[index];
        const payload = {
          name: draft.name,
          role: draft.role,
          quote: draft.quote,
          image: draft.image,
          rating: draft.rating,
          visible: draft.visible,
          order: index,
        };
        if (draft._id) {
          await updateVarsoviaRecord("testimonials", draft._id, payload);
        } else {
          await createVarsoviaRecord("testimonials", payload);
        }
      }
      toast.success("Testimonials saved");
      await load();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const fieldClass =
    "w-full rounded-lg border border-[#E2E5EA] bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A2332]/15 focus:border-[#1A2332]";

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-[#E8EAED] bg-white p-5 lg:p-6">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#1A2332]">Testimonials</h2>
            <p className="mt-0.5 text-sm text-[#6B7280]">
              Customer reviews & ratings
            </p>
          </div>
          {complete ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2.5 py-1 text-xs font-semibold text-[#166534]">
              <Check className="h-3.5 w-3.5" />
              Complete
            </span>
          ) : null}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {(["en", "th", "pl"] as LocaleCode[]).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setLocale(code)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase ${
                locale === code
                  ? "bg-[#1A2332] text-white"
                  : "bg-[#F3F4F6] text-[#5C6370]"
              }`}
            >
              {code}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-[#6B7280]">Loading…</p>
        ) : (
          <div className="space-y-4">
            {drafts.map((draft) => (
              <div
                key={draft.clientKey}
                className="space-y-3 rounded-xl border border-[#E8EAED] p-4"
              >
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-xs text-red-600"
                    onClick={() => void removeDraft(draft)}
                  >
                    Remove
                  </button>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#5C6370]">
                    Name
                  </label>
                  <input
                    type="text"
                    value={localizedValue(draft.name, locale)}
                    onChange={(event) =>
                      updateDraft(draft.clientKey, {
                        name: writeLocalizedField(
                          draft.name,
                          locale,
                          event.target.value
                        ),
                      })
                    }
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#5C6370]">
                    Role
                  </label>
                  <input
                    type="text"
                    value={localizedValue(draft.role, locale)}
                    onChange={(event) =>
                      updateDraft(draft.clientKey, {
                        role: writeLocalizedField(
                          draft.role,
                          locale,
                          event.target.value
                        ),
                      })
                    }
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#5C6370]">
                    Quote
                  </label>
                  <textarea
                    rows={4}
                    value={localizedValue(draft.quote, locale)}
                    onChange={(event) =>
                      updateDraft(draft.clientKey, {
                        quote: writeLocalizedField(
                          draft.quote,
                          locale,
                          event.target.value
                        ),
                      })
                    }
                    className={`${fieldClass} resize-y`}
                  />
                </div>

                <MediaUpload
                  label="Photo"
                  kind="image"
                  value={draft.image}
                  onChange={(value) =>
                    updateDraft(draft.clientKey, { image: value })
                  }
                  uploadFile={uploadVarsoviaMedia}
                />

                <div className="max-w-[140px]">
                  <label className="mb-1.5 block text-xs font-semibold text-[#5C6370]">
                    Rating (1-5)
                  </label>
                  <input
                    type="text"
                    value={String(draft.rating ?? 5)}
                    onChange={(event) =>
                      updateDraft(draft.clientKey, {
                        rating: Number(event.target.value) || 5,
                      })
                    }
                    className={fieldClass}
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addDraft}
              className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[#CBD5E1] px-3 py-2 text-xs font-semibold text-[#1A2332] hover:bg-[#F8FAFC]"
            >
              <Plus className="h-3.5 w-3.5" />
              Add testimonial
            </button>
          </div>
        )}

        <div className="mt-8 flex items-center gap-2 border-t border-[#E8EAED] pt-5">
          <button
            type="button"
            onClick={() => void saveAll()}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1A2332] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#243044] disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save Section"}
          </button>
          <button
            type="button"
            onClick={() => void load()}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 rounded-lg bg-[#DC2626] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#B91C1C] disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
            Reload
          </button>
        </div>
      </div>
    </section>
  );
}

function ResourceManager({ resource }: { resource: VarsoviaResource }) {
  const config = CONFIGS[resource];
  const [items, setItems] = useState<VarsoviaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<VarsoviaRecord | null | undefined>();
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [locale, setLocale] = useState<LocaleCode>("en");
  const [saving, setSaving] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCoverImage, setAiCoverImage] = useState("");
  const [aiImageLoading, setAiImageLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All categories");
  const card = config.card;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listVarsoviaRecords(resource));
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [resource]);

  useEffect(() => {
    setEditing(undefined);
    setQuery("");
    setCategoryFilter("All categories");
    void load();
  }, [load]);

  const cardCategories = useMemo(() => {
    if (!card) return ["All categories"];
    const set = new Set<string>();
    for (const item of items) {
      const category = localizedValue(getAtPath(item, "category")).trim();
      if (category) set.add(category);
    }
    return ["All categories", ...Array.from(set)];
  }, [card, items]);

  const cardItems = useMemo(() => {
    if (!card) return items;
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const title = localizedValue(getAtPath(item, config.titleKey)).toLowerCase();
      const description = localizedValue(
        getAtPath(item, card.descriptionKey)
      ).toLowerCase();
      const slug = String(item.slug ?? "").toLowerCase();
      const category = localizedValue(getAtPath(item, "category")).trim();
      const matchesQuery =
        !q ||
        title.includes(q) ||
        description.includes(q) ||
        slug.includes(q) ||
        category.toLowerCase().includes(q);
      const matchesCategory =
        categoryFilter === "All categories" || category === categoryFilter;
      return matchesQuery && matchesCategory;
    });
  }, [card, config.titleKey, items, query, categoryFilter]);

  const open = (item?: VarsoviaRecord) => {
    setEditing(item || null);
    setForm(item ? normalizeRecord(item) : { visible: true });
    setLocale("en");
  };

  const updateField = (field: Field, value: unknown) => {
    if (field.localized) {
      const existing = getAtPath(form, field.key);
      const localized: Record<string, unknown> =
        existing && typeof existing === "object" && !Array.isArray(existing)
          ? { ...(existing as Record<string, unknown>) }
          : { en: typeof existing === "string" ? existing : "" };
      localized[locale] = value;
      setForm(setAtPath(form, field.key, localized));
      return;
    }
    setForm(setAtPath(form, field.key, value));
  };

  const save = async () => {
    const requiredMissing = config.fields.some(
      (field) =>
        field.required &&
        !localizedValue(getAtPath(form, field.key), "en").trim()
    );
    if (requiredMissing) {
      toast.error("Complete all required English fields");
      setLocale("en");
      return;
    }

    const payload = sanitizeRecordMediaUrls(form);

    try {
      setSaving(true);
      if (editing?._id) {
        await updateVarsoviaRecord(resource, editing._id, payload);
        toast.success(`${config.singular} updated`);
      } else {
        await createVarsoviaRecord(resource, payload);
        toast.success(`${config.singular} created`);
      }
      setEditing(undefined);
      await load();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: VarsoviaRecord) => {
    const title = localizedValue(getAtPath(item, config.titleKey));
    if (!confirm(`Delete "${title || config.singular}"?`)) return;
    try {
      await deleteVarsoviaRecord(resource, item._id);
      toast.success(`${config.singular} deleted`);
      await load();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const generateCoverImage = async () => {
    const topic = aiTopic.trim();
    if (!topic) {
      toast.error("Enter a blog topic before generating an image");
      return;
    }

    setAiImageLoading(true);
    try {
      const res = await generateBlogImageWithAI("varsovia-kitchen", { topic });
      if (!res?.success || !res?.image) {
        throw new Error(res?.message || "No image returned from OpenAI");
      }
      setAiCoverImage(res.image);
      toast.success("Cover image generated with AI");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setAiImageLoading(false);
    }
  };

  const generateBlogDraft = async () => {
    const topic = aiTopic.trim();
    if (!topic) {
      toast.error("Enter a blog topic");
      return;
    }

    setAiLoading(true);
    try {
      const { article } = await generateBlogWithAI("varsovia-kitchen", {
        topic,
      });
      const sections = (article.bodySections || []).map((section) => ({
        heading: { en: section.title || "" },
        text: { en: section.content || "" },
        image: section.image || "",
      }));
      const cover = aiCoverImage.trim() || article.image || "";

      setEditing(null);
      setLocale("en");
      setForm({
        title: { en: article.title || "" },
        excerpt: { en: article.excerpt || "" },
        content: {
          en: sections
            .map((section) => localizedValue(section.text, "en"))
            .filter(Boolean)
            .join("\n\n"),
        },
        category: { en: article.category || "" },
        sections,
        readTime: {
          en: article.readTime
            ? `${article.readTime} min read`
            : "",
        },
        author: {
          name: { en: article.author || "Varsovia Design" },
          avatar: "",
        },
        date: article.publishDate || new Date().toISOString().slice(0, 10),
        image: cover,
        views: 0,
        visible: true,
        order: 0,
      });
      setAiOpen(false);
      setAiTopic("");
      setAiCoverImage("");
      toast.success(
        cover
          ? "Varsovia blog draft generated with cover image"
          : "Varsovia blog draft generated"
      );
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <section className="space-y-5">
      {card ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-[270px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={card.searchPlaceholder}
                  className="h-11 w-full rounded-xl border border-[#E2E5EA] bg-white pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#1A2332]/15"
                />
              </div>
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="h-11 min-w-[170px] appearance-none rounded-xl border border-[#E2E5EA] bg-white px-4 pr-9 text-sm outline-none focus:ring-2 focus:ring-[#1A2332]/15"
                >
                  {cardCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {resource === "blogs" ? (
                <button
                  type="button"
                  onClick={() => {
                    setAiCoverImage("");
                    setAiTopic("");
                    setAiOpen(true);
                  }}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#DDE1E7] bg-white px-4 text-sm font-semibold text-[#1A2332] hover:bg-[#F7F8FA]"
                >
                  <Sparkles size={16} /> Generate with AI
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => open()}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#1A2332] px-4 text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                {card.createLabel}
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-[#6B7280]">Loading…</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {cardItems.length === 0 ? (
                <div className="col-span-full rounded-xl border border-[#E8EAED] bg-white p-10 text-center text-[#6B7280]">
                  {card.emptyLabel}
                </div>
              ) : (
                cardItems.map((item) => {
                  const title =
                    localizedValue(getAtPath(item, config.titleKey)) ||
                    `Untitled ${config.singular}`;
                  const description = localizedValue(
                    getAtPath(item, card.descriptionKey)
                  );
                  const category = localizedValue(
                    getAtPath(item, "category")
                  ).trim();
                  const subtitle = card.subtitleKey
                    ? localizedValue(getAtPath(item, card.subtitleKey)).trim()
                    : category
                      ? `${category} ${card.subtitleSuffix ?? ""}`.trim()
                      : "";
                  const image = String(
                    getAtPath(item, card.imageKey) ?? ""
                  ).trim();
                  return (
                    <article
                      key={item._id}
                      className="overflow-hidden rounded-2xl border border-[#E8EAED] bg-white"
                    >
                      <div className="relative h-40 w-full bg-[#F3F4F6]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image || "/products/Kitchen1.png"}
                          alt={title}
                          className="h-full w-full object-cover"
                          onError={(event) => {
                            const el = event.currentTarget;
                            if (el.dataset.fallback === "1") return;
                            el.dataset.fallback = "1";
                            el.src = "/products/Kitchen1.png";
                          }}
                        />
                        <span className="absolute left-2 top-2 rounded-md bg-white px-2 py-1 text-[10px] font-semibold text-[#475569]">
                          {category || card.fallbackBadge}
                        </span>
                      </div>
                      <div className="space-y-2 p-4">
                        <h3 className="line-clamp-2 text-base font-semibold text-[#1A2332]">
                          {title}
                        </h3>
                        <p className="line-clamp-1 text-sm text-[#64748B]">
                          {subtitle || "—"}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-[#EEF2F7] px-2 py-0.5 text-xs text-[#475569]">
                            {category || "—"}
                          </span>
                          <span className="text-[11px] text-[#9CA3AF]">
                            Updated recently
                          </span>
                        </div>
                        <p className="line-clamp-2 text-xs text-[#475569]">
                          {description || "—"}
                        </p>
                        <div className="flex justify-end gap-1 pt-1">
                          <button
                            type="button"
                            onClick={() => open(item)}
                            className="inline-flex rounded-lg p-2 text-[#1A2332] hover:bg-[#F3F4F6]"
                            aria-label="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void remove(item)}
                            className="inline-flex rounded-lg p-2 text-[#DC2626] hover:bg-red-50"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">{config.label}</h2>
              <p className="mt-1 text-sm text-[#6B7280]">
                Manage English, Thai and Polish content in Varsovia API.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {resource === "blogs" ? (
                <button
                  type="button"
                  onClick={() => {
                    setAiCoverImage("");
                    setAiTopic("");
                    setAiOpen(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#DDE1E7] bg-white px-4 py-2.5 text-sm font-semibold text-[#1A2332] hover:bg-[#F7F8FA]"
                >
                  <Sparkles size={16} /> Generate with AI
                </button>
              ) : null}
              <button
                onClick={() => open()}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1A2332] px-4 py-2.5 text-sm font-semibold text-white"
              >
                <Plus size={16} /> Add {config.singular}
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#E2E5EA] bg-white">
            {loading ? (
              <p className="p-8 text-sm text-[#6B7280]">Loading…</p>
            ) : items.length === 0 ? (
              <p className="p-8 text-sm text-[#6B7280]">
                No {config.label.toLowerCase()} found.
              </p>
            ) : (
              <div className="divide-y divide-[#E8EAED]">
                {items.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between gap-4 px-5 py-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {localizedValue(getAtPath(item, config.titleKey)) ||
                          `Untitled ${config.singular}`}
                      </p>
                      <p className="mt-1 text-xs text-[#8A9099]">
                        ID: {item._id}
                      </p>
                      <span
                        className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          item.visible === false
                            ? "bg-gray-100 text-gray-600"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {item.visible === false ? "Hidden" : "Visible"}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => open(item)}
                        className="rounded-lg bg-blue-50 p-2 text-blue-700"
                        aria-label="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => void remove(item)}
                        className="rounded-lg bg-red-50 p-2 text-red-600"
                        aria-label="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {editing !== undefined && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E8EAED] bg-white px-6 py-4">
              <h3 className="font-bold">
                {editing ? `Edit ${config.singular}` : `Add ${config.singular}`}
              </h3>
              <button
                onClick={() => setEditing(undefined)}
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="flex gap-2">
                {LOCALES.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setLocale(item.id)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                      locale === item.id
                        ? "bg-[#1A2332] text-white"
                        : "bg-[#F0F2F5] text-[#5C6370]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {config.fields.map((field) => {
                  if (field.localized === true) {
                    const value = localizedValue(
                      getAtPath(form, field.key),
                      locale
                    );
                    return (
                      <FieldControl
                        key={`${field.key}-${locale}`}
                        field={field}
                        value={value}
                        locale={locale}
                        onChange={(value) => updateField(field, value)}
                      />
                    );
                  }

                  const structured =
                    field.type === "string-list" ||
                    field.type === "localized-string-list" ||
                    field.type === "stats-list" ||
                    field.type === "process-list" ||
                    field.type === "faq-list" ||
                    field.type === "showcase-meta-list" ||
                    field.type === "tool-list" ||
                    field.type === "spec-list" ||
                    field.type === "content-sections" ||
                    field.type === "strength-list" ||
                    field.type === "office-list" ||
                    field.type === "search-page-list" ||
                    field.type === "footer-nav";
                  const raw = getAtPath(form, field.key);
                  const value = structured
                    ? raw
                    : field.type === "json"
                      ? raw === undefined
                        ? ""
                        : typeof raw === "string"
                          ? raw
                          : JSON.stringify(raw, null, 2)
                      : raw;
                  return (
                    <FieldControl
                      key={field.key}
                      field={field}
                      value={value}
                      locale={locale}
                      onChange={(value) => {
                        if (field.type !== "json") {
                          updateField(field, value);
                          return;
                        }
                        try {
                          updateField(
                            field,
                            String(value).trim() ? JSON.parse(String(value)) : []
                          );
                        } catch {
                          updateField(field, value);
                        }
                      }}
                    />
                  );
                })}
              </div>
            </div>

            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-[#E8EAED] bg-white px-6 py-4">
              <button
                onClick={() => setEditing(undefined)}
                className="rounded-lg border border-[#DDE1E7] px-4 py-2.5 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => void save()}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1A2332] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {resource === "blogs" && aiOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg max-h-[90vh] space-y-4 overflow-y-auto rounded-2xl bg-white p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-[#1A2332]">
                  Generate with AI
                </h3>
                <p className="mt-1 text-xs text-[#6B7280]">
                  Enter a topic, optionally generate or upload a cover image,
                  then draft the full blog article.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (aiLoading || aiImageLoading) return;
                  setAiOpen(false);
                  setAiCoverImage("");
                }}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <label className="block text-xs font-semibold text-[#5C6370]">
              Blog topic
              <input
                value={aiTopic}
                onChange={(event) => setAiTopic(event.target.value)}
                placeholder="e.g. Timeless modular kitchens for luxury homes"
                disabled={aiLoading || aiImageLoading}
                autoFocus
                className="mt-1.5 w-full rounded-lg border border-[#E2E5EA] px-3 py-2.5 text-sm font-normal"
              />
            </label>

            <div className="space-y-3 rounded-xl border border-[#E8EAED] bg-[#FAFBFC] p-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#334155]">
                  Cover image
                </p>
                <p className="mt-0.5 text-[11px] text-[#94A3B8]">
                  Generate a widescreen cover with AI, or upload your own below.
                </p>
              </div>
              <button
                type="button"
                disabled={aiLoading || aiImageLoading || !aiTopic.trim()}
                onClick={() => void generateCoverImage()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1A2332] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {aiImageLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="h-4 w-4" />
                )}
                {aiImageLoading ? "Generating image…" : "Generate Image"}
              </button>
              {aiCoverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={aiCoverImage}
                  alt="AI cover preview"
                  className="h-36 w-full rounded-lg border border-[#E8EAED] object-cover bg-white"
                />
              ) : null}
              <p className="text-center text-[11px] font-medium uppercase tracking-wide text-[#94A3B8]">
                or upload manually
              </p>
              <MediaUpload
                label="Upload cover image"
                kind="image"
                value={aiCoverImage}
                onChange={setAiCoverImage}
                hint="PNG, JPG, JPEG, GIF, WEBP (Max 10MB)"
                uploadFile={uploadVarsoviaMedia}
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={aiLoading || aiImageLoading}
                onClick={() => {
                  setAiOpen(false);
                  setAiCoverImage("");
                }}
                className="rounded-lg border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={aiLoading || aiImageLoading}
                onClick={() => void generateBlogDraft()}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1A2332] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {aiLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {aiLoading ? "Generating…" : "Generate Blog"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function FieldControl({
  field,
  value,
  locale = "en",
  onChange,
}: {
  field: Field;
  value: unknown;
  locale?: LocaleCode;
  onChange: (value: unknown) => void;
}) {
  const items = Array.isArray(value) ? value : [];
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  const setEntryLocalized = (
    entry: Record<string, unknown>,
    key: string,
    nextValue: string
  ) => {
    const existing = entry[key];
    const localized: Record<string, unknown> =
      existing && typeof existing === "object" && !Array.isArray(existing)
        ? { ...(existing as Record<string, unknown>) }
        : { en: typeof existing === "string" ? existing : "" };
    localized[locale] = nextValue;
    return { ...entry, [key]: localized };
  };

  if (field.type === "string-list") {
    const strings = items.map((item) => String(item ?? ""));
    return (
      <div className="md:col-span-2">
        <FieldLabel field={field} />
        <div className="space-y-2">
          {strings.map((item, index) => (
            <div key={index} className="flex gap-2">
              <input
                value={item}
                onChange={(event) =>
                  onChange(
                    strings.map((current, itemIndex) =>
                      itemIndex === index ? event.target.value : current
                    )
                  )
                }
                placeholder={
                  field.media === "pdf"
                    ? "PDF URL or upload…"
                    : "Image URL or upload…"
                }
                className="min-w-0 flex-1 rounded-lg border border-[#DDE1E7] px-3.5 py-2.5 text-sm outline-none focus:border-[#1A2332]"
              />
              {field.media ? (
                <InlineUploadButton
                  kind={field.media}
                  onUploaded={(url) =>
                    onChange(
                      strings.map((current, itemIndex) =>
                        itemIndex === index ? url : current
                      )
                    )
                  }
                />
              ) : null}
              <ListButtons
                index={index}
                length={strings.length}
                onMove={move}
                onRemove={() => onChange(strings.filter((_, i) => i !== index))}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => onChange([...strings, ""])}
            className="inline-flex items-center gap-2 rounded-lg border border-dashed border-[#B9C0CA] px-3 py-2 text-xs font-semibold text-[#5C6370]"
          >
            <Plus size={14} /> Add item
          </button>
        </div>
      </div>
    );
  }

  if (field.type === "localized-string-list") {
    const itemKey = field.itemKey;
    const unwrap = (item: unknown) =>
      itemKey && item && typeof item === "object" && !Array.isArray(item)
        ? (item as Record<string, unknown>)[itemKey]
        : item;
    return (
      <div className="md:col-span-2">
        <FieldLabel field={field} />
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex gap-2">
              <input
                value={localizedValue(unwrap(item), locale)}
                onChange={(event) => {
                  const inner = unwrap(item);
                  const current: Record<string, unknown> =
                    inner && typeof inner === "object" && !Array.isArray(inner)
                      ? { ...(inner as Record<string, unknown>) }
                      : { en: typeof inner === "string" ? inner : "" };
                  current[locale] = event.target.value;
                  const next = itemKey ? { [itemKey]: current } : current;
                  onChange(
                    items.map((entry, itemIndex) =>
                      itemIndex === index ? next : entry
                    )
                  );
                }}
                placeholder={`Feature (${locale.toUpperCase()})`}
                className="min-w-0 flex-1 rounded-lg border border-[#DDE1E7] px-3.5 py-2.5 text-sm outline-none focus:border-[#1A2332]"
              />
              <ListButtons
                index={index}
                length={items.length}
                onMove={move}
                onRemove={() => onChange(items.filter((_, i) => i !== index))}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              onChange([...items, itemKey ? { [itemKey]: { en: "" } } : { en: "" }])
            }
            className="inline-flex items-center gap-2 rounded-lg border border-dashed border-[#B9C0CA] px-3 py-2 text-xs font-semibold text-[#5C6370]"
          >
            <Plus size={14} /> Add feature
          </button>
        </div>
      </div>
    );
  }

  if (field.type === "spec-list") {
    const specs = items.map((item) =>
      item && typeof item === "object"
        ? (item as Record<string, unknown>)
        : {}
    );
    return (
      <div className="md:col-span-2">
        <FieldLabel field={field} />
        <div className="space-y-3">
          {specs.map((entry, index) => (
            <div key={index} className="rounded-xl border border-[#E2E5EA] bg-[#FAFBFC] p-4">
              <div className="mb-3 flex justify-between gap-3">
                <span className="text-xs font-bold text-[#5C6370]">
                  Specification {index + 1}
                </span>
                <ListButtons
                  index={index}
                  length={specs.length}
                  onMove={move}
                  onRemove={() => onChange(specs.filter((_, i) => i !== index))}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <SmallInput
                  label="Label"
                  value={localizedValue(entry.label, locale)}
                  onChange={(next) =>
                    onChange(
                      specs.map((current, i) =>
                        i === index
                          ? setEntryLocalized(current, "label", next)
                          : current
                      )
                    )
                  }
                />
                <SmallInput
                  label="Value"
                  value={localizedValue(entry.value, locale)}
                  onChange={(next) =>
                    onChange(
                      specs.map((current, i) =>
                        i === index
                          ? setEntryLocalized(current, "value", next)
                          : current
                      )
                    )
                  }
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              onChange([...specs, { label: { en: "" }, value: { en: "" } }])
            }
            className="inline-flex items-center gap-2 rounded-lg border border-dashed border-[#B9C0CA] px-3 py-2 text-xs font-semibold text-[#5C6370]"
          >
            <Plus size={14} /> Add specification
          </button>
        </div>
      </div>
    );
  }

  if (field.type === "content-sections") {
    const sections = items.map((item) =>
      item && typeof item === "object"
        ? (item as Record<string, unknown>)
        : {}
    );
    return (
      <div className="md:col-span-2">
        <FieldLabel field={field} />
        <div className="space-y-3">
          {sections.map((entry, index) => (
            <div key={index} className="rounded-xl border border-[#E2E5EA] bg-[#FAFBFC] p-4">
              <div className="mb-3 flex justify-between gap-3">
                <span className="text-xs font-bold text-[#5C6370]">
                  Section {index + 1}
                </span>
                <ListButtons
                  index={index}
                  length={sections.length}
                  onMove={move}
                  onRemove={() =>
                    onChange(sections.filter((_, i) => i !== index))
                  }
                />
              </div>
              <div className="grid gap-3">
                <SmallInput
                  label="Heading"
                  value={localizedValue(entry.heading, locale)}
                  onChange={(next) =>
                    onChange(
                      sections.map((current, i) =>
                        i === index
                          ? setEntryLocalized(current, "heading", next)
                          : current
                      )
                    )
                  }
                />
                <label>
                  <span className="mb-1 block text-[11px] font-semibold uppercase text-[#6B7280]">
                    Text
                  </span>
                  <textarea
                    rows={4}
                    value={localizedValue(entry.text, locale)}
                    onChange={(event) =>
                      onChange(
                        sections.map((current, i) =>
                          i === index
                            ? setEntryLocalized(current, "text", event.target.value)
                            : current
                        )
                      )
                    }
                    className="w-full rounded-lg border border-[#DDE1E7] px-3 py-2 text-sm outline-none focus:border-[#1A2332]"
                  />
                </label>
                <SmallInput
                  label="Image URL"
                  value={String(entry.image ?? "")}
                  media="image"
                  onChange={(next) =>
                    onChange(
                      sections.map((current, i) =>
                        i === index ? { ...current, image: next } : current
                      )
                    )
                  }
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              onChange([
                ...sections,
                { heading: { en: "" }, text: { en: "" }, image: "" },
              ])
            }
            className="inline-flex items-center gap-2 rounded-lg border border-dashed border-[#B9C0CA] px-3 py-2 text-xs font-semibold text-[#5C6370]"
          >
            <Plus size={14} /> Add content section
          </button>
        </div>
      </div>
    );
  }

  if (field.type === "strength-list") {
    const strengths = items.map((item) =>
      item && typeof item === "object"
        ? (item as Record<string, unknown>)
        : {}
    );
    return (
      <div className="md:col-span-2">
        <FieldLabel field={field} />
        <div className="space-y-3">
          {strengths.map((entry, index) => (
            <div key={index} className="rounded-xl border border-[#E2E5EA] bg-[#FAFBFC] p-4">
              <div className="mb-3 flex justify-between gap-3">
                <span className="text-xs font-bold text-[#5C6370]">
                  Strength {index + 1}
                </span>
                <ListButtons
                  index={index}
                  length={strengths.length}
                  onMove={move}
                  onRemove={() =>
                    onChange(strengths.filter((_, i) => i !== index))
                  }
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <SmallInput
                  label="Title"
                  value={localizedValue(entry.title, locale)}
                  onChange={(next) =>
                    onChange(
                      strengths.map((current, i) =>
                        i === index
                          ? setEntryLocalized(current, "title", next)
                          : current
                      )
                    )
                  }
                />
                <SmallInput
                  label="Icon (eye, ruler, users, box, shield, pen)"
                  value={String(entry.icon ?? "")}
                  onChange={(next) =>
                    onChange(
                      strengths.map((current, i) =>
                        i === index ? { ...current, icon: next } : current
                      )
                    )
                  }
                />
                <label className="md:col-span-2">
                  <span className="mb-1 block text-[11px] font-semibold uppercase text-[#6B7280]">
                    Description
                  </span>
                  <textarea
                    rows={3}
                    value={localizedValue(entry.description, locale)}
                    onChange={(event) =>
                      onChange(
                        strengths.map((current, i) =>
                          i === index
                            ? setEntryLocalized(
                                current,
                                "description",
                                event.target.value
                              )
                            : current
                        )
                      )
                    }
                    className="w-full rounded-lg border border-[#DDE1E7] px-3 py-2 text-sm outline-none focus:border-[#1A2332]"
                  />
                </label>
                <div className="md:col-span-2">
                  <SmallInput
                    label="Image URL"
                    value={String(entry.image ?? "")}
                    media="image"
                    onChange={(next) =>
                      onChange(
                        strengths.map((current, i) =>
                          i === index ? { ...current, image: next } : current
                        )
                      )
                    }
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              onChange([
                ...strengths,
                {
                  title: { en: "" },
                  description: { en: "" },
                  image: "",
                  icon: "eye",
                },
              ])
            }
            className="inline-flex items-center gap-2 rounded-lg border border-dashed border-[#B9C0CA] px-3 py-2 text-xs font-semibold text-[#5C6370]"
          >
            <Plus size={14} /> Add strength
          </button>
        </div>
      </div>
    );
  }

  if (field.type === "stats-list") {
    const stats = items.map((item) =>
      item && typeof item === "object"
        ? (item as Record<string, unknown>)
        : {}
    );
    return (
      <div className="md:col-span-2">
        <FieldLabel field={field} />
        <div className="space-y-3">
          {stats.map((entry, index) => (
            <div key={index} className="rounded-xl border border-[#E2E5EA] bg-[#FAFBFC] p-4">
              <div className="mb-3 flex justify-between gap-3">
                <span className="text-xs font-bold text-[#5C6370]">Statistic {index + 1}</span>
                <ListButtons
                  index={index}
                  length={stats.length}
                  onMove={move}
                  onRemove={() => onChange(stats.filter((_, i) => i !== index))}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <SmallInput
                  label="Value"
                  value={localizedValue(entry.value, locale)}
                  onChange={(next) =>
                    onChange(
                      stats.map((current, i) =>
                        i === index
                          ? setEntryLocalized(current, "value", next)
                          : current
                      )
                    )
                  }
                />
                <SmallInput
                  label="Label"
                  value={localizedValue(entry.label, locale)}
                  onChange={(next) =>
                    onChange(
                      stats.map((current, i) =>
                        i === index
                          ? setEntryLocalized(current, "label", next)
                          : current
                      )
                    )
                  }
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              onChange([...stats, { value: { en: "" }, label: { en: "" } }])
            }
            className="inline-flex items-center gap-2 rounded-lg border border-dashed border-[#B9C0CA] px-3 py-2 text-xs font-semibold text-[#5C6370]"
          >
            <Plus size={14} /> Add statistic
          </button>
        </div>
      </div>
    );
  }

  if (field.type === "process-list") {
    const steps = items.map((item) =>
      item && typeof item === "object"
        ? (item as Record<string, unknown>)
        : {}
    );
    return (
      <div className="md:col-span-2">
        <FieldLabel field={field} />
        <div className="space-y-3">
          {steps.map((entry, index) => (
            <div key={index} className="rounded-xl border border-[#E2E5EA] bg-[#FAFBFC] p-4">
              <div className="mb-3 flex justify-between gap-3">
                <span className="text-xs font-bold text-[#5C6370]">Step {index + 1}</span>
                <ListButtons
                  index={index}
                  length={steps.length}
                  onMove={move}
                  onRemove={() => onChange(steps.filter((_, i) => i !== index))}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <SmallInput
                  label="Step Number"
                  value={String(entry.step ?? "")}
                  onChange={(next) =>
                    onChange(
                      steps.map((current, i) =>
                        i === index ? { ...current, step: next } : current
                      )
                    )
                  }
                />
                <SmallInput
                  label="Title"
                  value={localizedValue(entry.title, locale)}
                  onChange={(next) =>
                    onChange(
                      steps.map((current, i) =>
                        i === index
                          ? setEntryLocalized(current, "title", next)
                          : current
                      )
                    )
                  }
                />
                <SmallInput
                  label="Image URL (optional)"
                  value={String(entry.image ?? "")}
                  media="image"
                  onChange={(next) =>
                    onChange(
                      steps.map((current, i) =>
                        i === index ? { ...current, image: next } : current
                      )
                    )
                  }
                />
                <label className="md:col-span-2">
                  <span className="mb-1 block text-[11px] font-semibold uppercase text-[#6B7280]">
                    Text
                  </span>
                  <textarea
                    rows={3}
                    value={localizedValue(entry.text, locale)}
                    onChange={(event) =>
                      onChange(
                        steps.map((current, i) =>
                          i === index
                            ? setEntryLocalized(current, "text", event.target.value)
                            : current
                        )
                      )
                    }
                    className="w-full rounded-lg border border-[#DDE1E7] px-3 py-2 text-sm outline-none focus:border-[#1A2332]"
                  />
                </label>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              onChange([
                ...steps,
                { step: "", title: { en: "" }, text: { en: "" }, image: "" },
              ])
            }
            className="inline-flex items-center gap-2 rounded-lg border border-dashed border-[#B9C0CA] px-3 py-2 text-xs font-semibold text-[#5C6370]"
          >
            <Plus size={14} /> Add process step
          </button>
        </div>
      </div>
    );
  }

  if (field.type === "faq-list") {
    const faqs = items.map((item) =>
      item && typeof item === "object" ? (item as Record<string, unknown>) : {}
    );
    return (
      <div className="md:col-span-2">
        <FieldLabel field={field} />
        <div className="space-y-3">
          {faqs.map((entry, index) => (
            <div key={index} className="rounded-xl border border-[#E2E5EA] bg-[#FAFBFC] p-4">
              <div className="mb-3 flex justify-between gap-3">
                <span className="text-xs font-bold text-[#5C6370]">FAQ {index + 1}</span>
                <ListButtons
                  index={index}
                  length={faqs.length}
                  onMove={move}
                  onRemove={() => onChange(faqs.filter((_, i) => i !== index))}
                />
              </div>
              <div className="grid gap-3">
                <SmallInput
                  label="Question"
                  value={localizedValue(entry.question, locale)}
                  onChange={(next) =>
                    onChange(
                      faqs.map((current, i) =>
                        i === index
                          ? setEntryLocalized(current, "question", next)
                          : current
                      )
                    )
                  }
                />
                <label>
                  <span className="mb-1 block text-[11px] font-semibold uppercase text-[#6B7280]">
                    Answer
                  </span>
                  <textarea
                    rows={3}
                    value={localizedValue(entry.answer, locale)}
                    onChange={(event) =>
                      onChange(
                        faqs.map((current, i) =>
                          i === index
                            ? setEntryLocalized(current, "answer", event.target.value)
                            : current
                        )
                      )
                    }
                    className="w-full rounded-lg border border-[#DDE1E7] px-3 py-2 text-sm outline-none focus:border-[#1A2332]"
                  />
                </label>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              onChange([...faqs, { question: { en: "" }, answer: { en: "" } }])
            }
            className="inline-flex items-center gap-2 rounded-lg border border-dashed border-[#B9C0CA] px-3 py-2 text-xs font-semibold text-[#5C6370]"
          >
            <Plus size={14} /> Add FAQ
          </button>
        </div>
      </div>
    );
  }

  if (field.type === "showcase-meta-list") {
    const rows = items.map((item) =>
      item && typeof item === "object" ? (item as Record<string, unknown>) : {}
    );
    return (
      <div className="md:col-span-2">
        <FieldLabel field={field} />
        <div className="space-y-3">
          {rows.map((entry, index) => (
            <div key={index} className="rounded-xl border border-[#E2E5EA] bg-[#FAFBFC] p-4">
              <div className="mb-3 flex justify-between gap-3">
                <span className="text-xs font-bold text-[#5C6370]">Tab {index + 1}</span>
                <ListButtons
                  index={index}
                  length={rows.length}
                  onMove={move}
                  onRemove={() => onChange(rows.filter((_, i) => i !== index))}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <SmallInput
                  label="Tab Key"
                  value={String(entry.tabKey ?? "")}
                  onChange={(next) =>
                    onChange(
                      rows.map((current, i) =>
                        i === index ? { ...current, tabKey: next } : current
                      )
                    )
                  }
                />
                <SmallInput
                  label="Order"
                  value={String(entry.order ?? index)}
                  onChange={(next) =>
                    onChange(
                      rows.map((current, i) =>
                        i === index
                          ? { ...current, order: Number(next) || 0 }
                          : current
                      )
                    )
                  }
                />
                <SmallInput
                  label="Title"
                  value={localizedValue(entry.title, locale)}
                  onChange={(next) =>
                    onChange(
                      rows.map((current, i) =>
                        i === index
                          ? setEntryLocalized(current, "title", next)
                          : current
                      )
                    )
                  }
                />
                <SmallInput
                  label="Subtitle"
                  value={localizedValue(entry.subtitle, locale)}
                  onChange={(next) =>
                    onChange(
                      rows.map((current, i) =>
                        i === index
                          ? setEntryLocalized(current, "subtitle", next)
                          : current
                      )
                    )
                  }
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              onChange([
                ...rows,
                {
                  tabKey: "",
                  title: { en: "" },
                  subtitle: { en: "" },
                  order: rows.length,
                },
              ])
            }
            className="inline-flex items-center gap-2 rounded-lg border border-dashed border-[#B9C0CA] px-3 py-2 text-xs font-semibold text-[#5C6370]"
          >
            <Plus size={14} /> Add showcase tab
          </button>
        </div>
      </div>
    );
  }

  if (field.type === "office-list") {
    const offices = items.map((item) =>
      item && typeof item === "object" ? (item as Record<string, unknown>) : {}
    );
    return (
      <div className="md:col-span-2">
        <FieldLabel field={field} />
        <div className="space-y-3">
          {offices.map((entry, index) => (
            <div key={index} className="rounded-xl border border-[#E2E5EA] bg-[#FAFBFC] p-4">
              <div className="mb-3 flex justify-between gap-3">
                <span className="text-xs font-bold text-[#5C6370]">Office {index + 1}</span>
                <ListButtons
                  index={index}
                  length={offices.length}
                  onMove={move}
                  onRemove={() => onChange(offices.filter((_, i) => i !== index))}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <SmallInput
                  label="Label"
                  value={localizedValue(entry.label, locale)}
                  onChange={(next) =>
                    onChange(
                      offices.map((current, i) =>
                        i === index ? setEntryLocalized(current, "label", next) : current
                      )
                    )
                  }
                />
                <SmallInput
                  label="Address"
                  value={String(entry.address ?? "")}
                  onChange={(next) =>
                    onChange(
                      offices.map((current, i) =>
                        i === index ? { ...current, address: next } : current
                      )
                    )
                  }
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              onChange([...offices, { label: { en: "" }, address: "" }])
            }
            className="inline-flex items-center gap-2 rounded-lg border border-dashed border-[#B9C0CA] px-3 py-2 text-xs font-semibold text-[#5C6370]"
          >
            <Plus size={14} /> Add office
          </button>
        </div>
      </div>
    );
  }

  if (field.type === "search-page-list") {
    const pages = items.map((item) =>
      item && typeof item === "object" ? (item as Record<string, unknown>) : {}
    );
    return (
      <div className="md:col-span-2">
        <FieldLabel field={field} />
        <div className="space-y-3">
          {pages.map((entry, index) => (
            <div key={index} className="rounded-xl border border-[#E2E5EA] bg-[#FAFBFC] p-4">
              <div className="mb-3 flex justify-between gap-3">
                <span className="text-xs font-bold text-[#5C6370]">Page {index + 1}</span>
                <ListButtons
                  index={index}
                  length={pages.length}
                  onMove={move}
                  onRemove={() => onChange(pages.filter((_, i) => i !== index))}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <SmallInput
                  label="Title"
                  value={localizedValue(entry.title, locale)}
                  onChange={(next) =>
                    onChange(
                      pages.map((current, i) =>
                        i === index ? setEntryLocalized(current, "title", next) : current
                      )
                    )
                  }
                />
                <SmallInput
                  label="Link"
                  value={String(entry.href ?? "")}
                  onChange={(next) =>
                    onChange(
                      pages.map((current, i) =>
                        i === index ? { ...current, href: next } : current
                      )
                    )
                  }
                />
                <SmallInput
                  label="Description"
                  value={localizedValue(entry.description, locale)}
                  onChange={(next) =>
                    onChange(
                      pages.map((current, i) =>
                        i === index
                          ? setEntryLocalized(current, "description", next)
                          : current
                      )
                    )
                  }
                />
                <SmallInput
                  label="Order"
                  value={String(entry.order ?? index)}
                  onChange={(next) =>
                    onChange(
                      pages.map((current, i) =>
                        i === index ? { ...current, order: Number(next) || 0 } : current
                      )
                    )
                  }
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              onChange([
                ...pages,
                { title: { en: "" }, description: { en: "" }, href: "", order: pages.length },
              ])
            }
            className="inline-flex items-center gap-2 rounded-lg border border-dashed border-[#B9C0CA] px-3 py-2 text-xs font-semibold text-[#5C6370]"
          >
            <Plus size={14} /> Add search page
          </button>
        </div>
      </div>
    );
  }

  if (field.type === "footer-nav") {
    const nav =
      value && typeof value === "object" && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : { version: 1 };
    const linkColumns = Array.isArray(nav.linkColumns)
      ? (nav.linkColumns as Record<string, unknown>[])
      : [];
    const legalLinks = Array.isArray(nav.legalLinks)
      ? (nav.legalLinks as Record<string, unknown>[])
      : [];
    const contactLabels =
      nav.contactLabels && typeof nav.contactLabels === "object"
        ? (nav.contactLabels as Record<string, unknown>)
        : {};
    const socialLabels =
      nav.socialLabels && typeof nav.socialLabels === "object"
        ? (nav.socialLabels as Record<string, unknown>)
        : {};

    const patchNav = (partial: Record<string, unknown>) =>
      onChange({ version: 1, ...nav, ...partial });

    const emptyLink = () => ({
      label: { en: "" },
      href: "",
      enabled: true,
    });

    const renderLinkEditor = (
      links: Record<string, unknown>[],
      onLinksChange: (next: Record<string, unknown>[]) => void,
      addLabel: string
    ) => (
      <div className="space-y-2">
        {links.map((link, index) => (
          <div
            key={index}
            className="grid gap-2 rounded-lg border border-[#E8EAED] bg-white p-3 md:grid-cols-[1fr_1fr_auto_auto]"
          >
            <SmallInput
              label="Label"
              value={localizedValue(link.label, locale)}
              onChange={(next) =>
                onLinksChange(
                  links.map((current, i) =>
                    i === index ? setEntryLocalized(current, "label", next) : current
                  )
                )
              }
            />
            <SmallInput
              label="Link"
              value={String(link.href ?? "")}
              onChange={(next) =>
                onLinksChange(
                  links.map((current, i) =>
                    i === index ? { ...current, href: next } : current
                  )
                )
              }
            />
            <label className="flex items-end gap-2 pb-2 text-xs font-semibold text-[#5C6370]">
              <input
                type="checkbox"
                checked={link.enabled !== false}
                onChange={(event) =>
                  onLinksChange(
                    links.map((current, i) =>
                      i === index
                        ? { ...current, enabled: event.target.checked }
                        : current
                    )
                  )
                }
                className="h-4 w-4 accent-[#1A2332]"
              />
              On
            </label>
            <div className="flex items-end pb-1">
              <ListButtons
                index={index}
                length={links.length}
                onMove={(from, direction) => {
                  const target = from + direction;
                  if (target < 0 || target >= links.length) return;
                  const next = [...links];
                  [next[from], next[target]] = [next[target], next[from]];
                  onLinksChange(next);
                }}
                onRemove={() => onLinksChange(links.filter((_, i) => i !== index))}
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onLinksChange([...links, emptyLink()])}
          className="inline-flex items-center gap-2 rounded-lg border border-dashed border-[#B9C0CA] px-3 py-2 text-xs font-semibold text-[#5C6370]"
        >
          <Plus size={14} /> {addLabel}
        </button>
      </div>
    );

    return (
      <div className="md:col-span-2 space-y-5">
        <FieldLabel field={field} />

        <div className="grid gap-3 md:grid-cols-2">
          <SmallInput
            label="Contact heading"
            value={localizedValue(nav.contactHeading, locale)}
            onChange={(next) =>
              patchNav(setEntryLocalized(nav, "contactHeading", next))
            }
          />
          <SmallInput
            label="Copyright (use {year} for current year)"
            value={localizedValue(nav.copyright, locale)}
            onChange={(next) => patchNav(setEntryLocalized(nav, "copyright", next))}
          />
          <SmallInput
            label="Email label"
            value={localizedValue(contactLabels.email, locale)}
            onChange={(next) =>
              patchNav({
                contactLabels: setEntryLocalized(contactLabels, "email", next),
              })
            }
          />
          <SmallInput
            label="Mobile / WhatsApp label"
            value={localizedValue(contactLabels.mobileWhatsapp, locale)}
            onChange={(next) =>
              patchNav({
                contactLabels: setEntryLocalized(
                  contactLabels,
                  "mobileWhatsapp",
                  next
                ),
              })
            }
          />
          <SmallInput
            label="Contact number label"
            value={localizedValue(contactLabels.contactNumber, locale)}
            onChange={(next) =>
              patchNav({
                contactLabels: setEntryLocalized(
                  contactLabels,
                  "contactNumber",
                  next
                ),
              })
            }
          />
          <SmallInput
            label="WhatsApp social label"
            value={localizedValue(socialLabels.whatsapp, locale)}
            onChange={(next) =>
              patchNav({
                socialLabels: setEntryLocalized(socialLabels, "whatsapp", next),
              })
            }
          />
          <SmallInput
            label="Facebook social label"
            value={localizedValue(socialLabels.facebook, locale)}
            onChange={(next) =>
              patchNav({
                socialLabels: setEntryLocalized(socialLabels, "facebook", next),
              })
            }
          />
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[#5C6370]">
            Link columns
          </p>
          {linkColumns.map((column, columnIndex) => {
            const links = Array.isArray(column.links)
              ? (column.links as Record<string, unknown>[])
              : [];
            return (
              <div
                key={columnIndex}
                className="rounded-xl border border-[#E2E5EA] bg-[#FAFBFC] p-4 space-y-3"
              >
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div className="grid flex-1 gap-3 md:grid-cols-3">
                    <SmallInput
                      label="Column ID"
                      value={String(column.id ?? "")}
                      onChange={(next) =>
                        patchNav({
                          linkColumns: linkColumns.map((current, i) =>
                            i === columnIndex ? { ...current, id: next } : current
                          ),
                        })
                      }
                    />
                    <SmallInput
                      label="Order"
                      value={String(column.order ?? columnIndex + 1)}
                      onChange={(next) =>
                        patchNav({
                          linkColumns: linkColumns.map((current, i) =>
                            i === columnIndex
                              ? { ...current, order: Number(next) || 0 }
                              : current
                          ),
                        })
                      }
                    />
                    <label className="flex items-end gap-2 pb-2 text-xs font-semibold text-[#5C6370]">
                      <input
                        type="checkbox"
                        checked={column.enabled !== false}
                        onChange={(event) =>
                          patchNav({
                            linkColumns: linkColumns.map((current, i) =>
                              i === columnIndex
                                ? { ...current, enabled: event.target.checked }
                                : current
                            ),
                          })
                        }
                        className="h-4 w-4 accent-[#1A2332]"
                      />
                      Column enabled
                    </label>
                  </div>
                  <ListButtons
                    index={columnIndex}
                    length={linkColumns.length}
                    onMove={(from, direction) => {
                      const target = from + direction;
                      if (target < 0 || target >= linkColumns.length) return;
                      const next = [...linkColumns];
                      [next[from], next[target]] = [next[target], next[from]];
                      patchNav({ linkColumns: next });
                    }}
                    onRemove={() =>
                      patchNav({
                        linkColumns: linkColumns.filter((_, i) => i !== columnIndex),
                      })
                    }
                  />
                </div>
                {renderLinkEditor(
                  links,
                  (nextLinks) =>
                    patchNav({
                      linkColumns: linkColumns.map((current, i) =>
                        i === columnIndex ? { ...current, links: nextLinks } : current
                      ),
                    }),
                  "Add link"
                )}
              </div>
            );
          })}
          <button
            type="button"
            onClick={() =>
              patchNav({
                linkColumns: [
                  ...linkColumns,
                  {
                    id: `column-${linkColumns.length + 1}`,
                    order: linkColumns.length + 1,
                    enabled: true,
                    links: [emptyLink()],
                  },
                ],
              })
            }
            className="inline-flex items-center gap-2 rounded-lg border border-dashed border-[#B9C0CA] px-3 py-2 text-xs font-semibold text-[#5C6370]"
          >
            <Plus size={14} /> Add column
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[#5C6370]">
            Legal links
          </p>
          {renderLinkEditor(
            legalLinks,
            (nextLinks) => patchNav({ legalLinks: nextLinks }),
            "Add legal link"
          )}
        </div>
      </div>
    );
  }

  if (field.type === "tool-list") {
    const tools = items.map((item) =>
      item && typeof item === "object" ? (item as Record<string, unknown>) : {}
    );
    return (
      <div className="md:col-span-2">
        <FieldLabel field={field} />
        <div className="space-y-3">
          {tools.map((entry, index) => (
            <div key={index} className="rounded-xl border border-[#E2E5EA] bg-[#FAFBFC] p-4">
              <div className="mb-3 flex justify-between gap-3">
                <span className="text-xs font-bold text-[#5C6370]">Tool {index + 1}</span>
                <ListButtons
                  index={index}
                  length={tools.length}
                  onMove={move}
                  onRemove={() => onChange(tools.filter((_, i) => i !== index))}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <SmallInput
                  label="Name"
                  value={localizedValue(entry.name, locale)}
                  onChange={(next) =>
                    onChange(
                      tools.map((current, i) =>
                        i === index
                          ? setEntryLocalized(current, "name", next)
                          : current
                      )
                    )
                  }
                />
                <SmallInput
                  label="Icon key (compass|cpu|layers|box)"
                  value={String(entry.icon ?? "")}
                  onChange={(next) =>
                    onChange(
                      tools.map((current, i) =>
                        i === index ? { ...current, icon: next } : current
                      )
                    )
                  }
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              onChange([...tools, { name: { en: "" }, icon: "compass" }])
            }
            className="inline-flex items-center gap-2 rounded-lg border border-dashed border-[#B9C0CA] px-3 py-2 text-xs font-semibold text-[#5C6370]"
          >
            <Plus size={14} /> Add tool
          </button>
        </div>
      </div>
    );
  }

  const wide = field.type === "textarea" || field.type === "json";

  if (field.media && field.type !== "boolean" && field.type !== "number") {
    return (
      <div className={wide ? "md:col-span-2" : ""}>
        <FieldLabel field={field} />
        <div className="flex gap-2">
          <input
            type="text"
            value={String(value ?? "")}
            onChange={(event) => onChange(event.target.value)}
            placeholder={
              field.media === "pdf"
                ? "PDF URL or upload…"
                : "Image URL or upload…"
            }
            className="min-w-0 flex-1 rounded-lg border border-[#DDE1E7] px-3.5 py-2.5 text-sm outline-none focus:border-[#1A2332]"
          />
          <InlineUploadButton
            kind={field.media}
            onUploaded={(url) => onChange(url)}
          />
        </div>
      </div>
    );
  }

  return (
    <label className={wide ? "md:col-span-2" : ""}>
      <FieldLabel field={field} />
      {field.type === "boolean" ? (
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
          className="h-5 w-5 accent-[#1A2332]"
        />
      ) : field.type === "select" ? (
        <select
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-lg border border-[#DDE1E7] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#1A2332]"
        >
          {(field.options || []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : field.type === "textarea" || field.type === "json" ? (
        <textarea
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          rows={field.type === "json" ? 4 : 5}
          className="w-full rounded-lg border border-[#DDE1E7] px-3.5 py-2.5 text-sm outline-none focus:border-[#1A2332]"
        />
      ) : (
        <input
          type={field.type === "number" ? "number" : "text"}
          value={String(value ?? "")}
          onChange={(event) =>
            onChange(
              field.type === "number"
                ? event.target.value === ""
                  ? ""
                  : Number(event.target.value)
                : event.target.value
            )
          }
          className="w-full rounded-lg border border-[#DDE1E7] px-3.5 py-2.5 text-sm outline-none focus:border-[#1A2332]"
        />
      )}
    </label>
  );
}

function FieldLabel({ field }: { field: Field }) {
  return (
    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#5C6370]">
      {field.label}
      {field.required ? " *" : ""}
    </span>
  );
}

function SmallInput({
  label,
  value,
  onChange,
  media,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  media?: MediaKind;
}) {
  return (
    <label>
      <span className="mb-1 block text-[11px] font-semibold uppercase text-[#6B7280]">
        {label}
      </span>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={
            media
              ? media === "pdf"
                ? "PDF URL or upload…"
                : "Image URL or upload…"
              : undefined
          }
          className="min-w-0 flex-1 rounded-lg border border-[#DDE1E7] px-3 py-2 text-sm outline-none focus:border-[#1A2332]"
        />
        {media ? (
          <InlineUploadButton kind={media} onUploaded={onChange} />
        ) : null}
      </div>
    </label>
  );
}

function InlineUploadButton({
  kind = "image",
  onUploaded,
}: {
  kind?: MediaKind;
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const accept =
    kind === "pdf"
      ? "application/pdf,.pdf"
      : kind === "icon"
        ? "image/png,image/svg+xml,image/webp,image/jpeg"
        : "image/png,image/jpeg,image/webp,image/gif,image/svg+xml";

  const onFile = async (file?: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadVarsoviaMedia(file, kind);
      if (!res?.file?.url) throw new Error("No URL returned");
      onUploaded(res.file.url);
      toast.success("Uploaded");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#E2E5EA] bg-[#F9FAFB] px-3 py-2 text-xs font-semibold text-[#1A2332] hover:bg-[#F3F4F6] disabled:opacity-60"
      >
        {uploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Upload className="h-3.5 w-3.5" />
        )}
        Upload
      </button>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={(event) => void onFile(event.target.files?.[0])}
      />
    </>
  );
}

function ListButtons({
  index,
  length,
  onMove,
  onRemove,
}: {
  index: number;
  length: number;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex shrink-0 gap-1">
      <button
        type="button"
        disabled={index === 0}
        onClick={() => onMove(index, -1)}
        className="rounded-md border border-[#DDE1E7] px-2 py-1 text-xs disabled:opacity-30"
        aria-label="Move up"
      >
        ↑
      </button>
      <button
        type="button"
        disabled={index === length - 1}
        onClick={() => onMove(index, 1)}
        className="rounded-md border border-[#DDE1E7] px-2 py-1 text-xs disabled:opacity-30"
        aria-label="Move down"
      >
        ↓
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-md border border-red-200 p-1.5 text-red-600"
        aria-label="Remove"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}
