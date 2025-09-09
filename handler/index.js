const fs = require("fs");
const path = require("path"); // Módulo para lidar com caminhos de forma segura

module.exports = async (client) => {
  const SlashsArray = [];
  const commandsPath = path.join(__dirname, '..', 'Comandos');

  // Função auxiliar para carregar um comando, evitando repetição de código
  const loadCommand = (filePath) => {
    try {
      // A correção aqui é carregar o comando apenas UMA VEZ
      const command = require(filePath);

      // Verificação para garantir que o comando é válido
      if (command.name && command.run) {
        client.slashCommands.set(command.name, command);
        SlashsArray.push(command);
        console.log(`✅ Comando carregado: /${command.name}`);
      } else {
        console.log(`❌ Falha ao carregar o comando em: ${filePath}.`);
      }
    } catch (error) {
      console.error(`❌ Erro ao carregar comando de ${filePath}:`, error);
    }
  };

  // Função recursiva que lê a pasta 'Comandos' e todas as subpastas
  const readCommands = (directory) => {
    // Usamos readdirSync para corrigir o problema de tempo (assíncrono)
    const items = fs.readdirSync(directory);

    for (const item of items) {
      const fullPath = path.join(directory, item);
      const stats = fs.lstatSync(fullPath);

      // Se o item for uma PASTA, a função "mergulha" nela
      if (stats.isDirectory()) {
        readCommands(fullPath);
      }
      // Se for um ARQUIVO .js, ele é carregado
      else if (stats.isFile() && item.endsWith('.js')) {
        loadCommand(fullPath);
      }
    }
  };

  try {
    // Inicia o processo de leitura a partir da pasta principal 'Comandos'
    readCommands(commandsPath);
  } catch (error) {
    console.error("❌ Erro ao ler a pasta de comandos:", error);
  }

  // A lógica de registrar os comandos no evento "ready" permanece a mesma
  client.on("clientReady", async () => {
    try {
      console.log(`Iniciando o registro de ${SlashsArray.length} comandos (/).`);
      await client.application.commands.set(SlashsArray);
      console.log("✅ Comandos (/) registrados com sucesso!");
    } catch (error) {
      console.error("❌ Erro ao registrar os comandos:", error);
    }
  });
};