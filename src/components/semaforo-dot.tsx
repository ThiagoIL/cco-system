import { cn } from "@/lib/utils";
import { SEMAFORO_COLOR, SEMAFORO_LABEL } from "@/lib/labels";
import type { SemaforoSla } from "@/lib/sla";

export function SemaforoDot({ semaforo }: { semaforo: SemaforoSla }) {
  return (
    <span className="inline-flex items-center gap-1.5" title={SEMAFORO_LABEL[semaforo]}>
      <span className={cn("size-2.5 rounded-full", SEMAFORO_COLOR[semaforo])} />
      <span className="text-xs text-slate-500 dark:text-slate-400">
        {SEMAFORO_LABEL[semaforo]}
      </span>
    </span>
  );
}
