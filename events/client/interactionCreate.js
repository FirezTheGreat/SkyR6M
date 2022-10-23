const { BaseInteraction, channelMention, roleMention, EmbedBuilder, time, TimestampStyles, PermissionFlagsBits, OverwriteType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Event = require('../../structures/Event.js');
const Players = require('../../structures/models/Players.js')
const { Channels, Roles, Categories } = require('../../config.json');

module.exports = class interactionCreate extends Event {
    constructor(...args) {
        super(...args, {
            type: 'Client'
        });
    };

    /**
    * 
    * @param {BaseInteraction} interaction CommandInteraction
    * @returns CommandInteraction
    */

    async EventRun(interaction) {
        try {
            if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
                const command = this.bot.commands.get(interaction.commandName);
                if (command) {
                    if (!interaction.guild.members.me.permissions.has(command.client_permissions)) {
                        return await interaction.reply({ content: '*I do not have permission to run this command!*' });
                    } else if (command.user_permissions.length && !interaction.member.permissions.has(command.user_permissions)) {
                        return await interaction.reply({ content: '*You do not have permission to run this command!*' });
                    } else {
                        return command.InteractionRun(interaction);
                    };
                };
            };

            if (interaction.isSelectMenu()) {
                if (interaction.customId === `${interaction.guildId}_faq`) {
                    if (interaction.values[0] === 'gameplay') {
                        interaction.reply({ content: `**${interaction.guild.name}** - *Gameplay*\n\n*This server operates via a queueing system. To participate, join any one of the five matchmaking queues. Wait until the queue is full with ten members, any two people can become a captain. These captains choose players one at a time after the knife round until all players have been picked and each team moves to their own voice chat.* \n\n*Our server has a map polling system, the map which has been voted the most will be picked between the two teams, and choose the best IN server for all to play on. Host a room with correct details and play! After the match has ended, you may post the screenshot in ${channelMention(Channels.SubmitScreenshotId)} and moderators will sort out your points from there. Remember to always play by the rules written down in ${channelMention(Channels.PlayRulesId)} as failure to do so will result in punishments.*\n\n*To know more about our ranking and points system, please go to this channel ${channelMention(Channels.RanksId)}*`, ephemeral: true });
                    } else if (interaction.values[0] === 'points') {
                        interaction.reply({ content: `**${interaction.guild.name}** - *Points*\n\n*As every other game, you have the same goal of reaching to the top with the highest points compared to the other players by the end of the season by participating in custom games. The amount of points you receive per win will vary depending on your current points, as shown in ${channelMention(Channels.RanksId)}. Points may also be lost as a result of a defeat, and depending on the circumstance, points will be removed if a punishment is issued.*\n\n*Points update will not take any longer than an hour, if you can no longer see your screenshot in ${roleMention(Channels.VerifiedScreenshotId)} and have also not recieved your points, then please open up a ticket at ${channelMention(Channels.SupportId)}. You can check if your points have been updated or not in ${channelMention(Channels.PointsUpdateId)}*`, ephemeral: true });
                    } else if (interaction.values[0] === 'report') {
                        interaction.reply({ content: `**${interaction.guild.name}** - *Report*\n\n*You may report a player by opening up a ticket in ${channelMention(Channels.SupportId)}. There you must give us the evidence towards your report and It must follow the guidelines set in ${channelMention(Channels.PlayRulesId)}.*`, ephemeral: true });
                    } else if (interaction.values[0] === 'prize') {
                        interaction.reply({ content: `**${interaction.guild.name}** - *None as of yet.*`, ephemeral: true });
                    };
                };
            };

            if (interaction.isButton()) {
                if (interaction.customId === `${interaction.guildId}_kills`) {
                    const leaderboard_kills_data = await Players.find({}).sort({ 'statistics.kills': -1 }).limit(25);
                    const kills_description = [];

                    for (let [index, { name, statistics: { kills } }] of leaderboard_kills_data.entries()) {
                        kills_description.push(`${++index}. **${name}** - *${kills}*`);
                    };

                    const leaderboard_kills_embed = new EmbedBuilder()
                        .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                        .setTitle(`${interaction.guild.name} - Kill Wise Rankings`)
                        .setThumbnail(interaction.guild.iconURL())
                        .setColor('Aqua')
                        .setDescription(`*These are the current Top ${leaderboard_kills_data.length} players at ${interaction.guild.name}.*\n\n${kills_description.join('\n')}`)
                        .setFooter({ text: `Rankings are updated after every one hour. Click on the buttons below to check live-time rankings!`, iconURL: interaction.guild.iconURL() })
                        .setTimestamp();

                    await interaction.reply({ embeds: [leaderboard_kills_embed], ephemeral: true });
                };

                if (interaction.customId === `${interaction.guildId}_wins`) {
                    const leaderboard_wins_data = await Players.find({}).sort({ 'statistics.wins': -1 }).limit(25);
                    const wins_description = [];

                    for (let [index, { name, statistics: { wins } }] of leaderboard_wins_data.entries()) {
                        wins_description.push(`${++index}. **${name}** - *${wins}*`);
                    };

                    const leaderboard_wins_embed = new EmbedBuilder()
                        .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                        .setTitle(`${interaction.guild.name} - Win Wise Rankings`)
                        .setThumbnail(interaction.guild.iconURL())
                        .setColor('Aqua')
                        .setDescription(`*These are the current Top ${leaderboard_wins_data.length} players at ${interaction.guild.name}.*\n\n${wins_description.join('\n')}`)
                        .setFooter({ text: `Rankings are updated after every one hour. Click on the buttons below to check live-time rankings!`, iconURL: interaction.guild.iconURL() })
                        .setTimestamp();

                    await interaction.reply({ embeds: [leaderboard_wins_embed], ephemeral: true });
                };

                if (interaction.customId === `${interaction.guildId}_match_ping`) {
                    await interaction.deferReply({ ephemeral: true });

                    if (interaction.member.roles.cache.has(Roles.PingMatchId)) {
                        await interaction.member.roles.remove(Roles.PingMatchId);
                        await interaction.editReply({ content: `*${interaction.user.tag}, ${roleMention(Roles.PingMatchId)} has been removed from you.*` });
                    } else {
                        await interaction.member.roles.add(Roles.PingMatchId);
                        await interaction.editReply({ content: `*${interaction.user.tag}, ${roleMention(Roles.PingMatchId)} has been added to you.*` });
                    };
                };

                if (interaction.customId === `${interaction.guildId}_substitute_ping`) {
                    await interaction.deferReply({ ephemeral: true });

                    if (interaction.member.roles.cache.has(Roles.PingSubstituteId)) {
                        await interaction.member.roles.remove(Roles.PingSubstituteId);
                        await interaction.editReply({ content: `*${interaction.user.tag}, ${roleMention(Roles.PingSubstituteId)} has been removed from you.*` });
                    } else {
                        await interaction.member.roles.add(Roles.PingSubstituteId);
                        await interaction.editReply({ content: `*${interaction.user.tag}, ${roleMention(Roles.PingSubstituteId)} has been added to you.*` });
                    };
                };

                if (interaction.customId === `${interaction.guildId}_support`) {
                    await interaction.deferReply({ ephemeral: true });

                    const category = interaction.guild.channels.cache.get(Categories.TicketId);
                    const player = await Players.findOne({ id: interaction.member.id });

                    if (player.tickets.some(({ active }) => active)) return await interaction.editReply({ content: '*You already have an existing ticket.*' });

                    const ticket = this.bot.utils.generateRandomHex(5);

                    const channel = await category.children.create({
                        name: `ticket_${ticket}`,
                        topic: `Issued by ${interaction.user.tag} on ${time(Date.now(), TimestampStyles.LongDateTime)}`,
                        permissionOverwrites: [
                            {
                                id: interaction.member.id,
                                allow: [
                                    PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages,
                                    PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AttachFiles,
                                    PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AddReactions
                                ],
                                type: OverwriteType.Member
                            }
                        ]
                    });

                    const ticket_embed = new EmbedBuilder()
                        .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                        .setTitle(`Ticket - #${ticket}`)
                        .setColor('Green')
                        .setThumbnail(interaction.member?.displayAvatarURL())
                        .setDescription(`*Please ask your queries here ${interaction.member}.*`)
                        .setFooter({ text: `Created by ${interaction.user.tag}` })
                        .setTimestamp();

                    const ticket_components = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(`${channel.id}_lock`)
                                .setEmoji('🔒')
                                .setStyle(ButtonStyle.Danger)
                        );

                    await channel.send({ embeds: [ticket_embed], components: [ticket_components] });
                    await interaction.editReply({ content: `*Your ticket - #${ticket} has been created successfully in ${channel}*` });

                    player.tickets.push({ id: ticket, transcript: 'Unavailable', channel_id: channel.id, active: true, created_timestamp: Date.now(), ended_timestamp: 0 });

                    await Players.findOneAndUpdate(
                        {
                            id: interaction.member.id
                        },
                        {
                            tickets: player.tickets
                        },
                        {
                            upsert: true
                        }
                    );
                };

                if (interaction.customId === `${interaction.channelId}_lock`) {
                    const player = await Players.findOne({ 'tickets.channel_id': interaction.channelId });

                    if (interaction.member.permissions.has(PermissionFlagsBits.BanMembers) || interaction.member.id === player.id) {
                        await interaction.deferReply();

                        const ticket_index = player.tickets.findIndex(({ id }) => id === player.id);

                        player.tickets[ticket_index].active = false;
                        player.tickets[ticket_index].ended_timestamp = Date.now();

                        player.tickets[ticket_index].transcript = (await interaction.channel.messages.fetch({ cache: false })).filter((_, index) => index !== 0).mapValues((message) =>
                            `${time(message.createdTimestamp, TimestampStyles.ShortTime)} —— ${message.cleanContent ? `Content — ${message.cleanContent}\n\n` : ''}${message.attachments.size ? `Attachments — ${message.attachments.mapValues(({ url }) => url).join('\n')}` : ''}`
                        );

                        await Players.findOneAndUpdate(
                            {
                                id: interaction.member.id
                            },
                            {
                                tickets: player.tickets
                            }
                        );

                        await interaction.editReply({ content: `*${interaction.channel} will be deleted in 5 seconds..*` });
                    } else {
                        await interaction.reply({ content: '*You do not have permission to close this ticket.*', ephemeral: true });
                    };
                };
            };
        } catch (error) {
            return console.error(error);
        };
    };
};