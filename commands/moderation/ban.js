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

            for (const id of users) {
                try {
                    const ban = interaction.guild.bans.cache.get(id);
                    if (ban) {
                        await interaction.followUp({ content: `*User ${userMention(id)} is already Banned!*` });
                        continue;
                    };

                    const user = interaction.guild.members.cache.get(id);
                    if (user && !user.bannable) throw ({ code: 'unknown', message: `*Couldn\'t Ban User - *${userMention(id)}* from ${interaction.guild.name}!*` });

                    await this.bot.rest.put(Routes.guildBan(interaction.guildId, id), {
                        body: { delete_message_days: 0 },
                        reason
                    });
                    banned_users.push(userMention(id));

                    await Players.findOneAndDelete({ id });
                } catch (error) {
                    await interaction.followUp({ content: error.code !== 'unknown' ? `*Couldn\'t Ban User - *${id}* from ${interaction.guild.name}!*` : error.message });
                };
            };

            if (banned_users.length) return await interaction.editReply({ content: `*Banned ${banned_users.join(', ')} from ${interaction.guild.name}!*` });
        } catch (error) {
            console.error(error);
            return await this.bot.utils.error(interaction, error);
        };
    };
};