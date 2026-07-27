"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import AdminShell from "@/components/AdminShell";
import {
  deleteContact,
  listContacts,
  type ContactLead,
} from "@/services/adminAPI";

export default function AdminContactsPage() {
  const [items, setItems] = useState<ContactLead[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listContacts();
      setItems(res.data || []);
    } catch {
      toast.error("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onDelete = async (item: ContactLead) => {
    if (!confirm(`Delete enquiry from "${item.fullName}"?`)) return;
    try {
      await deleteContact(item._id);
      toast.success("Deleted");
      await load();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <AdminShell title="Contact Enquiries">
      <div className="bg-white rounded-xl border border-[#E8EAED] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E8EAED] flex items-center justify-between">
          <p className="text-sm text-[#6B7280]">
            {loading ? "Loading…" : `${items.length} enquiries`}
          </p>
          <button
            type="button"
            onClick={load}
            className="text-sm font-semibold text-[#1A2332] hover:underline"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="p-8 text-sm text-[#6B7280]">Loading contacts…</p>
        ) : items.length === 0 ? (
          <p className="p-8 text-sm text-[#6B7280]">No enquiries yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8F9FB] text-left text-xs uppercase tracking-wide text-[#6B7280]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Message</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id} className="border-t border-[#EEF0F3]">
                    <td className="px-4 py-3 font-medium text-[#1A1D26]">
                      {item.fullName}
                    </td>
                    <td className="px-4 py-3 text-[#4B5563]">{item.email}</td>
                    <td className="px-4 py-3 text-[#4B5563]">
                      {item.phoneNumber || item.whatsappNumber}
                    </td>
                    <td className="px-4 py-3 text-[#4B5563] max-w-xs truncate">
                      {item.message}
                    </td>
                    <td className="px-4 py-3 text-[#6B7280] whitespace-nowrap">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className="p-2 rounded-lg text-[#E11D48] hover:bg-red-50"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
