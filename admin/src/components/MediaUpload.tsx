"use client";

import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { uploadMedia } from "@/services/adminAPI";

type Kind = "image" | "icon" | "pdf" | "any";

export default function MediaUpload({
  label,
  value,
  onChange,
  kind = "image",
  accept,
  hint,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  kind?: Kind;
  accept?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const defaultAccept =
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
      onChange(res.file.url);
      toast.success("Uploaded");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-[#5C6370] mb-1.5">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={kind === "pdf" ? "PDF URL or upload…" : "Image URL or upload…"}
          className="flex-1 rounded-lg border border-[#E2E5EA] bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A2332]/15 focus:border-[#1A2332]"
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E5EA] bg-[#F9FAFB] px-3 py-2 text-xs font-semibold text-[#1A2332] hover:bg-[#F3F4F6] disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          Upload
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept || defaultAccept}
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </div>
      {hint ? <p className="mt-1 text-[11px] text-[#9CA3AF]">{hint}</p> : null}
      {value && kind !== "pdf" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt=""
          className="mt-2 h-16 w-auto max-w-full rounded-md border border-[#E8EAED] object-contain bg-white"
        />
      ) : null}
    </div>
  );
}
