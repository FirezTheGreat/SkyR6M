const { EmbedBuilder, AuditLogEvent, ThreadChannel } = require('discord.js');
const Event = require('../../structures/Event.js');
const { Channels } = require('../../config.json');

module.exports = class threadDelete extends Event {
    constructor(...args) {
        super(...args, {
            type: 'Client'
        });
    };

    /**
     * 
     * @param {ThreadChannel} thread Thread Channel
     * @returns threadDelete Event
     */

    async EventRun(thread) {
        try {
            if (thread.guild.available) {
                let { executor, target } = (await thread.guild.fetchAuditLogs({ type: AuditLogEvent.ThreadDelete })).entries.first();

                const AuditLogEmbed = new EmbedBuilder()
                    .setAuthor({ name: executor.username, iconURL: executor.displayAvatarURL() })
                    .setColor('Red')
                    .setDescription(`*A Thread Channel has been deleted by ${executor}*`)
                    .addFields([
                        { name: 'Thread Name', value: target.name, inline: true },
                        { name: 'Thread Id', value: target.id, inline: true },
                        { name: 'Deleted By', value: `${executor}`, inline: true },
                        { name: 'Deleted On', value: `<t:${Math.floor(Date.now() / 1000)}>`, inline: true },
                        { name: 'Parent Channel', value: `<#${thread.parentId}>`, inline: true },
                        { name: 'Parent Channel Id', value: thread.parentId, inline: true },
                    ])
                    .setFooter({ text: thread.guild.name, iconURL: thread.guild.iconURL() })
                    .setTimestamp();

                return await this.bot.utils.auditSend(Channels.AuditLogId, { embeds: [AuditLogEmbed] });
            };
        } catch (error) {
            console.error(error);
        };
    };
};