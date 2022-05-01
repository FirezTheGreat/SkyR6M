const Event = require('../../structures/Event.js');

module.exports = class error extends Event {
    constructor(...args) {
        super(...args);
    };

    EventRun(error) {
        console.error(error);
    };
};