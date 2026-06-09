import HighlightedFeature from "./components/HighlightedFeature";

export default function WorkflowHighlight() {
  return (
    <HighlightedFeature
      name="De l'audio au document en 2 minutes"
      description={
        <div className="space-y-4">
          <p className="text-muted-foreground text-base leading-relaxed">
            Plus besoin de retranscrire vos visites de chantier à la main. Enregistrez sur site,
            et l'IA s'occupe du reste : transcription, structuration par corps de métier, reformulation
            professionnelle.
          </p>
          <ul className="text-muted-foreground space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span> Transcription via Gladia (multilingue, multi-locuteurs)
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span> Structuration automatique par lot de travaux
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span> Export Word prêt à envoyer aux entreprises
            </li>
          </ul>
        </div>
      }
      highlightedComponent={<CRWorkflowMock />}
      direction="row"
    />
  );
}

function CRWorkflowMock() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
          <span className="text-xl">🎙️</span>
        </div>
        <div>
          <p className="text-foreground text-sm font-semibold">CR Chantier — Résidence Les Pins</p>
          <p className="text-muted-foreground text-xs">Visite du 07/06/2026 · 12 min 34 s</p>
        </div>
      </div>
      <div className="mb-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
        <div className="mb-2 flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Transcription terminée</span>
        </div>
        <p className="text-muted-foreground text-xs italic">
          "...le carrelage du hall d'entrée n'est pas encore posé, prévoir la semaine prochaine. La plomberie du RDC est OK mais il faut reprendre les joints..."
        </p>
      </div>
      <div className="space-y-2">
        <p className="text-foreground text-xs font-semibold uppercase tracking-wide">Compte rendu structuré</p>
        {[
          { lot: "Gros œuvre", status: "✅", note: "Conforme au planning" },
          { lot: "Carrelage", status: "⚠️", note: "Retard — reprise sem. 24" },
          { lot: "Plomberie", status: "⚠️", note: "Joints à reprendre (RDC)" },
          { lot: "Électricité", status: "✅", note: "Tableau livré conforme" },
        ].map((item) => (
          <div key={item.lot} className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-800">
            <span className="text-sm">{item.status}</span>
            <span className="text-foreground w-24 text-xs font-medium">{item.lot}</span>
            <span className="text-muted-foreground flex-1 text-xs">{item.note}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <button className="flex-1 rounded-lg bg-blue-600 py-2 text-xs font-medium text-white">
          Exporter Word
        </button>
        <button className="rounded-lg border border-gray-200 px-4 py-2 text-xs text-gray-600 dark:border-gray-700 dark:text-gray-300">
          PDF
        </button>
      </div>
    </div>
  );
}
