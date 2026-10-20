import { prisma } from "@/lib/prisma";
import { emitRealtime } from "@/lib/realtime";

type Id = string | null | undefined;

const EM_CAMPO = ["EM_DESLOCAMENTO", "EM_ATENDIMENTO"] as const;

/**
 * Mantém o status dos técnicos e das viaturas coerente com os chamados:
 *  - técnico com chamado "Em atendimento" → Em atendimento; "Em deslocamento" → Em deslocamento;
 *    sem nenhum dos dois volta a Disponível (Folga nunca é alterada);
 *  - viatura com chamado em campo → Em uso; sem nenhum volta a Disponível
 *    (Manutenção e Reserva nunca são alteradas).
 *
 * Chame depois de qualquer mudança de status/atribuição de chamado, passando os
 * ids antigos e novos (o técnico/viatura que saiu do chamado também precisa ser reavaliado).
 */
export async function sincronizarRecursos(ids: { colaboradores?: Id[]; viaturas?: Id[] }) {
  const colaboradorIds = [...new Set((ids.colaboradores ?? []).filter((id): id is string => !!id))];
  const viaturaIds = [...new Set((ids.viaturas ?? []).filter((id): id is string => !!id))];
  let colaboradoresMudaram = false;
  let viaturasMudaram = false;

  for (const id of colaboradorIds) {
    const [colaborador, atendendo, deslocando] = await Promise.all([
      prisma.colaborador.findUnique({ where: { id }, select: { status: true } }),
      prisma.chamado.count({ where: { colaboradorId: id, status: "EM_ATENDIMENTO" } }),
      prisma.chamado.count({ where: { colaboradorId: id, status: "EM_DESLOCAMENTO" } }),
    ]);
    if (!colaborador || colaborador.status === "FOLGA") continue;

    const alvo = atendendo > 0 ? "EM_ATENDIMENTO" : deslocando > 0 ? "EM_DESLOCAMENTO" : "DISPONIVEL";
    if (alvo !== colaborador.status) {
      await prisma.colaborador.update({ where: { id }, data: { status: alvo } });
      colaboradoresMudaram = true;
    }
  }

  for (const id of viaturaIds) {
    const [viatura, emCampo] = await Promise.all([
      prisma.viatura.findUnique({ where: { id }, select: { status: true } }),
      prisma.chamado.count({ where: { viaturaId: id, status: { in: [...EM_CAMPO] } } }),
    ]);
    if (!viatura || viatura.status === "MANUTENCAO" || viatura.status === "RESERVA") continue;

    const alvo = emCampo > 0 ? "EM_USO" : "DISPONIVEL";
    if (alvo !== viatura.status) {
      await prisma.viatura.update({ where: { id }, data: { status: alvo } });
      viaturasMudaram = true;
    }
  }

  if (colaboradoresMudaram) emitRealtime("colaboradores:changed");
  if (viaturasMudaram) emitRealtime("viaturas:changed");
}
