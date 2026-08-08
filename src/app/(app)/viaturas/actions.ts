"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { emitRealtime } from "@/lib/realtime";

export async function createViatura(formData: FormData) {
  const nome = z.string().min(1).parse(formData.get("nome"));
  await prisma.viatura.create({ data: { nome } });
  emitRealtime("viaturas:changed");
  revalidatePath("/viaturas");
  revalidatePath("/dashboard");
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
