const { EmbedBuilder, AttachmentBuilder, AuditLogEvent, VoiceState } = require('discord.js');
const Event = require('../../structures/Event.js');
const { Channels, QueueRoleIds } = require('../../config.json');
const path = require('path');

module.exports = class voiceStateUpdate extends Event {
    constructor(...args) {
        super(...args, {
            type: 'Guild'
        });
    };

    /**
     * 
     * @param {VoiceState} oldState Old VoiceState
     * @param {VoiceState} newState New VoiceState
     * @returns voiceStateUpdate Event
     */

    async EventRun(oldState, newState) {
        try {
            if (oldState.channelId && newState.member) {
                const { roles } = QueueRoleIds.find(({ voice }) => oldState.channelId === voice) ?? { roles: null };
                roles ? oldState.member.roles.remove(roles).catch(() => null) : null;
            };

            if (newState.channelId && newState.member) {
                const { roles } = QueueRoleIds.find(({ voice }) => newState.channelId === voice) ?? { roles: null };
                roles ? newState.member.roles.add(roles).catch(() => null) : null;
            };

            if (oldState.member && oldState.channelId && !newState.channelId) {
                const { executor, createdTimestamp } = (await newState.guild.fetchAuditLogs({ type: AuditLogEvent.MemberDisconnect })).entries.first() ?? { createdTimestamp: Date.now(), executor: null };
                const { attachment: voiceLeftAttachment } = new AttachmentBuilder(path.join(__dirname, '..', '..', 'assets', 'emojis', 'voice_left.png'), 'voice_left.png');

                const leftVoiceEmbed = new EmbedBuilder()
                    .setAuthor({ name: 'Left Voice Channel', iconURL: 'attachment://voice_left.png' })
                    .setColor('Red')
                    .addFields([
                        { name: 'Player', value: `${oldState.member.displayName}`, inline: true },
                        { name: 'Status', value: ':red_circle: Left', inline: true },
                        { name: 'Channel', value: `${oldState.channel.name}`, inline: true }
                    ])
                    .setFooter({ text: oldState.guild.name, iconURL: oldState.guild.iconURL() })
                    .setTimestamp();

                if (executor && executor.id !== oldState.member.id && Date.now() - createdTimestamp <= 5000) leftVoiceEmbed.addFields([
                    { name: 'Disconnected By', value: `${executor} (${executor.id})`, inline: true }
                ]);

                await this.bot.utils.auditSend(Channels.AuditLogId, { embeds: [leftVoiceEmbed], files: [voiceLeftAttachment] });
            } else if (oldState.member && newState.member && oldState.channelId && newState.channelId) {
                const { executor, createdTimestamp } = (await newState.guild.fetchAuditLogs({ type: AuditLogEvent.MemberMove })).entries.first() ?? { createdTimestamp: Date.now(), executor: null };
                const { attachment: voiceRejoinAttachment } = new AttachmentBuilder(path.join(__dirname, '..', '..', 'assets', 'emojis', 'voice_joined.png'), 'voice_joined.png');

                const rejoinedVoiceEmbed = new EmbedBuilder()
                    .setAuthor({ name: 'Rejoined Voice Channel', iconURL: 'attachment://voice_joined.png' })
                    .setColor('Aqua')
                    .addFields([
                        { name: 'Player', value: `${newState.member.displayName}`, inline: true },
                        { name: 'Status', value: `:green_square: Rejoined`, inline: true },
                        { name: 'Channels', value: `${oldState.channel.name} :arrow_right: ${newState.channel.name}`, inline: true }
                    ])
                    .setFooter({ text: newState.guild.name, iconURL: newState.guild.iconURL() })
                    .setTimestamp();

                if (executor && executor.id !== newState.member.id && Date.now() - createdTimestamp <= 5000) rejoinedVoiceEmbed.addFields([
                    { name: 'Moved By', value: `${executor} (${executor.id})`, inline: true }
                ]);

                await this.bot.utils.auditSend(Channels.AuditLogId, { embeds: [rejoinedVoiceEmbed], files: [voiceRejoinAttachment] });
            } else {
                const { attachment: voiceJoinAttachment } = new AttachmentBuilder(path.join(__dirname, '..', '..', 'assets', 'emojis', 'voice_joined.png'), 'voice_joined.png');

                const joinVoiceEmbed = new EmbedBuilder()
                    .setAuthor({ name: 'Joined Voice Channel', iconURL: 'attachment://voice_joined.png' })
                    .setColor('Green')
                    .addFields([
                        { name: 'Player', value: `${newState.member.displayName}`, inline: true },
                        { name: 'Status', value: ':green_circle: Joined', inline: true },
                        { name: 'Channel', value: `${newState.channel.name}`, inline: true }
                    ])
                    .setFooter({ text: newState.guild.name, iconURL: newState.guild.iconURL() })
                    .setTimestamp();

                await this.bot.utils.auditSend(Channels.AuditLogId, { embeds: [joinVoiceEmbed], files: [voiceJoinAttachment] });
            };
        } catch (error) {
            console.error(error);
        };
    };
};