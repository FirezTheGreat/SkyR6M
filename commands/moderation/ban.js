const { Routes } = require('discord-api-types/v10');
const { PermissionFlagsBits, ApplicationCommandOptionType, ChatInputCommandInteraction, userMention } = require('discord.js');
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
                { name: 'reason', type: ApplicationCommandOptionType.String, description: 'Reason for Ban', required: true },
                { name: 'id', type: ApplicationCommandOptionType.String, description: 'ID to Ban', required: false },
                { name: 'user', type: ApplicationCommandOptionType.User, description: 'User to Ban', required: false },
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
            const users = interaction.options._hoistedOptions.filter((option) => option.name !== 'reason').map(({ value }) => value);
            const reason = interaction.options.getString('reason');
            const banned_users = [];

            if (!users.length) return await interaction.reply({ content: '*Please Enter an User ID or User*', ephemeral: true });

            await interaction.deferReply();

            for (const value of users) {
                try {
                    const ban = interaction.guild.bans.cache.get(value);
                    if (ban) {
                        await interaction.followUp({ content: `*User ${userMention(value)} is already Banned!*` });
                        continue;
                    };

                    const user = interaction.guild.members.cache.get(value);
                    if (user && !user.bannable) throw ({ code: 'unknown', message: `*Couldn\'t Ban User - *${userMention(value)}* from ${interaction.guild.name}!*` });

                    await this.bot.rest.put(Routes.guildBan(interaction.guildId, value), {
                        body: { delete_message_days: 0 },
                        reason
                    });
                    banned_users.push(userMention(value));

                    await Players.findOneAndDelete({ id: value });
                } catch (error) {
                    await interaction.followUp({ content: error.code !== 'unknown' ? `*Couldn\'t Ban User - *${value}* from ${interaction.guild.name}!*` : error.message });
                };
            };

            if (banned_users.length) return await interaction.editReply({ content: `*Banned ${banned_users.join(', ')} from ${interaction.guild.name}!*` });
        } catch (error) {
            console.error(error);
            return await this.bot.utils.error(interaction, error);
        };
    };
};