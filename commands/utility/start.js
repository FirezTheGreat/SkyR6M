const { ApplicationCommandType, ChatInputCommandInteraction, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const Command = require('../../structures/Command.js');
const { Channels, QueueRoleIds, GameTheme } = require('../../config.json');
const { chooseGameMaps } = require('../../structures/Util.js');
const MatchStats = require('../../structures/models/MatchStats');
const Players = require('../../structures/models/Players');

module.exports = class Start extends Command {
    constructor(...args) {
        super(...args, {
            name: 'start',
            description: 'Register your match',
            category: 'Utility',
            usage: '[room-code]',
            type: ApplicationCommandType.ChatInput,
            options: [
                { name: 'code', type: ApplicationCommandOptionType.String, description: 'Enter your Room Code', required: true },
                { name: 'map', type: ApplicationCommandOptionType.String, description: 'Enter the Map to be played', required: true, choices: chooseGameMaps(GameTheme) }
            ]
        });
    };

    /**
     * @param {ChatInputCommandInteraction} interaction CommandInteraction
     * @returns Register's Match
     */

    async InteractionRun(interaction) {
        try {
            let player = await Players.findOne({ id: interaction.member.id });
            if (!player) return await interaction.reply({ content: `*You are not registered at ${interaction.guild.name}*`, ephemeral: true });

            if (!QueueRoleIds.map(({ text }) => text).includes(interaction.channelId)) return await interaction.reply({ content: '*You can start this match only in queue chats!*', ephemeral: true });
            if (!interaction.member?.voice.channel || interaction.member.voice.channel.members.size < 10) return await interaction.reply({ content: '*Cannot register match due to less players in queue!*' });

            let code = interaction.options.getString('code').toUpperCase();
            let map = interaction.options.getString('map');

            let match = await MatchStats.findOne({ id: code });

            if (!match) {
                await interaction.deferReply();

                match = await MatchStats.create({
                    id: code,
                    map,
                    host: {
                        id: interaction.member.id,
                        name: player.name
                    },
                    message_id: interaction.id
                });

                await match.save();

                setTimeout(async () => {
                    match = await MatchStats.findOne({ id: code });

                    if (!match?.allocated && !match?.invalidated) await MatchStats.deleteOne({ id: code });
                }, 43200000);
            } else {
                return await interaction.reply({ content: '*Cannot start this match, please consider rehosting!*' });
            };

            const auditLogEmbed = new EmbedBuilder()
                .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                .setColor('Green')
                .setDescription('*Match has been registered successfully!*')
                .addFields(
                    { name: 'Room ID', value: code, inline: true },
                    { name: 'Host', value: match.host.name, inline: true },
                    { name: 'Map', value: match.map, inline: true }
                )
                .setFooter({ text: `Match - #${(await MatchStats.find()).length}`, iconURL: interaction.guild.iconURL() })
                .setTimestamp();

            let candidates = [];
            let selected_candidates = [];

            for (const [id] of interaction.member.voice.channel.members) {
                let candidate = await Players.findOne({ id });

                candidates.push({ id, name: `${(await this.bot.users.fetch(id))}`, points: candidate.points.current });
            };

            for (const [index, { id, name }] of candidates.sort((a, b) => b.points - a.points).entries()) {
                if (index === 5) break;

                selected_candidates.push({ id, name });
            };

            let coalition_captain = selected_candidates[Math.floor(Math.random() * selected_candidates.length)];

            selected_candidates = selected_candidates.filter(({ id }) => id !== coalition_captain.id);

            let breach_captain = selected_candidates[Math.floor(Math.random() * selected_candidates.length)];

            const captainsEmbed = new EmbedBuilder()
                .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                .setColor('Green')
                .setDescription('*Captains have been successfully chosen by the bot*')
                .addFields(
                    { name: 'Room ID', value: code, inline: true },
                    { name: 'Coalition Captain', value: coalition_captain.name, inline: true },
                    { name: 'Breach Captain', value: breach_captain.name, inline: true },
                    { name: 'Host', value: match.host.name, inline: true },
                    { name: 'Map', value: match.map, inline: true },
                    { name: 'Time', value: new Date(match.timestamp).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }), inline: true }
                )
                .setFooter({ text: 'Leaving queue to evade being a captain will lead to a penalty', iconURL: interaction.guild.iconURL() })
                .setTimestamp();

            await interaction.editReply({ embeds: [captainsEmbed] });
            return await this.bot.utils.auditSend(Channels.RegisterLogId, { embeds: [auditLogEmbed] });
        } catch (error) {
            console.error(error);
            return await this.bot.utils.error(interaction, error);
        };
    };
};