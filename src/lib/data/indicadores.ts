import { prisma } from "@/lib/prisma";

const TRINTA_DIAS_MS = 30 * 24 * 60 * 60 * 1000;

export async function indicadoresOperacao() {
  const desde = new Date(Date.now() - TRINTA_DIAS_MS);
  const inicioHoje = new Date();
  inicioHoje.setHours(0, 0, 0, 0);

  const [concluidos30d, retornos30d, backlog, concluidosNoPrazo] = await Promise.all([
    prisma.chamado.count({ where: { dataConclusao: { gte: desde } } }),
    prisma.retorno.count({ where: { data: { gte: desde } } }),
    prisma.chamado.count({
      where: { status: { notIn: ["CONCLUIDO"] }, dataAbertura: { lt: inicioHoje } },
    }),
    prisma.chamado.count({
      where: {
        dataConclusao: { gte: desde },
        // dataConclusao <= prazoSla (cumprido)
      },
    }),
  ]);

  // SLA cumprido calculado em memória (comparação entre duas colunas).
  const concluidosDetalhe = await prisma.chamado.findMany({
    where: { dataConclusao: { gte: desde } },
    select: { dataConclusao: true, prazoSla: true },
  });
  const cumpridos = concluidosDetalhe.filter(
    (c) => c.dataConclusao && c.dataConclusao <= c.prazoSla
  ).length;
  const slaPercentual =
    concluidosDetalhe.length > 0
      ? Math.round((cumpridos / concluidosDetalhe.length) * 100)
      : 100;

  return {
    concluidos30d,
    retornos30d,
    backlog,
    slaPercentual,
    totalConcluidosDetalhe: concluidosNoPrazo,
  };
}

export async function indicadoresPorTecnico() {
  const desde = new Date(Date.now() - TRINTA_DIAS_MS);

  const tecnicos = await prisma.colaborador.findMany({
    where: { ativo: true, tipo: { in: ["TECNICO", "TI", "AJUDANTE"] } },
    orderBy: { nome: "asc" },
  });

  const resultado = await Promise.all(
    tecnicos.map(async (tecnico) => {
      const [concluidos, retornosGerados, pendenciasAbertas] = await Promise.all([
        prisma.chamado.findMany({
          where: {
            colaboradorId: tecnico.id,
            dataConclusao: { gte: desde },
          },
          select: { dataAbertura: true, dataConclusao: true, prazoSla: true },
        }),
        prisma.retorno.count({
          where: { colaboradorId: tecnico.id, data: { gte: desde } },
        }),
        prisma.pendencia.count({
          where: { responsavelId: tecnico.id, status: "ABERTA" },
        }),
      ]);

      const osConcluidas = concluidos.length;
      const cumpridosNoPrazo = concluidos.filter(
        (c) => c.dataConclusao && c.dataConclusao <= c.prazoSla
      ).length;
      const slaPercentual =
        osConcluidas > 0 ? Math.round((cumpridosNoPrazo / osConcluidas) * 100) : null;

      const horasTotais = concluidos.reduce((soma, c) => {
        if (!c.dataConclusao) return soma;
        const horas =
          (c.dataConclusao.getTime() - c.dataAbertura.getTime()) / (1000 * 60 * 60);
        return soma + Math.max(horas, 0);
      }, 0);
      const tempoMedioHoras = osConcluidas > 0 ? horasTotais / osConcluidas : 0;

      return {
        colaborador: tecnico,
        osConcluidas,
        tempoMedioHoras: Math.round(tempoMedioHoras * 10) / 10,
        horasProdutivas: Math.round(horasTotais * 10) / 10,
        retornosGerados,
        pendenciasAbertas,
        slaPercentual,
      };
    })
  );

  return resultado.sort((a, b) => b.osConcluidas - a.osConcluidas);
}
