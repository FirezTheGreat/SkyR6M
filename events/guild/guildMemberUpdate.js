const { EmbedBuilder, AuditLogEvent, GuildMember } = require('discord.js');
const Event = require('../../structures/Event.js');
const { Channels, Roles } = require('../../config.json');
const PlayerStats = require('../../structures/models/PlayerStats.js');
const MuteList = require('../../structures/models/MuteList.js');

module.exports = class guildMemberUpdate extends Event {
    constructor(...args) {
        super(...args, {
            type: 'Guild'
        });
    };

    /**
     * 
     * @param {GuildMember} oldMember Old Guild Member
     * @param {GuildMember} newMember New Guild Member
     * @returns guildMemberUpdate Event
     */

    async EventRun(oldMember, newMember) {
        try {
            const player = await PlayerStats.findOne({ id: newMember.id });

            if (oldMember.pending && !newMember.pending && !player) {
                const JoinedMemberEmbed = new EmbedBuilder()
                    .setAuthor({ name: newMember.guild.name, iconURL: newMember.guild.iconURL() })
                    .setColor('Aqua')
                    .setTitle(`Welcome to ${newMember.guild.name}`)
                    .setThumbnail(newMember.guild.iconURL())
                    .setDescription(`*Welcome ${newMember.user.tag} to ${newMember.guild.name}!. Please register yourself in <#${Channels.RegisterId}> and go through <#${Channels.InformationId}> and <#${Channels.PlayRulesId}> respectively to know more about the server and how to play in our Match Making!*`)
                    .setFooter({ text: newMember.user.username, iconURL: newMember.user.displayAvatarURL() })
                    .setTimestamp();

                newMember.send({ embeds: [JoinedMemberEmbed] }).catch(() => null);
            };

            if (!oldMember.roles.cache.has(Roles.MuteRoleId) && newMember.roles.cache.has(Roles.MuteRoleId)) {
                let mutedUser = await MuteList.findOne({ id: newMember.id });

                if (!mutedUser) {
                    const roles = newMember.roles.cache.filter((role) => !role.managed && ![Roles.MuteRoleId, newMember.guild.id].includes(role.id)).map((role) => role.id);

                    if (roles.length && player) {
                        await newMember.roles.remove(roles);
                        await PlayerStats.findOneAndUpdate(
                            {
                                id: player.id
                            },
                            {
                                _roles: [Roles.MuteRoleId]
                            }
                        );
                    };

                    this.bot.offenders.set(newMember.id, roles);
                };
            };

            if (oldMember.roles.cache.has(Roles.MuteRoleId) && !newMember.roles.cache.has(Roles.MuteRoleId)) {
                let mutedUser = await MuteList.findOne({ id: newMember.id });

                if (!mutedUser) {
                    const roles = this.bot.offenders.get(newMember.id);

                    if (roles && player) {
                        await newMember.roles.add(roles);
                        await PlayerStats.findOneAndUpdate(
                            {
                                id: player.id
                            },
                            {
                                _roles: roles
                            }
                        );
                    };

                    this.bot.offenders.delete(newMember.id);
                };
            };

            if (!oldMember.roles.cache.has(Roles.MuteRoleId) && !newMember.roles.cache.has(Roles.MuteRoleId) && player && (player._roles.length !== newMember.roles.cache.filter(({ managed, id }) => !managed && ![Roles.MuteRoleId, newMember.guild.id].includes(id)).size || !player._roles.every((value) => !newMember.roles.cache.has(value)))) {
                await PlayerStats.findOneAndUpdate(
                    {
                        id: player.id
                    },
                    {
                        _roles: newMember.roles.cache.filter(({ managed, id }) => !managed && ![Roles.MuteRoleId, newMember.guild.id].includes(id)).map(({ id }) => id)
                    }
                );
            };

            const { target, executor, createdTimestamp } = (await newMember.guild.fetchAuditLogs({ type: AuditLogEvent.MemberRoleUpdate })).entries.first();
            if (Date.now() - createdTimestamp <= 5000 && target.id === newMember.id) {
                let updatedRoles,
                    oldRoles = [],
                    newRoles = [];

                for (const oldRole of [...oldMember.roles.cache.keys()].filter((id) => id !== newMember.guild.id)) oldRoles.push(`<@&${oldRole}>`);
                for (const newRole of [...newMember.roles.cache.keys()].filter((id) => id !== newMember.guild.id)) newRoles.push(`<@&${newRole}>`);

                updatedRoles = newRoles.length >= oldRoles.length ?
                    newRoles.filter((id) => !oldRoles.includes(id)) :
                    oldRoles.filter((id) => !newRoles.includes(id));

                if ([...oldRoles].sort().toString() !== [...newRoles].sort().toString()) {
                    const memberRoleUpdateEmbed = new EmbedBuilder()
                        .setAuthor({ name: newMember.user.tag, iconURL: newMember.user.displayAvatarURL() })
                        .setColor('Aqua')
                        .setDescription(`***${newMember.user.tag}'s** roles have been updated on <t:${Math.floor(createdTimestamp / 1000)}> (<t:${Math.floor(createdTimestamp / 1000)}:R>)*`)
                        .addFields([
                            { name: 'Player', value: player?.name || 'Unregistered', inline: true },
                            { name: 'User ID', value: target.id, inline: true },
                            { name: 'Executor', value: `${executor} (${executor.id})`, inline: true },
                            { name: 'Previous Roles', value: oldRoles.join(', ') || 'None', inline: oldRoles.length > 4 ? false : true },
                            { name: 'Current Roles', value: newRoles.join(', ') || 'None', inline: newRoles.length > 4 ? false : true },
                            { name: newRoles.length >= oldRoles.length ? 'Updated Roles' : 'Removed Roles', value: updatedRoles.join(', ') || 'None', inline: updatedRoles.length > 4 ? false : true }
                        ])
                        .setFooter({ text: newMember.guild.name, iconURL: newMember.guild.iconURL() })
                        .setTimestamp();

                    this.bot.utils.auditSend(Channels.AuditLogId, { embeds: [memberRoleUpdateEmbed] });
                };
            };
        } catch (error) {
            console.error(error);
        };
    };
};