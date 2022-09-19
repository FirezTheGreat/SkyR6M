const { ApplicationCommandType, ChatInputCommandInteraction, Colors, ActionRowBuilder, SelectMenuBuilder, ComponentType, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const path = require('path');
const Command = require('../../structures/Command.js');
const { PremiumTiers, VerificationLevels, ExplicitContentFilters } = require('../../config.json');

module.exports = class ServerInfo extends Command {
    constructor(...args) {
        super(...args, {
            name: 'server-info',
            description: 'View Server Stats',
            category: 'Utility',
            type: ApplicationCommandType.ChatInput,
        });
    };

    /**
     * 
     * @param {ChatInputCommandInteraction} interaction CommandInteraction
     * @returns Server Info
     */

    async InteractionRun(interaction) {
        try {
            const premiumTier = interaction.guild.premiumTier > 0 ? path.join(__dirname, '..', '..', PremiumTiers[interaction.guild.premiumTier]) : null;

            let infoButtonCollector = null;
            let current_info_button_page = 0;

            let icon = interaction.guild.iconURL({ size: 4096 }) ?? false;
            let banner = interaction.guild.bannerURL({ size: 4096 }) ?? false;
            let splash = interaction.guild.splashURL({ size: 4096 }) ?? false;

            const total_icons = [icon, banner, splash].filter((icon) => icon);

            const infoEmbedOptions = [
                {
                    label: 'Overview',
                    description: 'Server Overview',
                    value: 'overview',
                    default: true
                }
            ];

            total_icons.length ? infoEmbedOptions.push({ label: 'Icons', description: 'Server Icons', value: 'icons' }) : null;

            let InfoEmbedComponents = new ActionRowBuilder()
                .addComponents([
                    new SelectMenuBuilder()
                        .setCustomId('info')
                        .setMaxValues(1)
                        .addOptions(infoEmbedOptions)
                ]);

            let InfoButtonComponents = new ActionRowBuilder()
                .addComponents([
                    new ButtonBuilder()
                        .setCustomId('left')
                        .setEmoji('<:left_single_arrow:985059826306514984>')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('right')
                        .setEmoji('<:right_single_arrow:985059836913922060>')
                        .setStyle(ButtonStyle.Primary)
                ]);

            const fixedEmbedComponents = InfoEmbedComponents;

            const infoEmbedFields = [
                {
                    author: {
                        name: interaction.guild.name,
                        iconURL: premiumTier
                    },
                    color: Colors.Aqua,
                    title: 'Server Profile',
                    description: interaction.guild.description,
                    thumbnail: {
                        url: interaction.guild.iconURL()
                    },
                    fields: [
                        { name: 'ID', value: interaction.guildId, inline: true },
                        { name: 'Created On', value: `<t:${Math.floor(interaction.guild.createdTimestamp / 1000)}:D> (<t:${Math.floor(interaction.guild.createdTimestamp / 1000)}:R>)`, inline: true },
                        { name: '\u200b', value: '\u200b', inline: true },
                        { name: 'Owner', value: `<@${interaction.guild.ownerId}>`, inline: true },
                        { name: 'Vanity URL', value: interaction.guild.vanityURLCode ?? 'None', inline: true },
                        { name: '\u200b', value: '\u200b', inline: true },
                        { name: 'Verification Level', value: VerificationLevels[interaction.guild.verificationLevel], inline: true },
                        { name: 'Explicit Media Content Filter', value: ExplicitContentFilters[interaction.guild.explicitContentFilter], inline: true },
                        { name: '\u200b', value: '\u200b', inline: true },
                        { name: '2FA Requirement for Moderation', value: interaction.guild.mfaLevel === 0 ? 'None' : 'Yes', inline: true },
                        { name: 'NSFW', value: [0, 1].includes(interaction.guild.nsfwLevel) ? 'Yes' : 'No', inline: true },
                        { name: '\u200b', value: '\u200b', inline: true },
                    ],
                    footer: {
                        text: interaction.guild.name,
                        iconURL: interaction.guild.iconURL()
                    },
                    timestamp: new Date().toISOString()
                },
                {
                    author: {
                        name: interaction.guild.name,
                        iconURL: premiumTier
                    },
                    color: Colors.Aqua,
                    title: 'Server Profile',
                    thumbnail: {
                        url: interaction.guild.iconURL()
                    },
                    fields: [
                        { name: 'Features', value: interaction.guild.features.map((feature) => this.bot.utils.capitalizeFirstLetter(feature, '_')).join('\n') },
                        {
                            name: 'Statistics', value: this.bot.utils.capitalizeFirstLetter(`
${interaction.guild.memberCount} approximate members (${interaction.guild.maximumMembers.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} maximum)
${interaction.guild.approximatePresenceCount ?? 0} approximate presences (${interaction.guild.presences.cache.size ?? 0} maximum)
${interaction.guild.channels.cache.size} channels (${interaction.guild.channels.cache.filter((channel) => channel.type === ChannelType.GuildText).size} text, ${interaction.guild.channels.cache.filter((channel) => [ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(channel.type)).size} voice, ${interaction.guild.channels.cache.filter((channel) => channel.type === ChannelType.GuildCategory).size} categories, ${interaction.guild.channels.cache.filter((channel) => channel.type === ChannelType.GuildNews).size} news)
${interaction.guild.roles.cache.size} roles
${interaction.guild.emojis.cache.size} emojis (${interaction.guild.emojis.cache.filter((emoji) => !emoji.animated).size} / 250 static, ${interaction.guild.emojis.cache.filter((emoji) => emoji.animated).size} / 250 animated)
${interaction.guild.stickers.cache.size} stickers
${interaction.guild.premiumSubscriptionCount} boosts`, ' ')
                        }
                    ],
                    footer: {
                        text: interaction.guild.name,
                        iconURL: interaction.guild.iconURL()
                    },
                    timestamp: new Date().toISOString()
                }
            ]

            const InfoMessage = await interaction.reply({
                embeds: [infoEmbedFields[0]],
                components: [InfoEmbedComponents, InfoButtonComponents]
            });

            infoButtonCollector = InfoMessage.createMessageComponentCollector({ filter: ({ customId }) => ['left', 'right'].includes(customId) && !interaction.user.bot, time: 300000, componentType: ComponentType.Button });

            infoButtonCollector.on('collect', async (button) => {
                if (button.user.id !== interaction.user.id) return await button.reply({ content: '*You did not initiate this command!*', ephemeral: true });

                switch (button.customId) {
                    case 'left':
                        if (current_info_button_page === 0) {
                            ++current_info_button_page;
                        } else {
                            --current_info_button_page;
                        };

                        break;
                    case 'right':
                        if (current_info_button_page === 1) {
                            --current_info_button_page;
                        } else {
                            ++current_info_button_page;
                        };

                        break;
                    default:
                        break;
                };

                await button.update({ embeds: [infoEmbedFields[current_info_button_page]] });
            });

            const InfoCollector = InfoMessage.createMessageComponentCollector({ filter: ({ customId }) => customId === 'info', time: 300000, componentType: ComponentType.SelectMenu });

            InfoCollector.on('collect', async (component) => {
                if (component.user.id !== interaction.user.id) return await component.reply({ content: '*You did not initiate this command!*', ephemeral: true });

                const FormatTypes = ['png', 'jpg', 'gif', 'webp'];
                const selectMenuOptions = [];

                for (const { data: { label, value } } of fixedEmbedComponents.components[0].options) {
                    const SelectMenuOption = {
                        label,
                        value,
                        default: value === component.values[0] ? true : false
                    };

                    selectMenuOptions.push(SelectMenuOption);
                };

                InfoEmbedComponents = new ActionRowBuilder()
                    .addComponents([
                        SelectMenuBuilder.from(fixedEmbedComponents.components[0]).setOptions(selectMenuOptions)
                    ]);

                switch (component.values[0]) {
                    case 'overview':
                        if (infoButtonCollector) {
                            current_info_button_page = 0;
                            infoButtonCollector.stop();
                            infoButtonCollector = null;
                        };

                        const infoEmbed = await component.update({
                            embeds: [infoEmbedFields[0]],
                            components: [InfoEmbedComponents, InfoButtonComponents]
                        });

                        infoButtonCollector = infoEmbed.createMessageComponentCollector({ filter: ({ customId }) => ['left', 'right'].includes(customId) && !interaction.user.bot, time: 300000, componentType: ComponentType.Button });

                        infoButtonCollector.on('collect', async (button) => {
                            if (button.user.id !== interaction.user.id) return await button.reply({ content: '*You did not initiate this command!*', ephemeral: true });

                            switch (button.customId) {
                                case 'left':
                                    if (current_info_button_page === 0) {
                                        ++current_info_button_page;
                                    } else {
                                        --current_info_button_page;
                                    };

                                    break;
                                case 'right':
                                    if (current_info_button_page === 1) {
                                        --current_info_button_page;
                                    } else {
                                        ++current_info_button_page;
                                    };

                                    break;
                                default:
                                    break;
                            };

                            await button.update({ embeds: [infoEmbedFields[current_info_button_page]] });
                        });

                        break;
                    case 'icons':
                        if (infoButtonCollector) {
                            current_info_button_page = 0;
                            infoButtonCollector.stop();
                            infoButtonCollector = null;
                        };

                        const EditedGuildIconURL = icon ? icon.slice(0, icon.lastIndexOf('.')) : null;
                        const EditedGuildBannerURL = banner ? banner.slice(0, banner.lastIndexOf('.')) : null;
                        const EditedGuildSplashURL = splash ? splash.slice(0, splash.lastIndexOf('.')) : null;

                        let GuildIconLinks = [];
                        let GuildBannerLinks = [];
                        let GuildSplashLinks = [];

                        for (const type of FormatTypes) {
                            if (EditedGuildIconURL) {
                                GuildIconLinks.push({ type, value: `[${type.toUpperCase()}](${EditedGuildIconURL}.${type})` });
                            };

                            if (EditedGuildBannerURL) {
                                GuildBannerLinks.push({ type, value: `[${type.toUpperCase()}](${EditedGuildBannerURL}.${type})` });
                            };

                            if (EditedGuildSplashURL) {
                                GuildSplashLinks.push({ type, value: `[${type.toUpperCase()}](${EditedGuildSplashURL}.${type})` });
                            };
                        };

                        const iconEmbedFields = [];

                        if (GuildIconLinks.length) {
                            iconEmbedFields.push({
                                author: {
                                    name: interaction.guild.name,
                                    iconURL: premiumTier
                                },
                                color: Colors.Aqua,
                                title: 'Server Profile',
                                thumbnail: {
                                    url: interaction.guild.iconURL()
                                },
                                fields: [
                                    { name: 'Icon', value: GuildIconLinks.map((link) => link.value).join(' - ') }
                                ],
                                image: {
                                    url: icon.endsWith('.webp') ? GuildIconLinks.find((link) => link.type === 'gif') : icon
                                },
                                footer: {
                                    text: interaction.guild.name,
                                    iconURL: interaction.guild.iconURL()
                                },
                                timestamp: new Date().toISOString()
                            });
                        };

                        if (GuildBannerLinks.length) {
                            iconEmbedFields.push({
                                author: {
                                    name: interaction.guild.name,
                                    iconURL: premiumTier
                                },
                                color: Colors.Aqua,
                                title: 'Server Profile',
                                thumbnail: {
                                    url: interaction.guild.iconURL()
                                },
                                fields: [
                                    { name: 'Banner', value: GuildBannerLinks.map((link) => link.value).join(' - ') }
                                ],
                                image: {
                                    url: banner.endsWith('.webp') ? GuildBannerLinks.find((link) => link.type === 'gif') : banner
                                },
                                footer: {
                                    text: interaction.guild.name,
                                    iconURL: interaction.guild.iconURL()
                                },
                                timestamp: new Date().toISOString()
                            });
                        };

                        if (GuildSplashLinks.length) {
                            iconEmbedFields.push({
                                author: {
                                    name: interaction.guild.name,
                                    iconURL: premiumTier
                                },
                                color: Colors.Aqua,
                                title: 'Server Profile',
                                thumbnail: {
                                    url: interaction.guild.iconURL()
                                },
                                fields: [
                                    { name: 'Splash', value: GuildSplashLinks.map((link) => link.value).join(' - ') }
                                ],
                                image: {
                                    url: splash.endsWith('.webp') ? GuildSplashLinks.find((link) => link.type === 'gif') : splash
                                },
                                footer: {
                                    text: interaction.guild.name,
                                    iconURL: interaction.guild.iconURL()
                                },
                                timestamp: new Date().toISOString()
                            });
                        };

                        const iconEmbed = await component.update({
                            embeds: [iconEmbedFields[0]],
                            components: [InfoEmbedComponents, InfoButtonComponents]
                        });

                        infoButtonCollector = iconEmbed.createMessageComponentCollector({ filter: ({ customId }) => ['left', 'right'].includes(customId) && !interaction.user.bot, time: 300000, componentType: ComponentType.Button });

                        infoButtonCollector.on('collect', async (button) => {
                            if (button.user.id !== interaction.user.id) return await button.reply({ content: '*You did not initiate this command!*', ephemeral: true });

                            switch (button.customId) {
                                case 'left':
                                    if (current_info_button_page === 0) {
                                        current_info_button_page = total_icons.length - 1;
                                    } else {
                                        --current_info_button_page;
                                    };

                                    break;
                                case 'right':
                                    if (current_info_button_page === total_icons.length - 1) {
                                        current_info_button_page = 0;
                                    } else {
                                        ++current_info_button_page;
                                    };

                                    break;
                                default:
                                    break;
                            };

                            await button.update({ embeds: [iconEmbedFields[current_info_button_page]] });
                        });
                    default:
                        break;
                };
            });

            InfoCollector.on('end', (_collected, reason) => {
                if (reason === 'time') {
                    InfoEmbedComponents = new ActionRowBuilder()
                        .addComponents([
                            SelectMenuBuilder.from(InfoEmbedComponents.components ? InfoEmbedComponents.components[0] : InfoEmbedComponents).setDisabled(true)
                        ]);

                    InfoButtonComponents = new ActionRowBuilder()
                        .addComponents([
                            ButtonBuilder.from(InfoButtonComponents.components ? InfoButtonComponents.components[0] : InfoButtonComponents).setDisabled(true)
                        ])
                        .addComponents([
                            ButtonBuilder.from(InfoButtonComponents.components ? InfoButtonComponents.components[1] : InfoButtonComponents).setDisabled(true)
                        ]);

                    return interaction.editReply({ components: [InfoEmbedComponents, InfoButtonComponents] }).catch(() => null);
                };
            });
        } catch (error) {
            if (error.code === 10062) return console.error(`Unknown Interaction Error - ${error.message}`);

            console.error(error);
            return await this.bot.utils.error(interaction, error);
        };
    };
};