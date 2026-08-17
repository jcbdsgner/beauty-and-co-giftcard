// Mirrors b&co/lib/data/contact.ts — reproduced here rather than imported
// since the two sites are separate Next.js projects/deployments (see
// docs/userflow.md "Constat technique"). Keep in sync by hand if the main
// site's contact details or social handles change.
export const CONTACT_INFO = {
  phone: "+221 78 120 86 86 / 78 654 93 93",
  email: "contact@beautyandco.com",
};

export type SocialLink = { label: string; href: string; icon: string };

export const SOCIAL_LINKS: SocialLink[] = [
  { label: "Instagram", href: "https://instagram.com", icon: "/images/social/social-instagram.svg" },
  { label: "Facebook", href: "https://facebook.com", icon: "/images/social/social-facebook.svg" },
  { label: "WhatsApp", href: "https://wa.me/", icon: "/images/social/social-whatsapp.svg" },
  { label: "TikTok", href: "https://tiktok.com", icon: "/images/social/social-tiktok.svg" },
];
