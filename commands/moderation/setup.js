const { ApplicationCommandOptionType, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder, roleMention, AttachmentBuilder, ActionRowBuilder, SelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Command = require('../../structures/Command.js');
const { Roles } = require('../../config.json');
const path = require('path');
const sub_commands = [
    {
        name: 'ping', type: ApplicationCommandOptionType.Subcommand, description: 'Setup Ping System', options: [
            { name: 'channel', type: ApplicationCommandOptionType.Channel, description: 'Channel to Setup', required: false }
        ]
    },
    {
        name: 'role', type: ApplicationCommandOptionType.Subcommand, description: 'Setup Role System', options: [
            { name: 'channel', type: ApplicationCommandOptionType.Channel, description: 'Channel to Setup', required: false }
        ]
    },
    {
        name: 'support', type: ApplicationCommandOptionType.Subcommand, description: 'Setup Support System', options: [
            { name: 'channel', type: ApplicationCommandOptionType.Channel, description: 'Channel to Setup', required: false }
        ]
    }
];

module.exports = class Setup extends Command {
    constructor(...args) {
        super(...args, {
            name: 'setup',
            description: 'Setup Commands',
            category: 'Moderation',
            usage: '[ping | role | support]',
            client_permissions: [PermissionFlagsBits.ManageRoles],
            user_permissions: [PermissionFlagsBits.Administrator],
            sub_commands,
            options: sub_commands.map(({ name, type, description, required, options }) => ({ name, type, description, required, options }))
        });
    };

    /**
     * 
     * @param {ChatInputCommandInteraction} interaction CommandInteraction
     * @returns Sets up Ping or Support System
     */

    async InteractionRun(interaction) {
        try {
            const sub_command = interaction.options._subcommand;
            const channel = interaction.options.getChannel('channel') || interaction.channel;

            if (sub_command === 'ping') {
                const ping_attachment_embed = new EmbedBuilder()
                    .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                    .setColor('Aqua')
                    .setImage('attachment://search.png')

                const ping_embed = new EmbedBuilder()
                    .setColor('Aqua')
                    .setDescription(`
*Use the **/search players** or **/search substitutes** slash commands while mentioning the queue you are currently in to broadcast a notification out.*

**${roleMention(Roles.PingMatchId)}** - *This role will receive a notification when a queue is in need of players.*
**${roleMention(Roles.PingSubstituteId)}** - *This role will receive a notification when a queue is in need of a substitute.*

*Each command has a ten minute cool-down, and excessive usage will result in timeouts.*
`)
                    .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                    .setTimestamp();

                await channel.send({ embeds: [ping_attachment_embed, ping_embed], files: [new AttachmentBuilder(path.join(__dirname, '..', '..', 'assets', 'banners', 'search.png'), 'search.png')] });
                return await interaction.reply({ content: `*Ping System successfully synced in **${channel}**!*`, ephemeral: true });
            } else if (sub_command === 'role') {
                const role_components = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`${interaction.guildId}_match_ping`)
                            .setLabel('Match Ping')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId(`${interaction.guildId}_substitute_ping`)
                            .setLabel('Substitute Ping')
                            .setStyle(ButtonStyle.Success)
                    );

                const role_attachment_embed = new EmbedBuilder()
                    .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                    .setColor('Aqua')
                    .setImage('attachment://role-setup.png')

                const role_embed = new EmbedBuilder()
                    .setColor('Aqua')
                    .setDescription(`*You may click a button below to receive either the ${roleMention(Roles.PingMatchId)} role or the ${roleMention(Roles.PingSubstituteId)} role. These roles may be pinged by everybody once every **10 minutes** through the command **/search**. The misuse of this command will lead to a timeout.\n\nUsers may **remove** the role by once again clicking on the button below.*`)
                    .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                    .setTimestamp();

                await channel.send({ embeds: [role_attachment_embed, role_embed], components: [role_components], files: [new AttachmentBuilder(path.join(__dirname, '..', '..', 'assets', 'banners', 'role-setup.png'), 'role-setup.png')] });
                return await interaction.reply({ content: `*Role System successfully synced in **${channel}**!*`, ephemeral: true });
            } else {
                const faq_attachment_embed = new EmbedBuilder()
                    .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                    .setColor('Aqua')
                    .setImage('attachment://faq.png');

                const faq_embed = new EmbedBuilder()
                    .setColor('Aqua')
                    .setDescription('*Below is a series of **FAQ** and answers to everyday inquiries that you may come across in our server. Please use this feature before opening a ticket, as you may find the answer to your question you\'ve been asking.*');

                const faq_components = new ActionRowBuilder()
                    .addComponents(
                        new SelectMenuBuilder()
                            .setCustomId(`${interaction.guildId}_faq`)
                            .setPlaceholder('Select An Option')
                            .setMaxValues(1)
                            .addOptions(
                                {
                                    label: 'Gameplay',
                                    description: `How does \'${interaction.guild.name}\' Work?`,
                                    value: 'gameplay'
                                },
                                {
                                    label: 'Points',
                                    description: 'How does one gain or lose points?',
                                    value: 'points'
                                },
                                {
                                    label: 'Report',
                                    description: 'How do I report someone?',
                                    value: 'report'
                                },
                                {
                                    label: 'Prize',
                                    description: 'What\'s this season\'s prizepool?',
                                    value: 'prize'
                                }
                            )
                    );

                const support_attachment_embed = new EmbedBuilder()
                    .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                    .setColor('Aqua')
                    .setImage('attachment://support.png');

                const support_embed = new EmbedBuilder()
                    .setColor('Aqua')
                    .setDescription(`*If you are uncertain about something which is related to our server, be it a issue with our custom matches or points, simply click the contact us button below to **open up a ticket**. Our moderators and staff will help you in any way possible. Please do however avoid spamming the system, as it **will result in a timeout**.*`)
                    .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                    .setTimestamp();

                const support_components = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`${interaction.guildId}_support`)
                            .setLabel('Contact Us!')
                            .setStyle(ButtonStyle.Success)
                    );

                await channel.send({ embeds: [faq_attachment_embed, faq_embed], components: [faq_components], files: [new AttachmentBuilder(path.join(__dirname, '..', '..', 'assets', 'banners', 'faq.png'), 'faq.png')] });
                await channel.send({ embeds: [support_attachment_embed, support_embed], components: [support_components], files: [new AttachmentBuilder(path.join(__dirname, '..', '..', 'assets', 'banners', 'support.png'), 'support.png')] });
                return await interaction.reply({ content: `*Support System successfully synced in **${channel}**!*`, ephemeral: true });
            };
        } catch (error) {
            console.error(error);
            return await this.bot.utils.error(interaction, error);
        };
    };
};