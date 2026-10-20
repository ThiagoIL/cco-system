import { ZodError } from "zod";

/** Resultado devolvido pelas Server Actions de formulário (null = ainda não enviado). */
export type ActionState = { error?: string } | null;

/** Converte erros de validação/banco em uma mensagem amigável para o usuário. */
export function toErrorMessage(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? "Dados inválidos.";
  }
  const code = (error as { code?: string } | null)?.code;
  if (code === "P2002") return "Já existe um registro com esses dados.";
  if (code === "P2003") return "O registro relacionado não foi encontrado.";
  if (code === "P2025") return "Registro não encontrado — talvez ele tenha sido removido.";
  console.error(error);
  return "Não foi possível concluir a operação. Tente novamente.";
}

/** Valida uma string de data/hora vinda de <input type="datetime-local">. */
export function isDataValida(valor: string) {
  return !Number.isNaN(new Date(valor).getTime());
}
