const { ApplicationCommandType, ApplicationCommandPermissionType, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const Command = require('../../structures/Command.js');
const { Channels, Owners } = require('../../config.json');
const PlayerStats = require('../../structures/models/PlayerStats.js');

module.exports = class Rename extends Command {
    constructor(...args) {
        super(...args, {
            name: 'rename',
            description: 'Rename your in-game name',
            category: 'Utility',
            usage: '[ign]',
            permissions: [
                { id: '', type: ApplicationCommandPermissionType.Role, permission: false },
                { id: '', type: ApplicationCommandPermissionType.Role, permission: true },
                ...Owners.map(({ id }) => ({ id, type: ApplicationCommandPermissionType.User, permission: true }))
            ],
            type: ApplicationCommandType.ChatInput,
            commandOptions: [
                { name: 'ign', type: ApplicationCommandOptionType.String, description: 'Rename your Rainbow 6 Mobile IGN', required: true }
            ]
        });
    };

    async InteractionRun(interaction) {
        try {
            let ign = interaction.options.getString('ign').trim().slice(0, 25);
            let player = await PlayerStats.findOne({ id: interaction.member.id });

            if (!player) return interaction.reply({ content: '*You are not registered at Sky Rainbow 6 Mobile Match Making*', ephemeral: true });

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
                        .setDescription(`*Sorry, We couldn\'t rename your IGN as it is already taken by ${memberExists ? originalNameMember : originalNameUser.tag}*`)
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

            await PlayerStats.updateOne(
                {
                    id: interaction.member.id
                },
                {
                    name: ign
                }
            );

            const successfulRegistrationEmbed = new EmbedBuilder()
                .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                .setColor('Green')
                .setDescription(`*We have successfully renamed your IGN at Sky Rainbow 6 Mobile Match Making!*`)
                .addFields(
                    { name: 'Player', value: `${interaction.member}`, inline: true },
                    { name: 'Previous IGN', value: player.name, inline: true },
                    { name: 'New IGN', value: ign, inline: true },
                )
                .setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();

            const AuditLogEmbed = new EmbedBuilder()
                .setAuthor({ name: 'Renamed IGN', iconURL: interaction.user.displayAvatarURL() })
                .setColor('Green')
                .addFields(
                    { name: 'Player', value: `${interaction.member}`, inline: true },
                    { name: 'Previous IGN', value: player.name, inline: true },
                    { name: 'New IGN', value: ign, inline: true },
                )
                .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                .setTimestamp();

            interaction.member.setNickname(`[${player.current_points}] ${ign}`).catch(() => null);

            interaction.editReply({ embeds: [successfulRegistrationEmbed] });
            return this.bot.utils.auditSend(Channels.AuditLogId, AuditLogEmbed);
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