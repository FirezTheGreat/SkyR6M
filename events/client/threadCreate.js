const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const Event = require('../../structures/Event.js');
const { Channels } = require('../../config.json');

module.exports = class threadCreate extends Event {
    constructor(...args) {
        super(...args, {
            type: 'Client'
        });
    };

    async EventRun(thread, created) {
        try {
            if (created && thread.partial) thread = await thread.fetch();

            if (thread.guild.available && created) {
                let { executor, target } = (await thread.guild.fetchAuditLogs({ type: AuditLogEvent.ThreadCreate })).entries.first();

                const AuditLogEmbed = new EmbedBuilder()
                    .setAuthor({ name: executor.username, iconURL: executor.displayAvatarURL() })
                    .setColor('Green')
                    .setDescription(`*A Thread Channel <#${target.id}> (${target.id}) has been created by ${executor}*`)
                    .addFields([
                        { name: 'Created By', value: `${executor}`, inline: true },
                        { name: 'Created On', value: `<t:${Math.floor(thread.createdTimestamp / 1000)}>`, inline: true },
                        { name: 'Auto Archives In', value: `<t:${Math.floor((Date.now() / 1000)) + (thread.autoArchiveDuration * 60)}> (<t:${Math.floor((Date.now() / 1000)) + (thread.autoArchiveDuration * 60)}:R>)`, inline: true },
                        { name: 'Parent Channel', value: `<#${target.parentId}>`, inline: true },
                        { name: 'Parent Channel Id', value: target.parentId, inline: true },
                        { name: 'Member Count', value: `${target.memberCount}`, inline: true }
                    ])
                    .setFooter({ text: thread.guild.name, iconURL: thread.guild.iconURL() })
                    .setTimestamp();

                this.bot.utils.auditSend(Channels.AuditLogId, { embeds: [AuditLogEmbed] });
            };
        } catch (error) {
            console.error(error);
        };
    };
};