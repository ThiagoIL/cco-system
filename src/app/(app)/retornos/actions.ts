"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { emitRealtime } from "@/lib/realtime";
import { sincronizarRecursos } from "@/lib/recursos";
import { isDataValida, toErrorMessage, type ActionState } from "@/lib/action-result";

const retornoSchema = z.object({
  chamadoId: z.string().min(1),
  motivo: z.string().trim().min(1, "Informe o motivo do retorno"),
  cliente: z.string().trim().min(1, "Informe o cliente"),
  data: z.string().min(1, "Informe a data").refine(isDataValida, "Data inválida"),
  colaboradorId: z.string().optional(),
});

export async function createRetorno(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  let chamadoId: string;
  try {
    const raw = Object.fromEntries(formData.entries());
    const data = retornoSchema.parse({
      ...raw,
      colaboradorId: raw.colaboradorId || undefined,
    });
    chamadoId = data.chamadoId;

    // Retornos representam retrabalho: o chamado volta para a fila e deixa de
    // ser considerado concluído (por isso a dataConclusao é limpa). Tudo na
    // mesma transação para não deixar o chamado num estado intermediário.
    const [, chamado] = await prisma.$transaction([
      prisma.retorno.create({
        data: {
          chamadoId: data.chamadoId,
          motivo: data.motivo,
          cliente: data.cliente,
          data: new Date(data.data),
          colaboradorId: data.colaboradorId ?? null,
        },
      }),
      prisma.chamado.update({
        where: { id: data.chamadoId },
        data: { status: "RETORNO_PROGRAMADO", dataConclusao: null },
      }),
    ]);
    // O chamado deixou de estar em campo: libera técnico e viatura.
    await sincronizarRecursos({
      colaboradores: [chamado.colaboradorId],
      viaturas: [chamado.viaturaId],
    });
  } catch (error) {
    return { error: toErrorMessage(error) };
  }

  emitRealtime("retornos:changed");
  emitRealtime("chamados:changed");
  revalidatePath(`/chamados/${chamadoId}`);
  revalidatePath("/retornos");
  revalidatePath("/chamados");
  revalidatePath("/dashboard");
  return null;
}
