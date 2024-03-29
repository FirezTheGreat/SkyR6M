const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const Event = require('../../structures/Event.js');
const { Channels } = require('../../config.json');

module.exports = class channelPinsUpdate extends Event {
    constructor(...args) {
        super(...args, {
            type: 'Guild'
        });
    };

    /**
     * 
     * @param {import('discord.js').TextBasedChannel} channel TextBasedChannel
     * @param {Number} timestamp Date Timestamp
     * @returns channelPinsUpdate Event
     */

    async EventRun(channel, timestamp) {
        try {
            const { executor, target, extra } = (await channel.guild.fetchAuditLogs({ type: AuditLogEvent.MessagePin })).entries.first();
            const message = (await channel.messages.fetchPinned()).find(({ id }) => id === extra.messageId)

            if (!message) {
                const { executor, target, extra } = (await channel.guild.fetchAuditLogs({ type: AuditLogEvent.MessageUnpin })).entries.first();
                const message = channel.messages.cache.get(extra.messageId);

                if (message.channel.id === extra.channel.id && message.author.id === target.id) {
                    const AuditLogEmbed = new EmbedBuilder()
                        .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                        .setColor('Aqua')
                        .setDescription(`*Message has been unpinned in ${message.channel}*`)
                        .addFields([
                            { name: 'Unpinned By', value: `${executor}`, inline: true },
                            { name: 'Unpinned On', value: `<t:${Math.floor(Date.now() / 1000)}>`, inline: true },
                            { name: 'Message Id', value: message.id, inline: true },
                        ])
                        .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() })
                        .setTimestamp();

                    if (message.content) AuditLogEmbed.addFields({ name: 'Unpinned Message', value: message.cleanContent.slice(0, 1024) });
                    if (message.attachments.size) AuditLogEmbed.setImage(message.attachments.first().url);

                    return await this.bot.utils.auditSend(Channels.MessageLogId, { embeds: [AuditLogEmbed] });
                };
            } else {
                if (message.channel.id === extra.channel.id && message.author.id === target.id) {
                    const AuditLogEmbed = new EmbedBuilder()
                        .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                        .setColor('Aqua')
                        .setDescription(`*Message has been pinned in ${message.channel}*`)
                        .addFields([
                            { name: 'Pinned By', value: `${executor}`, inline: true },
                            { name: 'Pinned On', value: `<t:${Math.floor(timestamp / 1000)}>`, inline: true },
                            { name: 'Message Id', value: message.id, inline: true }
                        ])
                        .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() })
                        .setTimestamp();

                    if (message.content) AuditLogEmbed.addFields({ name: 'Pinned Message', value: message.cleanContent.slice(0, 1024) });
                    if (message.attachments.size) AuditLogEmbed.setImage(message.attachments.first().url);

                    return await this.bot.utils.auditSend(Channels.AuditLogId, { embeds: [AuditLogEmbed] });
                };
            };
        } catch (error) {
            console.error(error);
        };
    };
};