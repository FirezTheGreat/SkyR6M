const Event = require('../../structures/Event.js');

module.exports = class error extends Event {
    constructor(...args) {
        super(...args, {
            type: 'Client'
        });
    };

    /**
     * 
     * @param {Error} error Error
     * @returns Error
     */

    EventRun(error) {
        return console.error(error);
    };
};