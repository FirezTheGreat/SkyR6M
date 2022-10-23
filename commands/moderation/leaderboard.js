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
                const points_description = [];

                for (let [index, { name, points: { current } }] of leaderboard_points_data.entries()) {
                    points_description.push(`${++index}. **${name}** - *${current}*`);
                };

                const components = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`${interaction.guildId}_kills`)
                            .setLabel('Top Kills')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId(`${interaction.guildId}_wins`)
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

                return setTimeout(() => leaderboard_message.delete().catch((error) => console.error(error)), 3605000);
            };

            await leaderboard();

            let leaderboard_interval = setInterval(async () => {
                try {
                    await leaderboard();
                } catch (error) {
                    clearInterval(leaderboard_interval);
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