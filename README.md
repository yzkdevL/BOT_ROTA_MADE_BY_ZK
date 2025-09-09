🤖 Bot de Recrutamento Policial para Discord
━━━━━━━━━━━━━━━━━━━━━━━━━━━

📄 Sobre o Projeto
Este bot é um sistema completo e automatizado para o processo de recrutamento e registo de novos membros num departamento policial, ideal para servidores de Roleplay (RP). Ele gere todo o fluxo, desde a configuração inicial pelo administrador, o preenchimento do formulário pelo candidato, até à aprovação final pela liderança, com atribuição automática de cargos e apelidos.

O objetivo é eliminar a necessidade de processos manuais, centralizando todas as etapas de forma interativa e registando cada ação num canal de logs dedicado.

━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ Funcionalidades Principais
O sistema é dividido em três fluxos de interação:

Para Administradores 👑
Comando de Configuração (/sistema_rota): Um único comando para configurar todos os canais essenciais do sistema:

canal_formulario: Onde o painel para iniciar o registo é enviado.

canal_logs: Para onde todos os registos de aprovação e cancelamento são enviados.

canal_confi_cancela: Um canal restrito para a liderança, onde as solicitações aparecem para serem aprovadas ou negadas.

Para Candidatos 👤
Fluxo de Registo Interativo:

O candidato clica num botão para iniciar o registo.

Um modal (formulário pop-up) solicita o QRA (identificação) e o ID no jogo.

O sistema valida os dados (ex: ID só pode conter números).

Outro modal permite que o candidato pesquise e selecione o seu recrutador na lista de membros do servidor.

No final, o candidato recebe uma confirmação de que a sua solicitação foi enviada para análise.

Para a Liderança (Staff) 👮
Painel de Aprovação:

Cada nova solicitação gera um painel detalhado no canal de aprovações, mencionando o recrutador.

A liderança pode aprovar o candidato selecionando a patente a ser atribuída num menu dropdown.

Ao aprovar, o bot automaticamente:

Atribui o cargo da patente selecionada.

Remove o cargo de novato/civil.

Define o apelido do membro no formato [Prefixo] | QRA | ID.

Envia um log completo da aprovação.

Envia uma DM de boas-vindas para o novo membro.

A liderança pode cancelar uma solicitação, abrindo um modal para registar o motivo, que também é enviado para o canal de logs.

━━━━━━━━━━━━━━━━━━━━━━━━━━━

🛠️ Tecnologias Utilizadas
Node.js

Discord.js v14

quick.db (para armazenamento de configurações e dados temporários)

━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 Instalação e Configuração
Siga os passos abaixo para executar o bot.

Pré-requisitos
Node.js v16.9 ou superior.

Um bot criado no Portal de Desenvolvedores do Discord com as Privileged Gateway Intents (Server Members, Presence, Message Content) ativadas.

Passos
Clone o repositório:

git clone [https://github.com/yzkdevL/BOT_ROTA_MADE_BY_ZK](https://github.com/yzkdevL/BOT_ROTA_MADE_BY_ZK)
cd SEU-REPOSITORIO

Instale as dependências:

npm install

Configure as variáveis:

Crie o ficheiro config.js na pasta principal e adicione o seu token:

module.exports = {
    token: "SEU_TOKEN_AQUI"
};

No ficheiro systems/setagemHD.js, preencha TODOS os IDs de cargos do seu servidor:

// Dentro do objeto 'patentes'
const patentes = {
    CABO: { id: 'ID_DO_CARGO_CABO', /* ... */ },
    TERCEIRO_SARGENTO: { id: 'ID_DO_CARGO_3SGT', /* ... */ },
    // ... e assim por diante para todas as patentes
};

// IDs dos cargos de separação e de novato
const CARGO_SEPARACAO = ['ID_CARGO_SEPARADOR_1', 'ID_CARGO_SEPARADOR_2'];
const CARGO_NOVATO = 'ID_DO_CARGO_DE_NOVATO_PARA_REMOVER';

Inicie o bot:

node index.js

━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Como Usar
Após iniciar o bot, certifique-se de que ele tem as permissões de Administrador no servidor para garantir que todas as funções (criar canais, gerir cargos e apelidos) funcionem corretamente.

Num canal de gestão, use o comando /sistema_rota.

Selecione os três canais necessários (canal_formulario, canal_logs, canal_confi_cancela).

O bot enviará o painel de registo no canal de formulário e o sistema estará ativo e pronto para uso.

━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 Autor
Feito por yzkdevL.

━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚖️ Licença e Direitos
Todos os direitos reservados por yzkdevL.
