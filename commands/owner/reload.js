const { ApplicationCommandType, ApplicationCommandOptionType } = require('discord.js');
const { sync } = require('glob');
const Command = require('../../structures/Command.js');
const { getCommands, getEvents } = require('../../structures/functions.js');
const { Owners } = require('../../config.json');
const sub_commands = [
    {
        name: 'commands', type: ApplicationCommandOptionType.Subcommand, description: 'Reload Bot Commands', required: false, options: [
            { name: 'command', type: ApplicationCommandOptionType.String, description: 'Command to Reload', required: false, choices: getCommands() }
        ]
    },
    {
        name: 'events', type: ApplicationCommandOptionType.Subcommand, description: 'Reload Bot Events', required: false, options: [
            { name: 'event', type: ApplicationCommandOptionType.String, description: 'Event to Reload', required: false, choices: getEvents() }
        ]
    }
];

module.exports = class Reload extends Command {
    constructor(...args) {
        super(...args, {
            name: 'reload',
            description: 'Reload Bot Commands/Events',
            category: 'Owner',
            usage: '[command(s) | event(s)]',
            type: ApplicationCommandType.ChatInput,
            sub_commands,
            options: sub_commands.map(({ name, type, description, required, options }) => ({ name, type, description, required, options }))
        });
    };

    async InteractionRun(interaction) {
        try {
            if (Owners.some(({ id }) => interaction.user.id === id)) {
                await interaction.deferReply({ ephemeral: true });

                const sub_command = interaction.options._subcommand;

                switch (sub_command) {
                    case 'commands':
                        const command_name = interaction.options.getString('command');
                        const command = this.bot.commands.get(command_name) || this.bot.commands.find(({ name }) => name.toLowerCase() === command_name);
                        const commandFile = command ? this.bot.utils.loadCommands(command) : null;

                        if (commandFile) {
                            return await interaction.editReply({ content: `*Reloaded Command - \`${commandFile.name}\` Successfully*` });
                        } else {
                            this.bot.commands.sweep(() => true);
                            this.bot.utils.loadCommands();

                            await interaction.editReply({ content: '*Reloaded All Commands Successfully.*' });
                        };
                        break;
                    case 'events':
                        const event_name = interaction.options.getString('event');
                        const event = this.bot.events.get(event_name?.toLowerCase());
                        const eventFile = event_name ? this.bot.utils.loadEvents(Object.assign(event, { name: event_name })) : null;

                        if (eventFile) {
                            return await interaction.editReply({ content: `*Reloaded Event - \`${event_name}\` Successfully*` });
                        } else {
                            const events = sync(`${this.directory}events/**/*.js`).filter((event_file) => !event_file.endsWith('ready.js') || !event_file.endsWith('interactionCreate.js'));

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

                            await interaction.editReply({ content: '*Reloaded All Events Successfully.*' });
                        };
                        break;
                };
            } else {
                return interaction.reply({ content: '*You do not have permission to use this command.*', ephemeral: true });
            };
        } catch (error) {
            console.error(error);

            if (interaction.deferred && !interaction.replied) {
                return interaction.editReply({ content: `An Error Occurred: \`${error.message}\`!` });
            } else if (interaction.replied) {
                return interaction.followUp({ content: `An Error Occurred: \`${error.message}\`!` });
            } else {
                return interaction.reply({ content: `An Error Occurred: \`${error.message}\`!` });
            };
        };
    };
};