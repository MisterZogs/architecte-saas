import { type CabinetSettings } from 'wasp/entities';
import { HttpError } from 'wasp/server';
import type { GetCabinetSettings, SaveCabinetSettings } from 'wasp/server/operations';

export const getCabinetSettings: GetCabinetSettings<void, CabinetSettings | null> = async (_args, context) => {
  if (!context.user) throw new HttpError(401);
  return context.entities.CabinetSettings.findUnique({
    where: { userId: context.user.id },
  });
};

export const saveCabinetSettings: SaveCabinetSettings<
  {
    nomCabinet?: string;
    adresse?: string;
    telephone?: string;
    email?: string;
    siteWeb?: string;
    logo?: string;
    logoMime?: string;
  },
  CabinetSettings
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);
  return context.entities.CabinetSettings.upsert({
    where: { userId: context.user.id },
    create: {
      userId: context.user.id,
      nomCabinet: args.nomCabinet ?? null,
      adresse: args.adresse ?? null,
      telephone: args.telephone ?? null,
      email: args.email ?? null,
      siteWeb: args.siteWeb ?? null,
      logo: args.logo ?? null,
      logoMime: args.logoMime ?? null,
    },
    update: {
      ...(args.nomCabinet !== undefined && { nomCabinet: args.nomCabinet || null }),
      ...(args.adresse !== undefined && { adresse: args.adresse || null }),
      ...(args.telephone !== undefined && { telephone: args.telephone || null }),
      ...(args.email !== undefined && { email: args.email || null }),
      ...(args.siteWeb !== undefined && { siteWeb: args.siteWeb || null }),
      ...(args.logo !== undefined && { logo: args.logo || null }),
      ...(args.logoMime !== undefined && { logoMime: args.logoMime || null }),
    },
  });
};
