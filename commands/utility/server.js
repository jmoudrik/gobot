import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
	.setName('server')
	.setDescription('Provides information about the server.');
export async function execute(interaction) {
	console.dir(interaction)
	await interaction.reply({ content: `Sie sind aber neugierig!`, ephemeral: true });
}

