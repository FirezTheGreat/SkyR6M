const { EmbedBuilder, AuditLogEvent, GuildBan } = require('discord.js');
const Event = require('../../structures/Event.js');
const Players = require('../../structures/models/Players.js');
const { Channels } = require('../../config.json');

module.exports = class guildBanRemove extends Event {
    constructor(...args) {
        super(...args, {
            type: 'Guild'
        });
    };

    /**
     * 
     * @param {GuildBan} ban Guild Ban
     * @returns guildBanRemove Event
     */

    async EventRun(ban) {
        try {
            if (ban.partial) ban = await ban.fetch();

            const player = await Players.findOne({ id: ban.user.id });
            const { target, executor } = (await ban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanRemove })).entries.first();

            if (ban.user.id === target.id) {
                const guildBanEmbed = new EmbedBuilder()
                    .setAuthor({ name: ban.user.tag, iconURL: ban.user.displayAvatarURL() })
                    .setColor('Green')
                    .setDescription(`***${ban.user.tag}** has been unbanned from the server on <t:${Math.floor(Date.now() / 1000)}> (<t:${Math.floor(Date.now() / 1000)}:R>)*`)
                    .addFields([
                        { name: 'Player', value: player?.name || 'Unregistered', inline: true },
                        { name: 'User ID', value: ban.user.id, inline: true },
                        { name: 'Unbanned By', value: `${executor}`, inline: true },
                        { name: 'Reason', value: ban.reason || 'None' }
                    ])
                    .setFooter({ text: ban.guild.name, iconURL: ban.guild.iconURL() })
                    .setTimestamp();

                return this.bot.utils.auditSend(Channels.AuditLogId, { embeds: [guildBanEmbed] });
            };
        } catch (error) {
            console.error(error);
        };
    };
};