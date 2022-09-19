const { PermissionFlagsBits, ApplicationCommandOptionType, ChatInputCommandInteraction, EmbedBuilder } = require('discord.js');
const Command = require('../../structures/Command.js');
const Players = require('../../structures/models/Players.js');
const Penalties = require('../../structures/models/PenaltyList.js');
const { Roles, Channels } = require('../../config.json');
const { RolePointChecker } = require('../../structures/Util.js');
const localized_time = new Date(new Date().getTime() + (330 + new Date().getTimezoneOffset()) * 60000).getTime();
const sub_commands = [
    {
        name: 'add', type: ApplicationCommandOptionType.Subcommand, description: 'Penalise Player', options: [
            { name: 'player', type: ApplicationCommandOptionType.User, description: 'Player to Penalise', required: true },
            {
                name: 'reason', type: ApplicationCommandOptionType.String, description: 'IGN of Player', required: true, choices:
                    [
                        { name: 'room owner abuse', value: 'owner_abuse' },
                        { name: 'match griefing', value: 'grief' },
                        { name: 'forging screenshot', value: 'forgery' },
                        { name: 'quitting match', value: 'leaving' },
                        { name: 'toxicity', value: 'toxicity' },
                        { name: 'toxicity to moderator', value: 'moderator_toxicity' },
                        { name: 'force forfeit', value: 'force_forfeit' },
                        { name: 'room evasion', value: 'evasion' }
                    ]
            },
        ]
    },
    {
        name: 'remove', type: ApplicationCommandOptionType.Subcommand, description: 'Remove Penalty from Player', options: [
            { name: 'id', type: ApplicationCommandOptionType.String, description: 'Penalty Id', required: true }
        ]
    }
];

