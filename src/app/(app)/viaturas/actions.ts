"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { emitRealtime } from "@/lib/realtime";
import { toErrorMessage, type ActionState } from "@/lib/action-result";

export async function createViatura(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const nome = z
      .string()
      .trim()
      .min(1, "Informe a identificação da viatura")
      .parse(formData.get("nome"));

    const existente = await prisma.viatura.findFirst({
      where: { nome: { equals: nome, mode: "insensitive" } },
    });
    if (existente) return { error: `Já existe uma viatura chamada "${existente.nome}".` };

    await prisma.viatura.create({ data: { nome } });
  } catch (error) {
    return { error: toErrorMessage(error) };
  }
  emitRealtime("viaturas:changed");
  revalidatePath("/viaturas");
  revalidatePath("/dashboard");
  return null;
}

export async function updateViaturaStatus(id: string, formData: FormData) {
  const status = z
    .enum(["DISPONIVEL", "EM_USO", "MANUTENCAO", "RESERVA"])
    .parse(formData.get("status"));
  await prisma.viatura.update({ where: { id }, data: { status } });
  emitRealtime("viaturas:changed");
  revalidatePath("/viaturas");
  revalidatePath("/dashboard");
  revalidatePath("/mapa");
}
