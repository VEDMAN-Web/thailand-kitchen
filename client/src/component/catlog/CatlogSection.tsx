"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { products } from "./catlogData";
import { useTranslation } from "../../i18n/LanguageProvider";
import ConsultationEnquiryModal from "../ConsultationEnquiryModal";

type PendingDownload = {
  id: number;
  category: string;
  downloadName: string;
  pdfFile: string;
};

export default function CatlogSection() {
  const { t } = useTranslation();
  const items = products.slice(0, 3);
  const [active, setActive] = useState<number | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const pendingDownloadRef = useRef<PendingDownload | null>(null);
  const unlockedRef = useRef(false);

  const refreshUnlockStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/catalog/status", { credentials: "include" });
      const data = await res.json();
      const next = Boolean(data.unlocked);
      unlockedRef.current = next;
      setUnlocked(next);
      return next;
    } catch {
      unlockedRef.current = false;
      setUnlocked(false);
      return false;
    }
  }, []);

  const saveBlobDownload = (blob: Blob, downloadName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadName;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const runDownload = useCallback(
    async (
      id: number,
      category: string,
      downloadName: string,
      pdfFile: string,
      skipLockCheck = false
    ) => {
      if (!skipLockCheck && !unlockedRef.current) {
        pendingDownloadRef.current = { id, category, downloadName, pdfFile };
        setEnquiryOpen(true);
        return;
      }

      setDownloadingId(id);
      try {
        const isUnlocked = skipLockCheck || (await refreshUnlockStatus());
        if (!isUnlocked) {
          pendingDownloadRef.current = { id, category, downloadName, pdfFile };
          setEnquiryOpen(true);
          return;
        }

        const staticPdfUrl = `/catlog/${pdfFile}`;
        const res = await fetch(staticPdfUrl, { cache: "no-store" });

        if (!res.ok) {
          throw new Error(
            "Catalogue PDF not found. Add catalogue.pdf to client/public/catlog/ folder."
          );
        }

        const blob = await res.blob();
        if (!blob.type.includes("pdf") && blob.size < 500) {
          throw new Error(t("home.catalog.downloadErrorDesc"));
        }

        saveBlobDownload(blob, downloadName);

        toast.success(t("home.catalog.downloadStarted"), {
          description: category,
        });
      } catch (err) {
        toast.error(t("home.catalog.downloadError"), {
          description:
            err instanceof Error
              ? err.message
              : t("home.catalog.downloadErrorDesc"),
        });
      } finally {
        setDownloadingId(null);
      }
    },
    [refreshUnlockStatus, t]
  );

  useEffect(() => {
    refreshUnlockStatus();
  }, [refreshUnlockStatus]);

  const handleEnquirySuccess = () => {
    unlockedRef.current = true;
    setUnlocked(true);

    const pending = pendingDownloadRef.current;
    if (pending) {
      pendingDownloadRef.current = null;
      // Let the modal finish closing before starting the download.
      setTimeout(() => {
        runDownload(
          pending.id,
          pending.category,
          pending.downloadName,
          pending.pdfFile,
          true
        );
      }, 150);
    }
  };

  return (
    <>
      <section className="pb-16 lg:pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <div
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 h-auto sm:h-[520px] lg:h-[600px]"
            onMouseLeave={() => setActive(null)}
          >
            {items.map((item, index) => {
              const isActive = active === index;
              const isIdle = active === null;
              const isDownloading = downloadingId === item.id;

              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => setActive(index)}
                  className={`group relative flex flex-col min-w-0 transition-[flex] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isIdle
                      ? "sm:flex-1"
                      : isActive
                        ? "sm:flex-[2.4]"
                        : "sm:flex-[0.8]"
                  }`}
                >
                  <div className="relative w-full h-[320px] sm:h-full overflow-hidden rounded-2xl">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className={`object-cover transition-transform duration-700 ease-out ${
                        isActive || isIdle
                          ? "scale-100 group-hover:scale-105"
                          : "scale-100"
                      }`}
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />

                    <button
                      type="button"
                      aria-label={t("home.catalog.downloadBtn")}
                      disabled={isDownloading}
                      onClick={(e) => {
                        e.stopPropagation();
                        runDownload(
                          item.id,
                          item.category,
                          item.downloadName,
                          item.pdf
                        );
                      }}
                      className={`absolute inset-0 z-10 grid place-items-center bg-[#1A1A1A]/55 transition-opacity duration-500 cursor-pointer border-0 p-0 ${
                        isActive
                          ? "opacity-100"
                          : "opacity-0 pointer-events-none sm:group-hover:opacity-100 sm:group-hover:pointer-events-auto"
                      }`}
                    >
                      <span className="pointer-events-none inline-flex items-center gap-2 bg-[#E0905A] text-white px-7 py-3.5 rounded-full text-sm font-semibold shadow-lg transition-transform duration-500 scale-100 group-hover:scale-105">
                        <Download size={18} />
                        {isDownloading
                          ? t("home.catalog.downloading")
                          : t("home.catalog.downloadBtn")}
                      </span>
                    </button>
                  </div>

                  <div
                    className={`mt-4 transition-opacity duration-500 ${
                      isIdle || isActive ? "opacity-100" : "opacity-70"
                    }`}
                  >
                    <p className="text-[11px] tracking-[0.18em] uppercase text-[#E0905A] font-semibold mb-1">
                      {item.category}
                    </p>
                    <p className="text-sm sm:text-base font-bold uppercase tracking-[0.08em] text-[#1A1A1A]">
                      {item.title}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center gap-2 mt-6">
            {items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Show ${item.category} catalogue`}
                onClick={() => setActive(index)}
                className={`h-2.5 w-2.5 rounded-full border transition-colors duration-300 ${
                  active === index
                    ? "border-[#1A1A1A] bg-white"
                    : "border-[#C8C0B6] bg-[#D8D2C8]"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      <ConsultationEnquiryModal
        open={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
        onSuccess={handleEnquirySuccess}
      />
    </>
  );
}
