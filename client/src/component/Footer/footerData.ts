import type { TranslationKey } from "../../i18n/translations";

export const footerLinks: {
  home: { key: TranslationKey; href: string }[];
  product: { key: TranslationKey; href: string }[];
} = {
  home: [
    { key: "footer.link.ourStory", href: "/#our-service" },
    { key: "footer.link.freeCatalogue", href: "/catalogue" },
    { key: "footer.link.globalPartner", href: "/#brands" },
    { key: "footer.link.contact", href: "/contact" },
  ],

  product: [
    { key: "footer.link.bestSeller", href: "/products?tab=best-seller" },
    { key: "footer.link.ourProducts", href: "/products" },
  ],
};

export const contactInfo = [
  {
    icon: "/footer/location.png",
    text: "Pattaya Office:\n82, 48-49 Chaiyaphruek 2 Rd, Pattaya City, Bang Lamung District, Chon Buri 20150",
  },
  {
    icon: "/footer/location.png",
    text: "Samui Office:\nRoute 4169, Mae Nam, Amphoe Ko Samui, Surat Thani 84330",
  },
  {
    icon: "/footer/email.png",
    text: "hi@thailandkitchens.com",
  },
  {
    icon: "/footer/calling.png",
    text: "+66 64 683 9777",
  },
];

export type SocialIconName = "instagram" | "facebook" | "whatsapp" | "x";

export const socialLinks: { name: SocialIconName; link: string; label: string }[] = [
  { name: "instagram", link: "https://www.facebook.com/ThailandKitchens/", label: "Instagram" },
  { name: "facebook", link: "https://www.facebook.com/ThailandKitchens/", label: "Facebook" },
  { name: "whatsapp", link: "https://wa.me/66646839777", label: "WhatsApp" },
  { name: "x", link: "https://x.com/", label: "X" },
];
