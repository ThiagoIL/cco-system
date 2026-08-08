"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { emitRealtime } from "@/lib/realtime";

const reatribuirSchema = z.object({
  colaboradorId: z.string().optional(),
  viaturaId: z.string().optional(),
});

export async function reatribuirChamado(id: string, formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const data = reatribuirSchema.parse({
    colaboradorId: raw.colaboradorId || undefined,
    viaturaId: raw.viaturaId || undefined,
  });

  await prisma.chamado.update({
    where: { id },
    data: {
      colaboradorId: data.colaboradorId ?? null,
      viaturaId: data.viaturaId ?? null,
    },
  });

  emitRealtime("chamados:changed");
  revalidatePath("/programacao");
  revalidatePath("/mapa");
  revalidatePath("/dashboard");
}
