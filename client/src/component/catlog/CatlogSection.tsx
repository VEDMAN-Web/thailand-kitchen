"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Download, Lock, X } from "lucide-react";
import { toast } from "sonner";
import { products } from "./catlogData";
import { useTranslation } from "../../i18n/LanguageProvider";

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
  const [showLockPopup, setShowLockPopup] = useState(false);
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
        setShowLockPopup(true);
        return;
      }

      setDownloadingId(id);
      try {
        const isUnlocked = skipLockCheck || (await refreshUnlockStatus());
        if (!isUnlocked) {
          pendingDownloadRef.current = { id, category, downloadName, pdfFile };
          setShowLockPopup(true);
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

    const onUnlocked = async () => {
      const isUnlocked = await refreshUnlockStatus();
      const pending = pendingDownloadRef.current;
      if (isUnlocked && pending) {
        pendingDownloadRef.current = null;
        setShowLockPopup(false);
        await runDownload(
          pending.id,
          pending.category,
          pending.downloadName,
          pending.pdfFile,
          true
        );
      }
    };

    window.addEventListener("catalog:unlocked", onUnlocked);
    return () => window.removeEventListener("catalog:unlocked", onUnlocked);
  }, [refreshUnlockStatus, runDownload]);

  const goToContact = () => {
    setShowLockPopup(false);
    const el = document.getElementById("contact");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
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
                      aria-label={
                        unlocked
                          ? t("home.catalog.downloadBtn")
                          : t("home.catalog.unlockBtn")
                      }
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
                        {unlocked ? (
                          <Download size={18} />
                        ) : (
                          <Lock size={18} />
                        )}
                        {isDownloading
                          ? t("home.catalog.downloading")
                          : unlocked
                            ? t("home.catalog.downloadBtn")
                            : t("home.catalog.unlockBtn")}
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

      {showLockPopup ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
          onClick={() => setShowLockPopup(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md rounded-[1.75rem] bg-[#141414] border border-[#E0905A]/25 p-8 sm:p-10 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowLockPopup(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <div className="mx-auto mb-5 w-14 h-14 rounded-full bg-[#E0905A]/15 flex items-center justify-center">
              <Lock size={26} className="text-[#E0905A]" />
            </div>

            <h3 className="text-xl font-bold text-white mb-3">
              {t("home.catalog.lockTitle")}
            </h3>
            <p className="text-white/60 text-sm leading-7 mb-8">
              {t("home.catalog.lockDesc")}
            </p>

            <button
              type="button"
              onClick={goToContact}
              className="w-full bg-[#E0905A] text-white px-6 py-3.5 rounded-full text-sm font-semibold hover:bg-[#c97d4e] transition"
            >
              {t("home.catalog.lockCta")}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
