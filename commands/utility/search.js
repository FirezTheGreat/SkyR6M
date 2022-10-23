const { ApplicationCommandOptionType, ChannelType, PermissionFlagsBits, ChatInputCommandInteraction, roleMention } = require('discord.js');
const Command = require('../../structures/Command.js');
const { Channels, Roles } = require('../../config.json');
const Players = require('../../structures/models/Players.js');
const sub_commands = [
    {
        name: 'players', type: ApplicationCommandOptionType.Subcommand, description: 'Search for Players', options: [
            { name: 'channel', type: ApplicationCommandOptionType.Channel, description: 'Queue to Join', required: true, channelTypes: [ChannelType.GuildVoice] }
        ]
    },
    {
        name: 'substitutes', type: ApplicationCommandOptionType.Subcommand, description: 'Search for Substitutes', options: [
            { name: 'channel', type: ApplicationCommandOptionType.Channel, description: 'Queue to Join', required: true, channelTypes: [ChannelType.GuildVoice] }
        ]
    }
];

module.exports = class Search extends Command {
    constructor(...args) {
        super(...args, {
            name: 'search',
            description: 'Search for Players or Substitutes',
            category: 'Utility',
            usage: '[players | substitutes]',
            client_permissions: [PermissionFlagsBits.MentionEveryone],
            user_permissions: [PermissionFlagsBits.Connect],
            sub_commands,
            options: sub_commands.map(({ name, type, description, required, options }) => ({ name, type, description, required, options }))
        });
    };

    /**
     * 
     * @param {ChatInputCommandInteraction} interaction CommandInteraction
     * @returns Searches for Players or Substitutes
     */

    async InteractionRun(interaction) {
        try {
            const sub_command = interaction.options._subcommand;

            const search_players_channel = interaction.guild.channels.cache.get(Channels.SearchPlayersId);
            const channel = interaction.options.getChannel('channel');

            let player = await Players.findOne({ id: interaction.member.id });

            if (player.pings.ping_interval > Date.now()) {
                const time = this.bot.utils.convertMSToDate(player.pings.ping_interval - Date.now());

                return await interaction.reply({ content: `*You need to wait for ${time.minutes} minutes ${time.seconds} seconds before using this command*`, ephemeral: true });
            } else {
                player = await Players.findOneAndUpdate(
                    {
                        id: interaction.member.id
                    },
                    {
                        pings: {
                            total_pings: ++player.pings.total_pings,
                            ping_interval: Date.now() + 600000,
                            daily_pings: sub_command === 'substitutes' ? ++player.pings.daily_pings : player.pings.daily_pings,
                            daily_substitute_cooldown: player.pings.daily_pings === 2 ? Date.now() + 86400000 : 0
                        }
                    },
                    {
                        new: true
                    }
                );
            };

            if (sub_command === 'players') {
                await interaction.reply({ content: '*Players have been notified!*', ephemeral: true });

                const message = await search_players_channel.send(`*${interaction.member} is searching for players to join ${channel}!* ${roleMention(Roles.PingMatchId)}`);
                return setTimeout(() => message.delete().catch(() => null), 600000);
            } else {
                if (player.pings.daily_pings === 2) {
                    if (player.pings.daily_substitute_cooldown - Date.now() <= 0) {
                        await Players.findOneAndUpdate(
                            {
                                id: interaction.member.id
                            },
                            {
                                pings: {
                                    total_pings: ++player.pings.total_pings,
                                    ping_interval: Date.now() + 600000,
                                    daily_pings: 0,
                                    daily_substitute_cooldown: 0
                                }
                            },
                            {
                                new: true
                            }
                        );

                        await interaction.reply({ content: '*Players have been notified!*', ephemeral: true });

                        const message = await search_players_channel.send(`*${interaction.member} is searching for players to join ${channel}!* ${roleMention(Roles.PingSubstituteId)}`);
                        return setTimeout(() => message.delete().catch(() => null), 600000);
                    } else {
                        const time = this.bot.utils.convertMSToDate(player.pings.daily_substitute_cooldown - Date.now());

                        return await interaction.reply({ content: `*${interaction.member}, you have reached your daily subsitute search limit.\n**Cooldown -** *${time.minutes} minutes ${time.seconds} seconds before using this command*`, ephemeral: true });
                    };
                } else {
                    await interaction.reply({ content: '*Players have been notified!*', ephemeral: true });

                    const message = await search_players_channel.send(`*${interaction.member} is searching for players to join ${channel}!* ${roleMention(Roles.PingSubstituteId)}`);
                    return setTimeout(() => message.delete().catch(() => null), 600000);
                };
            };
        } catch (error) {
            console.error(error);
            return await this.bot.utils.error(interaction, error);
        };
    };
};