const { ApplicationCommandType, ChannelType } = require('discord.js');
const Event = require('../../structures/Event.js');
const { Channels } = require('../../config.json');

module.exports = class Ready extends Event {
    constructor(...args) {
        super(...args, {
            once: true,
            type: 'Client'
        });
    };

    /**
     * 
     * @returns Initialises Client
     */

    async EventRun() {
        try {
            const InteractionCommands = this.bot.commands.filter(({ type }) => [ApplicationCommandType.User, ApplicationCommandType.Message, ApplicationCommandType.ChatInput].includes(type));
            const Commands = [];

            for (const [name, { description, type, options }] of InteractionCommands) {
                [ApplicationCommandType.User, ApplicationCommandType.Message].includes(type)
                    ? Commands.push({ name, type })
                    : Commands.push({ name, description, type, options })
            };

            await this.bot.application.commands.set(Commands);

            for (const guild of this.bot.guilds.cache.values()) {
                if (guild.available) {
                    const invites = await guild.invites.fetch({ cache: false });

                    this.bot.invites.set(guild.id, invites.mapValues(({ inviter, code, uses }) => ({ inviter, code, uses })));
                };
            };

            for (const guild of this.bot.guilds.cache.values()) {
                try {
                    await guild.members.fetch();
                } catch {
                    continue;
                };
            };

            for (const channel of this.bot.channels.cache.filter(({ type, viewable, parentId }) => [ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildNews, ChannelType.GuildPublicThread, ChannelType.GuildPrivateThread].includes(type) && viewable && parentId !== Channels.LogsCategoryId).values()) {
                try {
                    await channel.messages.fetch({ limit: 50, cache: true });
                } catch {
                    continue;
                };

                let fetchInterval = setInterval(async () => {
                    const cached_channel = this.bot.channels.cache.get(channel.id);

                    if (cached_channel) {
                        await cached_channel.messages.fetch({ limit: 50, cache: true });
                    } else {
                        clearInterval(fetchInterval);
                    };
                }, 7100000 - (7100000 - this.bot.sweepers.intervals.messages._repeat) + 100000);
            };

            return console.log(`${this.bot.user.username} is Online!`);
        } catch (error) {
            console.error(error);
        };
    };
};