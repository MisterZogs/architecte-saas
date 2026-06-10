# Architecte SaaS

Plateforme SaaS pour architectes français regroupant 3 outils IA. Frontend Wasp (React + Node.js + Prisma) dans `app/`, 3 services Python backend dans `services/` (symlinks vers `../architecte/`).

---

## Structure du projet

```
app/              Frontend SaaS — Wasp + React + Prisma (voir app/CLAUDE.md)
services/
  plu/            Assistant conformité PLU       → ../architecte/assistant-PLU-3e
  cctp/           Générateur de CCTP             → ../architecte/CCTP-DTU-2e
  cr-chantier/    CR de chantier automatique     → ../architecte/compte-rendu-chantier-1er
```

Chaque service a son propre `CLAUDE.md` avec vision produit, architecture, prompts et roadmap. **Les lire avant de travailler sur un service.**

---

## Service 1 — Assistant PLU (`services/plu/`)

Vérifie la conformité d'un projet au PLU de la commune en quelques minutes (vs 2-4h manuellement).

**Pipeline :** adresse → BAN API (géocodage + code INSEE) → GPU API (récupération PLU) → IGN WFS (identification zone) → RAG sur PDF règlement → vérification LLM → rapport de conformité

**Stack :** Python + FastAPI / LlamaIndex + ChromaDB / Claude Sonnet / WeasyPrint (export PDF)

**APIs clés :**
- BAN : `https://api-adresse.data.gouv.fr` — géocodage
- GPU (Géoportail Urbanisme) : `https://www.geoportail-urbanisme.gouv.fr/api/` — PLU des 35 000 communes
- MCP data.gouv.fr — datasets thématiques (PPRN, SUP, DVF…)

**Modèle éco :** freemium 3/mois gratuit, 49€/mois illimité, 9€/rapport

---

## Service 2 — Générateur CCTP (`services/cctp/`)

Génère un CCTP (Cahier des Clauses Techniques Particulières) complet et à jour réglementairement par lot de travaux.

**Pipeline :** saisie projet (type, zone climatique, zone sismique, PMR) → mapping lot → DTU → RAG sur base DTU → génération LLM par lot → édition inline → export Word/PDF

**Stack :** Python + FastAPI / LlamaIndex + ChromaDB / Claude Sonnet / python-docx + Jinja2

**15 lots couverts** : GO, charpente, couverture, menuiseries, isolation, cloisons, revêtements, carrelage, peinture, plomberie, CVC, électricité, VRD…

**Sources réglementaires :** DTU (AFNOR/CSTB), Eurocodes, RE2020, accessibilité PMR, sécurité incendie ERP

**Modèle éco :** 15€/lot, 79€/mois illimité, 149€/mois cabinet 5 users

---

## Service 3 — CR de Chantier (`services/cr-chantier/`)

Enregistrement audio de réunion de chantier → compte rendu structuré prêt à envoyer (~30 sec vs 1-3h manuellement).

**Pipeline :** upload audio (MP3/M4A/WAV) → Whisper API (transcription) → Claude Sonnet (structuration JSON par lot) → export Word/PDF

**Stack :** Python + FastAPI / OpenAI Whisper API / Claude Sonnet / python-docx

**Coût par CR :** ~0,38$ (Whisper ~0,36$ + LLM ~0,02$)

**Modèle éco :** freemium 3 CR/mois gratuit, 29€/mois illimité, 49€/mois cabinet 5 users

---

## Frontend app/ — Open SaaS + Wasp

Voir `app/CLAUDE.md` pour les instructions spécifiques Wasp/Open SaaS.

- Toujours consulter la doc Open SaaS via [llms.txt](https://docs.opensaas.sh/llms.txt) avant de modifier le frontend
- Si insuffisant, consulter la doc Wasp via [llms.txt](https://wasp.sh/llms.txt)
