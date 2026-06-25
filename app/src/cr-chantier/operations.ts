import { type CrChantier, type ProjetChantier } from 'wasp/entities';
import { HttpError } from 'wasp/server';
import type {
  GetCrsByUser,
  GetProjetsByUser,
  SaveCr,
  DeleteCr,
  CreateProjet,
  UpdateProjet,
  DeleteProjet,
} from 'wasp/server/operations';

export const getCrsByUser: GetCrsByUser<void, CrChantier[]> = async (_args, context) => {
  if (!context.user) throw new HttpError(401);
  return context.entities.CrChantier.findMany({
    where: { userId: context.user.id },
    orderBy: { createdAt: 'desc' },
  });
};

export const getProjetsByUser: GetProjetsByUser<void, ProjetChantier[]> = async (_args, context) => {
  if (!context.user) throw new HttpError(401);
  return context.entities.ProjetChantier.findMany({
    where: { userId: context.user.id },
    orderBy: { updatedAt: 'desc' },
  });
};

export const saveCr: SaveCr<
  {
    projet: string;
    dateReunion?: string;
    crData: { [key: string]: any };
    projetId?: string;
    updateProjetData?: boolean;
  },
  CrChantier
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);

  const cr = await context.entities.CrChantier.create({
    data: {
      userId: context.user.id,
      projet: args.projet,
      dateReunion: args.dateReunion ?? null,
      crData: args.crData as any,
      projetChantierId: args.projetId ?? null,
    },
  });

  if (args.projetId && args.updateProjetData) {
    const crData = args.crData as any;
    const lotsRecurrents = (crData.lots ?? []).map((l: any) => ({
      numero: l.numero,
      nom: l.nom,
      entreprise: l.entreprise ?? '',
    }));
    const intervenants = (crData.presents ?? []).map((p: any) => ({
      nom: p.nom,
      qualite: p.qualite ?? '',
      entreprise: p.entreprise ?? '',
    }));
    await context.entities.ProjetChantier.update({
      where: { id: args.projetId },
      data: { lotsRecurrents, intervenants },
    });
  }

  return cr;
};

export const deleteCr: DeleteCr<{ id: string }, CrChantier> = async ({ id }, context) => {
  if (!context.user) throw new HttpError(401);
  const existing = await context.entities.CrChantier.findFirst({
    where: { id, userId: context.user.id },
  });
  if (!existing) throw new HttpError(404);
  return context.entities.CrChantier.delete({ where: { id } });
};

export const createProjet: CreateProjet<
  { nom: string; adresse?: string },
  ProjetChantier
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);
  return context.entities.ProjetChantier.create({
    data: {
      userId: context.user.id,
      nom: args.nom,
      adresse: args.adresse ?? null,
    },
  });
};

export const updateProjet: UpdateProjet<
  {
    id: string;
    nom?: string;
    adresse?: string;
    lotsRecurrents?: any[];
    intervenants?: any[];
  },
  ProjetChantier
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);
  const existing = await context.entities.ProjetChantier.findFirst({
    where: { id: args.id, userId: context.user.id },
  });
  if (!existing) throw new HttpError(404);
  return context.entities.ProjetChantier.update({
    where: { id: args.id },
    data: {
      ...(args.nom !== undefined && { nom: args.nom }),
      ...(args.adresse !== undefined && { adresse: args.adresse }),
      ...(args.lotsRecurrents !== undefined && { lotsRecurrents: args.lotsRecurrents }),
      ...(args.intervenants !== undefined && { intervenants: args.intervenants }),
    },
  });
};

export const deleteProjet: DeleteProjet<{ id: string }, ProjetChantier> = async ({ id }, context) => {
  if (!context.user) throw new HttpError(401);
  const existing = await context.entities.ProjetChantier.findFirst({
    where: { id, userId: context.user.id },
  });
  if (!existing) throw new HttpError(404);
  return context.entities.ProjetChantier.delete({ where: { id } });
};
