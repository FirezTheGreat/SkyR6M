const { PermissionFlagsBits, ApplicationCommandOptionType, ChatInputCommandInteraction, userMention } = require('discord.js');
const Command = require('../../structures/Command.js');

module.exports = class Unban extends Command {
    constructor(...args) {
        super(...args, {
            name: 'unban',
            description: 'Unban\'s User',
            category: 'Moderation',
            usage: '[ID]',
            client_permissions: [PermissionFlagsBits.BanMembers],
            user_permissions: [PermissionFlagsBits.BanMembers],
            options: [
                { name: 'id', type: ApplicationCommandOptionType.String, description: 'ID to Unban', required: true }
            ]
        });
    };

    /**
     * 
     * @param {ChatInputCommandInteraction} interaction CommandInteraction
     * @returns Unban's User
     */

    async InteractionRun(interaction) {
        try {
            const user_id = interaction.options.getString('id');

            try {
                await interaction.guild.bans.remove(user_id);
            } catch (error) {
                interaction.followUp({ content: `*Couldn\'t Unban User - ${userMention(user_id)} from ${interaction.guild.name}!*` });
            };

            return await interaction.editReply({ content: `*Unbanned ${banned_users.join(', ')} from ${interaction.guild.name}!*` });
        } catch (error) {
            console.error(error);
            return await this.bot.utils.error(interaction, error);
        };
    };
};