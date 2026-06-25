import { routes } from "wasp/client/router";
import type { NavigationItem } from "./NavBar";

export const marketingNavigationItems: NavigationItem[] = [
  { name: "Fonctionnalités", to: "/#features" },
  { name: "Outils", to: "/#outils" },
  { name: "Tarifs", to: routes.PricingPageRoute.to },
] as const;

export const demoNavigationitems: NavigationItem[] = [
  { name: "CR Chantier", to: routes.CrChantierRoute.to },
  { name: "CCTP", to: routes.CctpRoute.to },
  { name: "Assistant PLU", to: routes.PluRoute.to },
  { name: "Paramètres", to: routes.CabinetSettingsRoute.to },
] as const;
