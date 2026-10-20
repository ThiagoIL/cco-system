"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { emitRealtime } from "@/lib/realtime";
import { toErrorMessage, type ActionState } from "@/lib/action-result";

const colaboradorSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome"),
  tipo: z.enum(["TECNICO", "TI", "AJUDANTE", "ESTAGIARIO"]),
  status: z.enum(["DISPONIVEL", "EM_ATENDIMENTO", "EM_DESLOCAMENTO", "FOLGA"]),
});

export async function createColaborador(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const data = colaboradorSchema.parse(Object.fromEntries(formData.entries()));
    await prisma.colaborador.create({ data });
  } catch (error) {
    return { error: toErrorMessage(error) };
  }
  emitRealtime("colaboradores:changed");
  revalidatePath("/equipes");
  revalidatePath("/dashboard");
  return null;
}

export async function updateColaboradorStatus(id: string, formData: FormData) {
  const status = z
    .enum(["DISPONIVEL", "EM_ATENDIMENTO", "EM_DESLOCAMENTO", "FOLGA"])
    .parse(formData.get("status"));
  await prisma.colaborador.update({ where: { id }, data: { status } });
  emitRealtime("colaboradores:changed");
  revalidatePath("/equipes");
  revalidatePath("/dashboard");
  revalidatePath("/mapa");
}

export async function toggleColaboradorAtivo(id: string, ativo: boolean) {
  await prisma.colaborador.update({ where: { id }, data: { ativo: !ativo } });
  emitRealtime("colaboradores:changed");
  revalidatePath("/equipes");
  revalidatePath("/dashboard");
}
