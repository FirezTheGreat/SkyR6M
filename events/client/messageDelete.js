const { EmbedBuilder, AuditLogEvent, Message } = require('discord.js');
const Event = require('../../structures/Event.js');
const { Channels } = require('../../config.json');

module.exports = class messageDelete extends Event {
    constructor(...args) {
        super(...args, {
            type: 'Client'
        });
    };

    /**
     * 
     * @param {Message} message Message
     * @returns messageDelete Event
     */

    async EventRun(message) {
        try {
            if (message.guild.available && message.channel.id !== Channels.MessageLogId) {
                let { executor, target } = (await message.guild.fetchAuditLogs({ type: AuditLogEvent.MessageDelete })).entries.first() || { executor: message.author, target: message.author };

                if (!message.partial && message.author?.id !== target.id) {
                    executor = message.author,
                        target = message.author;
                };

                const AuditLogEmbed = new EmbedBuilder()
                    .setAuthor({ name: target.tag, iconURL: target.displayAvatarURL() })
                    .setColor('Red')
                    .setDescription(`*Message has been deleted in ${message.channel}*\n\n**Content -** ${message.content || 'None'}`)
                    .addFields([
                        { name: 'Sent By', value: `${target}`, inline: true },
                        { name: 'Sent On', value: `<t:${Math.floor(message.createdTimestamp / 1000)}>`, inline: true },
                        { name: 'Deleted By', value: `${executor}`, inline: true },
                        { name: 'Message Id', value: message.id, inline: true },
                        { name: 'Author Id', value: target.id, inline: true },
                        { name: 'Executor User Id', value: executor.id, inline: true }
                    ])
                    .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() })
                    .setTimestamp();

                if (message.attachments.size) AuditLogEmbed.setImage(message.attachments.first().url);

                return await this.bot.utils.auditSend(Channels.MessageLogId, { embeds: [AuditLogEmbed] });
            };
        } catch (error) {
            console.error(error);
        };
    };
};