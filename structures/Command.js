const { ApplicationCommandType } = require("discord.js");

module.exports = class Command {
    constructor(bot, name, options = {}) {
        this.bot = bot;
        this.name = options.name || name;
        this.description = options.description || null;
        this.category = options.category;
        this.usage = options.usage || 'No Usage';
        this.permissions = options.permissions || [];
        this.type = options.type || ApplicationCommandType.ChatInput;
        this.commandOptions = options.commandOptions || [];
    };

    async InteractionRun(interaction) {
        throw new Error(`InteractionCommand ${this.name} doesn't provide a run method!`);
    }
};