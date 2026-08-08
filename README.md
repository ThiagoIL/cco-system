# CCO — RCOND/REDETEL

Centro de Controle Operacional para gerenciamento em tempo real de chamados,
técnicos, viaturas, SLA, pendências e retornos.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS v4)
- **PostgreSQL** via **Prisma ORM 7** (driver adapter `@prisma/adapter-pg`, sem engine Rust)
- **NextAuth (Auth.js) v5** — login com papéis (Administrador / Supervisor / Técnico)
- **Socket.io** — atualização em tempo real do Dashboard, Programação e Painel de TV
- Servidor Node customizado (`server.js`) para hospedar o Socket.io junto do Next.js

> ⚠️ Como a aplicação usa um servidor customizado (`server.js`) para o
> Socket.io, ela **não usa** `output: "standalone"` do Next.js — a imagem
> Docker carrega o `node_modules` completo. Isso é intencional.

## Rodando localmente

### 1. Banco de dados

Suba um Postgres local com Docker:

```bash
docker compose up -d db
```

Ou aponte `DATABASE_URL` para qualquer Postgres acessível (local ou remoto).

### 2. Variáveis de ambiente

```bash
cp .env.example .env
```

Preencha `DATABASE_URL`, `AUTH_SECRET` (gere com `openssl rand -base64 32`) e,
opcionalmente, `ADMIN_EMAIL` / `ADMIN_PASSWORD` para o usuário administrador
criado pelo seed.

### 3. Instalar dependências, migrar e popular o banco

```bash
npm install
npx prisma migrate deploy   # cria as tabelas
npx prisma db seed          # popula equipe, viaturas e usuário admin
```

### 4. Subir a aplicação

```bash
npm run dev
```

Acesse `http://localhost:3000` e entre com o e-mail/senha do admin exibidos
no final do `prisma db seed`.

## Migrations do Prisma — como funcionam

O schema fica em [`prisma/schema.prisma`](prisma/schema.prisma) e cada
alteração gera um arquivo versionado em `prisma/migrations/`.

- **Criar uma nova migration** (durante o desenvolvimento, com o banco local
  acessível):
  ```bash
  npx prisma migrate dev --name descreva_a_mudanca
  ```
- **Aplicar migrations pendentes** (produção/CI — não gera novos arquivos,
  só aplica os que já existem no repositório):
  ```bash
  npx prisma migrate deploy
  ```
- **Popular dados iniciais** (equipe, viaturas, usuário admin):
  ```bash
  npx prisma db seed
  ```

Essas migrations ficam versionadas em Git — sempre commitá-las junto da
mudança no `schema.prisma`.

## Deploy no EasyPanel

A ideia é ter **dois serviços separados** dentro do mesmo projeto EasyPanel:
um Postgres gerenciado e esta aplicação (via Dockerfile) — banco de dados à
parte da aplicação, como pedido.

### Passo 1 — Criar o banco de dados

1. No EasyPanel, crie um novo serviço do tipo **Postgres** (Database → Postgres).
2. Defina usuário, senha e nome do banco.
3. Copie a **connection string interna** que o EasyPanel gera (algo como
   `postgres://usuario:senha@nome-do-servico:5432/nome_do_banco`). Serviços
   dentro do mesmo projeto se enxergam pelo nome do serviço — não é preciso
   expor o Postgres publicamente.

### Passo 2 — Criar o serviço da aplicação

1. Crie um novo serviço do tipo **App** apontando para este repositório
   (Git) — o EasyPanel detecta o `Dockerfile` automaticamente e builda a
   imagem com ele.
2. Configure a porta interna como `3000` (a que o `server.js` escuta).
3. Em **Environment**, defina:
   - `DATABASE_URL` → a connection string do Passo 1
   - `AUTH_SECRET` → um valor aleatório (`openssl rand -base64 32`)
   - `NEXTAUTH_URL` → a URL pública final da aplicação (ex.:
     `https://cco.seudominio.com.br`)
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` → opcionais, usados apenas na primeira
     execução do seed
4. Configure o domínio/HTTPS do serviço nas configurações de **Domains** do
   EasyPanel.
5. Clique em **Deploy**.

### Passo 3 — Rodar as migrations

O container roda [`docker-entrypoint.sh`](docker-entrypoint.sh), que executa
automaticamente `npx prisma migrate deploy` **antes** de iniciar o servidor
a cada deploy — ou seja, novas migrations commitadas no repositório são
aplicadas sozinhas no próximo deploy, sem passo manual.

Ainda assim, para rodar migrations (ou o seed) manualmente a qualquer
momento — por exemplo, para popular a equipe/viaturas na primeira vez —
use o terminal do próprio serviço no EasyPanel (aba **Console/Terminal** do
app) e rode:

```bash
npx prisma migrate deploy
npx prisma db seed
```

> O `prisma db seed` usa `upsert`, então pode ser rodado mais de uma vez sem
> duplicar dados.

### Atualizações futuras

Sempre que o `schema.prisma` mudar:

1. Localmente: `npx prisma migrate dev --name nome_da_mudanca` (gera o
   arquivo de migration).
2. Commit e push do código, incluindo `prisma/migrations/`.
3. Deploy no EasyPanel — o `docker-entrypoint.sh` aplica a migration
   automaticamente antes de subir a nova versão.

## Estrutura de módulos

| Módulo | Rota |
| --- | --- |
| Dashboard Operacional | `/dashboard` |
| Programação Operacional | `/programacao` |
| Controle de Chamados | `/chamados` |
| Controle de Pendências | `/pendencias` |
| Controle de Retornos | `/retornos` |
| Mapa Operacional | `/mapa` |
| Cadastro de Equipes | `/equipes` |
| Cadastro de Viaturas | `/viaturas` |
| Indicadores | `/indicadores` |
| Painel para TV | `/tv` |

## Login padrão (após o seed)

- **E-mail:** valor de `ADMIN_EMAIL` (padrão `admin@rcondredetel.com.br`)
- **Senha:** valor de `ADMIN_PASSWORD` (padrão `cco@2026admin`)

**Troque a senha assim que possível** — hoje não há tela de "esqueci minha
senha"; para trocar, gere um novo hash e atualize o usuário diretamente no
banco, ou recrie o usuário via Prisma Studio (`npx prisma studio`).
