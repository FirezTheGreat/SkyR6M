const { ApplicationCommandOptionType, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, userMention, ApplicationCommandType } = require('discord.js');
const Command = require('../../structures/Command.js');
const Players = require('../../structures/models/Players.js');
const MatchStats = require('../../structures/models/MatchStats.js');
const { Roles, Channels, GameSides, GameTheme } = require('../../config.json');
const sub_commands = [
    {
        name: 'register', type: ApplicationCommandOptionType.Subcommand, description: 'Force Register Player', options: [
            { name: 'player', type: ApplicationCommandOptionType.User, description: 'Player to Force Register', required: true },
            { name: 'ign', type: ApplicationCommandOptionType.String, description: 'IGN of Player', required: true }
        ]
    },
    {
        name: 'rename', type: ApplicationCommandOptionType.Subcommand, description: 'Force Rename Player', options: [
            { name: 'player', type: ApplicationCommandOptionType.User, description: 'Player to Force Register', required: true },
            { name: 'ign', type: ApplicationCommandOptionType.String, description: 'IGN of Player', required: true }]
    },
    {
        name: 'replace', type: ApplicationCommandOptionType.SubcommandGroup, description: 'Replace players or team with substitute(s)', options: [
            {
                name: 'team', type: ApplicationCommandOptionType.Subcommand, description: 'Replace a team with another', options: [

                ]
            },
            {
                name: 'players', type: ApplicationCommandOptionType.Subcommand, description: 'Replace a player(s) with another', options: [
                    { name: 'code', type: ApplicationCommandOptionType.String, description: 'Match Code', required: true },
                    { name: 'previous', type: ApplicationCommandOptionType.User, description: 'Original Player to Replace', required: true },
                    { name: 'current', type: ApplicationCommandOptionType.User, description: 'Replaced Player', required: true }
                ]
            }
        ]
    },
    {
        name: 'fix', type: ApplicationCommandOptionType.Subcommand, description: 'Force Fix Player', options: [
            {
                name: 'category', type: ApplicationCommandOptionType.String, description: 'Fix Win, Lose or Points of the Player', required: true, choices:
                    [
                        { name: 'points', value: 'points' },
                        { name: 'wins', value: 'wins' },
                        { name: 'loses', value: 'loses' }
                    ]
            },
            {
                name: 'option', type: ApplicationCommandOptionType.String, description: 'Add, Remove or Reset Points, Wins, Loses of the Player', required: true, choices:
                    [
                        { name: 'add', value: 'add' },
                        { name: 'remove', value: 'remove' },
                        { name: 'reset', value: 'reset' }
                    ]
            },
            { name: 'player', type: ApplicationCommandOptionType.User, description: 'Player to Force Register', required: true },
            { name: 'amount', type: ApplicationCommandOptionType.Integer, description: 'Amount to Add, Remove or Reset to the Player', required: true, minValue: 0 }
        ]
    }
];

