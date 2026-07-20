import type { TranslationKey } from "../../i18n/translations";

export const footerLinks: {
  home: TranslationKey[];
  product: TranslationKey[];
} = {
  home: [
    "footer.link.ourStory",
    "footer.link.freeCatalogue",
    "footer.link.globalPartner",
    "footer.link.contact",
  ],

  product: [
    "footer.link.bestSeller",
    "footer.link.freeCatalogue",
    "footer.link.globalPartner",
    "footer.link.ourProducts",
  ],
};

export const contactInfo = [
  {
    icon: "/footer/location.png",
    text: "Cyber City, 610, Surat, Gujarat 394105",
  },
  {
    icon: "/footer/email.png",
    text: "hello@Thaikitchen.in",
  },
  {
    icon: "/footer/calling.png",
    text: "+91 98765 43210",
  },
];

export type SocialIconName = "instagram" | "facebook" | "whatsapp" | "x";

export const socialLinks: { name: SocialIconName; link: string; label: string }[] = [
  { name: "instagram", link: "#", label: "Instagram" },
  { name: "facebook", link: "#", label: "Facebook" },
  { name: "whatsapp", link: "#", label: "WhatsApp" },
  { name: "x", link: "#", label: "X" },
];
