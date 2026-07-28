"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth } from "@/lib/AdminAuthContext";
import {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct,
  type ProductItem,
} from "@/services/adminAPI";
import MediaUpload from "@/components/MediaUpload";

type FeatureHighlight = { title: string; description: string };

const empty = {
  title: "",
  slug: "",
  subtitle: "",
  productType: "",
  sectionTag: "",
  description: "",
  image: "/products/Kitchen2.png",
  icon: "",
  gallery1: "",
  gallery2: "",
  pdfUrl: "",
  category: "",
  feature1Title: "",
  feature1Description: "",
  feature2Title: "",
  feature2Description: "",
  feature3Title: "",
  feature3Description: "",
  featured: false,
};

export default function AdminProductsPage() {
  const { siteId } = useAdminAuth();
  const [items, setItems] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<ProductItem | null>(null);
  const [form, setForm] = useState(empty);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All categories");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listProducts(siteId);
      setItems(res.items || []);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setForm(empty);
    setEditing(null);
    setStep(1);
    setModal("create");
  };

  const openEdit = (item: ProductItem) => {
    const highlights = item.featureHighlights || [];
    const gallery = item.gallery || [];
    setEditing(item);
    setForm({
      title: item.title,
      slug: item.slug,
      subtitle: item.subtitle || "",
      productType: item.productType || "",
      sectionTag: item.sectionTag || "",
      description: item.description,
      image: item.image,
      icon: item.icon || "",
      gallery1: gallery[0] || "",
      gallery2: gallery[1] || "",
      pdfUrl: item.pdfUrl || "",
      category: item.category,
      feature1Title: highlights[0]?.title || "",
      feature1Description: highlights[0]?.description || "",
      feature2Title: highlights[1]?.title || "",
      feature2Description: highlights[1]?.description || "",
      feature3Title: highlights[2]?.title || "",
      feature3Description: highlights[2]?.description || "",
      featured: item.featured,
    });
    setStep(1);
    setModal("edit");
  };

  const closeModal = () => {
    setModal(null);
    setStep(1);
  };

  const validateStep = (target: 1 | 2 | 3) => {
    if (target === 2) {
      if (!form.title.trim() || !form.subtitle.trim() || !form.productType.trim() || !form.category.trim()) {
        toast.error("Please fill all required fields in Product Identity");
        return false;
      }
    }
    if (target === 3) {
      if (!form.sectionTag.trim() || !form.description.trim()) {
        toast.error("Please complete Overview Section before next step");
        return false;
      }
    }
    return true;
  };

  const onNext = () => {
    if (step === 1 && validateStep(2)) setStep(2);
    else if (step === 2 && validateStep(3)) setStep(3);
  };

  const onBack = () => {
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateStep(2) || !validateStep(3)) return;

    const featureHighlights: FeatureHighlight[] = [
      { title: form.feature1Title.trim(), description: form.feature1Description.trim() },
      { title: form.feature2Title.trim(), description: form.feature2Description.trim() },
      { title: form.feature3Title.trim(), description: form.feature3Description.trim() },
    ].filter((f) => f.title || f.description);

    const payload = {
      title: form.title,
      slug: form.slug,
      subtitle: form.subtitle,
      productType: form.productType,
      sectionTag: form.sectionTag,
      description: form.description,
      image: form.image,
      icon: form.icon,
      gallery: [form.gallery1, form.gallery2].map((s) => s.trim()).filter(Boolean),
      pdfUrl: form.pdfUrl,
      featureHighlights,
      category: form.category,
      featured: form.featured,
    };
    try {
      if (modal === "create") {
        await createProduct(siteId, payload);
        toast.success("Product created");
      } else if (editing) {
        await updateProduct(siteId, editing._id, payload);
        toast.success("Product updated");
      }
      closeModal();
      await load();
    } catch {
      toast.error("Save failed");
    }
  };

  const onDelete = async (item: ProductItem) => {
    if (!confirm(`Delete "${item.title}"?`)) return;
    try {
      await deleteProduct(siteId, item._id);
      toast.success("Deleted");
      await load();
    } catch {
      toast.error("Delete failed");
    }
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      if (item.category?.trim()) set.add(item.category.trim());
    }
    return ["All categories", ...Array.from(set)];
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q) ||
        (item.subtitle || "").toLowerCase().includes(q) ||
        (item.productType || "").toLowerCase().includes(q);
      const matchesCategory =
        categoryFilter === "All categories" || item.category === categoryFilter;
      return matchesQuery && matchesCategory;
    });
  }, [items, query, categoryFilter]);

  return (
    <AdminShell title="Product Inventory">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-[270px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search product inventory..."
              className="h-11 w-full rounded-xl border border-[#E2E5EA] bg-white pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#1A2332]/15"
            />
          </div>
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-11 min-w-[170px] appearance-none rounded-xl border border-[#E2E5EA] bg-white px-4 pr-9 text-sm outline-none focus:ring-2 focus:ring-[#1A2332]/15"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
          </div>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#1A2332] text-white text-sm font-semibold px-4"
        >
          <Plus className="w-4 h-4" />
          Create Product
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-[#6B7280]">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {filteredItems.length === 0 ? (
            <div className="col-span-full rounded-xl border border-[#E8EAED] bg-white p-10 text-center text-[#6B7280]">
              No products found.
            </div>
          ) : (
            filteredItems.map((item) => (
              <article
                key={item._id}
                className="overflow-hidden rounded-2xl border border-[#E8EAED] bg-white"
              >
                <div className="relative h-40 w-full bg-[#F3F4F6]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image || "/products/Kitchen1.png"}
                    alt={item.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const el = e.currentTarget;
                      if (el.dataset.fallback === "1") return;
                      el.dataset.fallback = "1";
                      el.src = "/products/Kitchen1.png";
                    }}
                  />
                  <span className="absolute left-2 top-2 rounded-md bg-white px-2 py-1 text-[10px] font-semibold text-[#475569]">
                    {item.category || "Kitchen Layouts"}
                  </span>
                </div>
                <div className="space-y-2 p-4">
                  <h3 className="line-clamp-2 text-base font-semibold text-[#1A2332]">
                    {item.title}
                  </h3>
                  <p className="line-clamp-1 text-sm text-[#64748B]">
                    {item.subtitle || item.productType || "—"}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#EEF2F7] px-2 py-0.5 text-xs text-[#475569]">
                      {item.productType || "—"}
                    </span>
                    <span className="text-[11px] text-[#9CA3AF]">Updated recently</span>
                  </div>
                  <p className="line-clamp-2 text-xs text-[#475569]">{item.description || "—"}</p>
                  <div className="flex justify-end gap-1 pt-1">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="inline-flex rounded-lg p-2 text-[#1A2332] hover:bg-[#F3F4F6]"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item)}
                      className="inline-flex rounded-lg p-2 text-[#DC2626] hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={onSubmit}
            className="w-full max-w-5xl bg-white rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-lg">
                {modal === "create" ? "Add Product" : "Edit Product"}
              </h3>
              <button type="button" onClick={closeModal}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                ["1. Product Identity", "Basic details & main gallery"],
                ["2. Overview Section", "Overview header & description"],
                ["3. Features & Details", "Highlight features & images"],
              ].map(([title, sub], i) => {
                const n = (i + 1) as 1 | 2 | 3;
                const active = step === n;
                const done = step > n;
                return (
                  <div
                    key={title}
                    className={`rounded-lg border px-3 py-2 ${active ? "border-[#1A2332] bg-[#F8FAFC]" : done ? "border-emerald-200 bg-emerald-50" : "border-[#E2E5EA]"}`}
                  >
                    <p className={`font-semibold ${active ? "text-[#1A2332]" : done ? "text-emerald-700" : "text-[#6B7280]"}`}>
                      {title}
                    </p>
                    <p className="text-[11px] text-[#9CA3AF]">{sub}</p>
                    {done ? <CheckCircle2 className="mt-1 h-3.5 w-3.5 text-emerald-600" /> : null}
                  </div>
                );
              })}
            </div>

            {step === 1 ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-[#E8EAED] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#334155]">Basic Identity</p>
                  <p className="text-[11px] text-[#94A3B8]">Core title and subtitle for this kitchen model</p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <label className="block text-xs font-semibold text-[#5C6370]">
                      Product Name *
                      <input
                        required
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        className="mt-1.5 w-full rounded-lg border border-[#E2E5EA] px-3 py-2.5 text-sm font-normal"
                      />
                    </label>
                    <label className="block text-xs font-semibold text-[#5C6370]">
                      Subtitle / Tagline *
                      <input
                        required
                        value={form.subtitle}
                        onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                        className="mt-1.5 w-full rounded-lg border border-[#E2E5EA] px-3 py-2.5 text-sm font-normal"
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-xl border border-[#E8EAED] p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#334155]">Classification & Category</p>
                  <p className="text-[11px] text-[#94A3B8]">Assign model type and store category</p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <label className="block text-xs font-semibold text-[#5C6370]">
                      Product Type *
                      <input
                        required
                        value={form.productType}
                        onChange={(e) => setForm({ ...form, productType: e.target.value })}
                        placeholder="e.g. U Shape, L Shape"
                        className="mt-1.5 w-full rounded-lg border border-[#E2E5EA] px-3 py-2.5 text-sm font-normal"
                      />
                    </label>
                    <label className="block text-xs font-semibold text-[#5C6370]">
                      Category *
                      <input
                        required
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="mt-1.5 w-full rounded-lg border border-[#E2E5EA] px-3 py-2.5 text-sm font-normal"
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-xs font-semibold text-[#5C6370]">
                    Slug (optional)
                    <input
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-[#E2E5EA] px-3 py-2.5 text-sm font-normal"
                    />
                  </label>
                  <div />
                </div>

                <MediaUpload
                  label="Main Product Image *"
                  kind="image"
                  value={form.image}
                  onChange={(v) => setForm({ ...form, image: v })}
                />
                <MediaUpload
                  label="Icon (optional)"
                  kind="icon"
                  value={form.icon}
                  onChange={(v) => setForm({ ...form, icon: v })}
                />
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-[#5C6370]">
                  Section Subhead / Series Tag *
                  <input
                    required
                    value={form.sectionTag}
                    onChange={(e) => setForm({ ...form, sectionTag: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-[#E2E5EA] px-3 py-2.5 text-sm font-normal"
                  />
                </label>
                <label className="block text-xs font-semibold text-[#5C6370]">
                  Detailed Description *
                  <textarea
                    required
                    rows={5}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-[#E2E5EA] px-3 py-2.5 text-sm font-normal"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  />
                  Featured product
                </label>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="rounded-xl border border-[#E8EAED] p-3">
                    <p className="text-xs font-semibold text-[#1A2332] mb-2">Feature Highlight 0{n}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block text-xs font-semibold text-[#5C6370]">
                        Title *
                        <input
                          required
                          value={form[`feature${n}Title` as keyof typeof form] as string}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              [`feature${n}Title`]: e.target.value,
                            } as typeof form)
                          }
                          className="mt-1.5 w-full rounded-lg border border-[#E2E5EA] px-3 py-2.5 text-sm font-normal"
                        />
                      </label>
                      <label className="block text-xs font-semibold text-[#5C6370]">
                        Description *
                        <input
                          required
                          value={form[`feature${n}Description` as keyof typeof form] as string}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              [`feature${n}Description`]: e.target.value,
                            } as typeof form)
                          }
                          className="mt-1.5 w-full rounded-lg border border-[#E2E5EA] px-3 py-2.5 text-sm font-normal"
                        />
                      </label>
                    </div>
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-3">
                  <MediaUpload
                    label="Feature Gallery Image 01"
                    kind="image"
                    value={form.gallery1}
                    onChange={(v) => setForm({ ...form, gallery1: v })}
                  />
                  <MediaUpload
                    label="Feature Gallery Image 02"
                    kind="image"
                    value={form.gallery2}
                    onChange={(v) => setForm({ ...form, gallery2: v })}
                  />
                </div>

                <MediaUpload
                  label="Product PDF (optional)"
                  kind="pdf"
                  value={form.pdfUrl}
                  onChange={(v) => setForm({ ...form, pdfUrl: v })}
                />
              </div>
            ) : null}

            <div className="flex justify-end gap-2 pt-2">
              {step === 1 ? (
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border px-4 py-2 text-sm"
                >
                  Cancel
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center gap-1 rounded-lg border px-4 py-2 text-sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={onNext}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#1A2332] text-white px-4 py-2 text-sm font-semibold"
                >
                  Next Step
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="rounded-lg bg-[#1A2332] text-white px-4 py-2 text-sm font-semibold"
                >
                  {modal === "create" ? "Create Product" : "Edit Product"}
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </AdminShell>
  );
}
