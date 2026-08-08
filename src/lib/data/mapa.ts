import { prisma } from "@/lib/prisma";

/**
 * Painel operacional por colaborador: cliente atual (chamado em atendimento
 * ou deslocamento), próximo atendimento programado, status e viatura.
 */
export async function listMapaOperacional() {
  const colaboradores = await prisma.colaborador.findMany({
    where: { ativo: true, tipo: { in: ["TECNICO", "TI", "AJUDANTE"] } },
    orderBy: { nome: "asc" },
    include: {
      chamados: {
        where: { status: { notIn: ["CONCLUIDO"] } },
        include: { viatura: true },
        orderBy: { dataProgramada: "asc" },
      },
    },
  });

  const agora = new Date();

  return colaboradores.map((c) => {
    const atual = c.chamados.find((ch) =>
      ["EM_ATENDIMENTO", "EM_DESLOCAMENTO"].includes(ch.status)
    );
    const proximo = c.chamados
      .filter((ch) => ch.id !== atual?.id && ch.dataProgramada && ch.dataProgramada > agora)
      .sort((a, b) => a.dataProgramada!.getTime() - b.dataProgramada!.getTime())[0];

    const viatura = atual?.viatura ?? proximo?.viatura ?? null;

    return {
      colaborador: c,
      atual,
      proximo,
      viatura,
    };
  });
}
