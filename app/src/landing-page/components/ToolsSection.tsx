import { Link as WaspRouterLink, routes } from "wasp/client/router";
import SectionTitle from "./SectionTitle";

const tools = [
  {
    emoji: "🎙️",
    name: "Compte Rendu de Chantier",
    tagline: "Dictez, l'IA rédige",
    description:
      "Enregistrez ou uploadez un audio de visite de chantier. En 2 minutes, obtenez un compte rendu structuré, prêt à envoyer aux entreprises.",
    steps: ["Enregistrement audio", "Transcription automatique", "Structuration IA", "Export Word/PDF"],
    color: "from-blue-500/10 to-blue-600/5",
    border: "border-blue-200 dark:border-blue-800",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    route: routes.CrChantierRoute,
  },
  {
    emoji: "📋",
    name: "Générateur CCTP",
    tagline: "CCTP complet en quelques clics",
    description:
      "Décrivez votre projet, sélectionnez les lots. L'IA génère un CCTP conforme aux DTU et normes NF, avec les spécifications techniques adaptées.",
    steps: ["Description du projet", "Sélection des lots", "Génération IA", "Export CCTP"],
    color: "from-purple-500/10 to-purple-600/5",
    border: "border-purple-200 dark:border-purple-800",
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    route: routes.CctpRoute,
  },
  {
    emoji: "🏛️",
    name: "Assistant PLU",
    tagline: "Vérifiez la conformité PLU",
    description:
      "Uploadez le PLU de votre commune. Posez vos questions sur les règles de constructibilité et obtenez des réponses précises avec les références réglementaires.",
    steps: ["Import du PLU", "Analyse IA", "Questions libres", "Rapport de conformité"],
    color: "from-emerald-500/10 to-emerald-600/5",
    border: "border-emerald-200 dark:border-emerald-800",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    route: routes.PluRoute,
  },
];

export default function ToolsSection() {
  return (
    <div className="mx-auto my-16 max-w-7xl px-6 md:my-24 lg:my-32 lg:px-8" id="outils">
      <SectionTitle
        title="3 outils pour votre pratique"
        description="De la visite de chantier à la dépose du permis de construire, l'IA vous accompagne à chaque étape."
      />
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {tools.map((tool) => (
          <WaspRouterLink key={tool.name} to={tool.route.to}>
            <div
              className={`group h-full rounded-2xl border bg-gradient-to-br p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${tool.color} ${tool.border}`}
            >
              <div className="mb-4 flex items-start justify-between">
                <span className="text-4xl">{tool.emoji}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${tool.badge}`}>
                  Essayer →
                </span>
              </div>
              <h3 className="text-foreground mb-1 text-xl font-bold">{tool.name}</h3>
              <p className="text-muted-foreground mb-4 text-sm font-medium italic">{tool.tagline}</p>
              <p className="text-muted-foreground mb-6 text-sm leading-relaxed">{tool.description}</p>
              <ol className="space-y-1">
                {tool.steps.map((step, i) => (
                  <li key={step} className="text-muted-foreground flex items-center gap-2 text-xs">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/60 text-xs font-bold dark:bg-white/10">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </WaspRouterLink>
        ))}
      </div>
    </div>
  );
}
