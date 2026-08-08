"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { emitRealtime } from "@/lib/realtime";

const colaboradorSchema = z.object({
  nome: z.string().min(1, "Informe o nome"),
  tipo: z.enum(["TECNICO", "TI", "AJUDANTE", "ESTAGIARIO"]),
  status: z.enum(["DISPONIVEL", "EM_ATENDIMENTO", "EM_DESLOCAMENTO", "FOLGA"]),
});

export async function createColaborador(formData: FormData) {
  const data = colaboradorSchema.parse(Object.fromEntries(formData.entries()));
  await prisma.colaborador.create({ data });
  emitRealtime("colaboradores:changed");
  revalidatePath("/equipes");
  revalidatePath("/dashboard");
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
