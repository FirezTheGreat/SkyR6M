const { ApplicationCommandType, ApplicationCommandPermissionType, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const Command = require('../../structures/Command.js');
const { Owners, Roles, Channels } = require('../../config.json');
const PlayerStats = require('../../structures/models/PlayerStats.js');

module.exports = class Register extends Command {
    constructor(...args) {
        super(...args, {
            name: 'register',
            description: 'Register your in-game name',
            category: 'Utility',
            usage: '[ign]',
            permissions: [
                { id: '', type: ApplicationCommandPermissionType.Role, permission: false },
                ...Owners.map(({ id }) => ({ id, type: ApplicationCommandPermissionType.User, permission: true }))
            ],
            type: ApplicationCommandType.ChatInput,
            commandOptions: [
                { name: 'ign', type: ApplicationCommandOptionType.String, description: 'Enter your Rainbow 6 Mobile IGN', required: true }
            ]
        });
    };

    async InteractionRun(interaction) {
        try {
            let ign = interaction.options.getString('ign').trim().slice(0, 25);
            let player = await PlayerStats.findOne({ id: interaction.member.id });

            if (player) return interaction.reply({ content: '*You have already registered at Sky Rainbow 6 Mobile Match Making*', ephemeral: true });

            await interaction.deferReply({ ephemeral: true });

            const members = (await PlayerStats.find({})).map(({ id, name }) => ({ id, name: name.toLowerCase(), no_case_name: name }));

            for (const splitName of ign.split(/[,\/]/g)) {
                let member = members.find(({ name }) => name.split(/[,\/]/g).includes(splitName.toLowerCase()));
                if (member && member.id !== interaction.user.id) {
                    let originalNameUser = await this.bot.users.fetch(member.id),
                        originalNameMember,
                        memberExists = true;

                    try {
                        originalNameMember = await interaction.guild.members.fetch(originalNameUser.id);
                    } catch {
                        memberExists = false;
                    };

                    const failedRegistrationEmbed = new EmbedBuilder()
                        .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                        .setColor('Red')
                        .setDescription(`*Sorry, We couldn\'t register your IGN as it is already taken by ${memberExists ? originalNameMember : originalNameUser.tag}*`)
                        .addFields(
                            { name: 'IGN', value: splitName, inline: true },
                            { name: 'Existing Player ID', value: originalNameUser.id, inline: true },
                            { name: 'Existing Player IGN', value: member.no_case_name, inline: true }
                        )
                        .setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
                        .setTimestamp();

                    return interaction.editReply({ embeds: [failedRegistrationEmbed] });
                };
            };

            const role = interaction.guild.roles.cache.get(Roles.RegisteredId);

            player = await PlayerStats.create({
                id: interaction.member.id,
                name: ign,
                rank: role.name,
                matches: 0,
                wins: 0,
                loses: 0,
                current_points: 0,
                total_points: 0,
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
                }
            });

            await player.save();

            const successfulRegistrationEmbed = new EmbedBuilder()
                .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                .setColor('Green')
                .setDescription(`*We have successfully registered you at Sky Rainbow 6 Mobile Match Making!*`)
                .addFields(
                    { name: 'Player', value: `${interaction.member}`, inline: true },
                    { name: 'Player ID', value: interaction.member.id, inline: true },
                    { name: 'IGN', value: ign, inline: true }
                )
                .setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();

            const AuditLogEmbed = new EmbedBuilder()
                .setAuthor({ name: 'Registered User', iconURL: interaction.user.displayAvatarURL() })
                .setColor('Green')
                .setDescription(`*Player has registered at Sky Rainbow 6 Mobile Match Making!*`)
                .addFields(
                    { name: 'Player', value: `${interaction.member}`, inline: true },
                    { name: 'Player ID', value: interaction.member.id, inline: true },
                    { name: 'IGN', value: ign, inline: true },
                )
                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                .setTimestamp();

            await interaction.member.roles.add(role.id);
            interaction.member.setNickname(`[${player.current_points}] ${ign}`).catch(() => null);

            interaction.editReply({ embeds: [successfulRegistrationEmbed] });
            return this.bot.utils.auditSend(Channels.RegisterLogId, AuditLogEmbed);
        } catch (error) {
            console.error(error);

            if (interaction.deferred && !interaction.replied) {
                return interaction.editReply({ content: `An Error Occurred: \`${error.message}\`!` });
            } else if (interaction.replied) {
                return interaction.followUp({ content: `An Error Occurred: \`${error.message}\`!` });
            } else {
                return interaction.reply({ content: `An Error Occurred: \`${error.message}\`!` });
            };
        };
    };
};