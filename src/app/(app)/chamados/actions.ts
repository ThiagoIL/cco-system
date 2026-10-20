"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { calcularPrazoSla } from "@/lib/sla";
import { emitRealtime } from "@/lib/realtime";
import { sincronizarRecursos } from "@/lib/recursos";
import { toErrorMessage, type ActionState } from "@/lib/action-result";
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

export async function createChamado(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  let chamadoId: string;
  try {
    const session = await auth();
    const data = parseForm(formData);

    // Se o usuário da sessão foi removido do banco, o chamado ainda pode ser
    // criado — só fica sem autor registrado.
    const autor = session?.user?.id
      ? await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { id: true },
        })
      : null;

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
        createdById: autor?.id,
      },
    });
    chamadoId = chamado.id;
    await sincronizarRecursos({
      colaboradores: [chamado.colaboradorId],
      viaturas: [chamado.viaturaId],
    });
  } catch (error) {
    return { error: toErrorMessage(error) };
  }

  emitRealtime("chamados:changed");
  revalidatePath("/chamados");
  revalidatePath("/dashboard");
  redirect(`/chamados/${chamadoId}`);
}

export async function updateChamado(
  id: string,
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const data = parseForm(formData);

    const atual = await prisma.chamado.findUniqueOrThrow({ where: { id } });

    // Reclassificar o SLA recalcula o prazo a partir da abertura original.
    const prazoSla =
      data.slaClasse !== atual.slaClasse
        ? calcularPrazoSla(atual.dataAbertura, data.slaClasse)
        : atual.prazoSla;

    const dataConclusao =
      data.status === "CONCLUIDO" ? (atual.dataConclusao ?? new Date()) : null;

    const atualizado = await prisma.chamado.update({
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
    // Reavalia quem saiu do chamado e quem entrou.
    await sincronizarRecursos({
      colaboradores: [atual.colaboradorId, atualizado.colaboradorId],
      viaturas: [atual.viaturaId, atualizado.viaturaId],
    });
  } catch (error) {
    return { error: toErrorMessage(error) };
  }

  emitRealtime("chamados:changed");
  revalidatePath("/chamados");
  revalidatePath(`/chamados/${id}`);
  revalidatePath("/dashboard");
  redirect(`/chamados/${id}`);
}

export async function deleteChamado(id: string) {
  const existente = await prisma.chamado.findUnique({
    where: { id },
    select: { colaboradorId: true, viaturaId: true },
  });
  // deleteMany não falha se o chamado já foi removido (ex.: duplo clique).
  await prisma.chamado.deleteMany({ where: { id } });
  if (existente) {
    await sincronizarRecursos({
      colaboradores: [existente.colaboradorId],
      viaturas: [existente.viaturaId],
    });
  }
  emitRealtime("chamados:changed");
  revalidatePath("/chamados");
  revalidatePath("/dashboard");
  redirect("/chamados");
}
