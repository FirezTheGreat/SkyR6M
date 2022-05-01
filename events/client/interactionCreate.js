const Event = require('../../structures/Event.js');

module.exports = class interactionCreate extends Event {
    constructor(...args) {
        super(...args)
    };

    async EventRun(interaction) {
        if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
            const command = this.bot.commands.get(interaction.commandName);
            if (command) command.InteractionRun(interaction);
        };
    };
};