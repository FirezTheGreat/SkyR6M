const { Invite } = require('discord.js');
const Event = require('../../structures/Event.js');

module.exports = class inviteCreate extends Event {
    constructor(...args) {
        super(...args, {
            type: 'Client'
        });
    };

    /**
     * 
     * @param {Invite} invite Invite
     * @returns inviteCreate Event
     */

    async EventRun(invite) {
        try {
            if (invite.guild.available) {
                const invites = await invite.guild.invites.fetch({ cache: false });

                this.bot.invites.set(invite.guild.id, invites.mapValues(({ inviter, code, uses }) => ({ inviter, code, uses })));
            };
        } catch (error) {
            console.error(error);
        };
    };
};