import { type CrChantier } from 'wasp/entities';
import { HttpError } from 'wasp/server';
import type { GetCrsByUser, SaveCr, DeleteCr } from 'wasp/server/operations';

export const getCrsByUser: GetCrsByUser<void, CrChantier[]> = async (_args, context) => {
  if (!context.user) throw new HttpError(401);
  return context.entities.CrChantier.findMany({
    where: { userId: context.user.id },
    orderBy: { createdAt: 'desc' },
  });
};

export const saveCr: SaveCr<
  { projet: string; dateReunion?: string; crData: Record<string, unknown> },
  CrChantier
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);
  return context.entities.CrChantier.create({
    data: {
      userId: context.user.id,
      projet: args.projet,
      dateReunion: args.dateReunion ?? null,
      crData: args.crData as any,
    },
  });
};

export const deleteCr: DeleteCr<{ id: string }, CrChantier> = async ({ id }, context) => {
  if (!context.user) throw new HttpError(401);
  const existing = await context.entities.CrChantier.findFirst({
    where: { id, userId: context.user.id },
  });
  if (!existing) throw new HttpError(404);
  return context.entities.CrChantier.delete({ where: { id } });
};
