# CCO — RCOND/REDETEL

Centro de Controle Operacional para gerenciamento em tempo real de chamados, técnicos, viaturas,
SLA, pendências e retornos (instalação única, sem multi-tenant).

**Stack:** Next.js 16 (App Router, Server Actions) · TypeScript · PostgreSQL · Prisma 7 ·
Tailwind CSS 4 · NextAuth v5 · Socket.io.

> Como a aplicação usa um servidor Node customizado (`server.js`) para hospedar o Socket.io junto do
> Next.js, ela **não usa** `output: "standalone"` — a imagem Docker carrega o `node_modules` de produção.
> Isso é intencional.

## Módulos

| Módulo | Rota | O que faz |
| --- | --- | --- |
| **Dashboard Operacional** | `/dashboard` | Em tempo real: recebidos/concluídos do dia, pendentes, retornos, SLA em risco/vencido, backlog, **fila de atenção** (chamados mais urgentes), gráficos por status/prioridade e dos últimos 7 dias, quadro de técnicos e de viaturas. |
| **Programação Operacional** | `/programacao` | Quadro com **arrastar e soltar**. Visões: por técnico (soltar atribui o técnico e programa o dia), por equipe (somente leitura), por região e por data (semana: soltar muda o dia, mantendo o horário). Coluna "Sem data" para programar pendências, troca de viatura no próprio cartão e navegação por dia. |
| **Controle de Chamados** | `/chamados` | Cadastro, edição e acompanhamento de chamados, com classe de SLA e semáforo. |
| **Controle de Pendências** | `/pendencias` | Pendências por chamado (sempre com responsável, motivo e prazo). |
| **Controle de Retornos** | `/retornos` | Retornos (retrabalho): o chamado volta para a fila e deixa de contar como concluído. |
| **Mapa Operacional** | `/mapa` | Por colaborador: cliente atual (com SLA), próximo atendimento, status, viatura e região; filtro por equipe. |
| **Cadastro de Equipes** | `/equipes` | Técnicos, TI, ajudantes e estagiários, com status. |
| **Cadastro de Viaturas** | `/viaturas` | Frota e status (disponível, em uso, manutenção, reserva). |
| **Indicadores** | `/indicadores` | Período de 7/30/90 dias. Operação (SLA, SLA por classe, backlog, retornos, produtividade), **supervisores** (produtividade, SLA e pendências por equipe) e técnicos (OS concluídas, tempo médio, horas produtivas, retornos gerados). |
| **Painel para TV** | `/tv` | Modo TV com relógio e tela cheia, atualização automática: programação do dia (com SLA), equipes em campo, pendências críticas, SLA e backlog. |

### Regras importantes

- **SLA por classe:** A = 2h, B = 4h, C = 8h, D = 24h, contados a partir da abertura. O semáforo fica amarelo
  quando restam 25% do prazo e vermelho quando vence. Reclassificar o chamado recalcula o prazo.
- **Recursos acompanham o chamado:** chamado "Em atendimento"/"Em deslocamento" coloca o técnico no mesmo status
  e a viatura "Em uso"; ao sair de campo eles voltam a "Disponível" (Folga, Manutenção e Reserva nunca são
  alteradas automaticamente). O status também pode ser ajustado manualmente em Equipes e Viaturas.
- **Equipes** são os grupos do cadastro: Técnicos, TI, Ajudantes e Estagiários.
- **Retorno reabre o chamado:** registrar um retorno muda o status para *Retorno programado* e limpa a data de conclusão.
- **Fuso horário:** toda a operação usa `America/Sao_Paulo` (o `server.js` e o Dockerfile fixam o `TZ`).
- **Papéis** (Administrador / Supervisor / Técnico): hoje funcionam apenas como rótulo — todo usuário logado
  acessa todos os módulos (veja *Próximos passos*).

## Rodando localmente

Pré-requisitos: Node 22+ e um PostgreSQL (o `docker-compose.yml` sobe um).

```bash
cp .env.example .env            # ajuste DATABASE_URL, AUTH_SECRET, NEXTAUTH_URL e ADMIN_*
docker compose up -d db         # ou use um Postgres seu
npm install
npx prisma migrate deploy       # aplica as migrations
npm run dev                     # http://localhost:3000
```

