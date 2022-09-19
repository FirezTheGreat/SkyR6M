const { PermissionFlagsBits, ApplicationCommandOptionType, ChatInputCommandInteraction, EmbedBuilder } = require('discord.js');
const Command = require('../../structures/Command.js');
const { Channels } = require('../../config.json');

module.exports = class Mute extends Command {
    constructor(...args) {
        super(...args, {
            name: 'mute',
            description: 'Mute\'s User',
            category: 'Moderation',
            usage: '[user]',
            client_permissions: [PermissionFlagsBits.ModerateMembers],
            user_permissions: [PermissionFlagsBits.ModerateMembers],
            options: [
                { name: 'user', type: ApplicationCommandOptionType.User, description: 'User to Mute', required: true },
                {
                    name: 'duration', type: ApplicationCommandOptionType.String, description: 'Duration of Mute', required: true, choices: [
                        { name: '30 minutes', value: '1800000' },
                        { name: '2 hours', value: '7200000' },
                        { name: '4 hours', value: '14400000' }
                    ]
                },
                { name: 'reason', type: ApplicationCommandOptionType.String, description: 'Reason for Mute', required: false }
            ]
        });
    };

    /**
     * 
     * @param {ChatInputCommandInteraction} interaction CommandInteraction
     * @returns Mute's User
     */

    async InteractionRun(interaction) {
        try {
            const member = interaction.options.getMember('user');
            const duration = Number(interaction.options.getString('duration'));
            const reason = interaction.options.getString('reason') || 'No Reason';

            if (!member) return await interaction.reply({ content: '*Player has left the server!*', ephemeral: true });
            if (member.roles.highest.comparePositionTo(interaction.member.roles.highest) >= 0) return await interaction.reply({ content: '*You do not have permissions to mute this player!*', ephemeral: true });

            await interaction.deferReply();
            await member.timeout(member.isCommunicationDisabled() ? ((member.communicationDisabledUntilTimestamp - Date.now()) + duration) : duration, reason);

            const memberTimeoutEmbed = new EmbedBuilder()
                .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                .setColor('Red')
                .setTitle(`Timeout for ${member.user.tag}`)
                .setThumbnail(member.user.displayAvatarURL())
                .setDescription(`***${member.user.tag}** has been timed out from the server on <t:${Math.floor(Date.now() / 1000)}> (<t:${Math.floor(Date.now() / 1000)}:R>)*`)
                .addFields([
                    { name: 'User', value: member.user.tag, inline: true },
                    { name: 'Muted By', value: `${interaction.user}`, inline: true },
                    { name: 'Duration', value: this.bot.utils.formatTime(duration), inline: true },
                    { name: 'Reason', value: reason, inline: true }
                ])
                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                .setTimestamp();

            await interaction.editReply({ content: `***${member.user.tag}** has been timed out for ${this.bot.utils.formatTime(duration)}*` });
            return await this.bot.utils.auditSend(Channels.SkyLogId, { embeds: [memberTimeoutEmbed] });
        } catch (error) {
            console.error(error);
            return await this.bot.utils.error(interaction, error);
        };
    };
};