export type ServicePackItem = {
  label: string;
  duration: string;
};

export type ServicePack = {
  id: string;
  label: string;
  image: string;
  /** Vidéo de fond en boucle pour la card, en remplacement de `image` — `image` reste le poster/fallback. */
  video?: string;
  description: string;
  price: number;
  items: ServicePackItem[];
};

// Mêmes packs, mêmes visuels et mêmes prix que la grille tarifaire de b&co
// (app/tarifs — lib/data/packs.ts), pour que l'offre reste identique entre
// les deux sites plutôt qu'une réinterprétation.
export const SERVICE_PACKS: ServicePack[] = [
  {
    id: "eclat-express",
    label: "Pack Éclat Express",
    image: "/images/packs/eclat-express.jpg",
    description: "Brushing, vernis et sourcils nets pour un look soigné en un seul passage.",
    price: 31000,
    items: [
      { label: "Shampoing brushing (shampoing inclus et obligatoire)", duration: "60 min" },
      { label: "Vernis simple mains (classique et halal)", duration: "30 min" },
      { label: "Épilation sourcils", duration: "15 min" },
    ],
  },
  {
    id: "cocooning-duo",
    label: "Pack Cocooning Duo",
    image: "/images/packs/cocooning-duo.jpg",
    video: "/videos/cocooning-duo.mp4",
    description: "Soin du dos et réflexologie : une vraie parenthèse détente.",
    price: 91000,
    items: [
      { label: "Soin du dos", duration: "90 min" },
      { label: "Reflexology", duration: "60 min" },
    ],
  },
  {
    id: "beaute-des-mains",
    label: "Pack Beauté des Mains",
    image: "/images/packs/beaute-des-mains.png",
    description: "Manucure, pédicure et remplissage gel pour des mains et pieds impeccables.",
    price: 55000,
    items: [
      { label: "Pédicure me spa", duration: "60 min" },
      { label: "Manucure spa express", duration: "45 min" },
      { label: "Remplissage gel", duration: "30 min" },
    ],
  },
  {
    id: "glow-total",
    label: "Pack Glow Total",
    image: "/images/packs/glow-total.png",
    description: "Facial éclat, épilation complète et manucure russe pour un glow total.",
    price: 85500,
    items: [
      { label: "Manucure russe (sans vernis/sans gel)", duration: "30 min" },
      { label: "Glow me facial", duration: "60 min" },
      { label: "Pack épilations complètes", duration: "60 min" },
    ],
  },
  // Packs fictifs pour la démo (pas dans la grille b&co) — ils réutilisent les
  // 4 visuels ci-dessus dans le même ordre, pour que deux photos identiques ne
  // soient jamais côte à côte dans le carrousel de app/packs.
  {
    id: "cheveux-sublimes",
    label: "Pack Cheveux Sublimés",
    image: "/images/packs/eclat-express.jpg",
    description: "Soin profond, coupe et brushing pour une chevelure nourrie et lumineuse.",
    price: 48000,
    items: [
      { label: "Soin profond kératine", duration: "45 min" },
      { label: "Coupe & finition", duration: "45 min" },
      { label: "Brushing", duration: "30 min" },
    ],
  },
  {
    id: "evasion-detente",
    label: "Pack Évasion Détente",
    image: "/images/packs/cocooning-duo.jpg",
    description: "Massage relaxant et gommage corps pour relâcher toutes les tensions.",
    price: 72000,
    items: [
      { label: "Massage relaxant corps", duration: "60 min" },
      { label: "Gommage corps", duration: "30 min" },
      { label: "Rituel thé & repos", duration: "15 min" },
    ],
  },
  {
    id: "mains-de-reine",
    label: "Pack Mains de Reine",
    image: "/images/packs/beaute-des-mains.png",
    description: "Manucure spa, pose gel et soin paraffine pour des mains d'exception.",
    price: 42000,
    items: [
      { label: "Manucure spa", duration: "45 min" },
      { label: "Pose gel couleur", duration: "45 min" },
      { label: "Soin paraffine mains", duration: "20 min" },
    ],
  },
];

export function getPackById(id: string | undefined): ServicePack | undefined {
  return SERVICE_PACKS.find((pack) => pack.id === id);
}
