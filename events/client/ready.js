const { ApplicationCommandType, ChannelType } = require('discord.js');
const Event = require('../../structures/Event.js');
const { Channels } = require('../../config.json');

module.exports = class Ready extends Event {
    constructor(...args) {
        super(...args, {
            once: true
        });
    };

    async EventRun() {
        try {
            let ChatInputCommands = this.bot.commands.filter(({ type }) => type === ApplicationCommandType.ChatInput);

            for (const [name, { description, type, options }] of ChatInputCommands) {
                await this.bot.guilds.cache.first().commands.create({ name, description, type, options });
            };

            let UserCommands = this.bot.commands.filter(({ type }) => [ApplicationCommandType.User, ApplicationCommandType.Message].includes(type));

            for (const [name, { type }] of UserCommands) {
                await this.bot.guilds.cache.first().commands.create({ name, type });
            };

            for (const guild of this.bot.guilds.cache.values()) {
                if (guild.available) {
                    const invites = await guild.invites.fetch({ cache: false });

                    this.bot.invites.set(guild.id, invites);
                };
            };

            for (const channel of this.bot.channels.cache.filter(({ type, viewable, parentId }) => [ChannelType.GuildText, ChannelType.GuildNews, ChannelType.GuildPublicThread, ChannelType.GuildPrivateThread].includes(type) && viewable && parentId !== Channels.LogsCategoryId).values()) {
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

            console.log(`${this.bot.user.username} is Online!`);
        } catch (error) {
            console.error(error);
        };
    };
};