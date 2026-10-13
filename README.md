# Ruptura CRM

Uma base para estúdios criativos e alunos da Ruptura: clientes, pipeline, propostas, projetos, financeiro, rotina e prospecção.

**Para alunos:** instale sua própria cópia seguindo o [guia de instalação](docs/INSTALACAO.md). O CRM do estúdio Bench Park é uma instalação privada.  
**Código público:** https://github.com/felipeferreira3d/crm-ruptura

## Antes de usar

A interface é publicada mesmo sem credenciais, mas **cadastros e login exigem um projeto Supabase configurado**. A tela inicial informa quando a instalação ainda aguarda ativação. Google Calendar exige também um cliente OAuth do Google. Não há banco fictício, conta compartilhada ou senha padrão.

- [Ativar a instalação na Vercel](docs/INSTALACAO.md)
- [Conectar Google Calendar](docs/GOOGLE-CALENDAR.md)
- [Guia para alunos](docs/ALUNOS.md)

## O que está incluído

- Clientes, pipeline, temperatura, origem e follow-up.
- Projetos, prazos, revisões, arquivos por link e responsáveis.
- Financeiro em BRL, USD e EUR, entradas/saídas e vencimentos.
- Propostas em português/inglês, tabela de preços, revisões e impressão em PDF.
- Biblioteca de mensagens, objeções, portfólio e prompts.
- Rotina com atrasos, silêncio do cliente, agenda e resumo copiável.
- Prospecção Instagram: cadastro/importação CSV/JSON, filtros, prioridade, deduplicação e conversão para o pipeline. Somente perfis com mais de 200 mil seguidores.
- Login por e-mail/senha, confirmação de e-mail e recuperação de senha.
- Espaços isolados; convites de equipe por link vinculado ao e-mail, validade de 7 dias e revogação.
- Google Calendar individual, com uma agenda criada pelo CRM e envio/atualização manual de registros salvos.

## O que depende de integração adicional

Varreduras de Instagram, agendamento de prospecção, e-mail diário automático, WhatsApp, conversão cambial e integração bancária não estão ativos. As buscas diárias são planejamento, não tarefas executadas em segundo plano. Dados de perfis só aparecem quando cadastrados/importados; localização e frequência desconhecidas não são inventadas.

Membros de uma equipe acessam **todo o espaço, incluindo financeiro**. Esta versão não tem permissões por projeto. Google Calendar é uma conexão pessoal, não compartilhada com a equipe. A sincronização é manual e unidirecional; edições no Google não voltam ao CRM.

## Desenvolvimento

Node.js 22.13 ou superior (recomendado Node 22 LTS).

```sh
npm ci
cp .env.example .env.local
npm run dev
```

No PowerShell, use `Copy-Item .env.example .env.local`. Preencha as variáveis seguindo o guia. Execute:

```sh
npm test
npm run typecheck
npm run build
```

Os testes de banco rodam Postgres em memória com PGlite: isolamento, permissões, concorrência, convites, revogação, conversão sem duplicatas e conteúdo de propostas enviadas.

## Arquitetura

Next.js App Router + React; Supabase Auth e Postgres; Vercel. O navegador envia o token Supabase; a API valida com `getUser` e verifica a participação no espaço. As tabelas têm RLS e acesso direto negado a `anon` e `authenticated`; apenas a API usa a chave de serviço, nunca enviada ao navegador. As funções transacionais também verificam a participação.

Tokens Google são criptografados com AES-256-GCM. Convites e estados OAuth são armazenados como hash, têm expiração e uso único. A chave de criptografia não pode ser perdida nem substituída sem reconectar as contas.

Esta distribuição começa com banco vazio. Não copia dados do CRM original nem exige hospedagem Sites/Cloudflare.

## Licença

MIT. Você pode copiar, adaptar e hospedar sua versão. Mantenha os avisos de licença das dependências.
