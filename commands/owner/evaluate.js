const { ApplicationCommandOptionType, EmbedBuilder, ChatInputCommandInteraction } = require('discord.js');
const Command = require('../../structures/Command.js');
const { Owners } = require('../../config.json');

module.exports = class Evaluate extends Command {
    constructor(...args) {
        super(...args, {
            name: 'evaluate',
            description: 'Evaluate Code',
            category: 'Owner',
            usage: '[code]',
            options: [
                { name: 'code', type: ApplicationCommandOptionType.String, description: 'Code to Evaluate', required: true }
            ]
        });
    };

    /**
     * 
     * @param {ChatInputCommandInteraction} interaction CommandInteraction
     * @returns Evaluated Code
     */

    async InteractionRun(interaction) {
        try {
            if (Owners.some(({ id }) => interaction.user.id === id)) {
                await interaction.deferReply();

                const code = interaction.options.getString('code').replace(this.bot.token, '||TOKEN||');
                const evalEmbed = new EmbedBuilder()
                    .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                    .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                    .setTimestamp();

                try {
                    let code_result = await new Promise((resolve) => resolve(eval(code)));

                    if (typeof code_result !== 'string') {
                        code_result = require('util').inspect(code_result, { depth: 0 });
                    };

                    evalEmbed
                        .setColor('Green')
                        .setTitle('Evaluated')
                        .addFields([
                            { name: 'Code', value: `\`\`\`js\n${code.slice(0, 1006)}\n\`\`\`` },
                            { name: 'Result', value: `\`\`\`js\n${code_result.replace(this.bot.token, 'TOKEN').slice(0, 1006)}\n\`\`\`` }
                        ]);

                    return await interaction.editReply({ embeds: [evalEmbed] });
                } catch (error) {
                    evalEmbed
                        .setColor('Red')
                        .setTitle('Error')
                        .addFields([
                            { name: 'Code', value: `\`\`\`js\n${code.slice(0, 1006)}\n\`\`\`` },
                            { name: 'Result', value: `\`\`\`js\n${error.message.replace(this.bot.token, 'TOKEN').slice(0, 1006)}\n\`\`\`` }
                        ]);

                    return await interaction.editReply({ embeds: [evalEmbed] });
                };
            } else {
                return await interaction.reply({ content: '*You do not have permission to use this command.*', ephemeral: true })
            };
        } catch (error) {
            console.error(error);
            return await this.bot.utils.error(interaction, error);
        };
    };
};