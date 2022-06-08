const { ChatInputCommandInteraction } = require('discord.js');
const Command = require('../../structures/Command.js');
const Event = require('../../structures/Event.js');

module.exports = class interactionCreate extends Event {
    constructor(...args) {
        super(...args, {
            type: 'Client'
        });
    };

    /**
    * 
    * @param {ChatInputCommandInteraction} interaction CommandInteraction
    * @returns CommandInteraction
    */

    EventRun(interaction) {
        if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
            const command = this.bot.commands.get(interaction.commandName);
            if (command) {
                if (!interaction.guild.members.me.permissions.has(command.client_permissions)) {
                    return interaction.reply({ content: '*I do not have permission to run this command!*' });
                } else if (command.user_permissions.length && !interaction.member.permissions.has(command.user_permissions)) {
                    return interaction.reply({ content: '*You do not have permission to run this command!*' });
                } else {
                    return command.InteractionRun(interaction);
                };
            };
        };
    };
};