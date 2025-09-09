const {
    ApplicationCommandType,
    PermissionFlagsBits,
    ApplicationCommandOptionType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    name: "sistema_rota",
    description: "Configura o sistema de formulário policial",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "canal_formulario",
            description: "Canal para enviar o painel do formulário.",
            type: ApplicationCommandOptionType.Channel,
            required: true,
            channel_types: [0]
        },
        {
            name: "canal_logs",
            description: "Canal para logs do sistema.",
            type: ApplicationCommandOptionType.Channel,
            required: true,
            channel_types: [0]
        },
        {
            name: "canal_confi_cancela",
            description: "Canal para aprovações e cancelamentos do formulário.",
            type: ApplicationCommandOptionType.Channel,
            required: true,
            channel_types: [0]
        }
    ],
    run: async (client, interaction) => {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: "🚫 Você precisa ter permissão de **Administrador** para usar este comando!",
                ephemeral: true
            });
        }

        const canalFormulario = interaction.options.getChannel('canal_formulario');
        const canalLogs = interaction.options.getChannel('canal_logs');
        const canalConfiCancela = interaction.options.getChannel('canal_confi_cancela');

        // Verifica permissões do bot
        const botPermissions = [
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.ReadMessageHistory
        ];

        const canaisComPermissoes = [canalFormulario, canalLogs, canalConfiCancela];
        for (const canal of canaisComPermissoes) {
            if (!canal.permissionsFor(client.user).has(botPermissions)) {
                return interaction.reply({
                    content: `❌ Eu não tenho permissões suficientes no canal ${canal.name}.`,
                    ephemeral: true
                });
            }
        }

        try {
            // Salva a configuração completa no banco de dados
            const configuracao = {
                canal_formulario: canalFormulario.id,
                canal_logs: canalLogs.id,
                canal_confi_cancela: canalConfiCancela.id,
                configurado_por: interaction.user.id,
                configurado_em: Date.now(),
                status: 'ativo'
            };

            await db.set(`sistema_formulario_${interaction.guild.id}`, configuracao);

            // Salva individualmente para acesso fácil
            await db.set(`canal_formulario_${interaction.guild.id}`, canalFormulario.id);
            await db.set(`canal_logs_${interaction.guild.id}`, canalLogs.id);
            await db.set(`canal_confi_cancela_${interaction.guild.id}`, canalConfiCancela.id);

            // Cria o botão para o formulário
            const formularioButton = new ButtonBuilder()
                .setCustomId("formulario_policial")
                .setLabel("📝 Iniciar Formulário")
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(formularioButton);
            // Envia a mensagem com o botão
            const embed = new EmbedBuilder()
                .setColor("#1a5fb4")
                .setTitle("🛡️ SISTEMA DE REGISTRO POLICIAL")
                .setDescription(">>> 📧 **Solicitação de Cadastro Oficial**\n*Preencha o formulário para ingressar no departamento*")
                .setThumbnail(interaction.guild.iconURL())
                .addFields(
                    {
                        name: "📄 Documentação Obrigatória",
                        value: "```asciidoc\n[QRA] :: Identificação oficial\n[ID] :: ID Oficial\n[Recrutador] :: Responsável pelo pedido do cadastro\n```"
                    },
                    {
                        name: "⏰ Fluxo do Processo",
                        value: "```diff\n! Etapa 1: Preenchimento do formulário\n! Etapa 2: Verificação de dados\n! Etapa 3: Aprovação superior\n+ Você será notificado via DM\n```"
                    }
                )
                .setFooter({
                    text: `Sistema de Recrutamento • ${interaction.guild.name}`,
                    iconURL: interaction.guild.iconURL()
                })
                .setTimestamp();
                
            await canalFormulario.send({
                embeds: [embed],
                components: [row]
            });

            // Envia mensagem de confirmação para o canal de logs
            const logEmbed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('✅ Sistema de Formulário Configurado')
                .setDescription(`Sistema de formulário policial ativado por ${interaction.user.tag}`)
                .addFields(
                    { name: 'Canal do Formulário', value: `${canalFormulario}`, inline: true },
                    { name: 'Canal de Logs', value: `${canalLogs}`, inline: true },
                    { name: 'Canal Confirmação/Cancelamento', value: `${canalConfiCancela}`, inline: true },
                    { name: 'Configurado em', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
                )
                .setTimestamp();

            await canalLogs.send({ embeds: [logEmbed] });

            await interaction.reply({
                content: `✅ Sistema de formulário policial configurado com sucesso!\n• Formulário em: ${canalFormulario}\n• Logs em: ${canalLogs}\n• Confirmações/Cancelamentos em: ${canalConfiCancela}`,
                ephemeral: true
            });

        } catch (error) {
            console.error("Erro ao configurar sistema de formulário:", error);

            await interaction.reply({
                content: "❌ Erro ao configurar o sistema. Verifique as permissões e tente novamente.",
                ephemeral: true
            });
        }
    }
};