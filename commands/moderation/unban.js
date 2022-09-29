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
                { name: 'id', type: ApplicationCommandOptionType.String, description: 'ID to Unban', required: false },
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
            const users = interaction.options._hoistedOptions.map(({ value }) => value);
            const banned_users = [];

            if (!users.length) return await interaction.reply({ content: '*Please Enter an User ID or User*', ephemeral: true });

            await interaction.deferReply();

            for (const value of users) {
                try {
                    try {
                        await interaction.guild.bans.fetch(value);
                    } catch {
                        interaction.followUp({ content: `*User ${userMention(value)} is not Banned!*` });
                        continue;
                    };
                    await interaction.guild.bans.remove(value);

                    banned_users.push(userMention(value));
                } catch (error) {
                    interaction.followUp({ content: `*Couldn\'t Unban User - ${value} from ${interaction.guild.name}!*` });
                };
            };

            if (banned_users.length) return await interaction.editReply({ content: `*Unbanned ${banned_users.join(', ')} from ${interaction.guild.name}!*` });
        } catch (error) {
            console.error(error);
            return await this.bot.utils.error(interaction, error);
        };
    };
};