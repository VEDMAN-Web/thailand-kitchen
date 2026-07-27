"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
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

const empty = {
  title: "",
  slug: "",
  description: "",
  image: "/products/Kitchen2.png",
  category: "",
  featured: false,
};

export default function AdminProductsPage() {
  const { siteId } = useAdminAuth();
  const [items, setItems] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<ProductItem | null>(null);
  const [form, setForm] = useState(empty);

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
    setModal("create");
  };

  const openEdit = (item: ProductItem) => {
    setEditing(item);
    setForm({
      title: item.title,
      slug: item.slug,
      description: item.description,
      image: item.image,
      category: item.category,
      featured: item.featured,
    });
    setModal("edit");
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (modal === "create") {
        await createProduct(siteId, form);
        toast.success("Product created");
      } else if (editing) {
        await updateProduct(siteId, editing._id, form);
        toast.success("Product updated");
      }
      setModal(null);
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

  return (
    <AdminShell title="Product Management">
      <div className="flex justify-end mb-6">
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1A2332] text-white text-sm font-semibold px-4 py-2.5"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-[#6B7280]">Loading…</p>
      ) : (
        <div className="bg-white rounded-xl border border-[#E8EAED] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F9FAFB] text-left text-xs uppercase tracking-wide text-[#6B7280]">
              <tr>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Featured</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F1F3]">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-[#6B7280]">
                    No products yet.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item._id} className="hover:bg-[#FAFBFC]">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#1A2332]">{item.title}</p>
                      <p className="text-xs text-[#9CA3AF]">/{item.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-[#5C6370]">{item.category || "—"}</td>
                    <td className="px-4 py-3">
                      {item.featured ? (
                        <span className="text-xs font-semibold text-[#166534] bg-[#DCFCE7] px-2 py-0.5 rounded-full">
                          Yes
                        </span>
                      ) : (
                        <span className="text-xs text-[#9CA3AF]">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="inline-flex p-2 text-[#1A2332] hover:bg-[#F3F4F6] rounded-lg"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className="inline-flex p-2 text-[#DC2626] hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
                {modal === "create" ? "Add Product" : "Edit Product"}
              </h3>
              <button type="button" onClick={() => setModal(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            {(
              [
                ["title", "Title"],
                ["slug", "Slug (optional)"],
                ["category", "Category"],
                ["image", "Image path"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block text-xs font-semibold text-[#5C6370]">
                {label}
                <input
                  required={key === "title"}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="mt-1.5 w-full rounded-lg border border-[#E2E5EA] px-3 py-2.5 text-sm font-normal"
                />
              </label>
            ))}
            <label className="block text-xs font-semibold text-[#5C6370]">
              Description
              <textarea
                rows={3}
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
