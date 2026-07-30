"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Loader2,
  Plus,
  Pencil,
  Save,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import AdminShell from "@/components/AdminShell";
import { mergeVarsoviaSiteDefaults } from "./siteDefaults";
import { generateBlogWithAI, uploadMedia } from "@/services/adminAPI";
import {
  createVarsoviaRecord,
  deleteVarsoviaRecord,
  getVarsoviaSite,
  getStoredVarsoviaAdminKey,
  listVarsoviaContacts,
  listVarsoviaRecords,
  localizedValue,
  setStoredVarsoviaAdminKey,
  updateVarsoviaContactStatus,
  updateVarsoviaRecord,
  updateVarsoviaSite,
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
  | "strength-list";
type Field = {
  key: string;
  label: string;
  type?: FieldType;
  localized?: boolean;
  required?: boolean;
  /** Shows an Upload button next to the URL input (image / logo / PDF). */
  media?: MediaKind;
};
type ResourceConfig = {
  label: string;
  singular: string;
  titleKey: string;
  fields: Field[];
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
    description: "Footer description and social media links.",
    fields: [
      { key: "footerBio", label: "Footer Description", localized: true, type: "textarea" },
      { key: "socialLinks.whatsapp", label: "WhatsApp URL" },
      { key: "socialLinks.instagram", label: "Instagram URL" },
      { key: "socialLinks.x", label: "X URL" },
      { key: "socialLinks.facebook", label: "Facebook URL" },
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
];

const CONFIGS: Record<VarsoviaResource, ResourceConfig> = {
  products: {
    label: "Products",
    singular: "Product",
    titleKey: "title",
    fields: [
      { key: "title", label: "Title", localized: true, required: true },
      { key: "description", label: "Description", localized: true, type: "textarea" },
      { key: "fullDescription", label: "Full Description", localized: true, type: "textarea" },
      { key: "slug", label: "Slug" },
      { key: "image", label: "Image URL", media: "image" },
      { key: "gallery", label: "Gallery Images", type: "string-list", media: "image" },
      { key: "features", label: "Features", type: "localized-string-list" },
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
      { key: "rating", label: "Rating (1–5)", type: "number" },
      { key: "image", label: "Image URL", media: "image" },
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
      { key: "coverImage", label: "Cover Image URL", media: "image" },
      { key: "downloadUrl", label: "Download URL", media: "pdf" },
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

function errorMessage(error: unknown) {
  const candidate = error as {
    response?: { data?: { message?: string; errors?: { message?: string }[] } };
    message?: string;
  };
  return (
    candidate.response?.data?.errors?.[0]?.message ||
    candidate.response?.data?.message ||
    candidate.message ||
    "Request failed"
  );
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
    requested === "site" ||
    requested === "contacts" ||
    RESOURCE_IDS.includes(requested as VarsoviaResource)
      ? requested
      : "site";

  return (
    <AdminShell title="Varsovia Kitchen CMS">
      {active === "site" ? (
        <SiteSettings />
      ) : active === "contacts" ? (
        <ContactsManager />
      ) : (
        <ResourceManager resource={active as VarsoviaResource} />
      )}
    </AdminShell>
  );
}

function SiteSettings() {
  const [adminKey, setAdminKey] = useState("");
  const [savingKey, setSavingKey] = useState(false);
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
    const stored = getStoredVarsoviaAdminKey();
    setAdminKey(stored);
    if (stored) void loadContent();
  }, [loadContent]);

  const saveKey = () => {
    const trimmed = adminKey.trim();
    if (!trimmed) {
      toast.error("Enter a valid Admin Key");
      return;
    }
    setSavingKey(true);
    try {
      setStoredVarsoviaAdminKey(trimmed);
      toast.success("Admin Key saved");
      void loadContent();
    } finally {
      setSavingKey(false);
    }
  };

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
          Enter the Varsovia API Admin Key used for create, update and delete.
        </p>
      </div>

      <div className="max-w-xl rounded-xl border border-[#DDE1E7] bg-white p-5 space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-[#1A2332]">Admin Key</span>
          <input
            type="password"
            value={adminKey}
            onChange={(event) => setAdminKey(event.target.value)}
            placeholder="Enter Varsovia ADMIN_KEY"
            autoComplete="off"
            className="w-full rounded-lg border border-[#DDE1E7] px-3 py-2.5 text-sm outline-none focus:border-[#1A2332]"
          />
        </label>
        <button
          type="button"
          onClick={saveKey}
          disabled={savingKey}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1A2332] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Save size={16} />
          {savingKey ? "Saving…" : "Save Admin Key"}
        </button>
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
        ) : !adminKey.trim() ? (
          <p className="p-6 text-sm text-[#6B7280]">
            Save the Varsovia Admin Key to load multilingual website content.
          </p>
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
                      field.type === "strength-list";
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
    void load();
  }, [load]);

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

    try {
      setSaving(true);
      if (editing?._id) {
        await updateVarsoviaRecord(resource, editing._id, form);
        toast.success(`${config.singular} updated`);
      } else {
        await createVarsoviaRecord(resource, form);
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
        image: article.image || "",
        views: 0,
        visible: true,
        order: 0,
      });
      setAiOpen(false);
      setAiTopic("");
      toast.success("Varsovia blog draft generated");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <section className="space-y-5">
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
              onClick={() => setAiOpen(true)}
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
                    field.type === "strength-list";
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-[#1A2332]">
                  Generate with AI
                </h3>
                <p className="mt-1 text-xs text-[#6B7280]">
                  Enter a topic and AI will prepare an editable Varsovia blog
                  draft.
                </p>
              </div>
              <button
                type="button"
                disabled={aiLoading}
                onClick={() => setAiOpen(false)}
                className="rounded-lg p-1.5 hover:bg-gray-100 disabled:opacity-50"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <label className="block text-xs font-semibold text-[#5C6370]">
              Blog topic
              <input
                value={aiTopic}
                onChange={(event) => setAiTopic(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !aiLoading) {
                    event.preventDefault();
                    void generateBlogDraft();
                  }
                }}
                placeholder="e.g. Timeless modular kitchens for luxury homes"
                disabled={aiLoading}
                autoFocus
                className="mt-1.5 w-full rounded-lg border border-[#E2E5EA] px-3 py-2.5 text-sm font-normal outline-none focus:border-[#1A2332]"
              />
            </label>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={aiLoading}
                onClick={() => setAiOpen(false)}
                className="rounded-lg border border-[#DDE1E7] px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={aiLoading || !aiTopic.trim()}
                onClick={() => void generateBlogDraft()}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1A2332] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
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
    return (
      <div className="md:col-span-2">
        <FieldLabel field={field} />
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex gap-2">
              <input
                value={localizedValue(item, locale)}
                onChange={(event) => {
                  const current: Record<string, unknown> =
                    item && typeof item === "object" && !Array.isArray(item)
                      ? { ...(item as Record<string, unknown>) }
                      : { en: typeof item === "string" ? item : "" };
                  current[locale] = event.target.value;
                  onChange(
                    items.map((entry, itemIndex) =>
                      itemIndex === index ? current : entry
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
            onClick={() => onChange([...items, { en: "" }])}
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
      const res = await uploadMedia(file, kind);
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

function ContactsManager() {
  const [items, setItems] = useState<VarsoviaRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listVarsoviaContacts());
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setStatus = async (id: string, status: string) => {
    try {
      await updateVarsoviaContactStatus(id, status);
      toast.success("Lead status updated");
      await load();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Contact Leads</h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          Enquiries submitted on the Varsovia website.
        </p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[#E2E5EA] bg-white">
        {loading ? (
          <p className="p-8 text-sm text-[#6B7280]">Loading…</p>
        ) : (
          <table className="w-full min-w-[1400px] text-left text-sm">
            <thead className="bg-[#F7F8FA] text-xs uppercase text-[#6B7280]">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">WhatsApp</th>
                <th className="px-4 py-3">City / Country</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Budget</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EAED]">
              {items.map((item) => (
                <tr key={item._id}>
                  <td className="px-4 py-4 font-semibold">
                    {String(item.name || "—")}
                  </td>
                  <td className="px-4 py-4">{String(item.email || "—")}</td>
                  <td className="px-4 py-4">{String(item.phone || "—")}</td>
                  <td className="px-4 py-4">{String(item.whatsapp || "—")}</td>
                  <td className="px-4 py-4">
                    {[item.city, item.country].filter(Boolean).map(String).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-4">
                    {String(item.projectType || "—")}
                  </td>
                  <td className="px-4 py-4">{String(item.budget || "—")}</td>
                  <td className="max-w-xs px-4 py-4">
                    {String(item.message || "—")}
                  </td>
                  <td className="px-4 py-4">
                    {item.createdAt
                      ? new Date(String(item.createdAt)).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={String(item.status || "new")}
                      onChange={(event) =>
                        void setStatus(item._id, event.target.value)
                      }
                      className="rounded-lg border border-[#DDE1E7] px-3 py-2"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
