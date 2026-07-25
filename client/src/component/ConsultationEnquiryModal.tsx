"use client";

import { useEffect, useState } from "react";
import { createContact } from "../services/contactAPI";
import { toast } from "sonner";

type ContactMethod = "whatsapp" | "telegram" | "phone" | "email";

const countryCodes = [
  { code: "+66", label: "TH +66" },
  { code: "+1", label: "US +1" },
  { code: "+91", label: "IN +91" },
  { code: "+48", label: "PL +48" },
];

const methods: {
  id: ContactMethod;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12.04 2C6.58 2 2.15 6.37 2.15 11.75c0 1.92.51 3.72 1.4 5.28L2 22l5.15-1.48a9.9 9.9 0 0 0 4.89 1.24h.01c5.46 0 9.89-4.37 9.89-9.76C21.94 6.37 17.5 2 12.04 2zm5.75 13.9c-.24.68-1.4 1.25-1.93 1.33-.49.07-1.12.1-1.81-.11-.42-.13-.95-.31-1.64-.6-2.88-1.25-4.76-4.17-4.9-4.36-.14-.19-1.15-1.53-1.15-2.92 0-1.39.73-2.07.99-2.35.26-.28.56-.35.75-.35.19 0 .38 0 .54.01.17.01.41-.07.64.49.24.58.82 2 .89 2.14.07.14.12.31.02.5-.1.19-.14.31-.28.48-.14.17-.3.38-.42.51-.14.14-.28.29-.12.56.16.28.71 1.17 1.52 1.9 1.05.94 1.93 1.23 2.21 1.37.28.14.44.12.6-.07.16-.19.7-.81.88-1.09.19-.28.37-.23.63-.14.26.1 1.64.77 1.92.91.28.14.47.21.54.33.07.12.07.68-.17 1.36z" />
      </svg>
    ),
  },
  {
    id: "telegram",
    label: "Telegram",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M21.8 4.3 2.9 11.6c-1.3.5-1.3 1.2-.2 1.5l4.8 1.5 1.9 5.7c.2.7.1.9.8.9.5 0 .7-.2 1-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.2-.4-1.7-1.3-1.3zM9.3 15.1l-.3 3.1-1.1-3.7 13-8-11.6 8.6z" />
      </svg>
    ),
  },
  {
    id: "phone",
    label: "Phone",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path
          d="M8.5 3.5h3.2l1.1 4.2-2 1.2a12.5 12.5 0 0 0 5.3 5.3l1.2-2 4.2 1.1v3.2c0 .9-.7 1.7-1.6 1.8A16.5 16.5 0 0 1 3.7 5.1c.1-.9.9-1.6 1.8-1.6Z"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "email",
    label: "Email",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M4 7l8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

type Props = {
  open: boolean;
  onClose: () => void;
  /** Called after the enquiry is successfully submitted (and catalogue access unlocked), before the modal closes. */
  onSuccess?: () => void;
};

const initialForm = {
  fullName: "",
  countryCode: "+66",
  phone: "",
  method: "whatsapp" as ContactMethod,
  message: "",
};

export default function ConsultationEnquiryModal({ open, onClose, onSuccess }: Props) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof initialForm, string>>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setForm(initialForm);
      setErrors({});
      setLoading(false);
    }
  }, [open]);

  if (!open) return null;

  const validate = () => {
    const next: Partial<Record<keyof typeof initialForm, string>> = {};
    if (!form.fullName.trim()) next.fullName = "Name is required";
    const digits = form.phone.replace(/\D/g, "");
    if (!digits) next.phone = "Phone number is required";
    else if (digits.length < 7) next.phone = "Enter a valid phone number";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const digits = form.phone.replace(/\D/g, "");
    const phoneNumber = `${form.countryCode}${digits}`;
    const methodLabel =
      methods.find((m) => m.id === form.method)?.label ?? form.method;
    const note = `Free consultation enquiry via navbar. Preferred contact: ${methodLabel}.`;
    const userMessage = form.message.trim();
    const message = userMessage ? `${userMessage}\n\n${note}` : note;

    try {
      setLoading(true);
      // Same contact API / DB path as the contact page forms
      await createContact({
        fullName: form.fullName.trim(),
        email: `enquiry.${digits}@thailandkitchens.lead`,
        phoneNumber,
        whatsappNumber: phoneNumber,
        cityName: "Not provided",
        countryName: "Not provided",
        message,
      });

      try {
        await fetch("/api/catalog/unlock", { method: "POST" });
      } catch {
        /* unlock is best-effort; contact already saved */
      }

      toast.success("Message Sent", {
        description: "We will contact you soon.",
      });
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const apiMessage =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response
          ?.data?.message === "string"
          ? (err as { response: { data: { message: string } } }).response.data
              .message
          : err instanceof Error
            ? err.message
            : "Please try again later.";

      toast.error("Submission Failed", { description: apiMessage });
    } finally {
      setLoading(false);
    }
  };

  const fieldClass =
    "w-full rounded-md border border-[#D8D8D8] px-3 py-2 text-[13px] text-[#1A1A1A] placeholder:text-[#A0A0A0] outline-none focus:border-[#B38B6D] transition";
  const labelClass = "block text-[12px] font-medium text-[#3A3A3A] mb-1.5";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Free consultation enquiry"
    >
      <button
        type="button"
        aria-label="Close enquiry form"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-[340px] bg-white rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] p-4 sm:p-5 overflow-hidden">
        <div className="flex justify-end mb-1">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 flex items-center justify-center rounded-full text-[#6B6B6B] hover:bg-black/5 transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label htmlFor="enquiry-name" className={labelClass}>
              Your name
            </label>
            <input
              id="enquiry-name"
              type="text"
              value={form.fullName}
              onChange={(e) => {
                setForm((prev) => ({
                  ...prev,
                  fullName: e.target.value.replace(/[^\p{L}\s'.-]/gu, ""),
                }));
                setErrors((prev) => ({ ...prev, fullName: "" }));
              }}
              placeholder="Jane Smith"
              className={fieldClass}
            />
            {errors.fullName ? (
              <p className="mt-1 text-[11px] text-red-500">{errors.fullName}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="enquiry-phone" className={labelClass}>
              Phone number
            </label>
            <div className="flex gap-1.5">
              <select
                value={form.countryCode}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, countryCode: e.target.value }))
                }
                aria-label="Country code"
                className="w-[88px] shrink-0 rounded-md border border-[#D8D8D8] pl-2 pr-6 py-2 text-[13px] text-[#1A1A1A] outline-none focus:border-[#B38B6D] appearance-none bg-[url('/arrow-down.svg')] bg-no-repeat bg-[right_0.4rem_center] bg-[length:9px]"
              >
                {countryCodes.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
              <input
                id="enquiry-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => {
                  setForm((prev) => ({
                    ...prev,
                    phone: e.target.value.replace(/[^\d\s]/g, ""),
                  }));
                  setErrors((prev) => ({ ...prev, phone: "" }));
                }}
                placeholder="7700 900123"
                className={`min-w-0 flex-1 ${fieldClass}`}
              />
            </div>
            {errors.phone ? (
              <p className="mt-1 text-[11px] text-red-500">{errors.phone}</p>
            ) : null}
          </div>

          <div>
            <p className={labelClass}>Preferred contact method</p>
            <div className="grid grid-cols-4 gap-2">
              {methods.map((method) => {
                const selected = form.method === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, method: method.id }))
                    }
                    aria-pressed={selected}
                    aria-label={method.label}
                    title={method.label}
                    className={`h-11 rounded-lg border flex items-center justify-center transition ${
                      selected
                        ? "border-[#E07070] bg-[#FCE8E8] text-[#C94A4A]"
                        : "border-[#D8D8D8] bg-white text-[#5A5A5A] hover:border-[#B8B8B8]"
                    }`}
                  >
                    {method.icon}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="enquiry-message" className={labelClass}>
              Message{" "}
              <span className="font-normal text-[#8A8A8A]">(optional)</span>
            </label>
            <textarea
              id="enquiry-message"
              rows={3}
              value={form.message}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, message: e.target.value }))
              }
              placeholder="Tell us what you are looking for..."
              className={`${fieldClass} resize-none`}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#C94A4A] hover:bg-[#B53E3E] text-white text-[13px] font-semibold py-2.5 transition disabled:opacity-70"
          >
            {loading ? "Sending..." : "Send enquiry"}
          </button>

          <p className="text-center text-[10px] text-[#8A8A8A] leading-4 px-0.5">
            By sending this form you agree to our privacy policy. No spam —
            one consultant, no mailing lists.
          </p>
        </form>
      </div>
    </div>
  );
}
