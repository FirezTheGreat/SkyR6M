const { ApplicationCommandType, ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, EmbedBuilder, ButtonStyle, ComponentType, AttachmentBuilder } = require('discord.js');
const Command = require('../../structures/Command.js');
const Players = require('../../structures/models/Players.js');
const { QueueRoleIds, GameMaps, GameTheme } = require('../../config.json');
const path = require('path');

module.exports = class Poll extends Command {
    constructor(...args) {
        super(...args, {
            name: 'poll',
            description: 'Conduct a poll to select a map for your match',
            category: 'Utility',
            type: ApplicationCommandType.ChatInput
        });
    };

    /**
     * 
     * @param {ChatInputCommandInteraction} interaction CommandInteraction
     * @returns Poll
     */

    async InteractionRun(interaction) {
        try {
            let player = await Players.findOne({ id: interaction.member.id });
            if (!player) return await interaction.reply({ content: `*You are not registered at ${interaction.guild.name}*`, ephemeral: true });

            if (!QueueRoleIds.map(({ text }) => text).includes(interaction.channelId)) return await interaction.reply({ content: '*You can start this match only in queue chats!*', ephemeral: true });
            if (!interaction.member?.voice.channelId) return await interaction.reply({ content: '*You need to join a voice channel to conduct a poll!*', ephemeral: true });

            let mapFields = [];
            let mapComponents = [];

            this.bot.polls.set(
                interaction.member.voice.channelId,
                {
                    players: await Promise.all(interaction.member.voice.channel.members.map(async ({ id }) => ({ id, name: (await Players.findOne({ id })).name }))),
                    text_channel: interaction.channelId,
                    map: 'none',
                    highest_votes: 0,
                    total_votes: 0,
                    map_wise_votes: []
                }
            );

            for (const map of GameMaps[GameTheme]) {
                mapFields.push({ name: map, value: `0 Votes`, inline: true });
                mapComponents.push(
                    new ButtonBuilder()
                        .setCustomId(map.toLowerCase())
                        .setLabel(map)
                        .setStyle(ButtonStyle.Primary)
                );
            };

            let pollButtonsOne = new ActionRowBuilder()
                .addComponents(mapComponents.slice(0, 5));

            let pollButtonsTwo = new ActionRowBuilder()
                .addComponents(mapComponents.slice(5));

            let pollButtons = mapComponents.length > 5 ? [pollButtonsOne, pollButtonsTwo] : [pollButtonsOne];

            const pollEmbed = new EmbedBuilder()
                .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                .setTitle('Map Poll')
                .setColor('Green')
                .addFields(mapFields)
                .setFooter({ text: 'Map with the highest votes will be played', iconURL: interaction.guild.iconURL() })
                .setTimestamp();

            const pollEmbedMessage = await interaction.reply({ embeds: [pollEmbed], components: pollButtons });

            const pollCollector = pollEmbedMessage.createMessageComponentCollector({ filter: ({ customId }) => GameMaps[GameTheme].map((map) => map.toLowerCase()).includes(customId), time: 5000, componentType: ComponentType.Button });

            pollCollector.on('collect', async (button) => {
                if (!this.bot.polls.get(button.member?.voice.channelId).players.find(({ id }) => button.member.id === id)) return await button.reply({ content: '*You are not currently present in any active queue!*', ephemeral: true });

                if (GameMaps[GameTheme].map((map) => map.toLowerCase()).includes(button.customId)) {
                    let vote = this.bot.polls.get(interaction.member.voice.channelId);
                    let vote_map = null;

                    if (vote) {
                        const voterIndex = vote.map_wise_votes.findIndex(({ id }) => id === button.member.id);
                        mapFields = [];

                        if (voterIndex > -1) {
                            vote_map = vote.map_wise_votes.at(voterIndex).map;
                            vote.map_wise_votes.splice(voterIndex, 1);

                            this.bot.polls.set(interaction.member.voice.channelId, vote);
                        };

                        if (vote_map !== button.customId) {
                            vote.map_wise_votes.push({ id: button.member.id, map: button.customId });

                            this.bot.polls.set(interaction.member.voice.channelId, vote);
                        };
                    };

                    for (const map of GameMaps[GameTheme]) {
                        let map_votes = vote.map_wise_votes.filter(({ map: game_map }) => game_map === map.toLowerCase()).length;

                        mapFields.push({ name: map, value: `${map_votes} Votes`, inline: true });
                    };

                    await button.update({ embeds: [pollEmbed.setFields(mapFields)] });

                    return vote_map !== button.customId
                        ? await button.followUp({ content: `*You have successfully voted for **${this.bot.utils.capitalizeFirstLetter(button.customId)}**!*`, ephemeral: true })
                        : await button.followUp({ content: `*You have successfully abstained from voting **${this.bot.utils.capitalizeFirstLetter(button.customId)}**!*`, ephemeral: true }); s
                };
            });

            pollCollector.on('end', async () => {
                const vote = this.bot.polls.get(interaction.member?.voice.channelId);

                const selected_maps = Object.entries(vote.map_wise_votes.reduce((acc, curr) => ({
                    ...acc,
                    [curr.map]: (acc[curr.map] || 0) + 1
                }), {}))
                    .sort(([, a], [, b]) => b - a)
                    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

                const map_winner = Object.keys(selected_maps)[0];

                let description = '\n';
                let index = 1;

                for (const [map, votes] of Object.entries(selected_maps)) {
                    description += `#${index++}. **${this.bot.utils.capitalizeFirstLetter(map)} - ${votes}**\n`;
                };

                const { attachment } = new AttachmentBuilder(path.join(__dirname, '..', '..', 'assets', 'maps', 'cops', `${map_winner}.png`), `${map_winner}.png`);

                const pollResultEmbed = new EmbedBuilder()
                    .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                    .setTitle('Poll Results')
                    .setColor('Green')
                    .setThumbnail(interaction.guild.iconURL())
                    .setDescription(description)
                    .setImage(`attachment://${map_winner}.png`)
                    .setFooter({ text: `${this.bot.utils.capitalizeFirstLetter(map_winner)} will be played`, iconURL: interaction.guild.iconURL() })
                    .setTimestamp();

                await interaction.editReply({ embeds: [pollResultEmbed], components: [], files: [attachment] });
                return this.bot.polls.delete(interaction.member?.voice.channelId);
            });
        } catch (error) {
            console.error(error);
            return await this.bot.utils.error(interaction, error);
        };
    };
};