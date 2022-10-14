const { ApplicationCommandOptionType, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder } = require('discord.js');
const Command = require('../../structures/Command.js');
const MatchStats = require('../../structures/models/MatchStats.js');
const Players = require('../../structures/models/Players.js');
const { Roles, Channels, GameTheme, GameSides } = require('../../config.json');
const { RolePointChecker } = require('../../structures/Util.js');
const PointAllocationManager = require('../../structures/ClassManagers/PointsAllocationManager.js');

module.exports = class Allocate extends Command {
    constructor(...args) {
        super(...args, {
            name: 'allocate',
            description: 'Allocate points to Winners or Losers',
            category: 'Moderation',
            usage: '[winners | losers]',
            client_permissions: [PermissionFlagsBits.ManageRoles, PermissionFlagsBits.ManageNicknames],
            user_permissions: [PermissionFlagsBits.ManageMessages],
            options: [
                { name: 'code', type: ApplicationCommandOptionType.String, description: 'Registered Match Code', required: true }
            ]
        });
    };

    /**
     * 
     * @param {ChatInputCommandInteraction} interaction CommandInteraction
     * @returns Allocate points to Winners or Losers
     */

    async InteractionRun(interaction) {
        try {
            const code = interaction.options.getString('code').toUpperCase();

            const match = await MatchStats.findOne({ id: code });
            if (!match) return await interaction.reply({ content: '*Room code has not been registered!*' });

            if (match.allocated) return await interaction.reply({ content: '*Points have already been allocated to the players!*' });
            if (match.invalidated) return await interaction.reply({ content: `*Cannot allocate points as match has been invalidated by **${match.invalidator.name}**!*` });

            await interaction.deferReply();

            const manager = new PointAllocationManager({
                bot: this.bot,
                channelId: interaction.channelId,
                guildId: interaction.guildId,
                matchId: code,
                moderator: {
                    id: interaction.member.id,
                    tag: interaction.user.tag,
                    icon: interaction.user.displayAvatarURL()
                }
            });

            switch (GameTheme) {
                case 'COPS':
                    const winner_team = match.coalition.status === 'winner' ? GameSides[GameTheme][0] : GameSides[GameTheme][1]
                    const loser_team = match.breach.status === 'loser' ? GameSides[GameTheme][1] : GameSides[GameTheme][0]

                    const winning_players = winner_team.toLowerCase() === GameSides[GameTheme][0] ? match.coalition.players : match.breach.players;
                    const losing_players = loser_team.toLowerCase() === GameSides[GameTheme][0] ? match.coalition.players : match.breach.players;

                    const winning_player_stats = [];
                    const losing_player_stats = [];

                    for (const { id, name } of winning_players.values()) {
                        const winner_stat_embed = new EmbedBuilder()
                            .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                            .setColor('Blue')
                            .setThumbnail(interaction.guild.members.cache.get(id).displayAvatarURL())
                            .setDescription(`*Please the enter the amount of **kills** by ${name} of ${winner_team}.*`)
                            .setTimestamp();

                        await interaction.editReply({ embeds: [winner_stat_embed] });

                        const collector = interaction.channel.createMessageCollector({ filter: (message) => /^[0-9]\d*$/g.test(message.content.trim()) && message.author.id === interaction.user.id, max: 2 });

                        collector.on('collect', async () => {
                            winner_stat_embed
                                .setDescription(`*Please the enter the amount of **deaths** of ${name} of ${winner_team}.*`)
                                .setTimestamp();

                            await interaction.editReply({ embeds: [winner_stat_embed] });
                        });

                        collector.on('end', async (collected) => {
                            winning_player_stats.push({ id, kills: +collected.first().content.trim(), deaths: +collected.last().content.trim() });
                        });
                    };

                    for (const { id, name } of losing_players.values()) {
                        const loser_stat_embed = new EmbedBuilder()
                            .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                            .setColor('Blue')
                            .setThumbnail(interaction.guild.members.cache.get(id).displayAvatarURL())
                            .setDescription(`*Please the enter the amount of **kills** by ${name} of ${loser_team}.*`)
                            .setTimestamp();

                        await interaction.editReply({ embeds: [loser_stat_embed] });

                        const collector = interaction.channel.createMessageCollector({ filter: (message) => /^[0-9]\d*$/g.test(message.content.trim()) && message.author.id === interaction.user.id, max: 2 });

                        collector.on('collect', async () => {
                            loser_stat_embed
                                .setDescription(`*Please the enter the amount of **deaths** of ${name} of ${loser_team}.*`)
                                .setTimestamp();

                            await interaction.editReply({ embeds: [loser_stat_embed] });
                        });

                        collector.on('end', async (collected) => {
                            losing_player_stats.push({ id, kills: +collected.first().content.trim(), deaths: +collected.last().content.trim() });
                        });
                    };

                    await MatchStats.updateOne(
                        {
                            id: code
                        },
                        {
                            coalition: {
                                players: match.coalition.status === 'winner' ? manager.setWinners(winning_player_stats) : manager.setLosers(losing_player_stats)
                            },
                            breach: {
                                players: match.breach.status === 'loser' ? manager.setLosers(losing_player_stats) : manager.setWinners(winning_player_stats)
                            },
                            allocated: true,
                            allocator: {
                                id: interaction.member.id,
                                name: (await Players.findOne({ id: interaction.member.id })).name,
                                timestamp: Date.now()
                            }
                        }
                    );
                case 'R6M':
                // later
                case 'VM':
                // later
            };
        } catch (error) {
            console.error(error);
            return await this.bot.utils.error(interaction, error);
        };
    };
};