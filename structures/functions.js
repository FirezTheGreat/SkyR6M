const { RolePoints } = require('../config.json');

module.exports = {
    RolePointChecker(old_points, new_points) {
        let old_role;
        for (const role of RolePoints) {
            if (role.points <= old_points) {
                old_role = role.role;
            } else {
                break;
            };
        };

        let new_role;
        for (const role of RolePoints) {
            if (role.points <= new_points) {
                new_role = role.role;
            } else {
                break;
            };
        };

        if (old_role !== new_role) return new_role;
        else return old_role;
    }
}