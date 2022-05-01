const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const Event = require('../../structures/Event.js');
const PlayerStats = require('../../structures/models/PlayerStats.js');
const { Channels } = require('../../config.json');

module.exports = class guildMemberRemove extends Event {
    constructor(...args) {
        super(...args);
    };

    async EventRun(member) {
        try {
            const player = await PlayerStats.findOne({ id: member.id });

            const { target } = (await member.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd })).entries.first();

            if (member.id !== target.id) {
                const guildLeaveEmbed = new EmbedBuilder()
                    .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
                    .setColor('Red')
                    .setDescription(`***${member.user.tag}** has left the server on <t:${Math.floor(Date.now() / 1000)}> (<t:${Math.floor(Date.now() / 1000)}:R>)*`)
                    .addFields([
                        { name: 'Player', value: player?.name || 'Unregistered', inline: true },
                        { name: 'User ID', value: member.id, inline: true },
                        { name: 'Joined Server On', value: `<t:${Math.floor((member.partial ? Date.now() : member.joinedTimestamp) / 1000)}> (<t:${Math.floor((member.partial ? Date.now() : member.joinedTimestamp) / 1000)}:R>)` }
                    ])
                    .setFooter({ text: member.guild.name, iconURL: member.guild.iconURL() })
                    .setTimestamp();

                this.bot.utils.auditSend(Channels.AuditLogId, { embeds: [guildLeaveEmbed] });
            };
        } catch (error) {
            console.error(error);
        };
    };
};