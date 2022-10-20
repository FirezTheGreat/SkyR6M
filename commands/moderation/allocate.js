const { ApplicationCommandOptionType, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, userMention } = require('discord.js');
const Command = require('../../structures/Command.js');
const MatchStats = require('../../structures/models/MatchStats.js');
const Players = require('../../structures/models/Players.js');
const { GameTheme, GameSides, Channels } = require('../../config.json');
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

            if (!match.screenshot) return await interaction.reply({ content: `*Cannot allocate points as match screenshot has not been sent by any player!*` });
            if (match.coalition.status === 'Unknown' || match.breach.status === 'Unknown') return await interaction.reply({ content: `*Cannot allocate points as match result has not been verified yet*` });

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
                    const winner_team = match.coalition.status === 'winner' ? GameSides[GameTheme][0] : GameSides[GameTheme][1];
                    const loser_team = match.breach.status === 'winner' ? GameSides[GameTheme][0] : GameSides[GameTheme][1];

                    const winning_players = winner_team === GameSides[GameTheme][0] ? match.coalition.players : match.breach.players;
                    const losing_players = loser_team === GameSides[GameTheme][0] ? match.coalition.players : match.breach.players;

                    const winning_player_stats = [];
                    const losing_player_stats = [];

                    let index = 0;

                    for (const { id, name } of winning_players.values()) {
                        const winner_stat_embed = new EmbedBuilder()
                            .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                            .setColor('Blue')
                            .setThumbnail(interaction.guild.members.cache.get(id).displayAvatarURL())
                            .setDescription(`*Please the enter the amount of **kills** by (${++index}) ${name} of ${winner_team}.*`)
                            .setFooter({ text: `1/2`, iconURL: interaction.guild.iconURL() })
                            .setTimestamp();

                        await interaction.editReply({ embeds: [winner_stat_embed] });

                        const kill_collector = await interaction.channel.awaitMessages({ filter: (message) => /^[0-9]\d*$/g.test(message.content.trim()) && message.author.id === interaction.user.id, max: 1 });

                        winner_stat_embed
                            .setDescription(`*Please the enter the amount of **deaths** of (${index}) ${name} of ${winner_team}.*`)
                            .setFooter({ text: `2/2`, iconURL: interaction.guild.iconURL() })
                            .setTimestamp();

                        await interaction.editReply({ embeds: [winner_stat_embed] });
                        kill_collector.first().deletable ? await kill_collector.first().delete() : null;

                        const death_collector = await interaction.channel.awaitMessages({ filter: (message) => /^[0-9]\d*$/g.test(message.content.trim()) && message.author.id === interaction.user.id, max: 1 });

                        death_collector.first().deletable ? await death_collector.first().delete() : null;
                        winning_player_stats.push({ id, kills: +kill_collector.first().content.trim(), deaths: +death_collector.last().content.trim(), name: (await Players.findOne({ id })).name });
                    };

                    for (const { id, name } of losing_players.values()) {
                        const loser_stat_embed = new EmbedBuilder()
                            .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                            .setColor('Blue')
                            .setThumbnail(interaction.guild.members.cache.get(id).displayAvatarURL())
                            .setDescription(`*Please the enter the amount of **kills** by (${++index}) ${name} of ${loser_team}.*`)
                            .setFooter({ text: `1/2`, iconURL: interaction.guild.iconURL() })
                            .setTimestamp();

                        await interaction.editReply({ embeds: [loser_stat_embed] });

                        const kill_collector = await interaction.channel.awaitMessages({ filter: (message) => /^[0-9]\d*$/g.test(message.content.trim()) && message.author.id === interaction.user.id, max: 1 });

                        loser_stat_embed
                            .setDescription(`*Please the enter the amount of **deaths** of (${index}) ${name} of ${loser_team}.*`)
                            .setFooter({ text: `2/2`, iconURL: interaction.guild.iconURL() })
                            .setTimestamp();

                        await interaction.editReply({ embeds: [loser_stat_embed] });
                        kill_collector.first().deletable ? await kill_collector.first().delete() : null;

                        const death_collector = await interaction.channel.awaitMessages({ filter: (message) => /^[0-9]\d*$/g.test(message.content.trim()) && message.author.id === interaction.user.id, max: 1 });

                        death_collector.first().deletable ? await death_collector.first().delete() : null;
                        losing_player_stats.push({ id, kills: +kill_collector.first().content.trim(), deaths: +death_collector.last().content.trim(), name: (await Players.findOne({ id })).name });
                    };

                    const coalition_players = match.coalition.status === 'winner' ? await manager.setWinners(winning_player_stats) : await manager.setLosers(losing_player_stats);
                    const breach_players = match.breach.status === 'winner' ? await manager.setWinners(winning_player_stats) : await manager.setLosers(losing_player_stats);

                    await MatchStats.updateOne(
                        {
                            id: code
                        },
                        {
                            coalition: {
                                players: coalition_players,
                                status: match.coalition.status
                            },
                            breach: {
                                players: breach_players,
                                status: match.breach.status
                            },
                            allocated: true,
                            allocator: {
                                id: interaction.member.id,
                                name: (await Players.findOne({ id: interaction.member.id })).name,
                                timestamp: Date.now()
                            }
                        }
                    );

                    interaction.guild.channels.cache.get(Channels.SubmitScreenshotId).messages.delete(match.message_id).catch(() => null);
                    await interaction.editReply({ content: `*Points have been allocated successfully by ${interaction.member}*`, embeds: [] });
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