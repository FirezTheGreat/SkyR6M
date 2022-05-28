const { EmbedBuilder, GuildMember } = require('discord.js');
const Event = require('../../structures/Event.js');
const Players = require('../../structures/models/Players.js');
const { Channels } = require('../../config.json');

module.exports = class guildMemberAdd extends Event {
    constructor(...args) {
        super(...args, {
            type: 'Guild'
        });
    };

    /**
     * 
     * @param {GuildMember} member Guild Member
     * @returns Register's User
     */

    async EventRun(member) {
        try {
            const player = await Players.findOne({ id: member.id });

            const cached_invites = this.bot.invites.get(member.guild.id);
            const new_invites = await member.guild.invites.fetch({ cache: false });

            const { inviter } = new_invites.find(({ code, uses }) => cached_invites?.get(code)?.uses < uses) || { inviter: { tag: 'Unknown#0000' } };
            this.bot.invites.set(member.guild.id, new_invites);

            const guildJoinEmbed = new EmbedBuilder()
                .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
                .setColor('Green')
                .setDescription(`***${member.user.tag}** has joined the server on <t:${Math.floor(member.joinedTimestamp / 1000)}> (<t:${Math.floor(member.joinedTimestamp / 1000)}:R>)*`)
                .addFields([
                    { name: 'Registered Name', value: player?.name || 'Unregistered', inline: true },
                    { name: 'User ID', value: member.id, inline: true },
                    { name: 'Invited By', value: inviter.tag, inline: true }
                ])
                .setFooter({ text: member.guild.name, iconURL: member.guild.iconURL() })
                .setTimestamp();

            if (player && member.manageable) {
                await member.setNickname(`[${player.points.current}] ${player.name.trim()}`);
                await member.roles.add(player._roles);
            };

            return await this.bot.utils.auditSend(Channels.AuditLogId, { embeds: [guildJoinEmbed] });
        } catch (error) {
            console.error(error);
        };
    };
};