No primeiro start, o app prepara o banco automaticamente (`src/lib/bootstrap.ts`, executado por
`src/instrumentation.ts`): cria o administrador (`ADMIN_EMAIL` / `ADMIN_PASSWORD`) quando ainda não há
usuários e cadastra a equipe e as viaturas iniciais quando esses cadastros estão vazios. O preparo é
idempotente. O comando `npm run db:seed` executa o mesmo preparo manualmente.

Scripts úteis: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run db:migrate` (criar migration em dev),
`npm run db:deploy` (aplicar migrations), `npm run db:studio`.

Para testar a imagem de produção localmente: `docker compose --profile app up --build`.

## Migrations do Prisma

O schema fica em [`prisma/schema.prisma`](prisma/schema.prisma) e cada alteração gera uma pasta versionada em
`prisma/migrations/`. **Sempre commite as migrations junto da mudança no schema.**

- **Criar uma migration** (desenvolvimento, com o banco local acessível):
  ```bash
  npx prisma migrate dev --name descreva_a_mudanca
  ```
- **Aplicar as pendentes** (produção/CI — não gera arquivos): `npx prisma migrate deploy`.
- **Em produção** isso é automático: o container roda `prisma migrate deploy` a cada start, antes de subir o servidor.

## Variáveis de ambiente

| Variável | Descrição |
| --- | --- |
| `DATABASE_URL` | String de conexão do PostgreSQL. |
| `AUTH_SECRET` | Segredo da sessão (mín. 32 caracteres). Gere com `openssl rand -base64 48`. |
| `NEXTAUTH_URL` | URL pública da aplicação (ex.: `https://cco.seudominio.com.br`). |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Administrador inicial (usado só quando não há usuários). |
| `TZ` | Fuso horário do servidor (`America/Sao_Paulo`). |
| `PORT` | Porta do servidor (padrão `3000`). |

## Deploy no Easypanel

1. **Banco:** no projeto, crie um serviço **Postgres** (versão 15+). Anote o host interno, usuário, senha e nome do banco.
2. **App:** crie um serviço do tipo **App** a partir do repositório Git (branch `master`) com **Build → Dockerfile**
   (o `Dockerfile` está na raiz). Porta do container: **3000**.
3. **Variáveis de ambiente** do app:
   ```
   DATABASE_URL=postgresql://USUARIO:SENHA@HOST_INTERNO:5432/NOME_DO_BANCO
   AUTH_SECRET=<valor aleatório com 32+ caracteres>
   NEXTAUTH_URL=https://cco.seudominio.com.br
   ADMIN_NAME=Administrador CCO
   ADMIN_EMAIL=<e-mail do administrador>
   ADMIN_PASSWORD=<senha forte>
   TZ=America/Sao_Paulo
   ```
4. **Domínio/HTTPS:** adicione o domínio na aba *Domains* do serviço (o Easypanel emite o certificado).
5. **Deploy.** A cada start o container aplica as migrations pendentes (`prisma migrate deploy`) antes de subir o servidor.
   O endpoint `GET /api/health` serve para o health check.
6. **Backups:** habilite os backups do serviço Postgres no Easypanel (ou agende `pg_dump`). Todos os dados ficam no banco.

> Troque a senha do administrador depois do primeiro acesso e mantenha `AUTH_SECRET` e `ADMIN_PASSWORD`
> fora do repositório (apenas nas variáveis de ambiente do Easypanel). Ainda não há tela de troca de senha:
> gere um novo hash e atualize o usuário pelo banco (ou Prisma Studio).

## Estrutura

```
prisma/            schema, migrations e seed
server.js          servidor Node customizado (Next.js + Socket.io)
src/app/(app)/     telas autenticadas (dashboard, chamados, programação…)
src/app/tv/        painel para TV
src/app/login/     autenticação
src/app/api/       NextAuth e health check
src/lib/           banco, SLA, tempo real, bootstrap, dados dos painéis
src/components/    componentes de UI
src/proxy.ts       barreira de acesso (redireciona para /login sem sessão)
```

## Próximos passos sugeridos

- Permissões por papel (Administrador / Supervisor / Técnico).
- Tela para desativar colaboradores/viaturas e gerenciar usuários e senhas.
- Relatórios e exportação CSV.
