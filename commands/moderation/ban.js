const { Routes } = require('discord-api-types/v10');
const { ApplicationCommandOptionType, ChatInputCommandInteraction, PermissionFlagsBits } = require('discord.js');
const Command = require('../../structures/Command.js');
const Players = require('../../structures/models/Players.js');

module.exports = class Ban extends Command {
    constructor(...args) {
        super(...args, {
            name: 'ban',
            description: 'Ban\'s User',
            category: 'Moderation',
            usage: '[ID | user]',
            client_permissions: [PermissionFlagsBits.BanMembers],
            user_permissions: [PermissionFlagsBits.BanMembers],
            options: [
                { name: 'id', type: ApplicationCommandOptionType.String, description: 'ID to Ban', required: false },
                { name: 'user', type: ApplicationCommandOptionType.User, description: 'User to Ban', required: false }
            ]
        });
    };

    /**
     * 
     * @param {ChatInputCommandInteraction} interaction CommandInteraction
     * @returns Ban's User
     */

    async InteractionRun(interaction) {
        try {
            const users = interaction.options._hoistedOptions.map(({ value }) => value);
            const banned_users = [];

            if (!users.length) return await interaction.reply({ content: '*Please Enter an User ID or User*', ephemeral: true });

            await interaction.deferReply();

            for (const value of users) {
                try {
                    const user = interaction.guild.members.cache.get(value);
                    if (user && !user.bannable) throw ({ code: 'unknown', message: `*Couldn\'t Ban User - *<@${value}>* from ${interaction.guild.name}!*` });

                    await this.bot.rest.put(Routes.guildBan(interaction.guildId, value));
                    banned_users.push(`<@${value}>`);

                    await Players.findOneAndDelete({ id: value });
                } catch (error) {
                    interaction.followUp({ content: error.code !== 'unknown' ? `*Couldn\'t Ban User - *${value}* from ${interaction.guild.name}!*` : error.message });
                };
            };

            if (banned_users.length) return await interaction.editReply({ content: `*Banned ${banned_users.join(', ')} from ${interaction.guild.name}!*` });
        } catch (error) {
            console.error(error);
            return this.bot.utils.error(interaction, error);
        };
    };
};