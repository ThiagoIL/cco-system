import type { ClasseSla } from "@/generated/prisma/enums";

/** Prazo de cada classe de SLA, em horas. */
export const SLA_HORAS: Record<ClasseSla, number> = {
  A: 2,
  B: 4,
  C: 8,
  D: 24,
};

/** A partir de quando (fração do prazo restante) o semáforo vira amarelo. */
const LIMIAR_ALERTA = 0.25;

export type SemaforoSla = "VERDE" | "AMARELO" | "VERMELHO";

export function calcularPrazoSla(dataAbertura: Date, classe: ClasseSla): Date {
  const horas = SLA_HORAS[classe];
  return new Date(dataAbertura.getTime() + horas * 60 * 60 * 1000);
}

/**
 * Semáforo de SLA. Se `dataConclusao` for informada, compara a conclusão
 * contra o prazo (SLA histórico); caso contrário compara "agora" contra o prazo.
 */
export function semaforoSla(
  prazoSla: Date,
  classe: ClasseSla,
  dataConclusao?: Date | null,
  agora: Date = new Date()
): SemaforoSla {
  const referencia = dataConclusao ?? agora;
  if (referencia > prazoSla) return "VERMELHO";

  const horasTotais = SLA_HORAS[classe];
  const janelaAlertaMs = horasTotais * 60 * 60 * 1000 * LIMIAR_ALERTA;
  const restanteMs = prazoSla.getTime() - referencia.getTime();

  if (restanteMs <= janelaAlertaMs) return "AMARELO";
  return "VERDE";
}

export const SLA_CLASSE_LABEL: Record<ClasseSla, string> = {
  A: "Classe A (até 2h)",
  B: "Classe B (até 4h)",
  C: "Classe C (até 8h)",
  D: "Classe D (até 24h)",
};

/** Texto curto do tempo de SLA: "1h 20min restantes", "vencido há 35min", "concluído no prazo". */
export function tempoRestanteSla(
  prazoSla: Date,
  dataConclusao?: Date | null,
  agora: Date = new Date()
): string {
  const referencia = dataConclusao ?? agora;
  const diffMin = Math.round((prazoSla.getTime() - referencia.getTime()) / 60000);
  const abs = Math.abs(diffMin);
  const horas = Math.floor(abs / 60);
  const minutos = abs % 60;
  const texto = horas > 0 ? `${horas}h ${String(minutos).padStart(2, "0")}min` : `${minutos}min`;

  if (dataConclusao) {
    return diffMin >= 0 ? "concluído no prazo" : `concluído com ${texto} de atraso`;
  }
  return diffMin >= 0 ? `${texto} restantes` : `vencido há ${texto}`;
}
