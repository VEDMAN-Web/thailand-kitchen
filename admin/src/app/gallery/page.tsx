"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Images, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import AdminShell from "@/components/AdminShell";
import MediaUpload from "@/components/MediaUpload";
import { useAdminAuth } from "@/lib/AdminAuthContext";
import {
  createGalleryItem,
  deleteGalleryItem,
  listGallery,
  updateGalleryItem,
  type GalleryCmsItem,
} from "@/services/adminAPI";

const FILTERS = [
  "Layout & Space",
  "Storage",
  "Style & Color",
  "Materials",
] as const;

const empty = {
  title: "",
  image: "",
  filter: "Style & Color",
  tall: false,
  wide: false,
};

export default function AdminGalleryPage() {
  const { siteId } = useAdminAuth();
  const [items, setItems] = useState<GalleryCmsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<GalleryCmsItem | null>(null);
  const [form, setForm] = useState(empty);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listGallery(siteId);
      setItems(res.items || []);
    } catch {
      toast.error("Failed to load gallery");
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
    setModal("create");
  };

  const openEdit = (item: GalleryCmsItem) => {
    setEditing(item);
    setForm({
      title: item.title,
      image: item.image,
      filter: item.filter || "Style & Color",
      tall: Boolean(item.tall),
      wide: Boolean(item.wide),
    });
    setModal("edit");
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.image) {
      toast.error("Please upload an image");
      return;
    }
    try {
      if (modal === "create") {
        await createGalleryItem(siteId, form);
        toast.success("Gallery item created");
      } else if (editing) {
        await updateGalleryItem(siteId, editing._id, form);
        toast.success("Gallery item updated");
      }
      setModal(null);
      await load();
    } catch {
      toast.error("Save failed");
    }
  };

  const onDelete = async (item: GalleryCmsItem) => {
    if (!confirm(`Delete "${item.title}"?`)) return;
    try {
      await deleteGalleryItem(siteId, item._id);
      toast.success("Deleted");
      await load();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <AdminShell title="Gallery Management">
      <div className="flex justify-end mb-6">
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1A2332] text-white text-sm font-semibold px-4 py-2.5"
        >
          <Plus className="w-4 h-4" />
          Add Image
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-[#6B7280]">Loading…</p>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E8EAED] p-10 text-center text-[#6B7280]">
          <Images className="w-8 h-8 mx-auto mb-3 opacity-40" />
          No gallery images yet. Upload from admin to show on the website.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-xl border border-[#E8EAED] overflow-hidden"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image}
                alt={item.title}
                className="h-40 w-full object-cover bg-[#F3F4F6]"
              />
              <div className="p-4">
                <p className="font-semibold text-[#1A2332]">{item.title}</p>
                <p className="text-xs text-[#6B7280] mt-1">{item.filter}</p>
                <div className="flex justify-end gap-1 mt-3">
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
                    className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={onSubmit}
            className="w-full max-w-lg bg-white rounded-2xl p-6 space-y-3 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-lg">
                {modal === "create" ? "Add Gallery Image" : "Edit Gallery Image"}
              </h3>
              <button type="button" onClick={() => setModal(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <label className="block text-xs font-semibold text-[#5C6370]">
              Title
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-[#E2E5EA] px-3 py-2.5 text-sm font-normal"
              />
            </label>
            <label className="block text-xs font-semibold text-[#5C6370]">
              Filter
              <select
                value={form.filter}
                onChange={(e) => setForm({ ...form, filter: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-[#E2E5EA] px-3 py-2.5 text-sm font-normal"
              >
                {FILTERS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
            <MediaUpload
              label="Image"
              kind="image"
              value={form.image}
              onChange={(v) => setForm({ ...form, image: v })}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.tall}
                onChange={(e) => setForm({ ...form, tall: e.target.checked })}
              />
              Tall layout
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.wide}
                onChange={(e) => setForm({ ...form, wide: e.target.checked })}
              />
              Wide layout
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-lg border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#1A2332] text-white px-4 py-2 text-sm font-semibold"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminShell>
  );
}
