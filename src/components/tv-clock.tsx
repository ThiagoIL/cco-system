"use client";

import { useEffect, useState } from "react";
import { Maximize2 } from "lucide-react";

/** Relógio do painel de TV + botão de tela cheia. */
export function TvClock() {
  const [agora, setAgora] = useState<Date | null>(null);

  useEffect(() => {
    // O primeiro tick é assíncrono (evita setState síncrono no efeito e divergência de hidratação).
    const primeiro = setTimeout(() => setAgora(new Date()), 0);
    const id = setInterval(() => setAgora(new Date()), 1000);
    return () => {
      clearTimeout(primeiro);
      clearInterval(id);
    };
  }, []);

  return (
    <div className="flex items-center gap-4">
      <div className="text-right">
        <p className="font-mono text-4xl font-bold tabular-nums">
          {agora
            ? agora.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })
            : "--:--:--"}
        </p>
        <p className="inline-block text-xs text-slate-500 first-letter:uppercase">
          {agora
            ? agora.toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
              })
            : ""}
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          if (document.fullscreenElement) void document.exitFullscreen();
          else void document.documentElement.requestFullscreen();
        }}
        className="rounded-lg border border-slate-700 p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
        aria-label="Tela cheia"
        title="Tela cheia"
      >
        <Maximize2 className="size-5" />
      </button>
    </div>
  );
}
