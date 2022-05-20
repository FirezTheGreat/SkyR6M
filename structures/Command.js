const { ApplicationCommandType, PermissionFlagsBits } = require("discord.js");
const SkyR6M = require("./SkyR6M");

module.exports = class Command {
    /**
     * 
     * @param {SkyR6M} bot Client
     * @param {string} name Command Name
     * @param {object} options Command Options
     * @param {string} options.name Command Name
     * @param {string} options.description Command Description
     * @param {string} options.category Command Category
     * @param {string} options.usage Command Usage
     * @param {number} options.type Command Type
     * @param {array<import("discord.js").PermissionFlags>} options.client_permissions Command Permissions
     * @param {array<import("discord.js").PermissionFlags>} options.user_permissions User Permissions
     * @param {array} options.sub_commands Sub Commands Array
     * @param {array} options.options Command Options
     */

    constructor(bot, name, options = {}) {
        this.bot = bot;
        this.name = options.name || name;
        this.description = options.description || null;
        this.category = options.category;
        this.usage = options.usage || null;
        this.type = options.type || ApplicationCommandType.ChatInput;
        this.client_permissions = [
            PermissionFlagsBits.UseApplicationCommands, PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, ...options.client_permissions ?? []
        ],
        this.user_permissions = [...options.user_permissions ?? []]
        this.sub_commands = options.sub_commands || [];
        this.options = options.options || [];
    };

    async InteractionRun(interaction) {
        throw new Error(`InteractionCommand ${this.name} doesn't provide a run method!`);
    }
};