module.exports = class Force extends Command {
    constructor(...args) {
        super(...args, {
            name: 'force',
            description: 'Force Commands',
            category: 'Moderation',
            usage: '[register | rename | fix]',
            client_permissions: [PermissionFlagsBits.ManageRoles, PermissionFlagsBits.ManageNicknames],
            user_permissions: [PermissionFlagsBits.Administrator],
            sub_commands,
            options: sub_commands.map(({ name, type, description, required, options }) => ({ name, type, description, required, options }))
        });
    };

    /**
     * 
     * @param {ChatInputCommandInteraction} interaction CommandInteraction
     * @returns Force Manages Player
     */

    async InteractionRun(interaction) {
        try {
            const sub_command = interaction.options._subcommand;

            if (sub_command === 'register') {
                const member = interaction.options.getMember('player');
                if (!member) return await interaction.reply({ content: '*Player does not exist!*', ephemeral: true });

                let player = await Players.findOne({ id: member.id });
                if (player) return await interaction.reply({ content: `*${member} has already registered at ${interaction.guild.name}*`, ephemeral: true });

                await interaction.deferReply({ ephemeral: true });

                const members = (await Players.find({})).map(({ id, name }) => ({ id, name: name.toLowerCase(), no_case_name: name }));
                const ign = interaction.options.getString('ign').trim().slice(0, 25);

                for (const split_name of ign.split(/[,\/]/g)) {
                    let member = members.find(({ name }) => name.split(/[,\/]/g).includes(split_name.toLowerCase()));
                    if (member && member.id !== interaction.user.id) {
                        let original_name_user = await this.bot.users.fetch(member.id),
                            original_name_member,
                            member_exists = true;

                        try {
                            original_name_member = await interaction.guild.members.fetch(original_name_user.id);
                        } catch {
                            member_exists = false;
                        };

                        const failedRegistrationEmbed = new EmbedBuilder()
                            .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                            .setColor('Red')
                            .setDescription(`*Sorry, We couldn\'t register ${member}\'s IGN as it is already taken by ${member_exists ? original_name_member : original_name_user.tag}*`)
                            .addFields([
                                { name: 'IGN', value: split_name, inline: true },
                                { name: 'Existing Player ID', value: original_name_user.id, inline: true },
                                { name: 'Existing Player IGN', value: member.no_case_name, inline: true }
                            ])
                            .setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
                            .setTimestamp();

                        return await interaction.editReply({ embeds: [failedRegistrationEmbed] });
                    };
                };

                const role = interaction.guild.roles.cache.get(Roles.RegisteredId);

                player = await Players.create({
                    id: member.id,
                    name: ign,
                    rank: role.name,
                    points: {
                        current: 0,
                        total: 0
                    },
                    statistics: {
                        kills: 0,
                        deaths: 0,
                        wins: 0,
                        loses: 0,
                        matches: 0
                    },
                    penalties: {
                        count: 0,
                        events: []
                    },
                    exclusive: {
                        subscribed: false,
                        queue_id: '',
                        cooldown: false,
                        cooldown_time: 0,
                        subscriptions: []
                    },
                    tickets: [],
                    pings: {
                        total_pings: 0,
                        ping_interval: 0,
                        daily_pings: 0,
                        daily_substitute_cooldown: 0
                    },
                    logs: {
                        matches: [],
                        penalties: []
                    },
                    previous_players: [],
                    achievements: [],
                    _roles: [Roles.RegisteredId]
                });

                await player.save();

                const successfulRegistrationEmbed = new EmbedBuilder()
                    .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                    .setColor('Green')
                    .setDescription(`*We have successfully registered ${member} at ${interaction.guild.name}!*`)
                    .addFields([
                        { name: 'Player', value: `${member}`, inline: true },
                        { name: 'Player ID', value: member.id, inline: true },
                        { name: 'IGN', value: ign, inline: true }
                    ])
                    .setFooter({ text: member.user.username, iconURL: member.user.displayAvatarURL() })
                    .setTimestamp();

                const auditLogEmbed = new EmbedBuilder()
                    .setAuthor({ name: 'Registered User', iconURL: member.user.displayAvatarURL() })
                    .setColor('Green')
                    .setDescription(`*Player has registered at ${interaction.guild.name}!*`)
                    .addFields([
                        { name: 'Player', value: `${member}`, inline: true },
                        { name: 'Player ID', value: member.id, inline: true },
                        { name: 'IGN', value: ign, inline: true },
                    ])
                    .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                    .setTimestamp();

                if (member.manageable) {
                    await member.roles.add(role.id);
                    await member.roles.member.setNickname(`[${player.points.current}] ${ign}`);
                } else {
                    await interaction.followUp({ content: `*Couldn't add registered role to ${member} or change ${member}\'s nickname, please DM Bot Owner regarding it.*` });
                };

                await interaction.editReply({ embeds: [successfulRegistrationEmbed] });
                return await this.bot.utils.auditSend(Channels.RegisterLogId, { embeds: [auditLogEmbed] });
            } else if (sub_command === 'rename') {
                const member = interaction.options.getMember('player');
                if (!member) return await interaction.reply({ content: '*Player does not exist!*', ephemeral: true });

                let player = await Players.findOne({ id: member.id });
                if (!player) return await interaction.reply({ content: `*${member} is not registered at ${interaction.guild.name}*`, ephemeral: true });

                await interaction.deferReply({ ephemeral: true });

                const members = (await Players.find({})).map(({ id, name }) => ({ id, name: name.toLowerCase(), no_case_name: name }));
                const ign = interaction.options.getString('ign').trim().slice(0, 25);

                for (const split_name of ign.split(/[,\/]/g)) {
                    let member = members.find(({ name }) => name.split(/[,\/]/g).includes(split_name.toLowerCase()));
                    if (member && member.id !== interaction.user.id) {
                        let original_name_user = await this.bot.users.fetch(member.id),
                            original_name_member,
                            member_exists = true;

                        try {
                            original_name_member = await interaction.guild.members.fetch(original_name_user.id);
                        } catch {
                            member_exists = false;
                        };

                        const failedRegistrationEmbed = new EmbedBuilder()
                            .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                            .setColor('Red')
                            .setDescription(`*Sorry, We couldn\'t rename ${member}\'s IGN as it is already taken by ${member_exists ? original_name_member : original_name_user.tag}*`)
                            .addFields([
                                { name: 'IGN', value: split_name, inline: true },
                                { name: 'Existing Player ID', value: original_name_user.id, inline: true },
                                { name: 'Existing Player IGN', value: member.no_case_name, inline: true }
                            ])
                            .setFooter({ text: member.user.username, iconURL: member.user.displayAvatarURL() })
                            .setTimestamp();

                        return await interaction.editReply({ embeds: [failedRegistrationEmbed] });
                    };
                };

                await Players.updateOne(
                    {
                        id: member.id
                    },
                    {
                        name: ign
                    }
                );

                const successfulRegistrationEmbed = new EmbedBuilder()
                    .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                    .setColor('Green')
                    .setDescription(`*We have successfully renamed ${member}\'s IGN at ${interaction.guild.name}!*`)
                    .addFields([
                        { name: 'Player', value: `${member}`, inline: true },
                        { name: 'Previous IGN', value: player.name, inline: true },
                        { name: 'New IGN', value: ign, inline: true },
                    ])
                    .setFooter({ text: member.user.username, iconURL: member.user.displayAvatarURL() })
                    .setTimestamp();

                const auditLogEmbed = new EmbedBuilder()
                    .setAuthor({ name: 'Renamed IGN', iconURL: member.user.displayAvatarURL() })
                    .setColor('Green')
                    .addFields([
                        { name: 'Player', value: `${member}`, inline: true },
                        { name: 'Previous IGN', value: player.name, inline: true },
                        { name: 'New IGN', value: ign, inline: true },
                    ])
                    .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                    .setTimestamp();

                if (member.manageable) {
                    await member.roles.member.setNickname(`[${player.points.current}] ${ign}`);
                } else {
                    await interaction.followUp({ content: `*Your new IGN has been updated to our database but failed to rename your IGN on discord, please DM a moderator regarding it.*` });
                };

                await interaction.editReply({ embeds: [successfulRegistrationEmbed] });
                return await this.bot.utils.auditSend(Channels.SkyLogId, { embeds: [auditLogEmbed] });
            } else if (sub_command === 'players') {
                const code = interaction.options.getString('code').toUpperCase();

                let match = await MatchStats.findOne({ id: code });
                if (!match) return await interaction.reply({ content: '*Match with this room code is not registered!*', ephemeral: true });

                const original_member = interaction.options.getMember('previous');
                if (!original_member) return await interaction.reply({ content: '*Previous Player does not exist!*', ephemeral: true });

                const updated_member = interaction.options.getMember('current');
                if (!updated_member) return await interaction.reply({ content: '*Current Player does not exist!*', ephemeral: true });

                let original_player = await Players.findOne({ id: original_member.id });
                if (!original_player) return await interaction.reply({ content: `*${original_member} is not registered at ${interaction.guild.name}*`, ephemeral: true });

                let updated_player = await Players.findOne({ id: updated_member.id });
                if (!updated_player) return await interaction.reply({ content: `*${updated_member} is not registered at ${interaction.guild.name}*`, ephemeral: true });

                await interaction.deferReply();

                let original_team = null;
                let updated_team = null;

                if (match.coalition.players.some(({ id }) => id === original_member.id)) original_team = 'coalition';
                else if (match.breach.players.some(({ id }) => id === original_member.id)) original_team = 'breach';

                if (match.coalition.players.some(({ id }) => id === updated_member.id)) updated_team = 'coalition';
                else if (match.breach.players.some(({ id }) => id === original_member.id)) updated_team = 'breach';

                if (!original_team) return await interaction.editReply({ content: '*Previous Player cannot be replaced as they don\'t belong to any team!*' });
                if (original_team === updated_team) return await interaction.editReply({ content: '*Previous Player and Current Player cannot be from the same team!*' });

                const originalPlayerIndex = match[original_team].players.findIndex(({ id }) => id === original_member.id);
                match[original_team].players[originalPlayerIndex] = { id: updated_member.id, name: userMention(updated_member.id), kills: 0, deaths: 0, points: 0 };

                if (updated_team) {
                    const updatedPlayerIndex = match[updated_team].players.findIndex(({ id }) => id === updated_member.id);
                    match[updated_team].players[updatedPlayerIndex] = { id: original_member.id, name: userMention(original_member.id), kills: 0, deaths: 0, points: 0 };
                };

                match = await MatchStats.findOneAndUpdate(
                    {
                        id: code
                    },
                    {
                        coalition: {
                            players: match[original_team].players,
                            status: match.coalition.status
                        },
                        breach: {
                            players: match[updated_team].players,
                            status: match.breach.status
                        }
                    },
                    {
                        new: true
                    }
                );

                const embedMessage = await interaction.guild.channels.cache.get(Channels.ScreenshotVerificationId).messages.fetch(match.message_id);

                embedMessage.embeds[0].fields = [
                    { name: GameSides[GameTheme][0], value: match.coalition.players.map((player, index) => index === 0 ? `${player.name} (C)` : player.name).join('\n'), inline: true },
                    { name: GameSides[GameTheme][1], value: match.breach.players.map((player, index) => index === 0 ? `${player.name} (C)` : player.name).join('\n'), inline: true },
                    { name: 'Host', value: match.host.name, inline: true }
                ];

                const replace_embed = new EmbedBuilder()
                    .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                    .setColor('Green')
                    .setDescription(`*Player(s) replaced successfully!*`)
                    .addFields([
                        { name: 'Previous Player', value: `${original_member}`, inline: true },
                        { name: 'Current Player', value: `${updated_member}`, inline: true },
                        { name: 'Match Code', value: match.id, inline: true }
                    ])
                    .setFooter({ text: `Moderator - ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
                    .setTimestamp();

                await embedMessage.edit({ embeds: [embedMessage] });
                return await interaction.editReply({ embeds: [replace_embed] });
            } else if (sub_command === 'team') {

            } else {
                // Force Fix Code
            };
        } catch (error) {
            console.error(error);
            return await this.bot.utils.error(interaction, error);
        };
    };
};