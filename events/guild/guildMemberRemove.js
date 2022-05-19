const { EmbedBuilder, AuditLogEvent, GuildMember } = require('discord.js');
const Event = require('../../structures/Event.js');
const PlayerStats = require('../../structures/models/PlayerStats.js');
const { Channels } = require('../../config.json');

module.exports = class guildMemberRemove extends Event {
    constructor(...args) {
        super(...args, {
            type: 'Guild'
        });
    };

    /**
     * 
     * @param {GuildMember} member Guild Member
     * @returns guildMemberRemove Event
     */

    async EventRun(member) {
        try {
            const player = await PlayerStats.findOne({ id: member.id });

            const { target } = (await member.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd })).entries.first() ?? { target: null };
            const { target: kick_target, executor: executor_kick, reason: reason_kick } = (await member.guild.fetchAuditLogs({ type: AuditLogEvent.MemberKick })).entries.first() ?? { target: null, executor: null, reason: null };

            if (member.id !== target?.id && member.id !== kick_target?.id) {
                const guildLeaveEmbed = new EmbedBuilder()
                    .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
                    .setColor('Red')
                    .setDescription(`***${member.user.tag}** has left the server on <t:${Math.floor(Date.now() / 1000)}> (<t:${Math.floor(Date.now() / 1000)}:R>)*`)
                    .addFields([
                        { name: 'Player', value: player?.name || 'Unregistered', inline: true },
                        { name: 'User ID', value: member.id, inline: true },
                        { name: 'Joined Server On', value: member.partial ? '*Cannot Determine*' : `<t:${Math.floor(member.joinedTimestamp / 1000)}> (<t:${Math.floor(member.joinedTimestamp / 1000)}:R>)` }
                    ])
                    .setFooter({ text: member.guild.name, iconURL: member.guild.iconURL() })
                    .setTimestamp();

                return this.bot.utils.auditSend(Channels.AuditLogId, { embeds: [guildLeaveEmbed] });
            } else if (member.id === kick_target?.id) {
                const guildKickEmbed = new EmbedBuilder()
                    .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
                    .setColor('Red')
                    .setDescription(`***${member.user.tag}** has been kicked from the server on <t:${Math.floor(Date.now() / 1000)}> (<t:${Math.floor(Date.now() / 1000)}:R>)*`)
                    .addFields([
                        { name: 'Player', value: player?.name || 'Unregistered', inline: true },
                        { name: 'User ID', value: member.id, inline: true },
                        { name: 'Joined Server On', value: member.partial ? '*Cannot Determine*' : `<t:${Math.floor(member.joinedTimestamp / 1000)}> (<t:${Math.floor(member.joinedTimestamp / 1000)}:R>)`, inline: true },
                        { name: 'Kicked By', value: `${executor_kick}`, inline: true },
                        { name: 'Executor Id', value: executor_kick.id, inline: true },
                        { name: 'Reason', value: `${reason_kick ?? 'None'}`, inline: true }
                    ])
                    .setFooter({ text: member.guild.name, iconURL: member.guild.iconURL() })
                    .setTimestamp();

                return this.bot.utils.auditSend(Channels.AuditLogId, { embeds: [guildKickEmbed] });
            };
        } catch (error) {
            console.error(error);
        };
    };
};