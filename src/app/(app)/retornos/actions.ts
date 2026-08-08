"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { emitRealtime } from "@/lib/realtime";

const retornoSchema = z.object({
  chamadoId: z.string().min(1),
  motivo: z.string().min(1, "Informe o motivo do retorno"),
  cliente: z.string().min(1, "Informe o cliente"),
  data: z.string().min(1, "Informe a data"),
  colaboradorId: z.string().optional(),
});

export async function createRetorno(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const data = retornoSchema.parse({
    ...raw,
    colaboradorId: raw.colaboradorId || undefined,
  });

  await prisma.retorno.create({
    data: {
      chamadoId: data.chamadoId,
      motivo: data.motivo,
      cliente: data.cliente,
      data: new Date(data.data),
      colaboradorId: data.colaboradorId ?? null,
    },
  });

  // Retornos represent rework, so we route the call back into the queue.
  await prisma.chamado.update({
    where: { id: data.chamadoId },
    data: { status: "RETORNO_PROGRAMADO" },
  });

  emitRealtime("retornos:changed");
  emitRealtime("chamados:changed");
  revalidatePath(`/chamados/${data.chamadoId}`);
  revalidatePath("/retornos");
  revalidatePath("/chamados");
  revalidatePath("/dashboard");
}
