const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits
} = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

// Função para calcular similaridade entre strings
function stringSimilarity(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;

    const matrix = [];
    for (let i = 0; i <= len1; i++) matrix[i] = [i];
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }

    return 1 - (matrix[len1][len2] / Math.max(len1, len2));
}
// Corrija o objeto patentes adicionando a propriedade 'nome'
const patentes = {
    CABO: {
        id: '1392646020210626769',
        prefixo: '[CB]',
        nome: 'Cabo' // Adicione esta linha
    },
    TERCEIRO_SARGENTO: {
        id: '1392646020252438599',
        prefixo: '[3º SGT]',
        nome: '3º Sargento' // Adicione esta linha
    },
    SEGUNDO_SARGENTO: {
        id: '1392646020252438600',
        prefixo: '[2º SGT]',
        nome: '2º Sargento' // Adicione esta linha
    },
    PRIMEIRO_SARGENTO: {
        id: '1392646020252438601',
        prefixo: '[1º SGT]',
        nome: '1º Sargento' // Adicione esta linha
    }
};
const CARGO_SEPARACAO = ['1392646020101574763', '1392646020101574762'];

async function atualizarEmbedSolicitacao(interaction, status, motivo = '') {
    try {
        const mensagemOriginal = interaction.message;
        if (!mensagemOriginal) return;

        const embedOriginal = mensagemOriginal.embeds[0];
        if (!embedOriginal) return;

        const novoEmbed = EmbedBuilder.from(embedOriginal)
            .setColor(status === 'confirmado' ? 0x00FF00 : 0xFF0000)
            .setTitle(status === 'confirmado' ? '✅ REGISTRO CONFIRMADO' : '❌ REGISTRO CANCELADO')
            .addFields(
                {
                    name: 'Status',
                    value: status === 'confirmado' ? `Aprovado pelo staff: ${motivo}` : `Cancelado: ${motivo || 'Motivo não especificado'}`,
                    inline: false
                },
                {
                    name: 'Staff Responsável',
                    value: interaction.user.toString(),
                    inline: true
                },
                {
                    name: 'Data/Hora',
                    value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
                    inline: true
                }
            );

        await mensagemOriginal.edit({
            embeds: [novoEmbed],
            components: [] // Remove os botões
        });
    } catch (error) {
        console.error('Erro ao atualizar embed:', error);
    }
}


