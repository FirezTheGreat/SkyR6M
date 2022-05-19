const { EmbedBuilder, AuditLogEvent, ChannelType, Collection } = require('discord.js');
const Event = require('../../structures/Event.js');
const { Channels } = require('../../config.json');

module.exports = class messageDeleteBulk extends Event {
    constructor(...args) {
        super(...args, {
            type: 'Client'
        });
    };

    /**
     * 
     * @param {Collection<Message>} messages Collection of Messages
     * @param {import('discord.js').TextBasedChannel} channel Channel
     * @returns messageDeleteBulk Event
     */

    async EventRun(messages, channel) {
        try {
            for (const message of [...messages.values()].reverse()) {
                if (message.guild.available && channel.type !== ChannelType.DM && channel.id !== Channels.MessageLogId) {
                    let { executor } = (await message.guild.fetchAuditLogs({ type: AuditLogEvent.MessageBulkDelete })).entries.first(),
                        target = 'Unknown#0000';

                    if (!message.partial) target = message.author;

                    const AuditLogEmbed = new EmbedBuilder()
                        .setAuthor({ name: executor.tag, iconURL: executor.displayAvatarURL() })
                        .setColor('Red')
                        .setDescription(`*Message in bulk has been deleted in ${message.channel}*\n\n**Content -** ${message.content || 'None'}`)
                        .addFields([
                            { name: 'Sent By', value: `${target}`, inline: true },
                            { name: 'Sent On', value: `<t:${Math.floor(message.createdTimestamp / 1000)}>`, inline: true },
                            { name: 'Deleted By', value: `${executor}`, inline: true },
                            { name: 'Message Id', value: message.id, inline: true },
                            { name: 'Author Id', value: target.id || target, inline: true },
                            { name: 'Executor User Id', value: executor.id, inline: true }
                        ])
                        .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() })
                        .setTimestamp();

                    if (message.attachments.size) AuditLogEmbed.setImage(message.attachments.first().url);

                    this.bot.utils.auditSend(Channels.MessageLogId, { embeds: [AuditLogEmbed] });
                };
            };
        } catch (error) {
            console.error(error);
        };
    };
};