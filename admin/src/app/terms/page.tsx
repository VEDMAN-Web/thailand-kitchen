"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import AdminShell from "@/components/AdminShell";
import { useAdminAuth } from "@/lib/AdminAuthContext";
import { getLegal, updateLegal } from "@/services/adminAPI";

export default function AdminTermsPage() {
  const { siteId } = useAdminAuth();
  const [pageTitle, setPageTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLegal(siteId, "terms");
      setPageTitle(res.page.title);
      setContent(res.page.content);
    } catch {
      toast.error("Failed to load page");
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    load();
  }, [load]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateLegal(siteId, "terms", { title: pageTitle, content });
      toast.success("Saved");
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell title="Terms & Conditions">
      {loading ? (
        <p className="text-sm text-[#6B7280]">Loading…</p>
      ) : (
        <form
          onSubmit={onSubmit}
          className="bg-white rounded-xl border border-[#E8EAED] p-6 space-y-4 max-w-3xl"
        >
          <label className="block text-xs font-semibold text-[#5C6370]">
            Page Title
            <input
              required
              value={pageTitle}
              onChange={(e) => setPageTitle(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[#E2E5EA] px-3 py-2.5 text-sm font-normal"
            />
          </label>
          <label className="block text-xs font-semibold text-[#5C6370]">
            Content
            <textarea
              required
              rows={16}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[#E2E5EA] px-3 py-2.5 text-sm font-normal"
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1A2332] text-white text-sm font-semibold px-4 py-2.5 disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save Page"}
          </button>
        </form>
      )}
    </AdminShell>
  );
}
