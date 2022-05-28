const { EmbedBuilder, AuditLogEvent, ThreadChannel } = require('discord.js');
const Event = require('../../structures/Event.js');
const { Channels } = require('../../config.json');

module.exports = class threadUpdate extends Event {
    constructor(...args) {
        super(...args, {
            type: 'Client'
        });
    };

    /**
     * 
     * @param {ThreadChannel} oldThread Old Thread Channel
     * @param {ThreadChannel} newThread New Thread Channel
     * @returns threadUpdate Event
     */

    async EventRun(oldThread, newThread) {
        try {
            if (newThread.partial) newThread = await newThread.fetch();

            if (newThread.guild.available) {
                let { executor } = (await newThread.guild.fetchAuditLogs({ type: AuditLogEvent.ThreadUpdate })).entries.first();

                const fields = [];

                switch (true) {
                    case oldThread.name !== newThread.name:
                        fields.push(
                            { name: 'Previous Name', value: oldThread.name, inline: true },
                            { name: 'Updated Name', value: newThread.name, inline: true },
                            { name: 'Changed By', value: `${executor}`, inline: true }
                        );
                        break;
                    case oldThread.locked !== newThread.locked:
                        fields.push(
                            { name: 'Previous Locked State', value: `${oldThread.locked}`, inline: true },
                            { name: 'Updated Locked State', value: `${newThread.locked}`, inline: true },
                            { name: 'Changed By', value: `${executor}`, inline: true }
                        );
                        break;
                    case oldThread.archived !== newThread.archived:
                        fields.push(
                            { name: 'Previous Archived State', value: `${oldThread.archived}`, inline: true },
                            { name: 'Updated Archived State', value: `${newThread.archived}`, inline: true },
                            { name: 'Changed By', value: `${executor}`, inline: true }
                        );
                        break;
                    default:
                        break;
                };

                const AuditLogEmbed = new EmbedBuilder()
                    .setAuthor({ name: executor.username, iconURL: executor.displayAvatarURL() })
                    .setColor('Aqua')
                    .setDescription(`*A Thread Channel ${newThread} (${newThread.id}) has been updated by ${executor}*`)
                    .addFields(fields)
                    .setFooter({ text: newThread.guild.name, iconURL: newThread.guild.iconURL() })
                    .setTimestamp();

                return await this.bot.utils.auditSend(Channels.AuditLogId, { embeds: [AuditLogEmbed] });
            };
        } catch (error) {
            console.error(error);
        };
    };
};