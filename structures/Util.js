const { EmbedBuilder } = require('discord.js');
const path = require('path');
const { promisify } = require('util');
const Command = require('./Command.js');
const Event = require('./Event.js');
const glob = promisify(require('glob'));

module.exports = class Util {
    constructor(bot) {
        this.bot = bot;
    };

    isClass(input) {
        return typeof input === 'function' &&
            typeof input.prototype === 'object' &&
            input.toString().substring(0, 5) === 'class';
    };

    get directory() {
        return `${path.dirname(require.main.filename)}${path.sep}`;
    };

    async loadCommands() {
        return glob(`${this.directory}commands/**/*.js`).then(commands => {
            for (const commandFile of commands) {
                delete require.cache[commandFile];
                const { name } = path.parse(commandFile);

                const File = require(commandFile);
                if (!this.isClass(File)) throw new TypeError(`Command ${name} doesn't export a class.`);

                const command = new File(this.bot, name.toLowerCase());
                if (!(command instanceof Command)) throw new TypeError(`Command ${name} doesnt belong in Commands.`);

                this.bot.commands.set(command.name, command);
            };
        });
    };

    async loadEvents() {
        return glob(`${this.directory}events/**/*.js`).then(events => {
            for (const eventFile of events) {
                delete require.cache[eventFile];
                const { name } = path.parse(eventFile);

                const File = require(eventFile);
                if (!this.isClass(File)) throw new TypeError(`Event ${name} doesn't export a class!`);

                const event = new File(this.bot, name.toLowerCase());
                if (!(event instanceof Event)) throw new TypeError(`Event ${name} doesn't belong in Events`);

                this.bot.events.set(event.name, event);
                event.emitter[event.type](name, (...args) => event.EventRun(...args));
            };
        });
    };

    parseTime(time) {
        const regex = /\d+\.*\d*\D+/g;
        time = time.split(/\s+/).join("");
        let res;
        let duration = 0;
        while ((res = regex.exec(time)) !== null) {
            if (res.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            const local = res[0].toLowerCase();
            if (local.endsWith("seconds") || local.endsWith("second") || (local.endsWith("s") && local.match(/\D+/)[0].length === 1)) {
                duration += parseInt(local.match(/\d+\.*\d*/)[0], 10) * 1000;
            }
            else if (local.endsWith("minutes") || local.endsWith("minute") || (local.endsWith("m") && local.match(/\D+/)[0].length === 1)) {
                duration += parseInt(local.match(/\d+\.*\d*/)[0], 10) * 60000;
            }
            else if (local.endsWith("hours") || local.endsWith("hour") || (local.endsWith("h") && local.match(/\D+/)[0].length === 1)) {
                duration += parseInt(local.match(/\d+\.*\d*/)[0], 10) * 3600000;
            }
            else if (local.endsWith("days") || local.endsWith("day") || (local.endsWith("d") && local.match(/\D+/)[0].length === 1)) {
                duration += parseInt(local.match(/\d+\.*\d*/)[0], 10) * 86400000;
            }
            else if (local.endsWith("weeks") || local.endsWith("week") || (local.endsWith("w") && local.match(/\D+/)[0].length === 1)) {
                duration += parseInt(local.match(/\d+\.*\d*/)[0], 10) * 604800000;
            }
            else if (local.endsWith("months") || local.endsWith("month")) {
                duration += parseInt(local.match(/\d+\.*\d*/)[0], 10) * 2628000000;
            }
            else if (local.endsWith("years") || local.endsWith("year") || (local.endsWith("y") && local.match(/\D+/)[0].length === 1)) {
                duration += parseInt(local.match(/\d+\.*\d*/)[0], 10) * 31557600000;
            }
        }
        if (duration === 0) {
            return null;
        }
        return duration;
    };

    /**
     * 
     * @param {number} milliseconds Date in MS
     * @param {boolean} minimal Formats in hh:mm:ss
     * @returns formatted time in 1h 1m 1s or 01:01:01
     */

    formatTime(milliseconds, minimal = false) {
        if (!milliseconds || isNaN(milliseconds) || milliseconds <= 0) {
            throw new RangeError("Utils#formatTime(milliseconds: number) Milliseconds must be a number greater than 0");
        }
        if (typeof minimal !== "boolean") {
            throw new RangeError("Utils#formatTime(milliseconds: number, minimal: boolean) Minimal must be a boolean");
        }
        const times = {
            years: 0,
            months: 0,
            weeks: 0,
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
        };
        while (milliseconds > 0) {
            if (milliseconds - 31557600000 >= 0) {
                milliseconds -= 31557600000;
                times.years++;
            }
            else if (milliseconds - 2628000000 >= 0) {
                milliseconds -= 2628000000;
                times.months++;
            }
            else if (milliseconds - 604800000 >= 0) {
                milliseconds -= 604800000;
                times.weeks += 7;
            }
            else if (milliseconds - 86400000 >= 0) {
                milliseconds -= 86400000;
                times.days++;
            }
            else if (milliseconds - 3600000 >= 0) {
                milliseconds -= 3600000;
                times.hours++;
            }
            else if (milliseconds - 60000 >= 0) {
                milliseconds -= 60000;
                times.minutes++;
            }
            else {
                times.seconds = Math.round(milliseconds / 1000);
                milliseconds = 0;
            }
        }
        const finalTime = [];
        let first = false;
        for (const [k, v] of Object.entries(times)) {
            if (minimal) {
                if (v === 0 && !first && !['minutes', 'seconds'].includes(k)) {
                    continue;
                }
                finalTime.push(v < 10 ? `0${v}` : `${v}`);
                first = true;
                continue;
            }
            if (v > 0) {
                finalTime.push(`${v} ${v > 1 ? k : k.slice(0, -1)}`);
            }
        }
        let time = finalTime.join(minimal ? ":" : ", ");
        if (time.includes(",")) {
            const pos = time.lastIndexOf(",");
            time = `${time.slice(0, pos)} and ${time.slice(pos + 1)}`;
        }
        return time;
    };

    /**
     * 
     * @param {string} id Channel Id
     * @param {Array<EmbedBuilder>} embed Embed to Send
     * @param {array} files Files to Attach
     * @returns Embeded message to the channel
     */

    auditSend(id, { embeds = [], files = [] }) {
        const channel = this.bot.channels.cache.get(id);

        if (channel) channel.send({ embeds, files });
        else return new TypeError(`Channel Id doesn't exist`);
    };

    /**
     * 
     * @param {string} string String
     * @returns Capitalized String
     */

    capitalizeFirstLetter(string) {
        return string[0].toUpperCase() + string.slice(1).toLowerCase();
    };

    /**
     * 
     * @param {number} current_points Current Points
     * @param {boolean} reverse Invert the point value to negative
     * @returns {number} Added Points
     */

    addPoints(current_points, reverse = false) {
        let points = 0;

        if (current_points < 200) points += 20;
        else if (current_points < 500) points += 15;
        else points += 10;

        return reverse ? -points : points;
    };

    /**
     * 
     * @param {number} current_points Current Points
     * @param {boolean} reverse Invert the point value to positive
     * @returns Removed Points
     */

    removePoints(current_points, reverse = false) {
        let points = 0;

        if (current_points < 100) points -= 0;
        else if (current_points < 200) points -= 10;
        else if (current_points < 300) points -= 15;
        else if (current_points < 700) points -= 20;
        else points -= 25;

        return reverse ? +points : points;
    };
};