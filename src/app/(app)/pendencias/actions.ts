"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { emitRealtime } from "@/lib/realtime";

const pendenciaSchema = z.object({
  chamadoId: z.string().min(1),
  responsavelId: z.string().min(1, "Toda pendência precisa de um responsável"),
  motivo: z.string().min(1, "Informe o motivo"),
  prazo: z.string().min(1, "Informe o prazo"),
  dataPrevista: z.string().min(1, "Informe a data prevista"),
});

export async function createPendencia(formData: FormData) {
  const data = pendenciaSchema.parse(Object.fromEntries(formData.entries()));

  await prisma.pendencia.create({
    data: {
      chamadoId: data.chamadoId,
      responsavelId: data.responsavelId,
      motivo: data.motivo,
      prazo: new Date(data.prazo),
      dataPrevista: new Date(data.dataPrevista),
    },
  });

  emitRealtime("pendencias:changed");
  revalidatePath(`/chamados/${data.chamadoId}`);
  revalidatePath("/pendencias");
  revalidatePath("/dashboard");
}

export async function resolverPendencia(id: string, chamadoId: string) {
  await prisma.pendencia.update({
    where: { id },
    data: { status: "RESOLVIDA" },
  });

  emitRealtime("pendencias:changed");
  revalidatePath(`/chamados/${chamadoId}`);
  revalidatePath("/pendencias");
  revalidatePath("/dashboard");
}
