const { ApplicationCommandOptionType, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder } = require('discord.js');
const Command = require('../../structures/Command.js');
const Players = require('../../structures/models/Players.js');
const { Roles, Channels } = require('../../config.json');
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
            const member = interaction.options.getMember('player');

            if (!member) return await interaction.reply({ content: '*Player does not exist!*', ephemeral: true });

            let player = await Players.findOne({ id: member.id });

            if (sub_command === 'register') {
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
                        total_kills: 0,
                        total_deaths: 0,
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
            } else {
                // Force Fix Code
            };
        } catch (error) {
            console.error(error);
            return await this.bot.utils.error(interaction, error);
        };
    };
};