const { ApplicationCommandOptionType, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const Command = require('../../structures/Command.js');
const MatchStats = require('../../structures/models/MatchStats');
const Players = require('../../structures/models/Players.js');
const { GameSides, GameTheme, Roles, Channels } = require('../../config.json');

module.exports = class Submit extends Command {
    constructor(...args) {
        super(...args, {
            name: 'submit',
            description: 'Submit your match\'s screenshot',
            category: 'Utility',
            usage: '[code | screenshot | note]',
            options: [
                { name: 'code', type: ApplicationCommandOptionType.String, description: 'Registered Match Code', required: true },
                { name: 'screenshot', type: ApplicationCommandOptionType.Attachment, description: 'Screenshot of the match', required: true },
                { name: 'note', type: ApplicationCommandOptionType.String, description: 'Note for moderator to check for any substitution', required: false }
            ]
        });
    };

    /**
     * 
     * @param {ChatInputCommandInteraction} interaction CommandInteraction
     * @returns Screenshot Result
     */

    async InteractionRun(interaction) {
        try {
            const player = await Players.findOne({ id: interaction.member.id });
            if (!player) return await interaction.reply({ content: `*You are not registered at ${interaction.guild.name}*`, ephemeral: true });

            const code = interaction.options.getString('code').toUpperCase();
            const screenshot = interaction.options.getAttachment('screenshot').url;
            const note = interaction.options.getString('note');

            const match = await MatchStats.findOne({ id: code });
            if (!match) return await interaction.reply({ content: '*Match with this room code is not registered!*', ephemeral: true });

            if (match.screenshot) return await interaction.reply({ content: '*Screenshot for this match has already been submitted!*', ephemeral: true });
            if (!match.coalition.players.concat(match.breach.players).some(({ id }) => id === interaction.user.id) && interaction.member.roles.highest.comparePositionTo(Roles.SeniorModeratorRoleId) < 0) return await interaction.reply({ content: '*You cannot submit screenshots for matches you haven\'t participated!*', ephemeral: true });

            if (match.invalidated || match.allocated) return await interaction.reply({ content: `*Match ${match.invalidated ? `has been invalidated by **${match.invalidator.name}**` : `points have been allocated by **${match.allocator.name}**`}!*`, ephemeral: true });

            const submit_embed = new EmbedBuilder()
                .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                .setColor('Blue')
                .setTitle(`Match Code - #${code}`)
                .setDescription(note)
                .addFields(
                    { name: GameSides[GameTheme][0], value: match.coalition.players.map((player, index) => index === 0 ? `${player.name} (C)` : player.name).join('\n'), inline: true },
                    { name: GameSides[GameTheme][1], value: match.breach.players.map((player, index) => index === 0 ? `${player.name} (C)` : player.name).join('\n'), inline: true },
                    { name: 'Host', value: match.host.name, inline: true }
                )
                .setImage(screenshot)
                .setFooter({ text: 'Senior Moderators please verify the screenshot', iconURL: interaction.guild.iconURL() })
                .setTimestamp();

            const submit_components = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`${interaction.id}_approve`)
                        .setEmoji('✅')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`${interaction.id}_cancel`)
                        .setEmoji('❌')
                        .setStyle(ButtonStyle.Primary)
                );

            await interaction.reply({ content: `*Your screenshot has been successfully sent for verification!*`, ephemeral: true });

            const submit_message = await interaction.guild.channels.cache.get(Channels.ScreenshotVerificationId).send({ embeds: [submit_embed], components: [submit_components] });

            await MatchStats.updateOne({ id: code }, { message_id: submit_message.id });

            const submit_filter = (button) => [`${interaction.id}_approve`, `${interaction.id}_cancel`].includes(button.customId) && button.member.roles.highest.comparePositionTo(Roles.SeniorModeratorRoleId) >= 0;
            const submit_collector = await submit_message.awaitMessageComponent({ filter: submit_filter, componentType: ComponentType.Button });

            if (submit_collector.customId === `${interaction.id}_approve`) {
                const winner_verification_embed = new EmbedBuilder()
                    .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                    .setColor('Green')
                    .setTitle(`Match Code - #${code}`)
                    .setDescription(`*Please verify which team won the match by clicking the button below this embed message!*`)
                    .setImage(screenshot)
                    .setFooter({ text: 'Senior Moderators please verify the winning team', iconURL: interaction.guild.iconURL() })
                    .setTimestamp();

                const winner_verification_components = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`${interaction.id}_${GameSides[GameTheme][0]}`)
                            .setLabel(GameSides[GameTheme][0])
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId(`${interaction.id}_${GameSides[GameTheme][1]}`)
                            .setLabel(GameSides[GameTheme][1])
                            .setStyle(ButtonStyle.Primary)
                    );

                const winner_verification_message = await submit_collector.update({ embeds: [winner_verification_embed], components: [winner_verification_components], fetchReply: true });

                const winner_verification_filter = (button) => [`${interaction.id}_${GameSides[GameTheme][0]}`, `${interaction.id}_${GameSides[GameTheme][1]}`].includes(button.customId) && button.member.id === submit_collector.member.id;
                const winner_verification_collector = await winner_verification_message.awaitMessageComponent({ filter: winner_verification_filter, componentType: ComponentType.Button });

                let winning_team;
                winner_verification_collector.customId === `${interaction.id}_${GameSides[GameTheme][0]}` ? winning_team = 'coalition' : winning_team = 'breach';

                const score_verification_embed = new EmbedBuilder()
                    .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                    .setColor('Green')
                    .setTitle(`Match Code - #${code}`)
                    .setDescription(`*Please verify the score of this match by writing below this messsage. Eg - \`13-9\`!*`)
                    .setImage(screenshot)
                    .setFooter({ text: 'Senior Moderators please verify the winning team', iconURL: interaction.guild.iconURL() })
                    .setTimestamp();

                const score_verification_message = await winner_verification_collector.update({ embeds: [score_verification_embed], components: [], fetchReply: true });
                const score_verification_collector = score_verification_message.channel.createMessageCollector({ filter: (message) => /^(0|[1-9]\d*)-(0|[1-9]\d*)$/.test(message.content.trim()) && message.author.id === winner_verification_collector.member.id, max: 1 });

                score_verification_collector.on('collect', async (message) => {
                    await MatchStats.updateOne(
                        { id: code },
                        {
                            coalition: {
                                players: match.coalition.players,
                                status: winning_team === 'coalition' ? 'winner' : 'loser'
                            },
                            breach: {
                                players: match.breach.players,
                                status: winning_team === 'breach' ? 'winner' : 'loser'
                            },
                            screenshot,
                            score: message.content.trim()
                        }
                    );

                    submit_embed
                        .setColor('Green')
                        .setFooter({ text: 'Senior Moderators have verified the screenshot!', iconURL: interaction.guild.iconURL() })

                    await this.bot.utils.auditSend(Channels.SubmitScreenshotId, { embeds: [submit_embed] });
                    message.deletable ? await message.delete() : null;

                    return submit_message.deletable ? await submit_message.delete() : null;
                });
            } else {
                return submit_message.deletable ? await submit_message.delete() : null;
            };
        } catch (error) {
            console.error(error);
            return await this.bot.utils.error(interaction, error);
        };
    };
};