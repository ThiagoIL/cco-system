"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { calcularPrazoSla } from "@/lib/sla";
import { emitRealtime } from "@/lib/realtime";
import { chamadoSchema } from "./schema";

function parseForm(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  return chamadoSchema.parse({
    ...raw,
    colaboradorId: raw.colaboradorId || undefined,
    viaturaId: raw.viaturaId || undefined,
    dataProgramada: raw.dataProgramada || undefined,
  });
}

export async function createChamado(formData: FormData) {
  const session = await auth();
  const data = parseForm(formData);

  const dataAbertura = new Date();
  const prazoSla = calcularPrazoSla(dataAbertura, data.slaClasse);

  const chamado = await prisma.chamado.create({
    data: {
      cliente: data.cliente,
      endereco: data.endereco || null,
      regiao: data.regiao || null,
      descricao: data.descricao || null,
      origem: data.origem,
      classificacao: data.classificacao,
      slaClasse: data.slaClasse,
      status: data.status,
      dataAbertura,
      prazoSla,
      dataProgramada: data.dataProgramada ? new Date(data.dataProgramada) : null,
      colaboradorId: data.colaboradorId ?? null,
      viaturaId: data.viaturaId ?? null,
      createdById: session?.user?.id,
    },
  });

  emitRealtime("chamados:changed");
  revalidatePath("/chamados");
  revalidatePath("/dashboard");
  redirect(`/chamados/${chamado.id}`);
}

export async function updateChamado(id: string, formData: FormData) {
  const data = parseForm(formData);

  const atual = await prisma.chamado.findUniqueOrThrow({ where: { id } });

  // Reclassificar o SLA recalcula o prazo a partir da abertura original.
  const prazoSla =
    data.slaClasse !== atual.slaClasse
      ? calcularPrazoSla(atual.dataAbertura, data.slaClasse)
      : atual.prazoSla;

  const dataConclusao =
    data.status === "CONCLUIDO" ? (atual.dataConclusao ?? new Date()) : null;

  await prisma.chamado.update({
    where: { id },
    data: {
      cliente: data.cliente,
      endereco: data.endereco || null,
      regiao: data.regiao || null,
      descricao: data.descricao || null,
      origem: data.origem,
      classificacao: data.classificacao,
      slaClasse: data.slaClasse,
      status: data.status,
      prazoSla,
      dataConclusao,
      dataProgramada: data.dataProgramada ? new Date(data.dataProgramada) : null,
      colaboradorId: data.colaboradorId ?? null,
      viaturaId: data.viaturaId ?? null,
    },
  });

  emitRealtime("chamados:changed");
  revalidatePath("/chamados");
  revalidatePath(`/chamados/${id}`);
  revalidatePath("/dashboard");
  redirect(`/chamados/${id}`);
}

export async function deleteChamado(id: string) {
  await prisma.chamado.delete({ where: { id } });
  emitRealtime("chamados:changed");
  revalidatePath("/chamados");
  revalidatePath("/dashboard");
  redirect("/chamados");
}
