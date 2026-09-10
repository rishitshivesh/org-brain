export function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="portal-orb portal-orb-one" />
      <div className="portal-orb portal-orb-two" />
      <div className="portal-grid-noise absolute inset-0 opacity-[0.035] dark:opacity-[0.06]" />
    </div>
  );
}
