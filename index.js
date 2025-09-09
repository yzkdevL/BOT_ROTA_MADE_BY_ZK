// =================================================================
// 1. IMPORTAÇÕES E CONFIGURAÇÕES INICIAIS
// =================================================================
const Discord = require("discord.js");
const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ChannelType,
    PermissionFlagsBits,
    ButtonBuilder,
    ButtonStyle,
    PermissionsBitField,
    Partials,
    Collection,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    AttachmentBuilder
} = require('discord.js');
const config = require("./config.js");
const handler = require('./handler');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.GuildWebhooks,

    ],
    partials: [Partials.Channel, Partials.Message]
});

client.slashCommands = new Collection();
handler(client);

// Status do bot
const statuses = [
    { name: '🚓 Em patrulhamento pelas ruas', type: Discord.ActivityType.Playing },
    { name: `👮 Bot Exclusivo da Rota`, type: Discord.ActivityType.Watching },
    { name: '📻 Ouvindo a central de comando...', type: Discord.ActivityType.Listening },
    { name: '🔦 Operação em andamento', type: Discord.ActivityType.Competing },
    { name: '🛑 Rota Policiamento 24h', type: Discord.ActivityType.Playing },
];



const setagemHD = require('./systems/setagemHD');



client.on('clientReady', async () => {
    console.log(`Bot ${client.user.tag} está online!`);

    // Inicia a rotação de status
    let i = 0;
    setInterval(() => {
        const currentStatus = statuses[i];
        let statusToSet = { ...currentStatus };

        if (statusToSet.name.includes('{servers}')) {
            const serverCount = client.guilds.cache.size;
            statusToSet.name = statusToSet.name.replace('{servers}', serverCount);
        }

        client.user.setActivity(statusToSet);
        i = (i + 1) % statuses.length;
    }, 5000); // Muda a cada 5 segundos
});


client.on('interactionCreate', async (interaction) => {
    try {
        if (interaction.type === Discord.InteractionType.ApplicationCommand) {
            const cmd = client.slashCommands.get(interaction.commandName);
            if (!cmd) {
                return interaction.reply({ content: '❌ Comando não encontrado.', ephemeral: true });
            }

            if (!interaction.member) {
                interaction.member = await interaction.guild.members.fetch(interaction.user.id);
            }
            await cmd.run(client, interaction);
        }
        await setagemHD.execute(interaction);

    } catch (error) {
        console.error("Erro ao iniciar verificação:", error);
        await interaction.reply({ content: '❌ Ocorreu um erro ao iniciar a verificação.', ephemeral: true });
    }

})
// =================================================================
// 3. HANDLERS DE ERROS GLOBAIS
// =================================================================
process.on('uncaughtException', (err) => {
    console.error('❌ Erro não tratado (uncaughtException):', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promessa rejeitada sem tratamento (unhandledRejection):', reason);
});


// =================================================================
// 6. LOGIN DO BOT
// =================================================================
client.login(config.token)
    .then(() => console.log('✅ Bot está conectado ao Discord.'))
    .catch((error) => console.error('❌ Erro ao conectar o bot:', error));