const Command = require('../../structures/Command.js');
const { PermissionFlagsBits, ApplicationCommandOptionType, ChatInputCommandInteraction, ActionRowBuilder, EmbedBuilder, AttachmentBuilder, SelectMenuBuilder, ComponentType, ButtonBuilder, ButtonStyle } = require('discord.js');
const Players = require('../../structures/models/Players.js');
const path = require('path');

module.exports = class Leaderboard extends Command {
    constructor(...args) {
        super(...args, {
            name: 'leaderboard',
            description: 'Display Server\'s Leaderboard',
            category: 'Moderation',
            usage: '[channel]',
            user_permissions: [PermissionFlagsBits.Administrator],
            options: [
                { name: 'channel', type: ApplicationCommandOptionType.Channel, description: 'Channel to Send', required: false }
            ]
        });
    };

    /**
     * 
     * @param {ChatInputCommandInteraction} interaction CommandInteraction
     * @returns Server Leaderboard
     */

    async InteractionRun(interaction) {
        try {
            const channel = interaction.options.getChannel('channel') || interaction.channel;

            await interaction.deferReply({ ephemeral: true });

            async function leaderboard() {
                const leaderboard_points_data = await Players.find({}).sort({ 'points.current': -1 }).limit(25);
                const leaderboard_kills_data = await Players.find({}).sort({ 'statistics.kills': -1 }).limit(25);
                const leaderboard_wins_data = await Players.find({}).sort({ 'statistics.wins': -1 }).limit(25);

                const points_description = [];
                const kills_description = [];
                const wins_description = [];

                for (let [index, { name, points: { current } }] of leaderboard_points_data.entries()) {
                    points_description.push(`${++index}. **${name}** - *${current}*`);
                };

                for (let [index, { name, statistics: { kills } }] of leaderboard_kills_data.entries()) {
                    kills_description.push(`${++index}. **${name}** - *${kills}*`);
                };

                for (let [index, { name, statistics: { wins } }] of leaderboard_wins_data.entries()) {
                    wins_description.push(`${++index}. **${name}** - *${wins}*`);
                };

                const components = new ActionRowBuilder() // make buttons instead
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('kills')
                            .setLabel('Top Kills')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('wins')
                            .setLabel('Top Wins')
                            .setStyle(ButtonStyle.Primary)
                    );

                const leaderboard_image = new EmbedBuilder()
                    .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                    .setColor('Aqua')
                    .setImage('attachment://leaderboard.png');

                const leaderboard_points_embed = new EmbedBuilder()
                    .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                    .setTitle(`${interaction.guild.name} - Point Wise Rankings`)
                    .setThumbnail(interaction.guild.iconURL())
                    .setColor('Aqua')
                    .setDescription(`*These are the current Top ${leaderboard_points_data.length} players at ${interaction.guild.name}.*\n\n${points_description.join('\n')}`)
                    .setFooter({ text: `Rankings are updated after every one hour. Click on the buttons below to check live-time rankings!`, iconURL: interaction.guild.iconURL() })
                    .setTimestamp();

                const leaderboard_message = await channel.send({ embeds: [leaderboard_image, leaderboard_points_embed], components: [components], files: [new AttachmentBuilder(path.join(__dirname, '..', '..', 'assets', 'banners', 'leaderboard.png'), 'leaderboard.png')] });
                const leaderboard_collector = leaderboard_message.createMessageComponentCollector({ filter: ({ customId }) => ['kills', 'wins'].includes(customId), time: 3600000, componentType: ComponentType.Button });

                leaderboard_collector.on('collect', async (button) => {
                    switch (button.customId) {
                        case 'kills':
                            const leaderboard_kills_embed = new EmbedBuilder()
                                .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                                .setTitle(`${interaction.guild.name} - Kill Wise Rankings`)
                                .setThumbnail(interaction.guild.iconURL())
                                .setColor('Aqua')
                                .setDescription(`*These are the current Top ${leaderboard_kills_data.length} players at ${interaction.guild.name}.*\n\n${kills_description.join('\n')}`)
                                .setFooter({ text: `Rankings are updated after every one hour. Click on the buttons below to check live-time rankings!`, iconURL: interaction.guild.iconURL() })
                                .setTimestamp();

                            await button.reply({ embeds: [leaderboard_kills_embed], ephemeral: true });

                            break;
                        case 'wins':
                            const leaderboard_wins_embed = new EmbedBuilder()
                                .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                                .setTitle(`${interaction.guild.name} - Win Wise Rankings`)
                                .setThumbnail(interaction.guild.iconURL())
                                .setColor('Aqua')
                                .setDescription(`*These are the current Top ${leaderboard_wins_data.length} players at ${interaction.guild.name}.*\n\n${wins_description.join('\n')}`)
                                .setFooter({ text: `Rankings are updated after every one hour. Click on the buttons below to check live-time rankings!`, iconURL: interaction.guild.iconURL() })
                                .setTimestamp();

                            await button.reply({ embeds: [leaderboard_wins_embed], ephemeral: true });

                            break;
                        default:
                            break;
                    };
                });

                return setTimeout(() => leaderboard_message.delete().catch((error) => console.error(error)), 3605000);
            };

            await leaderboard();

            setInterval(async () => {
                try {
                    await leaderboard();
                } catch (error) {
                    return console.error(error);
                };
            }, 3610000);

            return await interaction.editReply({ content: `*Leaderboard successfully synced in **${channel}**!*` });
        } catch (error) {
            console.error(error);
            return await this.bot.utils.error(interaction, error);
        };
    };
};