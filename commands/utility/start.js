const { ChatInputCommandInteraction, ApplicationCommandOptionType, EmbedBuilder, userMention } = require('discord.js');
const Command = require('../../structures/Command.js');
const { Channels, QueueRoleIds, GameTheme, GameSides } = require('../../config.json');
const { chooseGameMaps } = require('../../structures/Util.js');
const MatchStats = require('../../structures/models/MatchStats.js');
const Players = require('../../structures/models/Players.js');

module.exports = class Start extends Command {
    constructor(...args) {
        super(...args, {
            name: 'start',
            description: 'Register your match',
            category: 'Utility',
            usage: '[room-code]',
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
            if (!interaction.member?.voice.channel || interaction.member.voice.channel.members.filter((member) => !member.user.bot).size < 10) return await interaction.reply({ content: '*Cannot register match due to less players in queue!*' });

            let code = interaction.options.getString('code').replace(/ .*/, '').toUpperCase();
            let map = interaction.options.getString('map');

            let match = await MatchStats.findOne({ id: code });
            if (match) return await interaction.reply({ content: '*Cannot start this match, please consider rehosting!*' });

            await interaction.deferReply();

            let candidates = [];
            let sorted_candidates = [];

            for (const [id] of interaction.member.voice.channel.members) {
                let candidate = await Players.findOne({ id });

                candidates.push({ id, name: userMention(id), points: candidate.points.current });
            };

            for (const [index, { id, name }] of candidates.sort((a, b) => b.points - a.points).entries()) {
                if (index === 10) break;

                sorted_candidates.push({ id, name, kills: 0, deaths: 0, points: 0 });
            };

            match = await MatchStats.create({
                id: code,
                map,
                coalition: {
                    players: sorted_candidates.filter((_, index) => index % 2 === 0)
                },
                breach: {
                    players: sorted_candidates.filter((_, index) => index % 2 === 1)
                },
                host: {
                    id: interaction.member.id,
                    name: player.name
                }
            });

            await match.save();

            setTimeout(async () => {
                match = await MatchStats.findOne({ id: code });

                if (!match.allocated && !match.invalidated) await MatchStats.deleteOne({ id: code });
            }, 43200000);

            const teamsEmbed = new EmbedBuilder()
                .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                .setColor('Green')
                .setDescription('*Teams have been successfully chosen by the bot*')
                .addFields(
                    { name: 'Room ID', value: match.id, inline: true },
                    { name: GameSides[GameTheme][0], value: match.coalition.players.map((player, index) => index === 0 ? `${player.name} (C)` : player.name).join('\n'), inline: true },
                    { name: GameSides[GameTheme][1], value: match.breach.players.map((player, index) => index === 0 ? `${player.name} (C)` : player.name).join('\n'), inline: true },
                    { name: 'Host', value: match.host.name, inline: true },
                    { name: 'Map', value: match.map, inline: true },
                    { name: 'Time', value: new Date(match.timestamp).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }), inline: true }
                )
                .setFooter({ text: 'Leaving queue to evade being a captain will lead to a penalty', iconURL: interaction.guild.iconURL() })
                .setTimestamp();

            const auditLogEmbed = new EmbedBuilder()
                .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                .setColor('Green')
                .setDescription('*Match has been registered successfully!*')
                .addFields(
                    { name: 'Room ID', value: match.id, inline: true },
                    { name: 'Host', value: match.host.name, inline: true },
                    { name: 'Map', value: match.map, inline: true }
                )
                .setFooter({ text: `Match - #${(await MatchStats.find()).length}`, iconURL: interaction.guild.iconURL() })
                .setTimestamp();

            await interaction.editReply({ embeds: [teamsEmbed] });
            return await this.bot.utils.auditSend(Channels.RegisterLogId, { embeds: [auditLogEmbed] });
        } catch (error) {
            console.error(error);
            return await this.bot.utils.error(interaction, error);
        };
    };
};