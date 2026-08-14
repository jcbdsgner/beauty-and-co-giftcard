# Carte cadeau — B&Co

Site vitrine immersif pour l'achat de cartes cadeaux du salon B&Co : 3D interactive,
animations au scroll, identité visuelle héritée du site principal B&Co (mêmes
polices, mêmes tokens de couleur).

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** — même socle que le
  site principal `b&co/`, pour réutiliser polices, tokens et conventions sans friction.
- **Tailwind CSS v4** — tokens de marque définis dans `app/globals.css`, repris tels
  quels du site principal (`--core-brand-color`, etc.), plus une palette "stage"
  sombre pour mettre la 3D en valeur.
- **React Three Fiber + drei + three.js** — scène 3D déclarative pour la carte cadeau
  et les futurs effets immersifs.
- **GSAP + @gsap/react + ScrollTrigger** — animations d'entrée et au scroll.

## Architecture

```
app/
  layout.tsx        # polices (Cabinet Grotesk, Prata, Benedict) + shell
  page.tsx           # assemble les sections
  globals.css         # tokens de marque + thème Tailwind v4
  fonts/              # fichiers de police copiés depuis b&co/app/fonts
components/
  canvas/             # tout ce qui touche à React Three Fiber (client-only)
  sections/           # sections de page (Hero, ...) — composent canvas + copy + GSAP
  layout/             # header/footer une fois la nav définie
  ui/                 # composants d'interface réutilisables
lib/
  gsap/register.ts    # enregistrement gsap + ScrollTrigger + useGSAP (client-only)
  three/               # helpers/hooks R3F partagés
  utils.ts             # cn() (clsx + tailwind-merge)
public/
  images/
  models/              # futurs assets .glb (carte cadeau modélisée, textures)
```

Le Canvas R3F est toujours importé via `next/dynamic({ ssr: false })` depuis un
composant serveur — WebGL n'existe pas côté serveur.

## Démarrer

```bash
npm install
npm run dev
```
