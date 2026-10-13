# Ativar seu CRM na Vercel

Você pode usar a instalação da Ruptura quando o administrador a ativar, ou criar a sua própria cópia.

## 1. Criar o banco

1. Crie um projeto novo em https://supabase.com/dashboard. Escolha a região e guarde a senha do banco em local seguro.
2. Abra **SQL Editor** e execute o conteúdo completo de [001_crm.sql](../supabase/migrations/001_crm.sql) uma única vez.
3. Em **Authentication > Providers**, mantenha Email habilitado e **Confirm email** ligado. Configure senha mínima de 10 caracteres.
4. Em **Authentication > URL Configuration**, informe o endereço final da instalação como **Site URL** e adicione `https://seu-crm.vercel.app/**` aos redirects permitidos. Para desenvolvimento, adicione `http://localhost:3000/**`.
5. Configure um SMTP próprio para confirmação/recuperação de senha antes de distribuir aos alunos. O serviço de e-mail de testes do Supabase tem restrições; confira as configurações e os limites na sua conta.

## 2. Conectar na Vercel

Faça um fork deste repositório no GitHub e importe na Vercel como projeto **Next.js**, diretório raiz padrão. Ou configure o projeto existente `crm-ruptura` na equipe BENCH.

Em **Settings > Environment Variables**, preencha em Production:

| Variável | Origem |
| --- | --- |
| NEXT_PUBLIC_SUPABASE_URL | URL do projeto Supabase |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Chave anon (legacy) ou publishable do projeto |
| SUPABASE_SERVICE_ROLE_KEY | Chave service_role (legacy) ou secret do projeto; somente servidor |
| APP_URL | Endereço final HTTPS, sem caminho |

As chaves ficam nas configurações da API do projeto Supabase. Não coloque a chave de serviço em variável NEXT_PUBLIC, GitHub, código, arquivo compartilhado ou chat. O arquivo `.env.example` contém apenas os nomes.

Faça **Redeploy** após adicionar as variáveis; as variáveis públicas entram no build. A tela de ativação será substituída pelo login. Para Preview/Development, use banco de testes separado quando possível.

## 3. Validar antes de enviar à turma

- Cadastre duas contas reais de teste e confirme seus e-mails.
- Crie um espaço em cada uma, cadastre um cliente e verifique que a outra conta não vê esse registro.
- Gere um convite em Conta e equipe e abra com o e-mail convidado. Verifique acesso e revogação.
- Teste recuperação de senha por e-mail.
- Cadastre proposta, projeto, tarefa e lançamento; exporte os dados.
- Para a agenda, siga [Google Calendar](GOOGLE-CALENDAR.md), conecte duas contas e verifique que cada evento vai para sua própria agenda.
- Informe aos alunos o canal do administrador para suporte/exclusão de dados e configure política de retenção/backups.

Os testes automatizados locais não substituem a confirmação dos e-mails e do OAuth com contas reais após a conexão.

## Atualizações e dados

A migração inicial cria tabelas novas e não importa dados do CRM original. O proprietário pode exportar o JSON no CRM original para guardar seu backup. Importação geral desse JSON ainda não está incluída; importação de perfis CSV/JSON está disponível.

Mantenha backups do Supabase e não altere a chave de criptografia dos tokens Google sem planejar a reconexão. Para excluir uma conta proprietária, faça backup, remova os espaços dela (que eliminam registros/membros/convites por cascata) e depois exclua o usuário em Authentication. Para um membro, basta excluir o usuário; suas conexões e participações são removidas por cascata.

## Referências oficiais

- https://supabase.com/docs/guides/auth
- https://supabase.com/docs/guides/auth/auth-smtp
- https://vercel.com/docs/environment-variables
