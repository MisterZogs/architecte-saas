import type { GridFeature } from "./components/FeaturesGrid";

export const features: GridFeature[] = [
  {
    name: "80% de temps économisé",
    description: "Un compte rendu qui prenait 45 min s'écrit en moins de 5 min. Concentrez-vous sur votre métier.",
    emoji: "⏱️",
    size: "medium",
  },
  {
    name: "IA Mistral",
    description: "Modèle IA français, entraîné sur la réglementation de la construction.",
    emoji: "🤖",
    size: "small",
  },
  {
    name: "Export Word & PDF",
    description: "Documents formatés prêts à l'emploi.",
    emoji: "📄",
    size: "small",
  },
  {
    name: "DTU & Normes NF intégrés",
    description: "Les CCTP générés respectent les DTU et normes NF en vigueur. Les références réglementaires sont citées automatiquement dans le document.",
    emoji: "✅",
    size: "large",
  },
  {
    name: "RAG sur vos PLU",
    description: "Uploadez n'importe quel PLU. L'IA l'indexe et répond à vos questions avec les références précises des articles.",
    emoji: "🏛️",
    size: "large",
  },
  {
    name: "Multi-projets",
    description: "Gérez tous vos chantiers depuis un seul tableau de bord.",
    emoji: "🏗️",
    size: "small",
  },
  {
    name: "Données confidentielles",
    description: "Vos données restent sur vos serveurs.",
    emoji: "🔒",
    size: "small",
  },
  {
    name: "Transcription multilocuteurs",
    description: "Gladia détecte automatiquement les intervenants dans l'enregistrement.",
    emoji: "🎙️",
    size: "medium",
  },
  {
    name: "Accès immédiat",
    description: "Inscription en 30 secondes, aucune installation.",
    emoji: "🚀",
    size: "medium",
  },
];

export const faqs = [
  {
    id: 1,
    question: "Faut-il installer un logiciel ?",
    answer:
      "Non. ArchitecteIA est 100% en ligne, accessible depuis n'importe quel navigateur. Aucune installation requise.",
  },
  {
    id: 2,
    question: "Mes données de chantier sont-elles confidentielles ?",
    answer:
      "Oui. Vos fichiers audio, PLU et documents générés ne sont jamais partagés ni utilisés pour entraîner des modèles tiers. Les données restent sur nos serveurs sécurisés et vous pouvez les supprimer à tout moment.",
  },
  {
    id: 3,
    question: "L'IA comprend-elle les spécificités de la réglementation française ?",
    answer:
      "Oui. Nous utilisons Mistral, un modèle IA français, complété par une base de connaissances sur les DTU, normes NF et Eurocodes. Le générateur CCTP cite les références réglementaires applicables à chaque lot.",
  },
  {
    id: 4,
    question: "Puis-je utiliser mes propres PLU locaux ?",
    answer:
      "Oui, vous uploadez directement le PDF du PLU de votre commune. L'outil l'indexe en quelques secondes et vous pouvez ensuite poser toutes vos questions dessus.",
  },
  {
    id: 5,
    question: "Quels formats audio sont acceptés pour les comptes rendus ?",
    answer:
      "MP3, MP4, WAV, M4A, et la plupart des formats courants. Vous pouvez aussi dicter directement depuis le navigateur.",
  },
  {
    id: 6,
    question: "Quelle est la qualité des CCTP générés ?",
    answer:
      "Les CCTP sont générés à partir de templates conformes aux pratiques professionnelles, adaptés au descriptif de votre projet. Ils constituent une base solide que vous personnalisez ensuite selon vos exigences.",
  },
];

export const footerNavigation = {
  app: [
    { name: "CR Chantier", href: "/cr-chantier" },
    { name: "CCTP", href: "/cctp" },
    { name: "Assistant PLU", href: "/plu" },
    { name: "Tarifs", href: "/pricing" },
  ],
  company: [
    { name: "Connexion", href: "/login" },
    { name: "Inscription", href: "/signup" },
    { name: "Confidentialité", href: "#" },
    { name: "CGU", href: "#" },
  ],
};
