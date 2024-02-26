import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { REST, Routes } from 'discord.js';

import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const AUTH_TOKEN = process.env.AUTH_TOKEN ?? '';
// server
const GUILD_ID = process.env.GUILD_ID ?? '';
const APP_ID = process.env.APP_ID ?? '';

console.log("gobot start");
console.log((new Date()).toString());
console.log({ AUTH_TOKEN, GUILD_ID });

const getCmds = async () => {
	const commands = [];
	// Grab all the command folders from the commands directory you created earlier
	const foldersPath = join(__dirname, 'commands');
	const commandFolders = readdirSync(foldersPath);

	for (const folder of commandFolders) {
		// Grab all the command files from the commands directory you created earlier
		const commandsPath = join(foldersPath, folder);
		const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));
		// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
		for (const file of commandFiles) {
			const filePath = join(commandsPath, file);
			const command = await import(filePath);
			if ('data' in command && 'execute' in command) {
				commands.push(command.data.toJSON());
			} else {
				console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
			}
		}
	}
	return commands;
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(AUTH_TOKEN);

// and deploy your commands!
(async () => {
	try {
		const commands = await getCmds();
		console.log(`Started refreshing ${commands.length} application (/) commands.`);
		console.dir(commands);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			// pro server
			//Routes.applicationGuildCommands(APP_ID, GUILD_ID),
			// pro pm
			Routes.applicationCommands(APP_ID),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();
