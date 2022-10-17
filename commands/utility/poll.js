const { ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, EmbedBuilder, ButtonStyle, ComponentType, AttachmentBuilder, userMention } = require('discord.js');
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
            let channelId = interaction.member.voice.channelId;

            this.bot.polls.set(
                channelId,
                {
                    players: interaction.member.voice.channel.members.map(({ id }) => ({ id })),
                    text_channel: interaction.channelId,
                    map: 'none',
                    highest_votes: 0,
                    total_votes: 0,
                    map_wise_votes: [],
                    maps_selected: []
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

            let pollButtonsOne = new ActionRowBuilder().addComponents(mapComponents.slice(0, 5));
            let pollButtonsTwo = new ActionRowBuilder().addComponents(mapComponents.slice(5));

            let pollButtons = mapComponents.length > 5 ? [pollButtonsOne, pollButtonsTwo] : [pollButtonsOne];

            const pollEmbed = new EmbedBuilder()
                .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                .setTitle('Poll')
                .setColor('Green')
                .addFields(mapFields)
                .setFooter({ text: 'Map with the highest votes will be played', iconURL: interaction.guild.iconURL() })
                .setTimestamp();

            const pollEmbedMessage = await interaction.reply({ embeds: [pollEmbed], components: pollButtons });

            const pollCollector = pollEmbedMessage.createMessageComponentCollector({ filter: ({ customId }) => GameMaps[GameTheme].map((map) => map.toLowerCase()).includes(customId), time: 60000, componentType: ComponentType.Button });

            pollCollector.on('collect', async (button) => {
                if (!this.bot.polls.has(button.member?.voice.channelId) || !this.bot.polls.get(channelId).players.some(({ id }) => button.member.id === id)) return await button.reply({ content: '*You are not currently present in any active queue!*', ephemeral: true });

                if (GameMaps[GameTheme].map((map) => map.toLowerCase()).includes(button.customId)) {
                    let vote = this.bot.polls.get(channelId);
                    let vote_map = null;

                    if (vote) {
                        const voterIndex = vote.map_wise_votes.findIndex(({ id }) => id === button.member.id);
                        mapFields = [];

                        if (voterIndex > -1) {
                            vote_map = vote.map_wise_votes.at(voterIndex).map;
                            vote.map_wise_votes.splice(voterIndex, 1);

                            this.bot.polls.set(channelId, vote);
                        };

                        if (vote_map !== button.customId) {
                            vote.map_wise_votes.push({ id: button.member.id, map: button.customId });

                            this.bot.polls.set(channelId, vote);
                        };
                    };

                    for (const map of GameMaps[GameTheme]) {
                        let map_votes = vote.map_wise_votes.filter(({ map: game_map }) => game_map === map.toLowerCase()).length;

                        mapFields.push({ name: map, value: `${map_votes} Votes`, inline: true });
                    };

                    await button.update({ embeds: [pollEmbed.setFields(mapFields)] });

                    return vote_map !== button.customId
                        ? await button.followUp({ content: `*You have successfully voted for **${this.bot.utils.capitalizeFirstLetter(button.customId)}**!*`, ephemeral: true })
                        : await button.followUp({ content: `*You have successfully abstained from voting **${this.bot.utils.capitalizeFirstLetter(button.customId)}**!*`, ephemeral: true });
                };
            });

            pollCollector.on('end', async (collected) => {
                if (collected.size) {
                    const vote = this.bot.polls.get(channelId);

                    if (vote) {
                        const selected_votes = vote.map_wise_votes.reduce((acc, { id, map }) => ({
                            ...acc,
                            [map]: acc[map] ? [...acc[map], { id }] : [{ id }]
                        }), {});


                        for (const [map, votes] of Object.entries(selected_votes)) {
                            vote.maps_selected.push({ map, votes: votes.length, voters: votes.map(({ id }) => id) });
                        };

                        const sorted_maps = vote.maps_selected.sort((first_map, second_map) => second_map.votes - first_map.votes);

                        let description = '\n';
                        let index = 1;

                        for (const [, vote] of Object.entries(sorted_maps)) {
                            description += `#${index++}. **${this.bot.utils.capitalizeFirstLetter(vote.map)} - ${vote.voters.map((id) => userMention(id))} - (${vote.votes})**\n`;
                        };

                        const { attachment } = new AttachmentBuilder(path.join(__dirname, '..', '..', 'assets', 'maps', 'cops', `${sorted_maps.at(0).map}.png`), `${sorted_maps.at(0).map}.png`);

                        const pollButtonResult = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId(sorted_maps.at(0).map)
                                    .setLabel(this.bot.utils.capitalizeFirstLetter(sorted_maps.at(0).map))
                                    .setStyle(ButtonStyle.Success)
                            );

                        const pollResultEmbed = new EmbedBuilder()
                            .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                            .setTitle('Poll Results')
                            .setColor('Green')
                            .setDescription(description)
                            .setImage(`attachment://${sorted_maps.at(0).map}.png`)
                            .setFooter({ text: `Map - ${this.bot.utils.capitalizeFirstLetter(sorted_maps.at(0).map)} has been chosen.`, iconURL: interaction.guild.iconURL() })
                            .setTimestamp();

                        await interaction.editReply({ embeds: [pollResultEmbed], components: [pollButtonResult], files: [attachment] });
                        return this.bot.polls.delete(channelId);
                    };
                } else {
                    const pollResultEmbed = new EmbedBuilder()
                        .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                        .setTitle('Poll Results')
                        .setColor('Red')
                        .setThumbnail(interaction.guild.iconURL())
                        .setDescription('*Failed to select a map.*')
                        .setFooter({ text: `Failed to choose a map.`, iconURL: interaction.guild.iconURL() })
                        .setTimestamp();

                    await interaction.editReply({ embeds: [pollResultEmbed], components: [] });
                    return this.bot.polls.delete(interaction.member?.voice.channelId);
                };
            });
        } catch (error) {
            console.error(error);
            return await this.bot.utils.error(interaction, error);
        };
    };
};