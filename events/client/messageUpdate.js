const { EmbedBuilder, Message } = require('discord.js');
const Event = require('../../structures/Event.js');
const { Channels } = require('../../config.json');

module.exports = class messageUpdate extends Event {
    constructor(...args) {
        super(...args, {
            type: 'Client'
        });
    };

    /**
     * 
     * @param {Message} oldMessage Old Message
     * @param {Message} newMessage New Message
     * @returns messageUpdate Event
     */

    async EventRun(oldMessage, newMessage) {
        try {
            if (newMessage.author?.bot) return;

            if (oldMessage.content !== newMessage.content) {
                const AuditLogEmbed = new EmbedBuilder()
                    .setAuthor({ name: newMessage.author.tag, iconURL: newMessage.author.displayAvatarURL() })
                    .setColor('Aqua')
                    .setDescription(`*Message has been edited in ${newMessage.channel}*`)
                    .addFields([
                        { name: 'Sent By', value: `${newMessage.author} (${newMessage.author.id})`, inline: true },
                        { name: 'Sent On', value: `<t:${Math.floor(newMessage.createdTimestamp / 1000)}>`, inline: true },
                        { name: 'Message Id', value: newMessage.id, inline: true },
                        { name: 'Original Message', value: oldMessage.content.slice(0, 1024) },
                        { name: 'Edited Message', value: newMessage.content.slice(0, 1024) }
                    ])
                    .setFooter({ text: newMessage.guild.name, iconURL: newMessage.guild.iconURL() })
                    .setTimestamp();

                return this.bot.utils.auditSend(Channels.MessageLogId, { embeds: [AuditLogEmbed] });
            };
        } catch (error) {
            console.error(error);
        };
    };
};