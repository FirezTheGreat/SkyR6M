const { Client, EmbedBuilder, Guild, TextChannel } = require("discord.js");
const Players = require('../models/Players.js');
const MatchStats = require('../models/MatchStats.js');
const { Channels, Roles } = require('../../config.json');
const { RolePointChecker } = require("../Util.js");

/**
 * @class PointsAllocationManager Class.
 */

module.exports = class PointAllocationManager {
    /**
     * 
     * @param {Client} bot Client to initiate.
     * @param {string} channelId ChannelId to send Logs.
     * @param {string} guildId GuildId to fetch Guild Data.
     * @param {string} matchId MatchId of the match played.
     * @param {object} moderator Moderator who invoked the command.
     * @param {string} moderator.id Moderator Id
     * @param {string} moderator.tag Moderator user tag
     * @param {string} moderator.icon Moderator icon
     */

    constructor({ bot, channelId = '', guildId = '', matchId = '', moderator = { id: '', tag: '', icon: '' } }) {
        Object.defineProperty(this, 'bot', { value: bot });

        this.channel_id = channelId;
        this.guild_id = guildId;
        this.match_id = matchId
        this.moderator = moderator;
    };

    /**
     * @returns {Guild} Guild Object
     */

    get guild() {
        return this.bot.guilds.cache.get(this.guild_id);
    };

    /**
     * @returns {TextChannel} Text Channel of a Guild
     */

    get pointsUpdateChannel() {
        return this.guild.channels.cache.get(Channels.PointsUpdateId);
    };

    /**
     * @param {object[]} winners Array of Winners' Stats
     * @returns {object[]} Updated Stats for Each Winner
     */

    async setWinners(winners = []) {
        if (!Array.isArray(winners)) return new Error('Data sent is not an Array');
        if (!winners.length) return new Error('Empty Data');

        const updatedWinners = [];

        if (!this.#checkMatchValidity(this.match_id)) return new Error('Invalid Match');

        const match = await MatchStats.findOne({ id: this.match_id });

        for (const { id, kills, deaths } of winners) {
            let player = await Players.findOne({ id });

            if (!player) {
                const user = await this.bot.users.fetch(id);

                const UnregisteredPlayerEmbed = new EmbedBuilder()
                    .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
                    .setColor('Red')
                    .setDescription(`*Failed to add points to **${user.tag}** as player is not registered in our server.*`)
                    .setFooter({ text: this.guild.name, iconURL: this.guild.iconURL() })
                    .setTimestamp();

                await this.bot.utils.auditSend(this.channel_id, { embeds: [UnregisteredPlayerEmbed] });
            } else {
                let member = this.guild.members.cache.get(id);

                const points = this.bot.utils.addPoints(player.points.current);
                const updated_points = player.points.current + points;
                const role = this.guild.roles.cache.get(RolePointChecker(player.points.current, points));
                const existing_role = this.guild.roles.cache.find((role) => role.name.toLowerCase() === player.rank.toLowerCase());

                if (role.id !== existing_role.id) {
                    player.rank = role.name;
                    player._roles.push(role.id);

                    member ? await member.roles.add(role.id) : null;

                    if (existing_role.id !== Roles.RegisteredId) {
                        player._roles = player._roles.filter((role) => role !== existing_role.id);
                        member ? await member.roles.remove(existing_role) : null;
                    };
                };

                member = await this.bot.users.fetch(id);

                const match_log = await this.pointsUpdateChannel.send({ content: `***${player.name}** has won ${points} points, bringing their total to **${updated_points} points!**${existing_role.id !== role.id ? ` You now have **${player.rank.substring(player.rank.indexOf('|') + 1)}** rank` : ''}*` });

                player.logs.matches.push({ id: this.match_id, kills, deaths, map: match.map, description: match_log });
                player.previous_players.push(...winners.filter(({ id }) => id !== player.id).map(({ id, name }) => ({ id, name, status: 'win' })));

                player = await Players.findOneAndUpdate(
                    {
                        id
                    },
                    {
                        rank: player.rank,
                        points: {
                            current: updated_points,
                            total: player.points.total + points
                        },
                        statistics: {
                            kills: player.statistics.kills + kills,
                            deaths: player.statistics.deaths + deaths,
                            wins: player.statistics.wins + 1,
                            matches: player.statistics.matches + 1
                        },
                        logs: {
                            matches: player.logs.matches
                        },
                        previous_players: player.previous_players,
                        achievements: this.bot.utils.checkAchievements(player, points),
                        _roles: player._roles
                    },
                    {
                        new: true
                    }
                );

                const AddedPointsAuditLogEmbed = new EmbedBuilder()
                    .setAuthor({ name: 'Added Points', iconURL: member.displayAvatarURL() })
                    .setColor('Green')
                    .setDescription(`***${points}** points have been added to ${member.tag}*`)
                    .addFields(
                        { name: 'Previous Points', value: `${player.points.current - points}`, inline: true },
                        { name: 'Updated Points', value: `${player.points.current}`, inline: true },
                        { name: 'Room ID', value: `${this.match_id}`, inline: true }
                    )
                    .setFooter({ text: this.moderator.tag, iconURL: this.moderator.icon })
                    .setTimestamp();

                await this.bot.utils.auditSend(Channels.PointLogId, { embeds: [AddedPointsAuditLogEmbed] });

                const AddPointsAllotedEmbed = new EmbedBuilder()
                    .setAuthor({ name: this.guild.name, iconURL: this.guild.iconURL() })
                    .setColor('Green')
                    .setThumbnail(member.displayAvatarURL())
                    .setDescription(`***${points}** points have been added to ${member}*`)
                    .addFields(
                        { name: 'Previous Points', value: `${player.points.current - points}`, inline: true },
                        { name: 'Current Points', value: `${player.points.current}`, inline: true },
                        { name: 'Player', value: player.name, inline: true }
                    )
                    .setFooter({ text: `Points have been allotted by ${this.moderator.tag}`, iconURL: this.moderator.icon })
                    .setTimestamp();

                await this.bot.utils.auditSend(this.channel_id, { embeds: [AddPointsAllotedEmbed] });

                updatedWinners.push({ id, name: player.name, kills, deaths, points });
            };
        };

        return updatedWinners;
    };

    /**
     * 
     * @param {object[]} losers Array of Losers IDs.
     * @returns {object[]} Updated stats for each loser.
     */

    async setLosers(losers = []) {
        if (!Array.isArray(losers)) return new Error('Data sent is not an Array');
        if (!losers.length) return new Error('Empty Data');

        const updatedLosers = [];

        if (!this.#checkMatchValidity(this.match_id)) return new Error('Invalid Match');

        const match = await MatchStats.findOne({ id: this.match_id });

        for (const { id, kills, deaths } of losers) {
            let player = await Players.findOne({ id });

            if (!player) {
                const user = await this.bot.users.fetch(id);

                const UnregisteredPlayerEmbed = new EmbedBuilder()
                    .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
                    .setColor('Red')
                    .setDescription(`*Failed to remove points from **${user.tag}** as player is not registered in our server.*`)
                    .setFooter({ text: this.guild.name, iconURL: this.guild.iconURL() })
                    .setTimestamp();

                await this.bot.utils.auditSend(this.channel_id, { embeds: [UnregisteredPlayerEmbed] });
            } else {
                let member = this.guild.members.cache.get(id);

                const points = this.bot.utils.removePoints(player.points.current);
                const updated_points = player.points.current + points;
                const role = this.guild.roles.cache.get(RolePointChecker(player.points.current, points));
                const existing_role = this.guild.roles.cache.find((role) => role.name.toLowerCase() === player.rank.toLowerCase());

                if (role.id !== existing_role.id) {
                    player.rank = role.name;
                    player._roles.push(role.id);

                    member ? await member.roles.add(role.id) : null;

                    if (existing_role.id !== Roles.RegisteredId) {
                        player._roles = player._roles.filter((role) => role !== existing_role.id);
                        member ? await member.roles.remove(existing_role) : null;
                    };
                };

                member = await this.bot.users.fetch(id);

                const match_log = await this.pointsUpdateChannel.send({ content: `***${player.name}** has lost ${-points} points, bringing their total to **${updated_points} points!**${existing_role.id !== role.id ? ` You now have **${player.rank.substring(player.rank.indexOf('|') + 1)}** rank` : ''}*` });

                player.logs.matches.push({ id: this.match_id, kills, deaths, map: match.map, description: match_log });
                player.previous_players.push(...losers.filter(({ id }) => id !== player.id).map(({ id, name }) => ({ id, name, status: 'lose' })));

                player = await Players.findOneAndUpdate(
                    {
                        id
                    },
                    {
                        rank: player.rank,
                        points: {
                            current: updated_points
                        },
                        statistics: {
                            kills: player.statistics.kills + kills,
                            deaths: player.statistics.deaths + deaths,
                            loses: player.statistics.loses + 1,
                            matches: player.statistics.matches + 1
                        },
                        logs: {
                            matches: player.logs.matches
                        },
                        previous_players: player.previous_players,
                        achievements: this.bot.utils.checkAchievements(player, points),
                        _roles: player._roles
                    },
                    {
                        new: true
                    }
                );

                const RemovedPointsAuditLogEmbed = new EmbedBuilder()
                    .setAuthor({ name: 'Removed Points', iconURL: member.displayAvatarURL() })
                    .setColor('Green')
                    .setDescription(`***${+points}** points have been removed from ${member.tag}*`)
                    .addFields(
                        { name: 'Previous Points', value: `${player.points.current - points}`, inline: true },
                        { name: 'Updated Points', value: `${player.points.current}`, inline: true },
                        { name: 'Room ID', value: `${this.match_id}`, inline: true }
                    )
                    .setFooter({ text: this.moderator.tag, iconURL: this.moderator.icon })
                    .setTimestamp();

                await this.bot.utils.auditSend(Channels.PointLogId, { embeds: [RemovedPointsAuditLogEmbed] });

                const RemovePointsAllotedEmbed = new EmbedBuilder()
                    .setAuthor({ name: this.guild.name, iconURL: this.guild.iconURL() })
                    .setColor('Green')
                    .setThumbnail(member.displayAvatarURL())
                    .setDescription(`***${+points}** points have been removed from ${member}*`)
                    .addFields(
                        { name: 'Previous Points', value: `${player.points.current - points}`, inline: true },
                        { name: 'Current Points', value: `${player.points.current}`, inline: true },
                        { name: 'Player', value: player.name, inline: true }
                    )
                    .setFooter({ text: `Points have been removed by ${this.moderator.tag}`, iconURL: this.moderator.icon })
                    .setTimestamp();

                await this.bot.utils.auditSend(this.channel_id, { embeds: [RemovePointsAllotedEmbed] });

                updatedLosers.push({ id, name: player.name, kills, deaths, points });
            };
        };

        return updatedLosers;
    };

    /**
     * @private
     * @param {string} id Match Code
     * @returns {boolean} Match Validity
     */

    async #checkMatchValidity(id) {
        return (await MatchStats.find({ id })).length ? true : false;
    };
};