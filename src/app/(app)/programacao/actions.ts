"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { emitRealtime } from "@/lib/realtime";
import { sincronizarRecursos } from "@/lib/recursos";
import { toErrorMessage, type ActionState } from "@/lib/action-result";

const HORA_PADRAO = "08:00";

const movimentoSchema = z.discriminatedUnion("tipo", [
  // valor = id do colaborador ("" = sem técnico). Se o chamado ainda não tem data,
  // é programado para `dia` (yyyy-MM-dd).
  z.object({ tipo: z.literal("colaborador"), valor: z.string(), dia: z.string() }),
  z.object({ tipo: z.literal("viatura"), valor: z.string() }),
  z.object({ tipo: z.literal("regiao"), valor: z.string() }),
  // valor = novo dia (yyyy-MM-dd, "" = sem data). Mantém o horário já programado.
  z.object({ tipo: z.literal("data"), valor: z.string() }),
]);

export type MovimentoChamado = z.infer<typeof movimentoSchema>;

function dataValida(dia: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dia) && !Number.isNaN(new Date(`${dia}T00:00:00`).getTime());
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export async function moverChamado(
  id: string,
  movimento: MovimentoChamado
): Promise<ActionState> {
  try {
    const mov = movimentoSchema.parse(movimento);
    const atual = await prisma.chamado.findUniqueOrThrow({ where: { id } });

    // Chamados concluídos ficam como estão (só a viatura/região podem ser corrigidas).
    if (atual.status === "CONCLUIDO" && (mov.tipo === "colaborador" || mov.tipo === "data")) {
      return { error: "Chamados concluídos não podem ser reprogramados." };
    }

    const dados: {
      colaboradorId?: string | null;
      viaturaId?: string | null;
      regiao?: string | null;
      dataProgramada?: Date | null;
      status?: "NOVO" | "PROGRAMADO";
    } = {};

    if (mov.tipo === "colaborador") {
      dados.colaboradorId = mov.valor || null;
      // Atribuir um chamado sem data a um técnico o programa para o dia em tela.
      if (mov.valor && !atual.dataProgramada && dataValida(mov.dia)) {
        dados.dataProgramada = new Date(`${mov.dia}T${HORA_PADRAO}:00`);
      }
    } else if (mov.tipo === "viatura") {
      dados.viaturaId = mov.valor || null;
    } else if (mov.tipo === "regiao") {
      dados.regiao = mov.valor.trim() || null;
    } else if (mov.valor === "") {
      dados.dataProgramada = null;
    } else {
      if (!dataValida(mov.valor)) throw new Error("Data inválida");
      const hora = atual.dataProgramada
        ? `${pad(atual.dataProgramada.getHours())}:${pad(atual.dataProgramada.getMinutes())}`
        : HORA_PADRAO;
      dados.dataProgramada = new Date(`${mov.valor}T${hora}:00`);
    }

    // Programar tira o chamado de "Novo"; desprogramar devolve para "Novo".
    if ("dataProgramada" in dados) {
      if (dados.dataProgramada && atual.status === "NOVO") dados.status = "PROGRAMADO";
      if (!dados.dataProgramada && atual.status === "PROGRAMADO") dados.status = "NOVO";
    } else if (dados.colaboradorId && atual.status === "NOVO" && atual.dataProgramada) {
      dados.status = "PROGRAMADO";
    }

    const atualizado = await prisma.chamado.update({ where: { id }, data: dados });
    await sincronizarRecursos({
      colaboradores: [atual.colaboradorId, atualizado.colaboradorId],
      viaturas: [atual.viaturaId, atualizado.viaturaId],
    });
  } catch (error) {
    return { error: toErrorMessage(error) };
  }

  emitRealtime("chamados:changed");
  revalidatePath("/programacao");
  revalidatePath("/chamados");
  revalidatePath("/mapa");
  revalidatePath("/dashboard");
  return null;
}