module.exports = class Penalty extends Command {
    constructor(...args) {
        super(...args, {
            name: 'penalty',
            description: 'Add or Remove penalty from player',
            category: 'Moderation',
            usage: '[register | rename | fix]',
            client_permissions: [PermissionFlagsBits.ModerateMembers, PermissionFlagsBits.ManageNicknames],
            user_permissions: [PermissionFlagsBits.Administrator],
            sub_commands,
            options: sub_commands.map(({ name, type, description, required, options }) => ({ name, type, description, required, options }))
        });
    };

    /**
     * 
     * @param {ChatInputCommandInteraction} interaction CommandInteraction
     * @returns Penalises a Player
     */

    async InteractionRun(interaction) {
        try {
            const sub_command = interaction.options._subcommand;
            const points_update_channel = interaction.guild.channels.cache.get(Channels.PointsUpdateId);

            if (sub_command === 'add') {
                const member = interaction.options.getMember('player');
                const reason = interaction.options.getString('reason');

                if (!member) return await interaction.reply({ content: '*Player does not exist!*', ephemeral: true });

                let player = await Players.findOne({ id: member.id });
                if (!player) return await interaction.reply({ content: `*${member} is not registered at ${interaction.guild.name}*`, ephemeral: true });

                await interaction.deferReply();

                let [points, timeout, rank, updated_points] = [0, 0, player.rank, player.points.current];

                switch (reason) {
                    case 'owner_abuse':
                        switch (true) {
                            case (player.penalties.count === 0):
                                points = 20;
                                timeout = 0;

                                break;
                            case (player.penalties.count > 0 && player.penalties.count < 4):
                                points = 30;
                                timeout = 7200000; // 2 Hours

                                break;
                            case (player.penalties.count > 3 && player.penalties.count < 7):
                                points = 40;
                                timeout = 18000000; // 5 Hours

                                break;
                            default:
                                points = 50;
                                timeout = 86400000; // 24 Hours
                                break;
                        };

                        break;
                    case 'grief':
                        switch (true) {
                            case (player.penalties.count === 0):
                                points = 40;
                                timeout = 0;

                                break;
                            case (player.penalties.count > 0 && player.penalties.count < 4):
                                points = 50;
                                timeout = 43200000; // 12 Hours

                                break;
                            case (player.penalties.count > 3 && player.penalties.count < 7):
                                points = 60;
                                timeout = 86400000; // 24 Hours

                                break;
                            default:
                                points = 80;
                                timeout = 86400000; // 24 Hours
                                break;
                        };

                        break;
                    case 'forgery':
                        switch (true) {
                            case (player.penalties.count === 0):
                                points = 60;
                                timeout = 18000000; // 5 Hours

                                break;
                            case (player.penalties.count > 0 && player.penalties.count < 4):
                                points = 80;
                                timeout = 86400000; // 24 Hours

                                break;
                            default:
                                points = 100;
                                timeout = 172800000; // 48 Hours
                                break;
                        };

                        break;
                    case 'leaving':
                        switch (true) {
                            case (player.penalties.count === 0):
                                points = 40;
                                timeout = 0;

                                break;
                            case (player.penalties.count > 0 && player.penalties.count < 4):
                                points = 40;
                                timeout = 14400000; // 4 Hours

                                break;
                            case (player.penalties.count > 3 && player.penalties.count < 7):
                                points = 50;
                                timeout = 21600000; // 6 Hours

                                break;
                            default:
                                points = 60;
                                timeout = 86400000; // 24 Hours
                                break;
                        };

                        break;
                    case 'toxicity':
                        switch (true) {
                            case (player.penalties.count === 0):
                                points = 20;
                                timeout = 0;

                                break;
                            case (player.penalties.count > 0 && player.penalties.count < 4):
                                points = 40;
                                timeout = 0;

                                break;
                            case (player.penalties.count > 3 && player.penalties.count < 7):
                                points = 40;
                                timeout = 18000000; // 5 Hours

                                break;
                            default:
                                points = 50;
                                timeout = 43200000; // 12 Hours
                                break;
                        };

                        break;
                    case 'moderator_toxicity':
                        switch (true) {
                            case (player.penalties.count === 0):
                                points = 20;
                                timeout = 7200000; // 2 Hours
                                break;
                            case (player.penalties.count > 0 && player.penalties.count < 4):
                                points = 40;
                                timeout = 7200000; // 2 Hours

                                break;
                            case (player.penalties.count > 3 && player.penalties.count < 7):
                                points = 60;
                                timeout = 18000000; // 5 Hours

                                break;
                            default:
                                points = 60;
                                timeout = 86400000; // 24 Hours
                                break;
                        };

                        break;
                    case 'force_forfeit':
                        switch (true) {
                            case (player.penalties.count === 0):
                                points = 40;
                                timeout = 43200000; // 12 Hours

                                break;
                            case (player.penalties.count > 0 && player.penalties.count < 4):
                                points = 80;
                                timeout = 86400000; // 24 Hours

                                break;
                            default:
                                points = 80;
                                timeout = 172800000; // 48 Hours
                                break;
                        };

                        break;
                    case 'evasion':
                        switch (true) {
                            case (player.penalties.count === 0):
                                points = 20;
                                timeout = 7200000; // 2 Hours

                                break;
                            case (player.penalties.count > 0 && player.penalties.count < 4):
                                points = 40;
                                timeout = 14400000; // 4 Hours

                                break;
                            default:
                                points = 60;
                                timeout = 21600000; // 6 Hours
                                break;
                        };

                        break;
                    default:
                        break;
                };

                if (points > 0) {
                    if (points > player.points.current) points = -player.points.current;
                    else points = -points;

                    let { name, id } = interaction.guild.roles.cache.get(RolePointChecker(player.points.current, player.points.current + points));
                    updated_points = player.points.current + points;

                    if (name.toLowerCase() !== player.rank.toLowerCase()) {
                        let updated_role = interaction.guild.roles.cache.find(({ name }) => name.toLowerCase() === player.rank.toLowerCase());

                        rank = name;
                        await member.roles.add(id);
                        updated_role.id !== Roles.RegisteredId ? await member.roles.remove(updated_role) : null;

                        await points_update_channel.send(`***${player.name}** has lost ${+points} points, bringing their total to **${updated_points} points!** You now have **${name.split('|')[1].trim()}** rank!*`);
                    } else {
                        await points_update_channel.send(`***${player.name}** has lost ${+points} points, bringing their total to **${updated_points} points!***`);
                    };
                };

                let generated_penalty_id = this.bot.utils.generateRandomHex(4);

                player.penalties.events.push({ id: generated_penalty_id, reason, points: +points });
                player.logs.penalties.push({
                    id: generated_penalty_id,
                    reason,
                    points: +points,
                    moderator: { id: interaction.member.id, tag: interaction.user.tag }
                });

                player = await Players.findOneAndUpdate(
                    {
                        id: member.id
                    },
                    {
                        rank,
                        penalties: {
                            count: ++player.penalties.count,
                            events: player.penalties.events
                        },
                        points: {
                            current: updated_points,
                            total: player.points.total + points < 0 ? 0 : player.points.total + points
                        },
                        logs: {
                            penalties: player.logs.penalties
                        }
                    },
                    {
                        new: true,
                    }
                );

                await Penalties.create({
                    id: generated_penalty_id,
                    member_id: member.id,
                    reason,
                    start_timestamp: new Date(localized_time).getTime(),
                    duration_timestamp: timeout,
                    points: +points,
                    moderator: {
                        id: interaction.member.id,
                        tag: interaction.user.tag
                    }
                });

                const convertedTimeout = this.bot.utils.convertMSToDate(timeout);
                const final_reason = sub_commands[0].options[1].choices.find(({ value }) => value === reason).name;

                const penaltyEmbed = new EmbedBuilder()
                    .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                    .setColor('Green')
                    .setTitle(`Penalty for ${member.user.tag}`)
                    .setThumbnail(member.user.displayAvatarURL())
                    .setDescription(`***${member.user.tag}** has been penalised for \`${final_reason}\`*`)
                    .addFields([
                        { name: 'User', value: member.user.tag, inline: true },
                        { name: 'IGN', value: player.name, inline: true },
                        { name: 'ID', value: generated_penalty_id, inline: true },
                        { name: 'Points Deducted', value: `${+points}`, inline: true },
                        { name: '\u200b', value: '\u200b', inline: true },
                        { name: 'Timeout', value: convertedTimeout ? `${convertedTimeout.days}Days ${convertedTimeout.hours}Hours ${convertedTimeout.minutes}Mins` : '0', inline: true }
                    ])
                    .setFooter({ text: `Penalty By ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                    .setTimestamp();

                const successfulPenalisationEmbed = new EmbedBuilder()
                    .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                    .setColor('Green')
                    .setDescription(`*Successfully penalised ${member} at ${interaction.guild.name}!*`)
                    .addFields([
                        { name: 'Player', value: `${member}`, inline: true },
                        { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
                        { name: 'Reason', value: final_reason, inline: true }
                    ])
                    .setFooter({ text: member.user.username, iconURL: member.user.displayAvatarURL() })
                    .setTimestamp();

                if (convertedTimeout && member.moderatable) {
                    let existingTimeout = member.communicationDisabledUntilTimestamp - Date.now();
                    member.timeout(existingTimeout > 0 ? existingTimeout + timeout : timeout, final_reason).catch(() => null);
                    setTimeout(() => {
                        member.timeout(null).catch(() => null);
                    }, existingTimeout > 0 ? existingTimeout + timeout : timeout);
                };

                if (interaction.member.manageable) {
                    await member.setNickname(`[${player.points.current}] ${player.name}`);
                } else {
                    await interaction.channel.send({ content: `*IGN has been updated to our database but failed to rename ${member}\'s IGN on discord.*` });
                };

                await interaction.editReply({ embeds: [successfulPenalisationEmbed] });
                return await this.bot.utils.auditSend(Channels.PenaltyChannelId, { embeds: [penaltyEmbed] });
            } else {
                const id = interaction.options.getString('id').trim().toLowerCase();

                const penalty = await Penalties.findOne({ id });
                if (!penalty) return await interaction.reply({ content: `*Penalty Id - ${id} does not exist!*`, ephemeral: true });

                const member = interaction.guild.members.cache.get(penalty.member_id);
                if (!member) return await interaction.reply({ content: `*User has left the server!*`, ephemeral: true });

                let player = await Players.findOne({ id: member.id });
                if (!player) return await interaction.reply({ content: `*${member} is not registered at ${interaction.guild.name}*`, ephemeral: true });

                await interaction.deferReply();

                let [member_rank, points, updated_points] = [player.rank, penalty.points, player.points.current];

                if (points > 0) {
                    let { name, id } = interaction.guild.roles.cache.get(RolePointChecker(player.points.current, player.points.current + points));
                    updated_points = player.points.current + points;

                    if (name.toLowerCase() !== player.rank.toLowerCase()) {
                        let updated_role = interaction.guild.roles.cache.find(({ name }) => name.toLowerCase() === player.rank.toLowerCase());

                        member_rank = name;
                        await member.roles.add(id);
                        updated_role.id !== Roles.RegisteredId ? await member.roles.remove(updated_role) : null;

                        await points_update_channel.send(`***${player.name}** has lost ${points} points, bringing their total to **${updated_points} points!** You now have **${name.split('|')[1].trim()}** rank!*`);
                    } else {
                        await points_update_channel.send(`***${player.name}** has lost ${points} points, bringing their total to **${updated_points} points!***`);
                    };
                };

                const penaltyRemovalEmbed = new EmbedBuilder()
                    .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                    .setColor('Green')
                    .setTitle(`Penalty for ${member.user.tag}`)
                    .setThumbnail(member.user.displayAvatarURL())
                    .setDescription(`***${member.user.tag}'s** penalisation has been removed*`)
                    .addFields([
                        { name: 'User', value: member.user.tag, inline: true },
                        { name: 'IGN', value: player.name, inline: true },
                        { name: 'ID', value: penalty.id, inline: true },
                        { name: 'Points Added', value: `${penalty.points}`, inline: true },
                        { name: '\u200b', value: '\u200b', inline: true },
                        { name: 'Timeout', value: 'Removed', inline: true }
                    ])
                    .setFooter({ text: `Penalty Removed By ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                    .setTimestamp();

                const successfulPenalisationRemovalEmbed = new EmbedBuilder()
                    .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                    .setColor('Green')
                    .setDescription(`*Successfully removed penalisation of ${member} at ${interaction.guild.name}!*`)
                    .addFields([
                        { name: 'Player', value: `${member}`, inline: true },
                        { name: 'Player ID', value: `${penalty.member_id}`, inline: true },
                        { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
                    ])
                    .setFooter({ text: member.user.username, iconURL: member.user.displayAvatarURL() })
                    .setTimestamp();

                const penalty_index = player.penalties.events.findIndex((penalty) => penalty.id.toLowerCase() === id.toLowerCase());
                const penalty_log_index = player.logs.penalties.findIndex((penalty) => penalty.id.toLowerCase() === id.toLowerCase());

                player.penalties.events.splice(penalty_index, 1);
                player.logs.penalties.splice(penalty_log_index, 1);

                player = await Players.findOneAndUpdate(
                    {
                        id: member.id
                    },
                    {
                        rank: member_rank,
                        penalties: {
                            count: --player.penalties.count,
                            events: player.penalties.events
                        },
                        points: {
                            current: updated_points,
                            total: player.points.total + points
                        },
                        logs: {
                            penalties: player.logs.penalties
                        }
                    },
                    {
                        new: true,
                    }
                );

                await Penalties.deleteOne({ id: penalty.id });

                member.communicationDisabledUntilTimestamp ? await member.disableCommunicationUntil(member.communicationDisabledUntilTimestamp - penalty.duration_timestamp > 0 ? member.communicationDisabledUntilTimestamp - penalty.duration_timestamp : null) : null;

                if (interaction.member.manageable) {
                    await member.setNickname(`[${player.points.current}] ${player.name}`);
                } else {
                    await interaction.channel.send({ content: `*IGN has been updated to our database but failed to rename ${member}\'s IGN on discord.*` });
                };

                await interaction.editReply({ embeds: [successfulPenalisationRemovalEmbed] });
                return await this.bot.utils.auditSend(Channels.PenaltyChannelId, { embeds: [penaltyRemovalEmbed] });
            };
        } catch (error) {
            console.error(error);
            return await this.bot.utils.error(interaction, error);
        };
    };
};