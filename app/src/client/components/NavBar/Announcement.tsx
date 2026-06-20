export function Announcement() {
  return (
    <div className="from-blue-600 to-blue-700 text-white relative flex w-full items-center justify-center gap-3 bg-linear-to-r px-4 py-2 text-center text-sm">
      <span className="font-semibold">🚧 Bêta privée</span>
      <span className="hidden sm:inline text-blue-100">
        — Vos retours nous aident à améliorer l'outil. Merci de votre confiance.
      </span>
    </div>
  );
}
