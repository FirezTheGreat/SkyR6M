const { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder, ChatInputCommandInteraction } = require('discord.js');
const Command = require('../../structures/Command.js');
const { Roles, Channels } = require('../../config.json');
const PlayerStats = require('../../structures/models/PlayerStats.js');

module.exports = class Register extends Command {
    constructor(...args) {
        super(...args, {
            name: 'register',
            description: 'Register your in-game name',
            category: 'Utility',
            usage: '[ign]',
            type: ApplicationCommandType.ChatInput,
            options: [
                { name: 'ign', type: ApplicationCommandOptionType.String, description: 'Enter your Rainbow 6 Mobile IGN', required: true }
            ]
        });
    };

    /**
     * 
     * @param {ChatInputCommandInteraction} interaction CommandInteraction
     * @returns Register's User
     */

    async InteractionRun(interaction) {
        try {
            let ign = interaction.options.getString('ign').trim().slice(0, 25);
            let player = await PlayerStats.findOne({ id: interaction.member.id });

            if (player) return await interaction.reply({ content: `*You have already registered at ${interaction.guild.name}*`, ephemeral: true });

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
                        .addFields([
                            { name: 'IGN', value: splitName, inline: true },
                            { name: 'Existing Player ID', value: originalNameUser.id, inline: true },
                            { name: 'Existing Player IGN', value: member.no_case_name, inline: true }
                        ])
                        .setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
                        .setTimestamp();

                    return await interaction.editReply({ embeds: [failedRegistrationEmbed] });
                };
            };

            const role = interaction.guild.roles.cache.get(Roles.RegisteredId);

            player = await PlayerStats.create({
                id: interaction.member.id,
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
                .setDescription(`*We have successfully registered you at ${interaction.guild.name}!*`)
                .addFields([
                    { name: 'Player', value: `${interaction.member}`, inline: true },
                    { name: 'Player ID', value: interaction.member.id, inline: true },
                    { name: 'IGN', value: ign, inline: true }
                ])
                .setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();

            const AuditLogEmbed = new EmbedBuilder()
                .setAuthor({ name: 'Registered User', iconURL: interaction.user.displayAvatarURL() })
                .setColor('Green')
                .setDescription(`*Player has registered at ${interaction.guild.name}!*`)
                .addFields([
                    { name: 'Player', value: `${interaction.member}`, inline: true },
                    { name: 'Player ID', value: interaction.member.id, inline: true },
                    { name: 'IGN', value: ign, inline: true },
                ])
                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                .setTimestamp();

            if (interaction.member.manageable) {
                await interaction.member.roles.add(role.id);
                await interaction.member.setNickname(`[${player.points.current}] ${ign}`);
            } else {
                await interaction.followUp({ content: `*Couldn't add registered role to you or change your nickname, please DM a moderator regarding it.*` });
            };

            await interaction.editReply({ embeds: [successfulRegistrationEmbed] });
            return this.bot.utils.auditSend(Channels.RegisterLogId, { embeds: [AuditLogEmbed] });
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