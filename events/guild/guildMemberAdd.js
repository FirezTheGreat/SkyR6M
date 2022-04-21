const Event = require('../../structures/Event.js');
const PlayerStats = require('../../structures/models/PlayerStats.js');
const { RolePointChecker } = require('../../structures/functions.js');
const { Roles } = require('../../config.json');

module.exports = class guildMemberAdd extends Event {
    constructor(...args) {
        super(...args);
    };

    async EventRun(member) {
        try {
            const player = await PlayerStats.findOne({ id: member.id });

            if (player) {
                const roleId = RolePointChecker(player.current_points, player.current_points);
                const roles = [Roles.RegisteredId];

                if (roleId !== Roles.RegisteredId) roles.push(roleId);

                member.setNickname(`[${player.current_points}] ${player.name}`).catch(() => null);
                await member.roles.add(roles);
            };
        } catch (error) {
            console.error(error);
        };
    };
};