module.exports = {
    name: "interactionCreate",
    async execute(interaction) {
        // Botão para abrir o formulário policial
        if (interaction.isButton() && interaction.customId === "formulario_policial") {
            const canalLogs = await db.get(`canal_logs_${interaction.guild.id}`);
            if (!canalLogs) {
                return interaction.reply({
                    content: `❌ O sistema de logs está desativado.`,
                    ephemeral: true
                });
            }

            // Recuperar dados anteriores se existirem
            const formularioAnterior = await db.get(`formulario_policial_${interaction.user.id}`) || {};

            // Garantir que os valores atendam aos requisitos mínimos
            const qraValue = formularioAnterior.qra && formularioAnterior.qra.length >= 3 ? formularioAnterior.qra : '';
            const idValue = formularioAnterior.id && formularioAnterior.id.length >= 2 ? formularioAnterior.id : '';

            const modal = new ModalBuilder()
                .setCustomId('formularioPolicialModal')
                .setTitle('🚓 Registro Policial - QRA e ID');

            const qraInput = new TextInputBuilder()
                .setCustomId('qraInput')
                .setLabel("Seu QRA (Identificação)")
                .setPlaceholder('Ex: Alpha-12')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMaxLength(20)
                .setValue(qraValue); // Preenche com valor anterior.

            const idInput = new TextInputBuilder()
                .setCustomId('idInput')
                .setLabel("Seu ID dentro do Game.")
                .setPlaceholder('Ex: 7342 ou 247 ...')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMaxLength(15)
                .setValue(idValue); // Preenche com valor anterior.

            modal.addComponents(
                new ActionRowBuilder().addComponents(qraInput),
                new ActionRowBuilder().addComponents(idInput)
            );

            await interaction.showModal(modal);
        }

        // Modal de formulário policial
        if (interaction.isModalSubmit() && interaction.customId === 'formularioPolicialModal') {
            const qra = interaction.fields.getTextInputValue('qraInput');
            const id = interaction.fields.getTextInputValue('idInput');

            // Salvar os dados temporariamente (mesmo com erro)
            await db.set(`formulario_policial_${interaction.user.id}`, { qra, id });

            // Verificação para o campo ID - não permitir letras
            if (/[a-zA-Z]/.test(id)) {
                return interaction.reply({
                    content: '❌ **Erro no campo ID:** O ID deve conter apenas números. Letras não são permitidas.\n\n📝 **Seus dados foram salvos temporariamente.** Clique novamente no botão "🚓 Registrar-se" para continuar de onde parou.',
                    ephemeral: true
                });
            }

            // Verificação adicional para garantir que seja apenas números
            if (!/^\d+$/.test(id)) {
                return interaction.reply({
                    content: '❌ **Erro no campo ID:** O ID deve conter apenas números. Caracteres especiais não são permitidos.\n\n📝 **Seus dados foram salvos temporariamente.** Clique novamente no botão "🚓 Registrar-se" para continuar de onde parou.',
                    ephemeral: true
                });
            }

            await db.set(`usuarioQueEnviouFormulario_${interaction.user.id}`, interaction.user.id);

            const confirmarButton = new ButtonBuilder()
                .setCustomId('confirmarFormularioPolicial')
                .setEmoji('🔎')
                .setLabel('Procurar Recrutador')
                .setStyle(ButtonStyle.Primary);

            await interaction.reply({
                content: "✅ **Formulário enviado com sucesso!**\nAgora procure o usuário que te recrutou.\n\n⚠️ **OBS:** Se não encontrar o recrutador, procure novamente!\n*(Não ignore esta mensagem)*\n\n📌 **Lembrete:**\n```\nSe não encontrar, busque por referência, como o ID do recrutador.\n```",
                components: [new ActionRowBuilder().addComponents(confirmarButton)],
                ephemeral: true,
            });
        }

        // Botão para confirmar o formulário policial...
        if (interaction.isButton() && interaction.customId === "confirmarFormularioPolicial") {
            const buscarMembroModal = new ModalBuilder()
                .setCustomId('buscarMembroPolicialModal')
                .setTitle('Buscar Recrutador');

            const membroInput = new TextInputBuilder()
                .setCustomId('membroInputPolicial')
                .setLabel("Digite o nome ou tag do recrutador:")
                .setPlaceholder('Nome, letra ou tag do Recrutador.')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            buscarMembroModal.addComponents(new ActionRowBuilder().addComponents(membroInput));
            await interaction.showModal(buscarMembroModal);
        }

        // Modal de busca por recrutador... NAO ESQUECER
        if (interaction.isModalSubmit() && interaction.customId === 'buscarMembroPolicialModal') {
            try {
                const membroBuscado = interaction.fields.getTextInputValue('membroInputPolicial').trim().toLowerCase();

                if (!membroBuscado) {
                    return interaction.reply({
                        content: '❌ Por favor, insira um nome para buscar.',
                        ephemeral: true
                    });
                }

                // Busca exata primeiro
                const exactMatches = interaction.guild.members.cache.filter(member => {
                    const username = member.user.username.toLowerCase();
                    const nickname = member.nickname?.toLowerCase();
                    return username === membroBuscado || nickname === membroBuscado;
                });

                // Se não encontrar resultados exatos, faz busca aproximada
                const membersList = exactMatches.size > 0 ? exactMatches : interaction.guild.members.cache;

                const membros = membersList
                    .filter(member => {
                        const username = member.user.username.toLowerCase();
                        const nickname = member.nickname?.toLowerCase() || '';

                        // Verifica correspondência exata em parte do nome
                        if (username.includes(membroBuscado)) return true;
                        if (nickname.includes(membroBuscado)) return true;

                        // Verifica similaridade para nomes aproximados
                        const usernameSimilarity = stringSimilarity(username, membroBuscado);
                        const nicknameSimilarity = nickname ? stringSimilarity(nickname, membroBuscado) : 0;

                        return usernameSimilarity > 0.6 || nicknameSimilarity > 0.6;
                    })
                    .map(member => {
                        const username = member.user.username;
                        const nickname = member.nickname;
                        const similarity = Math.max(
                            stringSimilarity(username.toLowerCase(), membroBuscado),
                            nickname ? stringSimilarity(nickname.toLowerCase(), membroBuscado) : 0
                        );

                        return {
                            label: nickname ? `${nickname} (${username})` : username,
                            value: member.id,
                            description: `Similaridade: ${Math.round(similarity * 100)}%`,
                            emoji: similarity > 0.85 ? '🔍' : '👤'
                        };
                    })
                    .sort((a, b) => parseFloat(b.description.split(': ')[1]) - parseFloat(a.description.split(': ')[1]));

                if (membros.length === 0) {
                    return interaction.reply({
                        content: `❌ Nenhum recrutador encontrado com "${membroBuscado}". Tente um nome similar.`,
                        ephemeral: true
                    });
                }

                const membroSelectMenu = new StringSelectMenuBuilder()
                    .setCustomId('selecionarMembroPolicial')
                    .setPlaceholder(`Selecione quem te recrutou...`)
                    .addOptions(membros.slice(0, 25));

                await interaction.reply({
                    content: `🔍 ${membros.length} recrutador(es) encontrado(s) - Selecione abaixo:`,
                    components: [new ActionRowBuilder().addComponents(membroSelectMenu)],
                    ephemeral: true,
                });

            } catch (error) {
                console.error('Erro na busca de recrutador:', error);
                await interaction.reply({
                    content: '❌ Ocorreu um erro ao buscar recrutadores. Por favor, tente novamente.',
                    ephemeral: true
                });
            }
        }

        // Dropdown de seleção de recrutador... NAO ESQUECER
        if (interaction.isStringSelectMenu() && interaction.customId === 'selecionarMembroPolicial') {
            await interaction.deferReply({ ephemeral: true });

            try {
                const membroId = interaction.values[0];
                const membro = await interaction.guild.members.fetch(membroId).catch(() => null);

                if (!membro) {
                    return interaction.editReply({
                        content: '❌ Recrutador não encontrado no servidor.',
                        ephemeral: true
                    });
                }

                // Salva no banco de dados
                await db.set(`membroSelecionado_${interaction.user.id}`, membroId);

                // Recupera dados do formulário
                const formularioData = await db.get(`formulario_policial_${interaction.user.id}`);
                if (!formularioData) {
                    return interaction.editReply({
                        content: '❌ Dados do formulário não encontrados. Por favor, preencha o formulário novamente.',
                        ephemeral: true
                    });
                }

                // Obtém o canal de confirmação/cancelamento do banco de dados. NAO ESQUECER
                const canalConfiCancelaId = await db.get(`canal_confi_cancela_${interaction.guild.id}`);
                if (!canalConfiCancelaId) {
                    return interaction.editReply({
                        content: '❌ Canal de confirmação/cancelamento não configurado. Use /sistema_rota para configurar.',
                        ephemeral: true
                    });
                }

                const canalConfiCancela = interaction.guild.channels.cache.get(canalConfiCancelaId);
                if (!canalConfiCancela?.isTextBased()) {
                    return interaction.editReply({
                        content: '❌ Canal de confirmação/cancelamento não encontrado ou inválido.',
                        ephemeral: true
                    });
                }

                const embedConfirmacao = new EmbedBuilder()
                    .setColor("#1a5fb4")
                    .setTitle("🚓 SOLICITAÇÃO DE REGISTRO POLICIAL")
                    .setDescription(`📨 **Nova solicitação de ingresso no departamento**\n\n**Solicitante:** ${interaction.user.toString()}\n**Recrutador:** ${membro.toString()}`)
                    .addFields(
                        {
                            name: "📋 DADOS DO CONSCRITO",
                            value: "```prolog\nInformações fornecidas:\n```",
                            inline: false
                        },
                        {
                            name: "📻 QRA (Identificação)",
                            value: `\`\`\`fix\n${formularioData.qra}\n\`\`\``,
                            inline: true
                        },
                        {
                            name: "🎮 ID DO GAME",
                            value: `\`\`\`fix\n${formularioData.id}\n\`\`\``,
                            inline: true
                        },
                        {
                            name: "👤 RECRUTADOR RESPONSÁVEL",
                            value: `\`\`\`diff\n+ ${membro.displayName}\n\`\`\``,
                            inline: false
                        },
                        {
                            name: "⏰ DATA DO REGISTRO",
                            value: `\`\`\`\n${new Date().toLocaleString('pt-BR')}\n\`\`\``,
                            inline: true
                        },
                        {
                            name: "📊 STATUS",
                            value: "```diff\n+ Aguardando aprovação\n- Pendente de análise\n```",
                            inline: true
                        }
                    )
                    .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, size: 512 }))
                    .setFooter({
                        text: `Sistema de Registro • ${interaction.guild.name}`,
                        iconURL: interaction.guild.iconURL()
                    })
                    .setTimestamp();

               
                const patenteSelect = new StringSelectMenuBuilder()
                    .setCustomId('selecionar_patente')
                    .setPlaceholder('Selecione a patente')
                    .addOptions([
                        {
                            label: 'Cabo',
                            description: 'Atribuir patente de Cabo',
                            value: 'CABO',
                            emoji: '🎖️'
                        },
                        {
                            label: '3º Sargento',
                            description: 'Atribuir patente de 3º Sargento',
                            value: 'TERCEIRO_SARGENTO',
                            emoji: '🎖️'
                        },
                        {
                            label: '2º Sargento',
                            description: 'Atribuir patente de 2º Sargento',
                            value: 'SEGUNDO_SARGENTO',
                            emoji: '🎖️'
                        },
                        {
                            label: '1º Sargento',
                            description: 'Atribuir patente de 1º Sargento',
                            value: 'PRIMEIRO_SARGENTO',
                            emoji: '🎖️'
                        }
                    ]);

                const cancelButton = new ButtonBuilder()
                    .setCustomId('cancelarFormularioPolicial')
                    .setLabel('❌ Cancelar')
                    .setStyle(ButtonStyle.Danger);

                const row1 = new ActionRowBuilder().addComponents(patenteSelect);
                const row2 = new ActionRowBuilder().addComponents(cancelButton);
                // Envia a mensagem de confirmação
                const mensagemConfirmacao = await canalConfiCancela.send({
                    content: `Recrutador ${membro.toString()} você foi notificado:`,
                    embeds: [embedConfirmacao],
                    components: [row1, row2],
                });

                // Armazena referência no banco de dados
                await db.set(`usuarioQueEnviouFormulario_${mensagemConfirmacao.id}`, interaction.user.id);
                await db.set(`recrutadorDoUsuario_${interaction.user.id}`, membroId);

                // Resposta ao usuário - Embed 
                const embedApos = new EmbedBuilder()
                    .setColor("#00FF00") // Verde para sucesso
                    .setTitle("✅ REGISTRO ENVIADO COM SUCESSO!")
                    .setDescription("📨 **Seu formulário foi encaminhado para análise**\n*Aguarde a aprovação do seu recrutador*")
                    .addFields(
                        {
                            name: "📋 DADOS ENVIADOS",
                            value: "```prolog\nDados registrados no sistema:\n```",
                            inline: false
                        },
                        {
                            name: "📻 QRA (Identificação)",
                            value: `\`\`\`${formularioData.qra}\`\`\``,
                            inline: true
                        },
                        {
                            name: "🎮 ID NO GAME",
                            value: `\`\`\`${formularioData.id}\`\`\``,
                            inline: true
                        },
                        {
                            name: "⏰ PRÓXIMOS PASSOS",
                            value: "```diff\n+ Aguardar aprovação do recrutador\n+ Receber confirmação via DM\n+ Atribuição de patente\n```",
                            inline: false
                        },
                        {
                            name: "📞 SUPORTE",
                            value: "```\nCaso tenha problemas, contate a administração\n```",
                            inline: false
                        }
                    )
                    .setFooter({
                        text: `Sistema de Registro • ${interaction.guild.name}`,
                        iconURL: interaction.guild.iconURL()
                    })
                    .setTimestamp();

                await interaction.editReply({
                    content: `✅ ${membro.toString()} foi notificado sobre seu registro! Aguarde a confirmação.\n\n`,
                    embeds: [embedApos],
                    ephemeral: true
                });

            } catch (error) {
                console.error('Erro no processamento da seleção:', error);
                await interaction.editReply({
                    content: '❌ Ocorreu um erro ao processar sua seleção. Por favor, tente novamente.',
                    ephemeral: true
                });
            }
        }


        // Botão para cancelar o formulário 
        if (interaction.isButton() && interaction.customId === 'cancelarFormularioPolicial') {
            const modal = new ModalBuilder()
                .setCustomId('modalCancelarRegistroPolicial')
                .setTitle('Cancelar Registro Policial');

            const motivoInput = new TextInputBuilder()
                .setCustomId('motivoCancelamentoPolicial')
                .setLabel("Motivo do cancelamento")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setMinLength(10)
                .setMaxLength(1000);

            modal.addComponents(new ActionRowBuilder().addComponents(motivoInput));
            await interaction.showModal(modal);
        }
        // Handler para seleção de patente  //   NAO ESQUECER
        if (interaction.isStringSelectMenu() && interaction.customId === 'selecionar_patente') {
            await interaction.deferReply({ ephemeral: true });

            try {
                const patenteSelecionada = interaction.values[0];
                const usuarioQueEnviouFormularioId = await db.get(`usuarioQueEnviouFormulario_${interaction.message.id}`);

                if (!usuarioQueEnviouFormularioId) {
                    return interaction.editReply({ content: '❌ Não foi possível identificar o usuário.', ephemeral: true });
                }

                const formularioData = await db.get(`formulario_policial_${usuarioQueEnviouFormularioId}`);
                if (!formularioData) {
                    return interaction.editReply({ content: '❌ Dados do formulário não encontrados.', ephemeral: true });
                }

                const membroId = await db.get(`membroSelecionado_${usuarioQueEnviouFormularioId}`);
                const membro = await interaction.guild.members.fetch(membroId).catch(() => null);
                if (!membro) {
                    return interaction.editReply({ content: '❌ Recrutador não encontrado.', ephemeral: true });
                }

                // Obtém o canal de logs
                const canalLogsId = await db.get(`canal_logs_${interaction.guild.id}`);
                const canalLogs = interaction.guild.channels.cache.get(canalLogsId);
                if (!canalLogs) {
                    return interaction.editReply({ content: '❌ Canal de logs não encontrado.', ephemeral: true });
                }

                const CARGO_NOVATO = '1362134396273950920';
                const patente = patentes[patenteSelecionada];
                let cargoStatus = "✅ Cargos atualizados";

                // Definir o novo apelido baseado na patente..
                let novoApelido = '';
                const novoMembro = await interaction.guild.members.fetch(usuarioQueEnviouFormularioId);

                switch (patenteSelecionada) {
                    case 'CABO':
                        novoApelido = `${patente.prefixo} | ${formularioData.qra} | ${formularioData.id}`;
                        break;
                    case 'TERCEIRO_SARGENTO':
                        novoApelido = `${patente.prefixo} | ${formularioData.qra} | ${formularioData.id}`;
                        break;
                    case 'SEGUNDO_SARGENTO':
                        novoApelido = `${patente.prefixo} | ${formularioData.qra} | ${formularioData.id}`;
                        break;
                    case 'PRIMEIRO_SARGENTO':
                        novoApelido = `${patente.prefixo} | ${formularioData.qra} | ${formularioData.id}`;
                        break;
                }

                try {
                    // Remove cargo de novato e adiciona a patente selecionada..
                    await novoMembro.roles.remove(CARGO_NOVATO).catch(() => { });
                    await novoMembro.roles.add([patente.id, ...CARGO_SEPARACAO]);
                    cargoStatus = `✅ Patente atribuída: ${patente.nome}`;

                    try {
                        await novoMembro.setNickname(novoApelido);
                        cargoStatus += `\n🆔 Apelido atualizado: ${novoApelido}`;
                    } catch (error) {
                        cargoStatus += "\n⚠️ Sem permissão para alterar apelido";
                    }

                } catch (error) {
                    console.error('Erro ao atualizar membro:', error);
                    cargoStatus = '❌ Erro ao atualizar perfil';
                }

                // Cria o embed de log...
                const embedLog = new EmbedBuilder()
                    .setColor("#00FF00")
                    .setAuthor({
                        name: `🚓 REGISTRO CONFIRMADO - ${interaction.guild.name.toUpperCase()}`,
                        iconURL: interaction.guild.iconURL()
                    })
                    .setThumbnail(interaction.client.users.cache.get(usuarioQueEnviouFormularioId)?.displayAvatarURL({
                        dynamic: true,
                        size: 1024
                    }))
                    .setDescription(`### ✅ NOVO OFICIAL REGISTRADO NO SISTEMA\n**<@${usuarioQueEnviouFormularioId}>** foi admitido por ${membro.toString()}`)
                    .addFields(
                        {
                            name: "📊 DADOS DO NOVO RECRUTA",
                            value: "```prolog\nInformações do registro:\n```",
                            inline: false
                        },
                        {
                            name: "📻 QRA (Identificação)",
                            value: `\`\`\`fix\n${formularioData.qra}\n\`\`\``,
                            inline: true
                        },
                        {
                            name: "🎮 ID DO GAME",
                            value: `\`\`\`fix\n${formularioData.id}\n\`\`\``,
                            inline: true
                        },
                        {
                            name: "🎖️ PATENTE ATRIBUÍDA",
                            value: `\`\`\`diff\n+ ${patente.nome}\n\`\`\``,
                            inline: true
                        },
                        {
                            name: "👮 RECRUTADOR",
                            value: `\`\`\`diff\n+ ${membro.displayName}\n\`\`\``,
                            inline: true
                        },
                        {
                            name: "📈 STATUS DO CADASTRO",
                            value: `\`\`\`diff\n+ ${cargoStatus}\n\`\`\``,
                            inline: false
                        },
                        {
                            name: "⏰ DATA/HORA",
                            value: `\`\`\`\n${new Date().toLocaleString('pt-BR')}\n\`\`\``,
                            inline: true
                        },
                        {
                            name: "✅ CONFIRMADO POR",
                            value: `\`\`\`\n${interaction.user.tag}\n\`\`\``,
                            inline: true
                        }
                    )
                    .setFooter({
                        text: `Sistema de Logs • ${interaction.guild.name}`,
                        iconURL: interaction.user.displayAvatarURL()
                    })
                    .setTimestamp();

                await canalLogs.send({ embeds: [embedLog] });

                try {
                    // Envia mensagem de boas-vindas para o novo membro...
                    const embedBemVindo = new EmbedBuilder()
                        .setColor('#1a5fb4')
                        .setTitle(`✅ REGISTRO CONFIRMADO - ${interaction.guild.name}`)
                        .setDescription(">>> 🎉 **Parabéns! Seu cadastro foi aprovado!**\n*Agora você é um membro oficial do nosso departamento*")
                        .addFields(
                            {
                                name: "📊 SEUS DADOS",
                                value: "```asciidoc\n[QRA] :: " + formularioData.qra + "\n[ID] :: " + formularioData.id + "\n[Patente] :: " + patente.nome + "\n```",
                                inline: false
                            },
                            {
                                name: "👮 RECRUTADOR",
                                value: "```\n" + membro.displayName + "\n```",
                                inline: true
                            },
                            {
                                name: "📅 DATA",
                                value: "```\n" + new Date().toLocaleDateString('pt-BR') + "\n```",
                                inline: true
                            },
                            {
                                name: "💡 PRÓXIMOS PASSOS",
                                value: "```diff\n+ Explore o servidor\n+ Participe das atividades\n+ Leia as regras\n```",
                                inline: false
                            }
                        )
                        .setThumbnail(interaction.guild.iconURL())
                        .setFooter({
                            text: 'Bem-vindo ao nosso departamento!',
                            iconURL: interaction.guild.iconURL()
                        })
                        .setTimestamp();

                    await novoMembro.send({
                        content: `🎉 Olá ${novoMembro.toString()}! Seu registro foi confirmado!`,
                        embeds: [embedBemVindo]
                    });

                } catch (error) {
                    console.log('Não foi possível enviar DM:', error);
                }

                // Atualiza a embed original
                await atualizarEmbedSolicitacao(interaction, 'confirmado', `Patente: ${patente.nome}`);

                await interaction.editReply({
                    content: `✅ Registro confirmado e patente **${patente.nome}** atribuída com sucesso!`,
                    ephemeral: true
                });

                
                // Limpa os dados
                await Promise.all([
                    db.delete(`formulario_policial_${usuarioQueEnviouFormularioId}`),
                    db.delete(`membroSelecionado_${usuarioQueEnviouFormularioId}`),
                    db.delete(`usuarioQueEnviouFormulario_${interaction.message.id}`)
                ]);

            } catch (error) {
                console.error('Erro ao confirmar com patente:', error);
                await interaction.editReply({
                    content: '❌ Ocorreu um erro ao confirmar o registro.',
                    ephemeral: true
                });
            }
        }

        // Modal de cancelamento
        if (interaction.isModalSubmit() && interaction.customId === 'modalCancelarRegistroPolicial') {
            await interaction.deferReply({ ephemeral: true });

            try {
                const motivo = interaction.fields.getTextInputValue('motivoCancelamentoPolicial');

                if (!motivo || motivo.trim().length < 10) {
                    return interaction.editReply({
                        content: '❌ O motivo deve ter pelo menos 10 caracteres.',
                        ephemeral: true
                    });
                }

                const usuarioId = await db.get(`usuarioQueEnviouFormulario_${interaction.message.id}`);
                if (!usuarioId) {
                    return interaction.editReply({
                        content: '❌ Registro não encontrado.',
                        ephemeral: true
                    });
                }

                const formularioData = await db.get(`formulario_policial_${usuarioId}`) || {};

                // Obtém o canal de logs do banco de dados para enviar o cancelamento
                const canalLogsId = await db.get(`canal_logs_${interaction.guild.id}`);
                if (!canalLogsId) {
                    return interaction.editReply({
                        content: '❌ Canal de logs não configurado.',
                        ephemeral: true
                    });
                }

                const canalLogs = interaction.guild.channels.cache.get(canalLogsId);

                if (canalLogs) {
                    await canalLogs.send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('#FF5555')
                                .setTitle('❌ REGISTRO POLICIAL CANCELADO')
                                .setDescription(`Registro de <@${usuarioId}> foi cancelado pelo staff.`)
                                .addFields(
                                    {
                                        name: '📌 Informações do Oficial',
                                        value: [
                                            `▸ **QRA:** \`${formularioData.qra || 'Não informado'}\``,
                                            `▸ **ID:** \`${formularioData.id || 'Não informado'}\``,
                                            `▸ **Data do Registro:** <t:${Math.floor(Date.now() / 1000)}:f>`
                                        ].join('\n'),
                                        inline: false
                                    },
                                    {
                                        name: '📝 Detalhes do Cancelamento',
                                        value: [
                                            `▸ **Motivo:** \`\`\`${motivo.slice(0, 1000) || 'Não especificado'}\`\`\``,
                                            `▸ **Staff Responsável:** ${interaction.user.toString()}`,
                                            `▸ **Data/Hora:** <t:${Math.floor(Date.now() / 1000)}:F>`
                                        ].join('\n\n'),
                                        inline: false
                                    }
                                )
                                .setFooter({
                                    text: `Cancelamento realizado • ${interaction.guild.name}`,
                                    iconURL: interaction.guild.iconURL()
                                })
                                .setTimestamp()
                        ]
                    });
                }

                // Atualiza a embed original
                await atualizarEmbedSolicitacao(interaction, 'cancelado', motivo);

                // Limpa os dados
                await Promise.all([
                    db.delete(`formulario_policial_${usuarioId}`),
                    db.delete(`membroSelecionado_${usuarioId}`),
                    db.delete(`usuarioQueEnviouFormulario_${interaction.message.id}`)
                ]);

                await interaction.editReply({
                    content: `✅ Cancelamento registrado em <#${canalLogsId}>!`,
                    ephemeral: true
                });

            } catch (error) {
                console.error('Erro no cancelamento:', error);
                await interaction.editReply({
                    content: '❌ Ocorreu um erro ao processar o cancelamento.',
                    ephemeral: true
                });
            }
        }
    }
};