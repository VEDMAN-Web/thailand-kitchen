"use client";

import HomeContactInput from "./HomeContactInput";
import useContact from "../../hooks/useContact";
import { useTranslation } from "../../i18n/LanguageProvider";

export default function ContactForm() {
  const { t } = useTranslation();
  const { formData, errors, loading, handleChange, handleSubmit } =
    useContact();

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-7">
      <HomeContactInput
        label={t("form.fullName")}
        name="fullName"
        value={formData.fullName}
        onChange={handleChange}
        error={errors.fullName}
      />

      <HomeContactInput
        label={t("form.email")}
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
      />

      <HomeContactInput
        label={t("form.country")}
        name="countryName"
        value={formData.countryName}
        onChange={handleChange}
        error={errors.countryName}
      />

      <HomeContactInput
        label={t("form.city")}
        name="cityName"
        value={formData.cityName}
        onChange={handleChange}
        error={errors.cityName}
      />

      <HomeContactInput
        label={t("form.phone")}
        name="phoneNumber"
        type="tel"
        value={formData.phoneNumber}
        onChange={handleChange}
        error={errors.phoneNumber}
      />

      <HomeContactInput
        label={t("form.whatsapp")}
        name="whatsappNumber"
        type="tel"
        value={formData.whatsappNumber}
        onChange={handleChange}
        error={errors.whatsappNumber}
      />

      <div className="sm:col-span-2 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 bg-[#1A1A1A] text-white px-8 py-3.5 rounded-full text-sm font-semibold hover:bg-black transition disabled:opacity-70"
        >
          {loading ? t("form.sending") : t("form.submit")}
          {!loading && <span aria-hidden>↗</span>}
        </button>
      </div>
    </form>
  );
}
