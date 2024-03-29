const { Client, Collection, IntentsBitField, Partials, ActivityType } = require('discord.js');
const Util = require('./Util.js');
const Mongoose = require('./mongoose.js');

module.exports = class SkyR6M extends Client {
    constructor(options = {}) {
        super({
            partials: [Partials.Message, Partials.Reaction, Partials.GuildMember],
            presence: {
                status: 'online',
                activities: [
                    { name: 'Sky C-OPS MatchMaking', type: ActivityType.Watching }
                ]
            },
            intents: [
                IntentsBitField.Flags.MessageContent, IntentsBitField.Flags.Guilds,
                IntentsBitField.Flags.GuildMembers, IntentsBitField.Flags.GuildMessages,
                IntentsBitField.Flags.GuildVoiceStates, IntentsBitField.Flags.GuildBans,
                IntentsBitField.Flags.GuildInvites, IntentsBitField.Flags.GuildPresences
            ],
            sweepers: {
                messages: {
                    interval: 7000,
                    lifetime: 7000
                }
            }
        });

        this.validate(options);

        this.offenders = new Collection();
        this.commands = new Collection();
        this.invites = new Collection();
        this.events = new Collection();
        this.polls = new Collection();
        this.mongoose = new Mongoose();
        this.utils = new Util(this);

    };

    /**
     * 
     * @param {Client} options Client Options
     */

    validate(options) {
        if (typeof options !== 'object') throw new TypeError('Options should be a type of Object.');

        if (!options.TOKEN) throw new Error('You must pass the token for the bot.');
        this.token = options.TOKEN;
    };

    /**
     * 
     * @returns Starts the bot and loads all Commands, Events and Initiates Mongoose Client
     */

    async start(token = this.token) {
        await this.utils.loadCommands();
        await this.utils.loadEvents();
        await super.login(token);

        setImmediate(() => this.mongoose.init());
    };
};