const { ApplicationCommandType, ApplicationCommandOptionType, ActionRowBuilder, SelectMenuBuilder, Colors, ButtonStyle, ComponentType, ButtonBuilder, ChatInputCommandInteraction } = require('discord.js');
const Command = require('../../structures/Command.js');
const Players = require('../../structures/models/Players.js');

module.exports = class Profile extends Command {
    constructor(...args) {
        super(...args, {
            name: 'profile',
            description: 'View Player Stats',
            category: 'Utility',
            usage: '[user]',
            type: ApplicationCommandType.ChatInput,
            options: [
                { name: 'player', type: ApplicationCommandOptionType.User, description: 'Enter Player to View Stats', required: false }
            ]
        });
    };

    /**
     * 
     * @param {ChatInputCommandInteraction} interaction CommandInteraction
     * @returns Profile
     */

    async InteractionRun(interaction) {
        try {
            const member = interaction.options.getMember('player') || interaction.member;
            if (!member) return interaction.reply({ content: '*User has left the server.*', ephemeral: true });

            const player = await Players.findOne({ id: member.id });
            if (!player) return interaction.reply({ content: `***${member}** has not registered at ${interaction.guild.name}*`, ephemeral: true });

            const playerPosition = (await Players.find({}).sort({ 'points.current': -1 })).findIndex(({ id }) => id === player.id);
            const win_lose_ratio = player.statistics.deaths / player.statistics.kills;

            let collectorProfileComponents,
                matchLogCollector = null;

            const profileEmbedComponents = new ActionRowBuilder()
                .addComponents([
                    new SelectMenuBuilder()
                        .setCustomId('profile')
                        .setMaxValues(1)
                        .addOptions([
                            {
                                label: 'Match Statistics',
                                description: 'Victories & Defeats',
                                value: 'match',
                                default: true
                            },
                            {
                                label: 'K/D Statistics',
                                description: 'Kills & Deaths',
                                value: 'kd'
                            },
                            {
                                label: 'Match Logs',
                                description: 'Logs of Matches Played',
                                value: 'logs'
                            }
                        ])
                ]);

            const profileMessage = await interaction.reply({
                embeds: [
                    {
                        author: {
                            name: member.user.tag,
                            iconURL: member.user.displayAvatarURL()
                        },
                        color: Colors.Aqua,
                        title: 'Match Statistics',
                        description: `*Victory, Defeat & Rank Statistics of ${member}*`,
                        thumbnail: {
                            url: member.user.displayAvatarURL()
                        },
                        fields: [
                            { name: 'IGN', value: player.name, inline: true },
                            { name: 'Victories', value: player.statistics.wins, inline: true },
                            { name: 'Defeats', value: player.statistics.loses, inline: true },
                            { name: 'W/L Ratio', value: win_lose_ratio ? win_lose_ratio.toFixed(2) : '0', inline: true },
                            { name: 'Matches', value: player.statistics.matches, inline: true },
                            { name: 'Position Wise Rank', value: `#${playerPosition + 1}`, inline: true }
                        ],
                        footer: {
                            text: interaction.guild.name,
                            iconURL: interaction.guild.iconURL()
                        },
                        timestamp: new Date().toISOString()
                    }
                ],
                components: [profileEmbedComponents]
            });

            const profileEmbedCollector = profileMessage.createMessageComponentCollector({ filter: ({ customId }) => customId === 'profile', time: 300000, componentType: ComponentType.SelectMenu });

            profileEmbedCollector.on('collect', async (selectMenu) => {
                if (selectMenu.user.id !== interaction.user.id) return await selectMenu.reply({ content: '*You did not initiate this command!*', ephemeral: true });

                const selectMenuOptions = [];

                player.logs.matches.reverse();

                let total_pages = Math.ceil(player.logs.matches.length / 10),
                    current_page = 0;

                for (const { data: { label, value, description } } of profileEmbedComponents.components[0].options) {
                    const selectMenuOption = {
                        label,
                        value,
                        description,
                        default: value === selectMenu.values[0] ? true : false
                    };

                    selectMenuOptions.push(selectMenuOption);
                };

                collectorProfileComponents = new ActionRowBuilder()
                    .addComponents([
                        SelectMenuBuilder.from(profileEmbedComponents.components[0]).setOptions(selectMenuOptions)
                    ]);

                switch (selectMenu.values[0]) {
                    case 'match':
                        if (matchLogCollector) {
                            current_page = 0;
                            matchLogCollector.stop();
                            matchLogCollector = null;
                        };

                        await selectMenu.update({
                            embeds: [
                                {
                                    author: {
                                        name: member.user.tag,
                                        iconURL: member.user.displayAvatarURL()
                                    },
                                    color: Colors.Aqua,
                                    title: 'Match Statistics',
                                    description: `*Victory, Defeat & Rank Statistics of ${member}*`,
                                    thumbnail: {
                                        url: member.user.displayAvatarURL()
                                    },
                                    fields: [
                                        { name: 'IGN', value: player.name, inline: true },
                                        { name: 'Victories', value: player.statistics.wins, inline: true },
                                        { name: 'Defeats', value: player.statistics.loses, inline: true },
                                        { name: 'W/L Ratio', value: win_lose_ratio ? win_lose_ratio.toFixed(2) : '0', inline: true },
                                        { name: 'Matches', value: player.statistics.matches, inline: true },
                                        { name: 'Position Wise Rank', value: `#${playerPosition + 1}`, inline: true },
                                    ],
                                    footer: {
                                        text: interaction.guild.name,
                                        iconURL: interaction.guild.iconURL()
                                    },
                                    timestamp: new Date().toISOString()
                                }
                            ],
                            components: [collectorProfileComponents]
                        });
                        break;
                    case 'kd':
                        if (matchLogCollector) {
                            current_page = 0;
                            matchLogCollector.stop();
                            matchLogCollector = null;
                        };

                        const playerKDRPosition = (await Players.find({}).sort({ 'statistics.total_kills': -1 })).findIndex(({ id }) => id === player.id);
                        const kill_death_ratio = player.statistics.deaths / player.statistics.kills;

                        await selectMenu.update({
                            embeds: [
                                {
                                    author: {
                                        name: member.user.tag,
                                        iconURL: member.user.displayAvatarURL()
                                    },
                                    color: Colors.Aqua,
                                    title: 'Kills & Deaths Statistics',
                                    description: `*Kills, Deaths & KDR Statistics of ${member}*`,
                                    thumbnail: {
                                        url: member.user.displayAvatarURL()
                                    },
                                    fields: [
                                        { name: 'Kills', value: player.statistics.kills, inline: true },
                                        { name: 'Deaths', value: player.statistics.deaths, inline: true },
                                        { name: 'K/D Ratio', value: kill_death_ratio ? kill_death_ratio.toFixed(2) : '0', inline: true },
                                        { name: 'Highest Kills', value: player.logs.matches.length ? `${player.logs.matches.reduce((previousMatch, currentMatch) => previousMatch.kills > currentMatch.kills ? previousMatch : currentMatch).kills}` : '0', inline: true },
                                        { name: 'KDR Wise Rank', value: `#${playerKDRPosition + 1}`, inline: true },
                                        { name: 'Tier', value: `${interaction.guild.roles.cache.find(({ name }) => name.toLowerCase() === player.rank.toLowerCase())}`, inline: true }
                                    ],
                                    footer: {
                                        text: interaction.guild.name,
                                        iconURL: interaction.guild.iconURL()
                                    },
                                    timestamp: new Date().toISOString()
                                }
                            ],
                            components: [collectorProfileComponents]
                        });
                        break;
                    case 'logs':
                        const matchLogEmbedFields = [];

                        for (let page = 0; page < player.logs.matches.length; page += 10) {
                            let index = page;

                            const current_page_logs = player.logs.matches.slice(page, page + 10).map(({ description }) => `${++index}. ${description}`);

                            const logEmbed = {
                                author: {
                                    name: member.user.tag,
                                    iconURL: member.user.displayAvatarURL()
                                },
                                color: Colors.Aqua,
                                title: 'Match Logs & Data',
                                description: `*Match IDs, Logs & Data of ${member}*${`\n\n\`\`\`${current_page_logs.join('\n')}\`\`\``}`,
                                thumbnail: {
                                    url: member.user.displayAvatarURL()
                                },
                                footer: {
                                    text: `Page - ${(page + 10) / 10}/${total_pages}`,
                                    iconURL: interaction.guild.iconURL()
                                },
                                timestamp: new Date().toISOString()
                            };

                            matchLogEmbedFields.push(logEmbed);
                        };

                        const matchLogComponent = new ActionRowBuilder()
                            .addComponents([
                                new ButtonBuilder()
                                    .setCustomId('previous')
                                    .setLabel('Previous')
                                    .setEmoji('⏪')
                                    .setStyle(ButtonStyle.Primary),
                                new ButtonBuilder()
                                    .setCustomId('next')
                                    .setLabel('Next')
                                    .setEmoji('⏩')
                                    .setStyle(ButtonStyle.Primary)
                            ]);

                        const matchLogComponents = [];

                        total_pages > 1 ? matchLogComponents.push(matchLogComponent, collectorProfileComponents) : matchLogComponents.push(collectorProfileComponents);

                        const matchLogEmbed = await selectMenu.update({
                            embeds: [
                                matchLogEmbedFields.length
                                    ? matchLogEmbedFields[0] :
                                    {
                                        author: {
                                            name: member.user.tag,
                                            iconURL: member.user.displayAvatarURL()
                                        },
                                        color: Colors.Aqua,
                                        title: 'Match Logs & Data',
                                        description: `*Match IDs, Logs & Data of ${member} are currently unavailable*`,
                                        thumbnail: {
                                            url: member.user.displayAvatarURL()
                                        },
                                        footer: {
                                            text: interaction.guild.name,
                                            iconURL: interaction.guild.iconURL()
                                        },
                                        timestamp: new Date().toISOString()
                                    }
                            ],
                            components: matchLogComponents
                        });

                        if (total_pages > 1) {
                            matchLogCollector = matchLogEmbed.createMessageComponentCollector({ filter: ({ customId }) => ['previous', 'next'].includes(customId) && !interaction.user.bot, time: 300000, componentType: ComponentType.Button });

                            matchLogCollector.on('collect', async (button) => {
                                if (button.user.id !== interaction.user.id) return await button.reply({ content: '*You did not initiate this command!*', ephemeral: true });

                                switch (button.customId) {
                                    case 'previous':
                                        if (current_page === 0) {
                                            current_page = total_pages - 1;
                                        } else {
                                            --current_page;
                                        };
                                        break;
                                    case 'next':
                                        if (current_page === total_pages - 1) {
                                            current_page = 0;
                                        } else {
                                            ++current_page
                                        };
                                        break;
                                    default:
                                        break;
                                };

                                await button.update({ embeds: [matchLogEmbedFields[current_page]] });
                            });
                        };
                        break;
                    default:
                        break;
                };
            });

            profileEmbedCollector.on('end', async (_collected, reason) => {
                if (reason === 'time') {
                    collectorProfileComponents = new ActionRowBuilder()
                        .addComponents([
                            SelectMenuBuilder.from(collectorProfileComponents.components ? collectorProfileComponents.components[0] : collectorProfileComponents).setDisabled(true)
                        ]);

                    return interaction.editReply({ components: [collectorProfileComponents] }).catch(() => null);
                };
            });
        } catch (error) {
            if (error.code === 10062) return console.error(`Unknown Interaction Error - ${error.message}`);

            console.error(error);
            return await this.bot.utils.error(interaction, error);
        };
    };
};