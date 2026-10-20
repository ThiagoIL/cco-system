import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "./sidebar";
import { SignOutButton } from "./sign-out-button";
import { PAPEL_USUARIO_LABEL } from "@/lib/labels";

// Sempre renderizado sob demanda: as páginas leem o banco e a sessão a cada
// requisição, então não devem ser pré-renderizadas durante o `next build`.
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex h-screen">
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-4 py-4 dark:border-slate-800">
          <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
            RCOND / REDETEL
          </p>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Centro de Controle Operacional
          </p>
        </div>
        <Sidebar />
        <div className="border-t border-slate-200 p-3 dark:border-slate-800">
          <div className="mb-2 px-3">
            <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
              {session.user.name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {PAPEL_USUARIO_LABEL[session.user.role] ?? session.user.role}
            </p>
          </div>
          <SignOutButton />
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
        {children}
      </main>
    </div>
  );
}
