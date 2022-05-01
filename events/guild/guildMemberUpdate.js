const { EmbedBuilder } = require('discord.js');
const Event = require('../../structures/Event.js');
const { Channels, Roles } = require('../../config.json');
const PlayerStats = require('../../structures/models/PlayerStats.js');
const MuteList = require('../../structures/models/MuteList.js');

module.exports = class guildMemberUpdate extends Event {
    constructor(...args) {
        super(...args);
    };

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
        } catch (error) {
            console.error(error);
        };
    };
};