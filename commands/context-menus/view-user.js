const { ApplicationCommandType, ActionRowBuilder, SelectMenuBuilder, ComponentType, Colors, SelectMenuOptionBuilder, ActivityType } = require('discord.js');
const Command = require('../../structures/Command.js');
const PlayerStats = require('../../structures/models/PlayerStats.js');
const Flags = {
    Partner: "<:partnered_server_owner:966328321405227058>", Hypesquad: "<:HypeSquad:966328352959004722>",
    BugHunterLevel1: "<:BugHunter:966328528201203782>", BugHunterLevel2: "<:BugHunterLvl2:966328541815914570>",
    HypeSquadOnlineHouse1: "<:HypeSquad_bravery:966328390141501450>", HypeSquadOnlineHouse2: "<:HypeSquad_brilliance:966328409741459546>",
    HypeSquadOnlineHouse3: "<:HypeSquad_balance:966328371233579038>", PremiumEarlySupporter: "<:early_supporter:966328433019867146>",
    CertifiedModerator: "<:Moderator:966328503974887475>", VerifiedDeveloper: "<:early_verified_developer:966328445237866546>",
    NitroUser: "<:nitro:966353373295165440>"
};

module.exports = class ViewUser extends Command {
    constructor(...args) {
        super(...args, {
            name: 'View User Profile',
            category: 'contextMenus',
            type: ApplicationCommandType.User
        });
    };

    async InteractionRun(interaction) {
        try {
            if (!interaction.targetMember) return interaction.reply({ content: '*User has left the server.*', ephemeral: true });

            let userBanner = (await interaction.targetUser.fetch()).bannerURL({ size: 4096 });
            if (userBanner?.includes('a_')) {
                userBanner = userBanner.split('.');

                userBanner.pop();
                userBanner.push('gif');

                userBanner = userBanner.join('.');
            };

            const Badges = [];
            for (const flag of interaction.targetUser.flags.toArray()) {
                if (flag in Flags) Badges.push(Flags[flag]);
            };

            const nitroUserAvatar =
                interaction.targetUser.displayAvatarURL().endsWith('.gif')
                    ? Flags.NitroUser : userBanner
                        ? Flags.NitroUser : interaction.targetMember.premiumSince
                            ? Flags.NitroUser : new Set(interaction.targetUser.discriminator).size === 1
                                ? Flags.NitroUser : '';

            const player = await PlayerStats.findOne({ id: interaction.targetUser.id });
            const userEmbedOptions = [
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
            ];

            interaction.targetUser.banner ? userEmbedOptions.push({ label: 'Banner', value: 'banner' }) : null;

            interaction.targetMember.presence?.activities?.some(({ type }) => [ActivityType.Listening, ActivityType.Playing, ActivityType.Streaming, ActivityType.Watching].includes(type))
                ? userEmbedOptions.push({ label: 'Activity', value: 'activity' })
                : null

            let userEmbedComponents = new ActionRowBuilder()
                .addComponents([
                    new SelectMenuBuilder()
                        .setCustomId('ViewUser')
                        .setMaxValues(1)
                        .addOptions(userEmbedOptions)
                ]);

            const fixedEmbedComponents = userEmbedComponents;

            const EmbedMessage = await interaction.reply({
                embeds: [
                    {
                        author: {
                            name: 'User Profile',
                            iconURL: interaction.targetUser.displayAvatarURL()
                        },
                        color: Colors.Aqua,
                        title: interaction.targetUser.tag,
                        description: `${nitroUserAvatar} ${Badges.join(' ')}`.trim(),
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
                components: [userEmbedComponents]
            });

            const EmbedCollector = EmbedMessage.createMessageComponentCollector({ filter: ({ customId }) => customId === 'ViewUser', time: 300000, componentType: ComponentType.SelectMenu });

            EmbedCollector.on('collect', async (selectMenu) => {
                if (selectMenu.user.id !== interaction.user.id) return await selectMenu.reply({ content: '*You did not initiate this command!*', ephemeral: true });

                const FormatTypes = ['png', 'jpg', 'gif', 'webp'];
                const selectMenuOptions = [];

                for (const { data: { label, value } } of fixedEmbedComponents.components[0].options) {
                    const SelectMenuOption = {
                        label,
                        value,
                        default: value === selectMenu.values[0] ? true : false
                    };

                    selectMenuOptions.push(SelectMenuOption);
                };

                userEmbedComponents = new ActionRowBuilder()
                    .addComponents([
                        SelectMenuBuilder.from(fixedEmbedComponents.components[0]).setOptions(selectMenuOptions)
                    ]);

                switch (selectMenu.values[0]) {
                    case 'overview':
                        await selectMenu.update({
                            embeds: [
                                {
                                    author: {
                                        name: 'User Profile',
                                        iconURL: interaction.targetUser.displayAvatarURL()
                                    },
                                    color: Colors.Aqua,
                                    title: interaction.targetUser.tag,
                                    description: `${nitroUserAvatar} ${Badges.join(' ')}`,
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
                            components: [userEmbedComponents]
                        });
                        break;
                    case 'roles':
                        await selectMenu.update({
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
                            components: [userEmbedComponents]
                        });
                        break;
                    case 'avatar':
                        const DefaultUserAvatarURL = interaction.targetUser.displayAvatarURL({ size: 4096 });
                        const EditedUserAvatarURL = DefaultUserAvatarURL.slice(0, DefaultUserAvatarURL.lastIndexOf('.'));

                        let AvatarLinks = [];
                        for (const type of FormatTypes) AvatarLinks.push({ type, value: `[${type.toUpperCase()}](${EditedUserAvatarURL}.${type})` });

                        await selectMenu.update({
                            embeds: [
                                {
                                    author: {
                                        name: 'User Profile',
                                        iconURL: interaction.targetUser.displayAvatarURL()
                                    },
                                    color: Colors.Aqua,
                                    title: interaction.targetUser.tag,
                                    description: `${nitroUserAvatar} ${Badges.join(' ')}`,
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
                            components: [userEmbedComponents]
                        });
                        break;
                    case 'banner':
                        const DefaultUserBannerURL = (await interaction.targetUser.fetch()).bannerURL({ size: 4096 });
                        const EditedUserBannerURL = DefaultUserBannerURL.slice(0, DefaultUserBannerURL.lastIndexOf('.'));

                        let BannerLinks = [];
                        for (const type of FormatTypes) BannerLinks.push({ type, value: `[${type.toUpperCase()}](${EditedUserBannerURL}.${type})` });

                        await selectMenu.update({
                            embeds: [
                                {
                                    author: {
                                        name: 'User Profile',
                                        iconURL: interaction.targetUser.displayAvatarURL()
                                    },
                                    color: Colors.Aqua,
                                    title: interaction.targetUser.tag,
                                    description: `${nitroUserAvatar} ${Badges.join(' ')}`,
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
                            components: [userEmbedComponents]
                        });
                        break;
                    case 'activity':
                        const { activities } = interaction.targetMember.presence;
                        const activity_fields = [];

                        let imageURL = null;

                        for (const { name, type, url, state, details, timestamps, syncId, assets } of activities) {
                            if (ActivityType.Custom === type) {
                                activity_fields.push({ name: 'Status', value: state });
                            } else if (ActivityType.Playing === type) {
                                if (name.toLowerCase() === 'youtube') {
                                    activity_fields.push(
                                        { name: 'Watching on YouTube', value: `*[${details}](${url})*` },
                                        { name: 'Channel', value: state, inline: true },
                                        { name: `${assets.smallText.toLowerCase() === 'live' ? 'Live' : 'Ends In'}`, value: assets.smallText.toLowerCase() === 'live' ? 'Live Stream' : this.bot.utils.formatTime(new Date(timestamps?.end || Date.now() + 1000).getTime() - Date.now(), true), inline: true }
                                    );
                                };

                                if (name.toLowerCase() === 'visual studio code') {
                                    activity_fields.push(
                                        { name: 'Visual Studio Code', value: `**${details}**` },
                                        { name: 'Folder', value: state ? state.split(':')[1].trim() : 'Idle', inline: true },
                                        { name: 'Opened Since', value: this.bot.utils.formatTime(Date.now() - new Date(timestamps?.start || Date.now() - 1000).getTime(), true), inline: true },
                                        { name: 'Language', value: state ? this.bot.utils.capitalizeFirstLetter(assets.largeText.match(/(\b[A-Z]+|\b[A-Z]\b)/g).filter((word) => word.length > 1).toString()) : 'Idle', inline: true }
                                    );
                                };
                            } else if (ActivityType.Listening === type) {
                                if (name.toLowerCase() === 'spotify') {
                                    activity_fields.push(
                                        { name: 'Listening to Spotify', value: `**${state.replace(/;/g, ',')} -** *[${details}](https://open.spotify.com/track/${syncId || '6Uh4txYnvejoOrITECJAiA'})*` },
                                        { name: 'Album', value: assets.largeText, inline: true },
                                        { name: 'Duration', value: this.bot.utils.formatTime(new Date(timestamps?.end || Date.now() + 1000).getTime() - new Date(timestamps?.start || Date.now()).getTime(), true), inline: true },
                                        { name: 'Ends In', value: this.bot.utils.formatTime(new Date(timestamps?.end || Date.now() + 1000).getTime() - Date.now(), true), inline: true }
                                    );

                                    imageURL = `https://i.scdn.co/image/${assets.largeImage.split(':')[1]}`;
                                };
                            };
                        };

                        await selectMenu.update({
                            embeds: [
                                {
                                    author: {
                                        name: 'User Activity',
                                        iconURL: interaction.targetUser.displayAvatarURL()
                                    },
                                    color: Colors.Aqua,
                                    title: interaction.targetUser.tag,
                                    description: `${nitroUserAvatar} ${Badges.join(' ')}`,
                                    thumbnail: {
                                        url: interaction.targetUser.displayAvatarURL()
                                    },
                                    fields: [...activity_fields],
                                    image: {
                                        url: imageURL
                                    },
                                    footer: {
                                        text: interaction.targetUser.username,
                                        iconURL: interaction.targetUser.displayAvatarURL()
                                    },
                                    timestamp: new Date().toISOString()
                                }
                            ],
                            components: [userEmbedComponents]
                        });
                        break;
                };
            });

            EmbedCollector.on('end', async (_collected, reason) => {
                if (reason === 'time') {
                    userEmbedComponents = new ActionRowBuilder()
                        .addComponents([
                            SelectMenuBuilder.from(userEmbedComponents.components ? userEmbedComponents.components[0] : userEmbedComponents).setDisabled(true)
                        ]);

                    return interaction.editReply({ components: [userEmbedComponents] }).catch(() => null);
                };
            });
        } catch (error) {
            console.error(error);

            if (error.code === 10062) return console.error(`Unknown Interaction Error - ${error.message}`);

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