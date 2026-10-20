"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { emitRealtime } from "@/lib/realtime";
import { isDataValida, toErrorMessage, type ActionState } from "@/lib/action-result";

const pendenciaSchema = z.object({
  chamadoId: z.string().min(1),
  responsavelId: z.string().min(1, "Toda pendência precisa de um responsável"),
  motivo: z.string().trim().min(1, "Informe o motivo"),
  prazo: z.string().min(1, "Informe o prazo").refine(isDataValida, "Prazo inválido"),
  dataPrevista: z
    .string()
    .min(1, "Informe a data prevista")
    .refine(isDataValida, "Data prevista inválida"),
});

export async function createPendencia(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  let chamadoId: string;
  try {
    const data = pendenciaSchema.parse(Object.fromEntries(formData.entries()));
    chamadoId = data.chamadoId;

    await prisma.pendencia.create({
      data: {
        chamadoId: data.chamadoId,
        responsavelId: data.responsavelId,
        motivo: data.motivo,
        prazo: new Date(data.prazo),
        dataPrevista: new Date(data.dataPrevista),
      },
    });
  } catch (error) {
    return { error: toErrorMessage(error) };
  }

  emitRealtime("pendencias:changed");
  revalidatePath(`/chamados/${chamadoId}`);
  revalidatePath("/pendencias");
  revalidatePath("/dashboard");
  return null;
}

export async function resolverPendencia(id: string, chamadoId: string) {
  // Filtra também por chamadoId para não resolver uma pendência de outro chamado.
  await prisma.pendencia.updateMany({
    where: { id, chamadoId },
    data: { status: "RESOLVIDA" },
  });

  emitRealtime("pendencias:changed");
  revalidatePath(`/chamados/${chamadoId}`);
  revalidatePath("/pendencias");
  revalidatePath("/dashboard");
}
