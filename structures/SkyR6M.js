const { Client, Collection, IntentsBitField, Partials } = require('discord.js');
const Util = require('./Util.js');

module.exports = class SkyR6M extends Client {
    constructor(options = {}) {
        super({
            partials: [Partials.Message, Partials.Reaction],
            presence: {
                status: 'idle',
                activities: [
                    { name: 'Sky Rainbow 6 Mobile MatchMaking', type: 'WATCHING' }
                ]
            },
            intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMembers, IntentsBitField.Flags.GuildMessages, IntentsBitField.Flags.GuildVoiceStates]
        });

        this.validate(options);

        this.offenders = new Collection();
        this.commands = new Collection();
        this.events = new Collection();
        this.utils = new Util(this);
        this.mongoose = require('./mongoose.js');
    };

    validate(options) {
        if (typeof options !== 'object') throw new TypeError('Options should be a type of Object.');

        if (!options.TOKEN) throw new Error('You must pass the token for the bot.');
        this.token = options.TOKEN;
    };

    async start(token = this.token) {
        this.utils.loadCommands();
        this.utils.loadEvents();
        this.mongoose.init();
        super.login(token);
    };
};