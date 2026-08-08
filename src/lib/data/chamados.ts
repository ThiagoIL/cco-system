import { prisma } from "@/lib/prisma";
import { semaforoSla, type SemaforoSla } from "@/lib/sla";
import type { StatusChamado } from "@/generated/prisma/enums";

const chamadoInclude = {
  colaborador: true,
  viatura: true,
  createdBy: { select: { id: true, nome: true } },
} as const;

export type ChamadoComRelacoes = Awaited<
  ReturnType<typeof listChamados>
>[number];

export async function listChamados(filters?: {
  status?: StatusChamado[];
  busca?: string;
  colaboradorId?: string;
  dataProgramada?: { gte?: Date; lte?: Date };
}) {
  const chamados = await prisma.chamado.findMany({
    where: {
      status: filters?.status ? { in: filters.status } : undefined,
      colaboradorId: filters?.colaboradorId,
      dataProgramada: filters?.dataProgramada,
      OR: filters?.busca
        ? [
            { cliente: { contains: filters.busca, mode: "insensitive" } },
            { regiao: { contains: filters.busca, mode: "insensitive" } },
            { endereco: { contains: filters.busca, mode: "insensitive" } },
          ]
        : undefined,
    },
    include: chamadoInclude,
    orderBy: { dataAbertura: "desc" },
  });

  return chamados.map((chamado) => ({
    ...chamado,
    semaforo: semaforoSla(chamado.prazoSla, chamado.slaClasse, chamado.dataConclusao),
  }));
}

export async function getChamadoById(id: string) {
  const chamado = await prisma.chamado.findUnique({
    where: { id },
    include: {
      ...chamadoInclude,
      pendencias: {
        include: { responsavel: true },
        orderBy: { createdAt: "desc" },
      },
      retornos: {
        include: { colaborador: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!chamado) return null;

  const semaforo: SemaforoSla = semaforoSla(
    chamado.prazoSla,
    chamado.slaClasse,
    chamado.dataConclusao
  );

  return { ...chamado, semaforo };
}

export async function dashboardCounts() {
  const inicioHoje = new Date();
  inicioHoje.setHours(0, 0, 0, 0);
  const fimHoje = new Date();
  fimHoje.setHours(23, 59, 59, 999);
  const agora = new Date();

  const [
    recebidosHoje,
    concluidosHoje,
    pendentes,
    retornosPendentes,
    emAberto,
    colaboradoresAtivos,
    viaturas,
    backlog,
  ] = await Promise.all([
    prisma.chamado.count({
      where: { dataAbertura: { gte: inicioHoje, lte: fimHoje } },
    }),
    prisma.chamado.count({
      where: { dataConclusao: { gte: inicioHoje, lte: fimHoje } },
    }),
    prisma.chamado.count({
      where: { status: { notIn: ["CONCLUIDO"] } },
    }),
    // "Retornos pendentes": chamados com um retorno registrado cuja nova
    // visita ainda não foi concluída (ver createRetorno em retornos/actions.ts).
    prisma.chamado.count({ where: { status: "RETORNO_PROGRAMADO" } }),
    prisma.chamado.findMany({
      where: { status: { notIn: ["CONCLUIDO"] } },
      select: { prazoSla: true, slaClasse: true },
    }),
    prisma.colaborador.groupBy({
      by: ["status"],
      where: { ativo: true, tipo: { in: ["TECNICO", "TI", "AJUDANTE"] } },
      _count: true,
    }),
    prisma.viatura.groupBy({ by: ["status"], where: { ativo: true }, _count: true }),
    prisma.chamado.count({
      where: { status: { notIn: ["CONCLUIDO"] }, dataAbertura: { lt: inicioHoje } },
    }),
  ]);

  let slaRisco = 0;
  let slaVencido = 0;
  for (const c of emAberto) {
    const semaforo = semaforoSla(c.prazoSla, c.slaClasse, null, agora);
    if (semaforo === "AMARELO") slaRisco++;
    if (semaforo === "VERMELHO") slaVencido++;
  }

  const colabCount = (status: string) =>
    colaboradoresAtivos.find((c) => c.status === status)?._count ?? 0;
  const viaturaCount = (status: string) =>
    viaturas.find((v) => v.status === status)?._count ?? 0;

  return {
    recebidosHoje,
    concluidosHoje,
    pendentes,
    retornosPendentes,
    slaRisco,
    slaVencido,
    tecnicosDisponiveis: colabCount("DISPONIVEL"),
    tecnicosEmAtendimento: colabCount("EM_ATENDIMENTO"),
    tecnicosEmDeslocamento: colabCount("EM_DESLOCAMENTO"),
    viaturasDisponiveis: viaturaCount("DISPONIVEL"),
    viaturasEmUso: viaturaCount("EM_USO"),
    backlog,
  };
}
