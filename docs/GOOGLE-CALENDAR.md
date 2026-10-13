# Google Calendar por usuário

A integração usa OAuth individual. O administrador configura o aplicativo uma vez; cada aluno conecta sua própria conta em **Conta e equipe > Google Calendar**.

## Configuração do administrador

1. No Google Cloud Console, crie/seleccione um projeto e ative a **Google Calendar API**.
2. Configure a tela de consentimento OAuth com o nome Ruptura CRM, e-mail de suporte, domínio e URL de privacidade da sua instalação (`https://seu-crm.vercel.app/privacidade`).
3. Crie uma credencial OAuth do tipo **Web application**.
4. Autorize o redirect exato: `https://seu-crm.vercel.app/api/google/callback`. Para a instalação Ruptura: `https://crm-ruptura.vercel.app/api/google/callback`.
5. Configure na Vercel: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APP_URL` e `TOKEN_ENCRYPTION_KEY`.
6. Gere a chave de criptografia com `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`. Guarde a chave somente no gerenciador de variáveis/segredos da hospedagem.
7. Faça Redeploy. Em modo de teste no Google, adicione as contas de teste autorizadas. Antes de distribuir amplamente, conclua os requisitos de publicação/verificação indicados no console. Tokens em modo de teste podem expirar; confirme as regras atuais do Google.

Escopo solicitado: `https://www.googleapis.com/auth/calendar.app.created`. Ele permite criar agendas secundárias e gerenciar os eventos nelas. O CRM não lê sua agenda pessoal preexistente.

## Uso pelo aluno

1. Entre no CRM e conecte Google em Conta e equipe.
2. Autorize sua conta. Uma agenda **Ruptura CRM** será criada no Google.
3. Salve uma tarefa, lead, projeto ou lançamento com data.
4. Abra o registro salvo e clique **Enviar / atualizar no Google**. Se editou campos, salve primeiro.
5. O evento começa às **9h no fuso de São Paulo**, dura 30 minutos e tem um alerta popup 30 minutos antes. Habilite notificações do Google Calendar no celular.

O mesmo registro é atualizado no mesmo evento dessa conexão, sem duplicar a cada envio. O envio é manual e unidirecional; mudar o CRM não altera a agenda até clicar novamente, e editar no Google não altera o CRM. Não há envio de convites para clientes.

Cada conexão é pessoal. Membros não recebem os tokens uns dos outros. Ao desconectar, o CRM apaga suas credenciais e tenta revogá-las no Google; você também pode revogar em https://myaccount.google.com/permissions. Eventos antigos permanecem no Google. Ao reconectar, uma nova agenda será criada; remova a agenda anterior no Google se não precisar mais dela.

Alternativas sem OAuth: exportar .ics ou usar o atalho “Adicionar ao Google Agenda” em Minha rotina. Esses métodos são manuais e podem criar duplicatas se repetidos.

Referência: https://developers.google.com/workspace/calendar/api/auth
