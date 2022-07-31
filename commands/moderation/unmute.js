const { PermissionFlagsBits, ApplicationCommandOptionType, ChatInputCommandInteraction, EmbedBuilder, AuditLogEvent } = require("discord.js");
const Command = require("../../structures/Command.js");
const { Channels } = require('../../config.json');

module.exports = class Unmute extends Command {
    constructor(...args) {
        super(...args, {
            name: 'unmute',
            description: 'Unmute\'s User',
            category: 'Moderation',
            usage: '[user]',
            client_permissions: [PermissionFlagsBits.ModerateMembers],
            user_permissions: [PermissionFlagsBits.ModerateMembers],
            options: [
                { name: 'user', type: ApplicationCommandOptionType.User, description: 'User to Unmute', required: true }
            ]
        });
    };

    /**
     * 
     * @param {ChatInputCommandInteraction} interaction CommandInteraction
     * @returns Unmute's User
     */

    async InteractionRun(interaction) {
        try {
            const member = interaction.options.getMember('user');

            if (!member) return await interaction.reply({ content: '*Player has left the server!*', ephemeral: true });
            if (member.roles.highest.comparePositionTo(interaction.member.roles.highest) >= 0) return await interaction.reply({ content: '*You do not have permissions to unmute this player!*', ephemeral: true });

            if (member.isCommunicationDisabled()) {
                await interaction.deferReply();
                await member.timeout(null);

                const memberTimeoutRemovalEmbed = new EmbedBuilder()
                    .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                    .setColor('Green')
                    .setTitle(`Timeout removed for ${member.user.tag}`)
                    .setThumbnail(member.user.displayAvatarURL())
                    .setDescription(`*Timeout has been removed from **${member.user.tag}** in the server on <t:${Math.floor(Date.now() / 1000)}> (<t:${Math.floor(Date.now() / 1000)}:R>)*`)
                    .addFields([
                        { name: 'User', value: member.user.tag, inline: true },
                        { name: 'ID', value: member.id, inline: true },
                        { name: 'Unmuted By', value: `${interaction.user}`, inline: true },
                    ])
                    .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                    .setTimestamp();

                await interaction.editReply({ content: `*Timeout has been removed for **${member.user.tag}***` });
                return await this.bot.utils.auditSend(Channels.SkyLogId, { embeds: [memberTimeoutRemovalEmbed] });
            } else {
                return await interaction.reply({ content: '*Player has not been muted!*', ephemeral: true });
            };
        } catch (error) {
            console.error(error);
            return await this.bot.utils.error(interaction, error);
        };
    };
};