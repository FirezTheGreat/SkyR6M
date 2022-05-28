const { PermissionFlagsBits, ApplicationCommandOptionType, ChatInputCommandInteraction, EmbedBuilder } = require("discord.js");
const Command = require("../../structures/Command.js");
const Players = require("../../structures/models/Players.js");
const Penalties = require("../../structures/models/PenaltyList.js");
const { Roles, Channels } = require('../../config.json');
const { RolePointChecker } = require("../../structures/Util.js");
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

            switch (sub_command) {
                case 'add':
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

                    member.setNickname(`[${player.points.current}] ${player.name}`).catch(() => interaction.channel.send(`*An Error Occurred: **User Has Been Penalised But Couldn\'t Change Nickname!**!*`));
                    await interaction.editReply({ embeds: [successfulPenalisationEmbed] });
                    await this.bot.utils.auditSend(Channels.PenaltyChannelId, { embeds: [penaltyEmbed] });

                    break;
                case 'remove':
                    const penalty_id = interaction.options.getString('id').trim().toLowerCase();

                    const penalty = await Penalties.findOne({ id: penalty_id });
                    if (!penalty) return await interaction.reply({ content: `*Penalty Id - ${penalty_id} does not exist!*`, ephemeral: true });

                    const penalty_member = interaction.guild.members.cache.get(penalty.member_id);
                    if (!penalty_member) return await interaction.reply({ content: `*User has left the server!*`, ephemeral: true });

                    let penalty_player = await Players.findOne({ id: penalty_member.id });
                    if (!penalty_player) return await interaction.reply({ content: `*${penalty_member} is not registered at ${interaction.guild.name}*`, ephemeral: true });

                    await interaction.deferReply();

                    let [member_rank, deducted_points, updated_penalty_points] = [penalty_player.rank, penalty.points, penalty_player.points.current];

                    if (deducted_points > 0) {
                        let { name, id } = interaction.guild.roles.cache.get(RolePointChecker(penalty_player.points.current, penalty_player.points.current + deducted_points));
                        updated_penalty_points = penalty_player.points.current + deducted_points;

                        if (name.toLowerCase() !== penalty_player.rank.toLowerCase()) {
                            let updated_role = interaction.guild.roles.cache.find(({ name }) => name.toLowerCase() === penalty_player.rank.toLowerCase());

                            member_rank = name;
                            await penalty_member.roles.add(id);
                            updated_role.id !== Roles.RegisteredId ? await penalty_member.roles.remove(updated_role) : null;

                            await points_update_channel.send(`***${penalty_player.name}** has lost ${deducted_points} points, bringing their total to **${updated_penalty_points} points!** You now have **${name.split('|')[1].trim()}** rank!*`);
                        } else {
                            await points_update_channel.send(`***${penalty_player.name}** has lost ${deducted_points} points, bringing their total to **${updated_penalty_points} points!***`);
                        };
                    };

                    const penaltyRemovalEmbed = new EmbedBuilder()
                        .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                        .setColor('Green')
                        .setTitle(`Penalty for ${penalty_member.user.tag}`)
                        .setThumbnail(penalty_member.user.displayAvatarURL())
                        .setDescription(`***${penalty_member.user.tag}'s** penalisation has been removed*`)
                        .addFields([
                            { name: 'User', value: penalty_member.user.tag, inline: true },
                            { name: 'IGN', value: penalty_player.name, inline: true },
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
                        .setDescription(`*Successfully removed penalisation of ${penalty_member} at ${interaction.guild.name}!*`)
                        .addFields([
                            { name: 'Player', value: `${penalty_member}`, inline: true },
                            { name: 'Player ID', value: `${penalty.member_id}`, inline: true },
                            { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
                        ])
                        .setFooter({ text: penalty_member.user.username, iconURL: penalty_member.user.displayAvatarURL() })
                        .setTimestamp();
                    
                    const penalty_index = penalty_player.penalties.events.findIndex((penalty) => penalty.id.toLowerCase() === penalty_id.toLowerCase());
                    const penalty_log_index = penalty_player.logs.penalties.findIndex((penalty) => penalty.id.toLowerCase() === penalty_id.toLowerCase());

                    penalty_player.penalties.events.splice(penalty_index, 1);
                    penalty_player.logs.penalties.splice(penalty_log_index, 1);

                    penalty_player = await Players.findOneAndUpdate(
                        {
                            id: penalty_member.id
                        },
                        {
                            rank: member_rank,
                            penalties: {
                                count: --penalty_player.penalties.count,
                                events: penalty_player.penalties.events
                            },
                            points: {
                                current: updated_penalty_points,
                                total: penalty_player.points.total + deducted_points
                            },
                            logs: {
                                penalties: penalty_player.logs.penalties
                            }
                        },
                        {
                            new: true,
                        }
                    );

                    await Penalties.deleteOne({ id: penalty.id });

                    penalty_member.communicationDisabledUntilTimestamp ? await penalty_member.disableCommunicationUntil(penalty_member.communicationDisabledUntilTimestamp - penalty.duration_timestamp > 0 ? penalty_member.communicationDisabledUntilTimestamp - penalty.duration_timestamp : null) : null;

                    penalty_member.setNickname(`[${penalty_player.points.current}] ${penalty_player.name}`).catch(() => interaction.channel.send(`*An Error Occurred: **User Has Been Penalised But Couldn\'t Change Nickname!**!*`));
                    await interaction.editReply({ embeds: [successfulPenalisationRemovalEmbed] });
                    await this.bot.utils.auditSend(Channels.PenaltyChannelId, { embeds: [penaltyRemovalEmbed] });
                default:
                    break;
            };
        } catch (error) {
            console.error(error);
            return await this.bot.utils.error(interaction, error);
        };
    };
};