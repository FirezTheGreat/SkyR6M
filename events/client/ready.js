const { ApplicationCommandType } = require('discord.js');
const Event = require('../../structures/Event');

module.exports = class Ready extends Event {
    constructor(...args) {
        super(...args, {
            once: true
        });
    };

    async EventRun() {
        try {
            let ChatInputCommands = this.bot.commands.filter(({ type }) => type === ApplicationCommandType.ChatInput);

            for (const [key, { description, type, commandOptions, permissions }] of ChatInputCommands) {
                const ChatInputData = await this.bot.guilds.cache.first().commands.create({ name: key, description, type, options: commandOptions });

                await ChatInputData.permissions.add({ permissions });
            };

            let UserCommands = this.bot.commands.filter(({ type }) => [ApplicationCommandType.User, ApplicationCommandType.Message].includes(type));

            for (const [key, { type, permissions }] of UserCommands) {
                const UserData = await this.bot.guilds.cache.first().commands.create({ name: key, type });

                await UserData.permissions.add({ permissions });
            };

            console.log(`${this.bot.user.username} is Online!`);
        } catch (error) {
            console.error(error);
        };
    };
};