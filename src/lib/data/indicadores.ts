import { prisma } from "@/lib/prisma";
import type { ClasseSla } from "@/generated/prisma/enums";

const DIA_MS = 24 * 60 * 60 * 1000;

export const PERIODOS = [7, 30, 90] as const;
export type PeriodoDias = (typeof PERIODOS)[number];

function desde(dias: number) {
  return new Date(Date.now() - dias * DIA_MS);
}

const percentual = (parte: number, total: number) =>
  total > 0 ? Math.round((parte / total) * 100) : null;

const umaCasa = (n: number) => Math.round(n * 10) / 10;

export async function indicadoresOperacao(dias: number) {
  const inicio = desde(dias);
  const inicioHoje = new Date();
  inicioHoje.setHours(0, 0, 0, 0);

  const [retornos, backlog, pendenciasAbertas, concluidos] = await Promise.all([
    prisma.retorno.count({ where: { data: { gte: inicio } } }),
    prisma.chamado.count({
      where: { status: { notIn: ["CONCLUIDO"] }, dataAbertura: { lt: inicioHoje } },
    }),
    prisma.pendencia.count({ where: { status: "ABERTA" } }),
    // SLA cumprido é calculado em memória (comparação entre duas colunas).
    prisma.chamado.findMany({
      where: { dataConclusao: { gte: inicio } },
      select: { dataConclusao: true, dataAbertura: true, prazoSla: true, slaClasse: true },
    }),
  ]);

  const noPrazo = (c: (typeof concluidos)[number]) => !!c.dataConclusao && c.dataConclusao <= c.prazoSla;

  const porClasse = (["A", "B", "C", "D"] as ClasseSla[]).map((classe) => {
    const doGrupo = concluidos.filter((c) => c.slaClasse === classe);
    return {
      classe,
      total: doGrupo.length,
      slaPercentual: percentual(doGrupo.filter(noPrazo).length, doGrupo.length),
    };
  });

  const horasTotais = concluidos.reduce(
    (soma, c) =>
      c.dataConclusao ? soma + Math.max((c.dataConclusao.getTime() - c.dataAbertura.getTime()) / 36e5, 0) : soma,
    0
  );

  return {
    concluidos: concluidos.length,
    retornos,
    backlog,
    pendenciasAbertas,
    // Sem chamados concluídos no período não há SLA a medir (null, não 100%).
    slaPercentual: percentual(concluidos.filter(noPrazo).length, concluidos.length),
    osPorDia: umaCasa(concluidos.length / dias),
    tempoMedioHoras: concluidos.length ? umaCasa(horasTotais / concluidos.length) : 0,
    taxaRetorno: percentual(retornos, concluidos.length),
    porClasse,
  };
}

export type IndicadorTecnico = Awaited<ReturnType<typeof indicadoresPorTecnico>>[number];

export async function indicadoresPorTecnico(dias: number) {
  const inicio = desde(dias);

  const [tecnicos, concluidos, retornos, pendencias] = await Promise.all([
    prisma.colaborador.findMany({
      where: { ativo: true, tipo: { in: ["TECNICO", "TI", "AJUDANTE"] } },
      orderBy: { nome: "asc" },
    }),
    prisma.chamado.findMany({
      where: { dataConclusao: { gte: inicio }, colaboradorId: { not: null } },
      select: { colaboradorId: true, dataAbertura: true, dataConclusao: true, prazoSla: true },
    }),
    prisma.retorno.groupBy({
      by: ["colaboradorId"],
      where: { data: { gte: inicio }, colaboradorId: { not: null } },
      _count: true,
    }),
    prisma.pendencia.groupBy({
      by: ["responsavelId"],
      where: { status: "ABERTA" },
      _count: true,
    }),
  ]);

  const resultado = tecnicos.map((tecnico) => {
    const meus = concluidos.filter((c) => c.colaboradorId === tecnico.id);
    const cumpridosNoPrazo = meus.filter((c) => c.dataConclusao && c.dataConclusao <= c.prazoSla).length;
    const horasTotais = meus.reduce(
      (soma, c) =>
        c.dataConclusao ? soma + Math.max((c.dataConclusao.getTime() - c.dataAbertura.getTime()) / 36e5, 0) : soma,
      0
    );

    return {
      colaborador: tecnico,
      osConcluidas: meus.length,
      cumpridosNoPrazo,
      tempoMedioHoras: meus.length ? umaCasa(horasTotais / meus.length) : 0,
      horasProdutivas: umaCasa(horasTotais),
      retornosGerados: retornos.find((r) => r.colaboradorId === tecnico.id)?._count ?? 0,
      pendenciasAbertas: pendencias.find((p) => p.responsavelId === tecnico.id)?._count ?? 0,
      slaPercentual: percentual(cumpridosNoPrazo, meus.length),
    };
  });

  return resultado.sort((a, b) => b.osConcluidas - a.osConcluidas);
}

/** Visão de supervisão: produtividade, SLA e pendências agregados por equipe (tipo de colaborador). */
export function indicadoresPorEquipe(porTecnico: IndicadorTecnico[]) {
  const grupos = new Map<string, IndicadorTecnico[]>();
  for (const t of porTecnico) {
    const lista = grupos.get(t.colaborador.tipo) ?? [];
    lista.push(t);
    grupos.set(t.colaborador.tipo, lista);
  }

  const ordem = ["TECNICO", "TI", "AJUDANTE", "ESTAGIARIO"];
  const ordenados = [...grupos.entries()].sort(([a], [b]) => ordem.indexOf(a) - ordem.indexOf(b));

  return ordenados.map(([tipo, membros]) => {
    const os = membros.reduce((s, m) => s + m.osConcluidas, 0);
    const cumpridos = membros.reduce((s, m) => s + m.cumpridosNoPrazo, 0);
    const horas = membros.reduce((s, m) => s + m.horasProdutivas, 0);
    return {
      tipo,
      membros: membros.length,
      osConcluidas: os,
      osPorMembro: umaCasa(os / membros.length),
      slaPercentual: percentual(cumpridos, os),
      tempoMedioHoras: os ? umaCasa(horas / os) : 0,
      retornosGerados: membros.reduce((s, m) => s + m.retornosGerados, 0),
      pendenciasAbertas: membros.reduce((s, m) => s + m.pendenciasAbertas, 0),
    };
  });
}
