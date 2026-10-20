import { addDays, format, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { semaforoSla, type SemaforoSla } from "@/lib/sla";

const ORDEM_SEMAFORO: Record<SemaforoSla, number> = { VERMELHO: 0, AMARELO: 1, VERDE: 2 };

/**
 * Dados complementares do Dashboard além dos contadores:
 * fila de atenção (chamados abertos mais urgentes), distribuições, série dos
 * últimos 7 dias e o quadro de técnicos/viaturas.
 */
export async function dashboardPainel() {
  const agora = new Date();
  const inicio7 = startOfDay(addDays(agora, -6));

  const [abertos, recentes, colaboradores, viaturas] = await Promise.all([
    prisma.chamado.findMany({
      where: { status: { not: "CONCLUIDO" } },
      include: { colaborador: true, viatura: true },
    }),
    prisma.chamado.findMany({
      where: { OR: [{ dataAbertura: { gte: inicio7 } }, { dataConclusao: { gte: inicio7 } }] },
      select: { dataAbertura: true, dataConclusao: true },
    }),
    prisma.colaborador.findMany({
      where: { ativo: true, tipo: { in: ["TECNICO", "TI", "AJUDANTE"] } },
      orderBy: { nome: "asc" },
      include: {
        chamados: {
          where: { status: { in: ["EM_ATENDIMENTO", "EM_DESLOCAMENTO"] } },
          take: 1,
        },
      },
    }),
    prisma.viatura.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      include: {
        chamados: {
          where: { status: { in: ["EM_ATENDIMENTO", "EM_DESLOCAMENTO"] } },
          take: 1,
        },
      },
    }),
  ]);

  const abertosComSemaforo = abertos.map((c) => ({
    ...c,
    semaforo: semaforoSla(c.prazoSla, c.slaClasse, null, agora),
  }));

  const filaAtencao = [...abertosComSemaforo]
    .sort(
      (a, b) =>
        ORDEM_SEMAFORO[a.semaforo] - ORDEM_SEMAFORO[b.semaforo] ||
        a.classificacao.localeCompare(b.classificacao) ||
        a.prazoSla.getTime() - b.prazoSla.getTime()
    )
    .slice(0, 8);

  const contar = <K extends string>(chave: (c: (typeof abertos)[number]) => K) => {
    const mapa = new Map<K, number>();
    for (const c of abertos) mapa.set(chave(c), (mapa.get(chave(c)) ?? 0) + 1);
    return mapa;
  };
  const porStatus = contar((c) => c.status);
  const porClassificacao = contar((c) => c.classificacao);

  // Série dos últimos 7 dias (dias no fuso do servidor, America/Sao_Paulo).
  const serie = Array.from({ length: 7 }, (_, i) => {
    const dia = addDays(inicio7, i);
    return { chave: format(dia, "yyyy-MM-dd"), dia: format(dia, "dd/MM"), recebidos: 0, concluidos: 0 };
  });
  const indice = new Map(serie.map((s) => [s.chave, s]));
  for (const c of recentes) {
    const aberto = indice.get(format(c.dataAbertura, "yyyy-MM-dd"));
    if (aberto) aberto.recebidos++;
    if (c.dataConclusao) {
      const concluido = indice.get(format(c.dataConclusao, "yyyy-MM-dd"));
      if (concluido) concluido.concluidos++;
    }
  }

  return {
    filaAtencao,
    porStatus,
    porClassificacao,
    serie: serie.map(({ dia, recebidos, concluidos }) => ({ dia, recebidos, concluidos })),
    colaboradores,
    viaturas,
  };
}
