const { ChatInputCommandInteraction, channelMention, roleMention } = require('discord.js');
const Event = require('../../structures/Event.js');
const { Channels, Roles } = require('../../config.json');

module.exports = class interactionCreate extends Event {
    constructor(...args) {
        super(...args, {
            type: 'Client'
        });
    };

    /**
    * 
    * @param {ChatInputCommandInteraction} interaction CommandInteraction
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
                        interaction.reply({ content: `**Sky India MatchMaking** - *Gameplay*\n\n*This server operates via a queueing system. To participate, join any one of the five matchmaking queues. Wait until the queue is full with ten members, any two people can become a captain. These captains choose players one at a time after the knife round until all players have been picked and each team moves to their own voice chat.* \n\n*Our server has a map polling system, the map which has been voted the most will be picked between the two teams, and choose the best IN server for all to play on. Host a room with correct details and play! After the match has ended, you may post the screenshot in ${channelMention(Channels.SubmitScreenshotId)} and moderators will sort out your points from there. Remember to always play by the rules written down in ${channelMention(Channels.PlayRulesId)} as failure to do so will result in punishments.*\n\n*To know more about our ranking and points system, please go to this channel ${channelMention(Channels.RanksId)}*`, ephemeral: true });
                    } else if (interaction.values[0] === 'points') {
                        interaction.reply({ content: `**Sky India MatchMaking** - *Points*\n\n*As every other game, you have the same goal of reaching to the top with the highest points compared to the other players by the end of the season by participating in custom games. The amount of points you receive per win will vary depending on your current points, as shown in ${channelMention(Channels.RanksId)}. Points may also be lost as a result of a defeat, and depending on the circumstance, points will be removed if a punishment is issued.*\n\n*Points update will not take any longer than an hour, if you can no longer see your screenshot in ${roleMention(Channels.VerifiedScreenshotId)} and have also not recieved your points, then please open up a ticket at ${channelMention(Channels.SupportId)}. You can check if your points have been updated or not in ${channelMention(Channels.PointsUpdateId)}*`, ephemeral: true });
                    } else if (interaction.values[0] === 'report') {
                        interaction.reply({ content: `**Sky India MatchMaking** - *Report*\n\n*You may report a player by opening up a ticket in ${channelMention(Channels.SupportId)}. There you must give us the evidence towards your report and It must follow the guidelines set in ${channelMention(Channels.PlayRulesId)}.*`, ephemeral: true });
                    } else if (interaction.values[0] === 'prize') {
                        interaction.reply({ content: '**Sky India MatchMaking** - *None as of yet.*', ephemeral: true });
                    };
                };
            };

            if (interaction.isButton()) {
                await interaction.deferReply({ ephemeral: true });

                if (interaction.customId === `${interaction.guildId}_match_ping`) {
                    if (interaction.member.roles.cache.has(Roles.PingMatchId)) {
                        await interaction.member.roles.remove(Roles.PingMatchId);
                        await interaction.editReply({ content: `*${interaction.user.tag}, ${roleMention(Roles.PingMatchId)} has been removed from you.*` });
                    } else {
                        await interaction.member.roles.add(Roles.PingMatchId);
                        await interaction.editReply({ content: `*${interaction.user.tag}, ${roleMention(Roles.PingMatchId)} has been added to you.*` });
                    };
                };

                if (interaction.customId === `${interaction.guildId}_substitute_ping`) {
                    if (interaction.member.roles.cache.has(Roles.PingSubstituteId)) {
                        await interaction.member.roles.remove(Roles.PingSubstituteId);
                        await interaction.editReply({ content: `*${interaction.user.tag}, ${roleMention(Roles.PingSubstituteId)} has been removed from you.*` });
                    } else {
                        await interaction.member.roles.add(Roles.PingSubstituteId);
                        await interaction.editReply({ content: `*${interaction.user.tag}, ${roleMention(Roles.PingSubstituteId)} has been added to you.*` });
                    };
                };
            };
        } catch (error) {
            return console.error(error);
        };
    };
};