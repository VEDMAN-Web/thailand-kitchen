"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import AdminShell from "@/components/AdminShell";
import MediaUpload from "@/components/MediaUpload";
import { useAdminAuth } from "@/lib/AdminAuthContext";
import {
  createBlog,
  deleteBlog,
  listBlogs,
  updateBlog,
  type BlogBodySection,
  type BlogItem,
} from "@/services/adminAPI";

type FormState = {
  title: string;
  slug: string;
  category: string;
  readTime: string;
  author: string;
  publishDate: string;
  excerpt: string;
  image: string;
  bodySections: BlogBodySection[];
  highlightTitle: string;
  highlightText: string;
  quote: string;
  quoteAuthor: string;
  gallery1: string;
  gallery2: string;
  published: boolean;
};

const emptyForm = (): FormState => ({
  title: "",
  slug: "",
  category: "",
  readTime: "3",
  author: "Admin",
  publishDate: new Date().toISOString().slice(0, 10),
  excerpt: "",
  image: "",
  bodySections: [{ title: "", content: "", image: "" }],
  highlightTitle: "",
  highlightText: "",
  quote: "",
  quoteAuthor: "",
  gallery1: "",
  gallery2: "",
  published: true,
});

function formatDateLabel(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

export default function AdminBlogsPage() {
  const { siteId } = useAdminAuth();
  const [items, setItems] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All types");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<BlogItem | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listBlogs(siteId);
      setItems(res.items || []);
    } catch {
      toast.error("Failed to load blogs");
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    load();
  }, [load]);

  const types = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      if (item.category?.trim()) set.add(item.category.trim());
    }
    return ["All types", ...Array.from(set)];
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        (item.category || "").toLowerCase().includes(q) ||
        (item.author || "").toLowerCase().includes(q) ||
        (item.excerpt || "").toLowerCase().includes(q);
      const matchesType =
        typeFilter === "All types" || item.category === typeFilter;
      return matchesQuery && matchesType;
    });
  }, [items, query, typeFilter]);

  const openCreate = () => {
    setForm(emptyForm());
    setEditing(null);
    setStep(1);
    setModal("create");
  };

  const openEdit = (item: BlogItem) => {
    const gallery = item.gallery || [];
    const sections =
      item.bodySections && item.bodySections.length
        ? item.bodySections
        : [{ title: "", content: item.content || "", image: "" }];
    setEditing(item);
    setForm({
      title: item.title || "",
      slug: item.slug || "",
      category: item.category || "",
      readTime: (item.readTime || "5").replace(/\s*min.*/i, "") || "5",
      author: item.author || "Admin",
      publishDate:
        item.publishDate ||
        (item.createdAt ? item.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10)),
      excerpt: item.excerpt || "",
      image: item.image || "",
      bodySections: sections.map((s) => ({
        title: s.title || "",
        content: s.content || "",
        image: s.image || "",
      })),
      highlightTitle: item.highlightTitle || "",
      highlightText: item.highlightText || "",
      quote: item.quote || "",
      quoteAuthor: item.quoteAuthor || "",
      gallery1: gallery[0] || "",
      gallery2: gallery[1] || "",
      published: item.published !== false,
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
      if (
        !form.title.trim() ||
        !form.category.trim() ||
        !form.readTime.trim() ||
        !form.author.trim() ||
        !form.publishDate.trim() ||
        !form.excerpt.trim()
      ) {
        toast.error("Please complete all required Header & Cover fields");
        return false;
      }
    }
    if (target === 3) {
      const hasSection = form.bodySections.some(
        (s) => s.title.trim() || s.content.trim()
      );
      if (!hasSection) {
        toast.error("Add at least one body section");
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

  const updateSection = (
    index: number,
    key: keyof BlogBodySection,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      bodySections: prev.bodySections.map((s, i) =>
        i === index ? { ...s, [key]: value } : s
      ),
    }));
  };

  const addSection = () => {
    setForm((prev) => ({
      ...prev,
      bodySections: [...prev.bodySections, { title: "", content: "", image: "" }],
    }));
  };

  const removeSection = (index: number) => {
    setForm((prev) => ({
      ...prev,
      bodySections: prev.bodySections.filter((_, i) => i !== index),
    }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateStep(2) || !validateStep(3)) return;

    const bodySections = form.bodySections
      .map((s) => ({
        title: s.title.trim(),
        content: s.content.trim(),
        image: (s.image || "").trim(),
      }))
      .filter((s) => s.title || s.content || s.image);

    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      category: form.category.trim(),
      readTime: `${form.readTime.trim()} min`,
      author: form.author.trim(),
      publishDate: form.publishDate.trim(),
      excerpt: form.excerpt.trim(),
      image: form.image.trim(),
      bodySections,
      highlightTitle: form.highlightTitle.trim(),
      highlightText: form.highlightText.trim(),
      quote: form.quote.trim(),
      quoteAuthor: form.quoteAuthor.trim(),
      gallery: [form.gallery1, form.gallery2].map((s) => s.trim()).filter(Boolean),
      published: form.published,
    };

    try {
      if (modal === "create") {
        await createBlog(siteId, payload);
        toast.success("Blog created");
      } else if (editing) {
        await updateBlog(siteId, editing._id, payload);
        toast.success("Blog updated");
      }
      closeModal();
      await load();
    } catch {
      toast.error("Save failed");
    }
  };

  const onDelete = async (item: BlogItem) => {
    if (!confirm(`Delete "${item.title}"?`)) return;
    try {
      await deleteBlog(siteId, item._id);
      toast.success("Deleted");
      await load();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <AdminShell title="Blog Content Manager">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-[320px] max-w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search blogs by title, type, or author..."
                className="h-11 w-full rounded-xl border border-[#E2E5EA] bg-white pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#1A2332]/15"
              />
            </div>
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-11 min-w-[140px] appearance-none rounded-xl border border-[#E2E5EA] bg-white px-4 pr-9 text-sm outline-none"
              >
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
            </div>
            <div className="inline-flex rounded-xl border border-[#E2E5EA] bg-white p-1">
              <button
                type="button"
                onClick={() => setView("grid")}
                className={`rounded-lg p-2 ${view === "grid" ? "bg-[#EEF0F3]" : ""}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className={`rounded-lg p-2 ${view === "list" ? "bg-[#EEF0F3]" : ""}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#1A2332] text-white text-sm font-semibold px-4"
          >
            <Plus className="w-4 h-4" />
            Create Blog
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-[#6B7280]">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-white p-10 text-center text-sm text-[#6B7280]">
            No blog posts found.
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <article
                key={item._id}
                className="overflow-hidden rounded-2xl border border-[#E8EAED] bg-white"
              >
                <div className="relative h-44 bg-[#F3F4F6]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image || "/blog/blogImage (1).jpg"}
                    alt={item.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const el = e.currentTarget;
                      if (el.dataset.fallback === "1") return;
                      el.dataset.fallback = "1";
                      el.src = "/blog/blogImage (1).jpg";
                    }}
                  />
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="rounded-full bg-[#2563EB] p-2 text-white shadow"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item)}
                      className="rounded-full bg-[#DC2626] p-2 text-white shadow"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="absolute bottom-2 left-2 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#475569]">
                    {item.category || "Journal"}
                  </span>
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex items-center gap-3 text-[11px] text-[#6B7280]">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDateLabel(item.publishDate || item.createdAt)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      {item.readTime || "5 min"}
                    </span>
                  </div>
                  <h3 className="line-clamp-2 text-base font-bold text-[#1A2332]">
                    {item.title}
                  </h3>
                  <p className="line-clamp-2 text-sm text-[#6B7280]">
                    {item.excerpt || "—"}
                  </p>
                  <p className="pt-1 text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">
                    By {item.author || "Admin"}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <article
                key={item._id}
                className="flex gap-4 rounded-xl border border-[#E8EAED] bg-white p-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image || "/blog/blogImage (1).jpg"}
                  alt={item.title}
                  className="h-20 w-28 rounded-lg object-cover bg-[#F3F4F6]"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-[#1A2332] line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#6B7280] mt-1">
                    {item.category || "Journal"} · {item.readTime || "5 min"} · By{" "}
                    {item.author || "Admin"}
                  </p>
                  <p className="text-sm text-[#6B7280] mt-1 line-clamp-1">
                    {item.excerpt}
                  </p>
                </div>
                <div className="flex shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="p-2 rounded-lg hover:bg-[#F3F4F6]"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item)}
                    className="p-2 rounded-lg text-[#DC2626] hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={onSubmit}
            className="w-full max-w-4xl bg-white rounded-2xl p-6 space-y-4 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">
                {modal === "create"
                  ? "Create New Blog Article"
                  : "Edit Blog Article"}
              </h3>
              <button type="button" onClick={closeModal}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                ["1. Header & Cover", "Title, author, read time & cover photo"],
                ["2. Body Sections", "Article headings, content & section images"],
                ["3. Highlight & Quote", "Featured highlight, quote & 2 images"],
              ].map(([title, sub], i) => {
                const n = (i + 1) as 1 | 2 | 3;
                const active = step === n;
                const done = step > n;
                return (
                  <div
                    key={title}
                    className={`rounded-lg border px-3 py-2 ${
                      active
                        ? "border-[#1A2332] bg-[#F8FAFC]"
                        : done
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-[#E2E5EA]"
                    }`}
                  >
                    <p
                      className={`font-semibold ${
                        active
                          ? "text-[#1A2332]"
                          : done
                            ? "text-emerald-700"
                            : "text-[#6B7280]"
                      }`}
                    >
                      {title}
                    </p>
                    <p className="text-[11px] text-[#9CA3AF]">{sub}</p>
                    {done ? (
                      <CheckCircle2 className="mt-1 h-3.5 w-3.5 text-emerald-600" />
                    ) : null}
                  </div>
                );
              })}
            </div>

            {step === 1 ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-[#E8EAED] p-4 space-y-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-[#334155]">
                      Article Header & Metadata
                    </p>
                    <p className="text-[11px] text-[#94A3B8]">
                      Renders at the top of the blog article detail page.
                    </p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <label className="block text-xs font-semibold text-[#5C6370]">
                      Article Title *
                      <input
                        required
                        value={form.title}
                        onChange={(e) =>
                          setForm({ ...form, title: e.target.value })
                        }
                        placeholder="e.g. Designing Modern Luxury Kitchen Islands"
                        className="mt-1.5 w-full rounded-lg border border-[#E2E5EA] px-3 py-2.5 text-sm font-normal"
                      />
                    </label>
                    <label className="block text-xs font-semibold text-[#5C6370]">
                      Category / Article Type *
                      <input
                        required
                        value={form.category}
                        onChange={(e) =>
                          setForm({ ...form, category: e.target.value })
                        }
                        placeholder="e.g. Design Trends, Kitchen Architecture"
                        className="mt-1.5 w-full rounded-lg border border-[#E2E5EA] px-3 py-2.5 text-sm font-normal"
                      />
                    </label>
                  </div>
                  <div className="grid md:grid-cols-3 gap-3">
                    <label className="block text-xs font-semibold text-[#5C6370]">
                      Minutes to Read *
                      <input
                        required
                        value={form.readTime}
                        onChange={(e) =>
                          setForm({ ...form, readTime: e.target.value })
                        }
                        className="mt-1.5 w-full rounded-lg border border-[#E2E5EA] px-3 py-2.5 text-sm font-normal"
                      />
                    </label>
                    <label className="block text-xs font-semibold text-[#5C6370]">
                      Author Name *
                      <input
                        required
                        value={form.author}
                        onChange={(e) =>
                          setForm({ ...form, author: e.target.value })
                        }
                        className="mt-1.5 w-full rounded-lg border border-[#E2E5EA] px-3 py-2.5 text-sm font-normal"
                      />
                    </label>
                    <label className="block text-xs font-semibold text-[#5C6370]">
                      Publish Date *
                      <input
                        required
                        type="date"
                        value={form.publishDate}
                        onChange={(e) =>
                          setForm({ ...form, publishDate: e.target.value })
                        }
                        className="mt-1.5 w-full rounded-lg border border-[#E2E5EA] px-3 py-2.5 text-sm font-normal"
                      />
                    </label>
                  </div>
                  <label className="block text-xs font-semibold text-[#5C6370]">
                    Article Summary / Lead Excerpt *
                    <textarea
                      required
                      rows={4}
                      value={form.excerpt}
                      onChange={(e) =>
                        setForm({ ...form, excerpt: e.target.value })
                      }
                      placeholder="Write a compelling lead paragraph/summary rendered under the title..."
                      className="mt-1.5 w-full rounded-lg border border-[#E2E5EA] px-3 py-2.5 text-sm font-normal"
                    />
                  </label>
                </div>

                <div className="rounded-xl border border-[#E8EAED] p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-[#334155]">
                        Main Featured Cover Photo
                      </p>
                      <p className="text-[11px] text-[#94A3B8]">
                        Large widescreen cover photo rendered below the header on
                        the blog detail page.
                      </p>
                    </div>
                    <span className="rounded-full bg-[#E0F2FE] px-2.5 py-1 text-[10px] font-semibold text-[#0369A1]">
                      1 High-Res Cover Image
                    </span>
                  </div>
                  <MediaUpload
                    label="Upload 1 Widescreen Cover Image"
                    kind="image"
                    value={form.image}
                    onChange={(v) => setForm({ ...form, image: v })}
                    hint="PNG, JPG, JPEG, GIF, WEBP (Max 10MB)"
                  />
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#1A2332]">
                      Body Sections
                    </p>
                    <p className="text-xs text-[#6B7280]">
                      Add headings, paragraphs and optional section images.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addSection}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#1A2332] text-white text-sm font-semibold px-3 py-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Section
                  </button>
                </div>
                {form.bodySections.map((section, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-[#E8EAED] p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-[#334155]">
                        SECTION #{index + 1}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeSection(index)}
                        className="text-xs font-semibold text-[#DC2626]"
                      >
                        Remove
                      </button>
                    </div>
                    <label className="block text-xs font-semibold text-[#5C6370]">
                      Section Heading
                      <input
                        value={section.title}
                        onChange={(e) =>
                          updateSection(index, "title", e.target.value)
                        }
                        className="mt-1.5 w-full rounded-lg border border-[#E2E5EA] px-3 py-2.5 text-sm font-normal"
                      />
                    </label>
                    <label className="block text-xs font-semibold text-[#5C6370]">
                      Section Content
                      <textarea
                        rows={4}
                        value={section.content}
                        onChange={(e) =>
                          updateSection(index, "content", e.target.value)
                        }
                        className="mt-1.5 w-full rounded-lg border border-[#E2E5EA] px-3 py-2.5 text-sm font-normal"
                      />
                    </label>
                    <MediaUpload
                      label="Section Image (optional)"
                      kind="image"
                      value={section.image || ""}
                      onChange={(v) => updateSection(index, "image", v)}
                    />
                  </div>
                ))}
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-[#E8EAED] p-4 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#334155]">
                    Featured Highlight
                  </p>
                  <label className="block text-xs font-semibold text-[#5C6370]">
                    Highlight Title
                    <input
                      value={form.highlightTitle}
                      onChange={(e) =>
                        setForm({ ...form, highlightTitle: e.target.value })
                      }
                      className="mt-1.5 w-full rounded-lg border border-[#E2E5EA] px-3 py-2.5 text-sm font-normal"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-[#5C6370]">
                    Highlight Text
                    <textarea
                      rows={3}
                      value={form.highlightText}
                      onChange={(e) =>
                        setForm({ ...form, highlightText: e.target.value })
                      }
                      className="mt-1.5 w-full rounded-lg border border-[#E2E5EA] px-3 py-2.5 text-sm font-normal"
                    />
                  </label>
                </div>

                <div className="rounded-xl border border-[#E8EAED] p-4 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#334155]">
                    Quote Block
                  </p>
                  <label className="block text-xs font-semibold text-[#5C6370]">
                    Quote
                    <textarea
                      rows={3}
                      value={form.quote}
                      onChange={(e) =>
                        setForm({ ...form, quote: e.target.value })
                      }
                      className="mt-1.5 w-full rounded-lg border border-[#E2E5EA] px-3 py-2.5 text-sm font-normal"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-[#5C6370]">
                    Quote Author
                    <input
                      value={form.quoteAuthor}
                      onChange={(e) =>
                        setForm({ ...form, quoteAuthor: e.target.value })
                      }
                      className="mt-1.5 w-full rounded-lg border border-[#E2E5EA] px-3 py-2.5 text-sm font-normal"
                    />
                  </label>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <MediaUpload
                    label="Highlight Image 01"
                    kind="image"
                    value={form.gallery1}
                    onChange={(v) => setForm({ ...form, gallery1: v })}
                  />
                  <MediaUpload
                    label="Highlight Image 02"
                    kind="image"
                    value={form.gallery2}
                    onChange={(v) => setForm({ ...form, gallery2: v })}
                  />
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(e) =>
                      setForm({ ...form, published: e.target.checked })
                    }
                  />
                  Published
                </label>
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-2 pt-2">
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

              <div className="flex items-center gap-3">
                <span className="text-xs text-[#6B7280]">Step {step} of 3</span>
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
                    {modal === "create" ? "Create Blog" : "Save Blog"}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      )}
    </AdminShell>
  );
}
