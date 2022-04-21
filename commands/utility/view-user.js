const { ApplicationCommandType, ApplicationCommandPermissionType, ActionRowBuilder, SelectMenuBuilder, ComponentType, Colors } = require('discord.js');
const { Owners } = require('../../config.json');
const Command = require('../../structures/Command.js');
const PlayerStats = require('../../structures/models/PlayerStats.js');
const Flags = {
    Partner: "<:partnered_server_owner:966328321405227058>", Hypesquad: "<:HypeSquad:966328352959004722>",
    BugHunterLevel1: "<:BugHunter:966328528201203782>", BugHunterLevel2: "<:BugHunterLvl2:966328541815914570>",
    HypeSquadOnlineHouse1: "<:HypeSquad_bravery:966328390141501450>", HypeSquadOnlineHouse2: "<:HypeSquad_brilliance:966328409741459546>",
    HypeSquadOnlineHouse3: "<:HypeSquad_balance:966328371233579038>", PremiumEarlySupporter: "<:early_supporter:966328433019867146>",
    CertifiedModerator: "<:Moderator:966328503974887475>", VerifiedDeveloper: "<:early_verified_developer:966328445237866546>"
};

module.exports = class ViewUser extends Command {
    constructor(...args) {
        super(...args, {
            name: 'View User Profile',
            category: 'Utility',
            type: ApplicationCommandType.User,
            permissions: [
                { id: '', type: ApplicationCommandPermissionType.Role, permission: false },
                { id: '', type: ApplicationCommandPermissionType.Role, permission: true },
                ...Owners.map(({ id }) => ({ id, type: ApplicationCommandPermissionType.User, permission: true }))
            ]
        });
    };

    async InteractionRun(interaction) {
        try {
            let userBanner = (await interaction.targetUser.fetch()).bannerURL({ size: 4096 });
            if (userBanner?.includes('a_')) {
                userBanner = userBanner.split('.');

                userBanner.pop();
                userBanner.push('gif');

                userBanner = userBanner.join('.');
            };

            let finalFlags = [];
            for (const flag of interaction.targetUser.flags.toArray()) {
                if (flag in Flags) finalFlags.push(Flags[flag]);
            };

            let isNitroUser =
                interaction.targetUser.displayAvatarURL().endsWith('.gif')
                    ? '<:nitro:966353373295165440>' : userBanner
                        ? '<:nitro:966353373295165440>' : '';

            const player = await PlayerStats.findOne({ id: interaction.targetUser.id });

            let UserEmbedComponents = new ActionRowBuilder()
                .addComponents(
                    new SelectMenuBuilder()
                        .setCustomId('ViewUser')
                        .setMaxValues(1)
                        .addOptions(
                            {
                                label: 'Overview',
                                value: 'overview',
                                default: true
                            },
                            {
                                label: 'Roles',
                                value: 'roles'
                            },
                            {
                                label: 'Avatar',
                                value: 'avatar'
                            },
                            {
                                label: 'Banner',
                                value: 'banner'
                            }
                        )
                );

            //UserEmbedComponents = SelectMenuBuilder.from(UserEmbedComponents.components[0]);
            //console.log(UserEmbedComponents);

            if (!interaction.targetUser.banner) UserEmbedComponents = new ActionRowBuilder()
                .addComponents(
                    new SelectMenuBuilder()
                        .setCustomId('ViewUser')
                        .setMaxValues(1)
                        .addOptions(
                            {
                                label: 'Overview',
                                value: 'overview',
                                default: true
                            },
                            {
                                label: 'Roles',
                                value: 'roles'
                            },
                            {
                                label: 'Avatar',
                                value: 'avatar'
                            }
                        )
                );

            const EmbedMessage = await interaction.reply({
                embeds: [
                    {
                        author: {
                            name: 'User Profile',
                            iconURL: interaction.targetUser.displayAvatarURL()
                        },
                        color: Colors.Aqua,
                        title: interaction.targetUser.tag,
                        description: `${isNitroUser} ${finalFlags.join(' ')}`,
                        thumbnail: {
                            url: interaction.targetUser.displayAvatarURL()
                        },
                        fields: [
                            { name: 'ID', value: `${interaction.targetUser.id} (${interaction.targetUser})` },
                            { name: 'Registered Name', value: player?.name || 'Unregistered', inline: true },
                            { name: 'Server Booster', value: interaction.targetMember.premiumSince ? `<t:${Math.floor(interaction.targetMember.premiumSinceTimestamp / 1000)}:D> (<t:${Math.floor(interaction.targetMember.premiumSinceTimestamp / 1000)}:R>)` : 'No', inline: true },
                            { name: 'Account Created', value: `<t:${Math.floor(interaction.targetUser.createdTimestamp / 1000)}:D> (<t:${Math.floor(interaction.targetUser.createdTimestamp / 1000)}:R>)` },
                            { name: 'Joined Server', value: `<t:${Math.floor(interaction.targetMember.joinedTimestamp / 1000)}:D> (<t:${Math.floor(interaction.targetMember.joinedTimestamp / 1000)}:R>)` },
                        ],
                        footer: {
                            text: interaction.targetUser.username,
                            iconURL: interaction.targetUser.displayAvatarURL()
                        },
                        timestamp: new Date().toISOString()
                    }
                ],
                components: [UserEmbedComponents]
            });

            const EmbedCollector = EmbedMessage.createMessageComponentCollector({ filter: ({ customId }) => customId === 'ViewUser', time: 300000, componentType: ComponentType.SelectMenu });

            EmbedCollector.on('collect', async (SelectMenu) => {
                if (SelectMenu.user.id !== interaction.user.id) return SelectMenu.reply({ content: '*You did not initiate this command!*', ephemeral: true });

                const FormatTypes = ['png', 'jpg', 'gif', 'webp'];

                switch (SelectMenu.values[0]) {
                    case 'overview':
                        UserEmbedComponents = new ActionRowBuilder()
                            .addComponents(
                                new SelectMenuBuilder()
                                    .setCustomId('ViewUser')
                                    .setMaxValues(1)
                                    .addOptions(
                                        {
                                            label: 'Overview',
                                            value: 'overview',
                                            default: true
                                        },
                                        {
                                            label: 'Roles',
                                            value: 'roles'
                                        },
                                        {
                                            label: 'Avatar',
                                            value: 'avatar'
                                        },
                                        {
                                            label: 'Banner',
                                            value: 'banner'
                                        }
                                    )
                            );

                        if (!interaction.targetUser.banner) UserEmbedComponents = new ActionRowBuilder()
                            .addComponents(
                                new SelectMenuBuilder()
                                    .setCustomId('ViewUser')
                                    .setMaxValues(1)
                                    .addOptions(
                                        {
                                            label: 'Overview',
                                            value: 'overview',
                                            default: true
                                        },
                                        {
                                            label: 'Roles',
                                            value: 'roles'
                                        },
                                        {
                                            label: 'Avatar',
                                            value: 'avatar'
                                        }
                                    )
                            );

                        SelectMenu.update({
                            embeds: [
                                {
                                    author: {
                                        name: 'User Profile',
                                        iconURL: interaction.targetUser.displayAvatarURL()
                                    },
                                    color: Colors.Aqua,
                                    title: interaction.targetUser.tag,
                                    description: `${isNitroUser} ${finalFlags.join(' ')}`,
                                    thumbnail: {
                                        url: interaction.targetUser.displayAvatarURL()
                                    },
                                    fields: [
                                        { name: 'ID', value: `${interaction.targetUser.id} (${interaction.targetUser})` },
                                        { name: 'Registered Name', value: player?.name || 'Unregistered', inline: true },
                                        { name: 'Server Booster', value: interaction.targetMember.premiumSince ? `<t:${Math.floor(interaction.targetMember.premiumSinceTimestamp / 1000)}:D> (<t:${Math.floor(interaction.targetMember.premiumSinceTimestamp / 1000)}:R>)` : 'No', inline: true },
                                        { name: 'Account Created', value: `<t:${Math.floor(interaction.targetUser.createdTimestamp / 1000)}:D> (<t:${Math.floor(interaction.targetUser.createdTimestamp / 1000)}:R>)` },
                                        { name: 'Joined Server', value: `<t:${Math.floor(interaction.targetMember.joinedTimestamp / 1000)}:D> (<t:${Math.floor(interaction.targetMember.joinedTimestamp / 1000)}:R>)` }
                                    ],
                                    footer: {
                                        text: interaction.targetUser.username,
                                        iconURL: interaction.targetUser.displayAvatarURL()
                                    },
                                    timestamp: new Date().toISOString()
                                }
                            ],
                            components: [UserEmbedComponents]
                        });
                        break;
                    case 'roles':
                        UserEmbedComponents = new ActionRowBuilder()
                            .addComponents(
                                new SelectMenuBuilder()
                                    .setCustomId('ViewUser')
                                    .setMaxValues(1)
                                    .addOptions(
                                        {
                                            label: 'Overview',
                                            value: 'overview'
                                        },
                                        {
                                            label: 'Roles',
                                            value: 'roles',
                                            default: true
                                        },
                                        {
                                            label: 'Avatar',
                                            value: 'avatar'
                                        },
                                        {
                                            label: 'Banner',
                                            value: 'banner'
                                        }
                                    )
                            );

                        if (!interaction.targetUser.banner) UserEmbedComponents = new ActionRowBuilder()
                            .addComponents(
                                new SelectMenuBuilder()
                                    .setCustomId('ViewUser')
                                    .setMaxValues(1)
                                    .addOptions(
                                        {
                                            label: 'Overview',
                                            value: 'overview'

                                        },
                                        {
                                            label: 'Roles',
                                            value: 'roles',
                                            default: true
                                        },
                                        {
                                            label: 'Avatar',
                                            value: 'avatar'
                                        }
                                    )
                            );

                        SelectMenu.update({
                            embeds: [
                                {
                                    author: {
                                        name: 'User Profile',
                                        iconURL: interaction.targetUser.displayAvatarURL()
                                    },
                                    color: Colors.Aqua,
                                    title: interaction.targetUser.tag,
                                    description: `${interaction.targetMember.roles.cache.filter((role) => role.id !== interaction.guild.id).toJSON().join(', ')}`,
                                    thumbnail: {
                                        url: interaction.targetUser.displayAvatarURL()
                                    },
                                    footer: {
                                        text: interaction.targetUser.username,
                                        iconURL: interaction.targetUser.displayAvatarURL()
                                    },
                                    timestamp: new Date().toISOString()
                                }
                            ],
                            components: [UserEmbedComponents]
                        });
                        break;
                    case 'avatar':
                        const DefaultUserAvatarURL = interaction.targetUser.displayAvatarURL({ size: 4096 });
                        const EditedUserAvatarURL = DefaultUserAvatarURL.slice(0, DefaultUserAvatarURL.lastIndexOf('.'));

                        let AvatarLinks = [];
                        for (const type of FormatTypes) AvatarLinks.push({ type, value: `[${type.toUpperCase()}](${EditedUserAvatarURL}.${type})` });

                        UserEmbedComponents = new ActionRowBuilder()
                            .addComponents(
                                new SelectMenuBuilder()
                                    .setCustomId('ViewUser')
                                    .setMaxValues(1)
                                    .addOptions(
                                        {
                                            label: 'Overview',
                                            value: 'overview'
                                        },
                                        {
                                            label: 'Roles',
                                            value: 'roles'
                                        },
                                        {
                                            label: 'Avatar',
                                            value: 'avatar',
                                            default: true
                                        },
                                        {
                                            label: 'Banner',
                                            value: 'banner'
                                        }
                                    )
                            );

                        if (!interaction.targetUser.banner) UserEmbedComponents = new ActionRowBuilder()
                            .addComponents(
                                new SelectMenuBuilder()
                                    .setCustomId('ViewUser')
                                    .setMaxValues(1)
                                    .addOptions(
                                        {
                                            label: 'Overview',
                                            value: 'overview'

                                        },
                                        {
                                            label: 'Roles',
                                            value: 'roles'
                                        },
                                        {
                                            label: 'Avatar',
                                            value: 'avatar',
                                            default: true
                                        }
                                    )
                            );

                        SelectMenu.update({
                            embeds: [
                                {
                                    author: {
                                        name: 'User Profile',
                                        iconURL: interaction.targetUser.displayAvatarURL()
                                    },
                                    color: Colors.Aqua,
                                    title: interaction.targetUser.tag,
                                    description: `${isNitroUser} ${finalFlags.join(' ')}`,
                                    thumbnail: {
                                        url: interaction.targetUser.displayAvatarURL()
                                    },
                                    fields: [
                                        { name: 'Avatars', value: AvatarLinks.map((link) => link.value).join(' - ') }
                                    ],
                                    image: {
                                        url: DefaultUserAvatarURL.endsWith('.webp') ? AvatarLinks.find((link) => link.type === 'gif') : DefaultUserAvatarURL
                                    },
                                    footer: {
                                        text: interaction.targetUser.username,
                                        iconURL: interaction.targetUser.displayAvatarURL()
                                    },
                                    timestamp: new Date().toISOString()
                                }
                            ],
                            components: [UserEmbedComponents]
                        });
                        break;
                    case 'banner':
                        const DefaultUserBannerURL = (await interaction.targetUser.fetch()).bannerURL({ size: 4096 });
                        const EditedUserBannerURL = DefaultUserBannerURL.slice(0, DefaultUserBannerURL.lastIndexOf('.'));

                        let BannerLinks = [];
                        for (const type of FormatTypes) BannerLinks.push({ type, value: `[${type.toUpperCase()}](${EditedUserBannerURL}.${type})` });

                        UserEmbedComponents = new ActionRowBuilder()
                            .addComponents(
                                new SelectMenuBuilder()
                                    .setCustomId('ViewUser')
                                    .setMaxValues(1)
                                    .addOptions(
                                        {
                                            label: 'Overview',
                                            value: 'overview'
                                        },
                                        {
                                            label: 'Roles',
                                            value: 'roles'
                                        },
                                        {
                                            label: 'Avatar',
                                            value: 'avatar'
                                        },
                                        {
                                            label: 'Banner',
                                            value: 'banner',
                                            default: true
                                        }
                                    )
                            );

                        SelectMenu.update({
                            embeds: [
                                {
                                    author: {
                                        name: 'User Profile',
                                        iconURL: interaction.targetUser.displayAvatarURL()
                                    },
                                    color: Colors.Aqua,
                                    title: interaction.targetUser.tag,
                                    description: `${isNitroUser} ${finalFlags.join(' ')}`,
                                    thumbnail: {
                                        url: interaction.targetUser.displayAvatarURL()
                                    },
                                    fields: [
                                        { name: 'Banners', value: BannerLinks.map((link) => link.value).join(' - ') }
                                    ],
                                    image: {
                                        url: DefaultUserBannerURL.endsWith('.webp') ? BannerLinks.find((link) => link.type === 'gif') : DefaultUserBannerURL
                                    },
                                    footer: {
                                        text: interaction.targetUser.username,
                                        iconURL: interaction.targetUser.displayAvatarURL()
                                    },
                                    timestamp: new Date().toISOString()
                                }
                            ],
                            components: [UserEmbedComponents]
                        });
                        break;
                };
            });

            EmbedCollector.on('end', async (_collected, reason) => {
                if (reason === 'time') {
                    UserEmbedComponents = new ActionRowBuilder()
                        .addComponents(
                            new SelectMenuBuilder()
                                .setCustomId('ViewUser')
                                .setMaxValues(1)
                                .addOptions(
                                    {
                                        label: 'Overview',
                                        value: 'overview',
                                        default: true
                                    },
                                    {
                                        label: 'Roles',
                                        value: 'roles'
                                    },
                                    {
                                        label: 'Avatar',
                                        value: 'avatar'
                                    },
                                    {
                                        label: 'Banner',
                                        value: 'banner'
                                    }
                                )
                                .setDisabled()
                        );

                    return interaction.editReply({
                        embeds: [
                            {
                                author: {
                                    name: 'User Profile',
                                    iconURL: interaction.targetUser.displayAvatarURL()
                                },
                                color: Colors.Aqua,
                                title: interaction.targetUser.tag,
                                description: `${isNitroUser} ${finalFlags.join(' ')}`,
                                thumbnail: {
                                    url: interaction.targetUser.displayAvatarURL()
                                },
                                fields: [
                                    { name: 'ID', value: `${interaction.targetUser.id} (${interaction.targetUser})` },
                                    { name: 'Registered Name', value: player?.name || 'Unregistered', inline: true },
                                    { name: 'Server Booster', value: interaction.targetMember.premiumSince ? `<t:${Math.floor(interaction.targetMember.premiumSinceTimestamp / 1000)}:D> (<t:${Math.floor(interaction.targetMember.premiumSinceTimestamp / 1000)}:R>)` : 'No', inline: true },
                                    { name: 'Account Created', value: `<t:${Math.floor(interaction.targetUser.createdTimestamp / 1000)}:D> (<t:${Math.floor(interaction.targetUser.createdTimestamp / 1000)}:R>)` },
                                    { name: 'Joined Server', value: `<t:${Math.floor(interaction.targetMember.joinedTimestamp / 1000)}:D> (<t:${Math.floor(interaction.targetMember.joinedTimestamp / 1000)}:R>)` }
                                ],
                                footer: {
                                    text: interaction.targetUser.username,
                                    iconURL: interaction.targetUser.displayAvatarURL()
                                },
                                timestamp: new Date().toISOString()
                            }
                        ],
                        components: [UserEmbedComponents]
                    });
                };
            });
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