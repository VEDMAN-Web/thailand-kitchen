"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Pencil, Trash2, X, Save } from "lucide-react";
import { toast } from "sonner";
import AdminShell from "@/components/AdminShell";
import {
  createVarsoviaRecord,
  deleteVarsoviaRecord,
  getStoredVarsoviaAdminKey,
  listVarsoviaContacts,
  listVarsoviaRecords,
  localizedValue,
  setStoredVarsoviaAdminKey,
  updateVarsoviaContactStatus,
  updateVarsoviaRecord,
  type LocaleCode,
  type VarsoviaRecord,
  type VarsoviaResource,
} from "@/services/varsoviaAPI";

type FieldType = "text" | "textarea" | "number" | "boolean" | "json";
type Field = {
  key: string;
  label: string;
  type?: FieldType;
  localized?: boolean;
  required?: boolean;
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

const CONFIGS: Record<VarsoviaResource, ResourceConfig> = {
  products: {
    label: "Products",
    singular: "Product",
    titleKey: "title",
    fields: [
      { key: "title", label: "Title", localized: true, required: true },
      { key: "description", label: "Description", localized: true, type: "textarea" },
      { key: "slug", label: "Slug" },
      { key: "image", label: "Image URL" },
      { key: "category", label: "Category" },
      { key: "featured", label: "Featured", type: "boolean" },
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
      { key: "coverImage", label: "Cover Image URL" },
      { key: "gallery", label: "Gallery URLs (JSON array)", type: "json" },
      { key: "category", label: "Category" },
      { key: "subcategory", label: "Subcategory" },
      { key: "style", label: "Style" },
      { key: "color", label: "Color" },
      { key: "material", label: "Material" },
      { key: "finish", label: "Finish" },
      { key: "featured", label: "Featured", type: "boolean" },
      { key: "interiorCatalog", label: "Show in Interior Catalogue", type: "boolean" },
      { key: "isNew", label: "New", type: "boolean" },
      { key: "price", label: "Price", type: "number" },
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
      { key: "readTime", label: "Read Time", localized: true },
      { key: "author.name", label: "Author Name", localized: true },
      { key: "date", label: "Date" },
      { key: "author.avatar", label: "Author Avatar URL" },
      { key: "image", label: "Cover Image URL" },
      { key: "views", label: "Views", type: "number" },
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
      { key: "image", label: "Image URL" },
      { key: "order", label: "Order", type: "number" },
    ],
  },
  catalogues: {
    label: "Catalogues",
    singular: "Catalogue",
    titleKey: "title",
    fields: [
      { key: "title", label: "Title", localized: true, required: true },
      { key: "coverImage", label: "Cover Image URL" },
      { key: "downloadUrl", label: "Download URL" },
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
      { key: "image", label: "Image URL" },
      { key: "gallery", label: "Gallery URLs (JSON array)", type: "json" },
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
      { key: "image", label: "Image URL" },
      { key: "teamType", label: "Team Type (Italian / Headquarter)" },
      { key: "order", label: "Order", type: "number" },
    ],
  },
  partners: {
    label: "Partners",
    singular: "Partner",
    titleKey: "name",
    fields: [
      { key: "name", label: "Name", localized: true, required: true },
      { key: "logo", label: "Logo URL" },
      { key: "website", label: "Website" },
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
      { key: "image", label: "Image URL" },
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAdminKey(getStoredVarsoviaAdminKey());
  }, []);

  const save = () => {
    const trimmed = adminKey.trim();
    if (!trimmed) {
      toast.error("Enter a valid Admin Key");
      return;
    }
    setSaving(true);
    try {
      setStoredVarsoviaAdminKey(trimmed);
      toast.success("Admin Key saved");
    } finally {
      setSaving(false);
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
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1A2332] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? "Saving…" : "Save Admin Key"}
        </button>
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
    setForm(normalizeRecord(item));
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

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">{config.label}</h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            Manage English, Thai and Polish content in Varsovia API.
          </p>
        </div>
        <button
          onClick={() => open()}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1A2332] px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus size={16} /> Add {config.singular}
        </button>
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
                        onChange={(value) => updateField(field, value)}
                      />
                    );
                  }

                  const raw = getAtPath(form, field.key);
                  const value =
                    field.type === "json"
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
    </section>
  );
}

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const wide = field.type === "textarea" || field.type === "json";
  return (
    <label className={wide ? "md:col-span-2" : ""}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#5C6370]">
        {field.label}
        {field.required ? " *" : ""}
      </span>
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
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-[#F7F8FA] text-xs uppercase text-[#6B7280]">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EAED]">
              {items.map((item) => (
                <tr key={item._id}>
                  <td className="px-4 py-4 font-semibold">
                    {String(item.name || "—")}
                  </td>
                  <td className="px-4 py-4">
                    <p>{String(item.email || "—")}</p>
                    <p className="text-[#6B7280]">
                      {String(item.phone || item.whatsapp || "—")}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    {String(item.projectType || "—")}
                  </td>
                  <td className="max-w-xs px-4 py-4">
                    {String(item.message || "—")}
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
