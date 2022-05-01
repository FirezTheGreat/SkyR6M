const { Client, EmbedBuilder, Guild, TextChannel } = require("discord.js");
const PlayerStats = require('../models/PlayerStats.js');
const MatchStats = require('../models/MatchStats.js');
const { Channels, Roles } = require('../../config.json');
const { RolePointChecker } = require("../functions.js");

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
     * @param {string} moderator.name Moderator name
     * @param {string} moderator.tag Moderator user tag
     */
    constructor({ bot, channelId = '', guildId = '', matchId = '', moderator = { id: '', name: '', tag: '' } }) {
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
     * 
     * @param {string[]} losers Array of Losers IDs.
     * @returns {object[]} Updated stats for each loser.
     */

    async setLosers(losers = []) {
        if (!Array.isArray(losers)) return new Error('Data sent is not an Array');
        if (losers.length) return new Error('Empty Data');

        const updatedLosers = [];

        const match_validity = this.#checkMatchValidity(this.match_id);
        if (!match_validity) return new Error('Invalid Match');

        for (const { id, kills, deaths } of losers) {
            let player = await PlayerStats.findOne({ id });

            if (!player) {
                const user = await this.bot.users.fetch(id);

                const UnregisteredPlayerEmbed = new EmbedBuilder()
                    .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
                    .setColor('Red')
                    .setDescription(`*Failed to remove points from **${user.tag}** as player is not registered in our server.*`)
                    .setFooter({ text: this.guild.name, iconURL: this.guild.iconURL() })
                    .setTimestamp();

                this.bot.utils.auditSend(this.channel_id, { embeds: [UnregisteredPlayerEmbed] });
            } else {
                const member = this.guild.members.cache.get(id);

                if (!member) {
                    const user = await this.bot.users.fetch(id);

                    const PlayerLeftEmbed = new EmbedBuilder()
                        .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
                        .setColor('Aqua')
                        .setDescription(`***${user.tag}** has left the server, the points could not be removed from the player.*`)
                        .setFooter({ text: this.guild.name, iconURL: this.guild.iconURL() })
                        .setTimestamp();

                    this.bot.utils.auditSend(this.channel_id, { embeds: [PlayerLeftEmbed] });
                } else {
                    const points = this.bot.utils.removePoints(player.current_points);
                    const role_id = RolePointChecker(player.current_points, points);

                    const role = this.guild.roles.cache.get(role_id);

                    let rank = player.rank;
                    let hasRoleUpdated = false;

                    if (role.name.toLowerCase() !== rank.toLowerCase()) {
                        let prior_role = this.guild.roles.cache.find(({ name }) => name.toLowerCase() === rank.toLowerCase());

                        rank = role.name;
                        hasRoleUpdated = true;

                        await member.roles.add(role.id);
                        prior_role === Roles.RegisteredId
                            ? null
                            : await member.roles.remove(prior_role);
                    };

                    const match_log = await this.pointsUpdateChannel.send(`***${player.name}** has lost ${+points} points, bringing their total to ${player.current_points + points} points!${hasRoleUpdated ? ` You now have **${role.name.slice(6)}** rank` : ''}*`);
                    player.logs.matches.push(match_log);

                    player = await PlayerStats.findOneAndUpdate(
                        {
                            id
                        },
                        {
                            rank,
                            current_points: player.current_points + points,
                            statistics: {
                                kills,
                                deaths,
                                loses: ++player.statistics.loses,
                                matches: ++player.statistics.matches
                            },
                            logs: {
                                matches: player.logs.matches
                            }
                        },
                        {
                            new: true
                        }
                    );

                    const RemovedPointsAuditLogEmbed = new EmbedBuilder()
                        .setAuthor({ name: 'Removed Points', iconURL: member.user.displayAvatarURL() })
                        .setColor('Green')
                        .setDescription(`***${points}** points have been removed from ${member.user.tag}*`)
                        .addFields(
                            { name: 'Previous Points', value: `${player.current_points - points}`, inline: true },
                            { name: 'Updated Points', value: `${player.current_points}`, inline: true },
                            { name: 'Match Id', value: `${this.match_id}`, inline: true }
                        )
                        .setFooter({ text: this.moderator.tag, iconURL: this.moderator.icon })
                        .setTimestamp();

                    this.bot.utils.auditSend(Channels.PointLogId, { embeds: [RemovedPointsAuditLogEmbed] });

                    const RemovePointsAllotedEmbed = new EmbedBuilder()
                        .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                        .setColor('Green')
                        .setThumbnail(member.user.displayAvatarURL())
                        .setDescription(`***${points}** points have been removed from ${member}*`)
                        .addFields(
                            { name: 'Previous Points', value: `${player.current_points - points}`, inline: true },
                            { name: 'Current Points', value: `${player.current_points}`, inline: true },
                            { name: 'Player', value: player.name, inline: true }
                        )
                        .setFooter({ text: `Points have been removed by ${this.moderator.tag}`, iconURL: this.moderator.icon })
                        .setTimestamp();

                    this.bot.utils.auditSend(this.channel_id, { embeds: [RemovePointsAllotedEmbed] });
                };
            }
        };

        return updatedLosers;
    };

    /**
     * @private
     * @param {string} id Match Id
     * @returns {boolean} Match Validity
     */

    async #checkMatchValidity(id) {
        return (await MatchStats.find({ id })).length ? true : false;
    };
};