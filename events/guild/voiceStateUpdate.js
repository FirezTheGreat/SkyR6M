const { EmbedBuilder, AttachmentBuilder, AuditLogEvent, VoiceState } = require('discord.js');
const Event = require('../../structures/Event.js');
const { Channels, QueueRoleIds } = require('../../config.json');
const Players = require('../../structures/models/Players.js');
const path = require('path');
const { setTimeout: wait } = require('node:timers/promises');

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
            if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
                const { roles: oldState_roles } = QueueRoleIds.find(({ voice }) => oldState.channelId === voice) ?? { roles: null };

                if (oldState_roles) {
                    newState.member.roles.remove(oldState_roles).catch(() => null);

                    await wait(1000);

                    const poll = this.bot.polls.get(oldState.channelId);

                    if (poll) {
                        if (oldState.channel.members.size > 0) {
                            poll.players = oldState.channel.members.map(({ id }) => ({ id }));

                            this.bot.polls.set(oldState.channelId, poll);
                        } else {
                            this.bot.polls.delete(oldState.channelId);
                        };
                    };
                };

                const { roles: newState_roles } = QueueRoleIds.find(({ voice }) => newState.channelId === voice) ?? { roles: null };
                if (newState_roles) {
                    newState.member.roles.add(newState_roles).catch(() => null);

                    const poll = this.bot.polls.get(newState.channelId);

                    if (poll && newState.channel.members.size < 11) {
                        poll.players = newState.channel.members.map(({ id }) => ({ id }));

                        this.bot.polls.set(newState.channelId, poll);
                    };
                };
            };

            if (oldState.member && oldState.channelId && !newState.channelId) {
                const { roles } = QueueRoleIds.find(({ voice }) => oldState.channelId === voice) ?? { roles: null };
                if (roles) {
                    oldState.member.roles.remove(roles).catch(() => null);

                    const poll = this.bot.polls.get(oldState.channelId);

                    if (poll) {
                        if (oldState.channel.members.size > 0) {
                            poll.players = oldState.channel.members.map(({ id }) => ({ id }));

                            this.bot.polls.set(oldState.channelId, poll);
                        } else {
                            this.bot.polls.delete(oldState.channelId);
                        };
                    };
                };

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
                const player = await Players.findOne({ id: newState.member.id });
                if (!player) {
                    await newState.disconnect();
                    return newState.member.send({ content: `*You are not registered at ${newState.guild.name}*` }).catch(() => null);
                };

                const { roles } = QueueRoleIds.find(({ voice }) => newState.channelId === voice) ?? { roles: null };
                if (roles) {
                    newState.member.roles.add(roles).catch(() => null);

                    const poll = this.bot.polls.get(newState.channelId);

                    if (poll && newState.channel.members.size < 11) {
                        poll.players = newState.channel.members.map(({ id }) => ({ id }));

                        this.bot.polls.set(newState.channelId, poll);
                    };
                };

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