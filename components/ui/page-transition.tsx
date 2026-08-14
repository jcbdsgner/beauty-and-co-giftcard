// Plain CSS animation (no client JS needed) — it plays automatically because
// `template.tsx` gives this wrapper a fresh DOM node on every navigation.
export function PageTransition({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-fade-in">{children}</div>;
}
