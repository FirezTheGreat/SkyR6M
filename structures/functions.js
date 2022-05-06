const { RolePoints } = require('../config.json');
const { sync } = require('glob');
const path = require('path');
/**
 * @class Functions
 */

module.exports = class Function {
    /**
     * 
     * @param {number} old_points Total Old Points
     * @param {number} new_points Added New Points
     * @returns {string<role>} Role ID
     */
    static RolePointChecker(old_points, new_points) {
        let old_role;
        new_points += old_points;

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
    };

    static getCommands() {
        const directory = `${path.dirname(require.main.filename)}${path.sep}`;
        const choices = [];
        const commands = sync(`${directory}commands/**/*.js`).slice(0, 25);

        const isClass = (input) => {
            return typeof input === 'function' &&
                typeof input.prototype === 'object' &&
                input.toString().substring(0, 5) === 'class';
        };

        for (const index of commands.keys()) {
            const { name } = path.parse(commands[index]);
            const File = require(commands[index]);

            if (isClass(File)) choices.push({ name, value: name.toLowerCase().split('-').join(' ') });
        };

        return choices;
    };

    static getEvents() {
        const directory = `${path.dirname(require.main.filename)}${path.sep}`;
        const choices = [];
        const events = sync(`${directory}events/**/*.js`).slice(0, 25);

        const isClass = (input) => {
            return typeof input === 'function' &&
                typeof input.prototype === 'object' &&
                input.toString().substring(0, 5) === 'class';
        };

        for (const index of events.keys()) {
            const { name } = path.parse(events[index]);
            const File = require(events[index]);

            if (isClass(File) && !['interactioncreate', 'ready'].includes(name.toLowerCase())) choices.push({ name, value: name });
        };

        return choices;
    };
};