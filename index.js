import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import * as fs from 'fs';

import { userMention, bold, italic, strikethrough, underscore, spoiler, quote, blockQuote, hyperlink, hideLinkEmbed, Client, Events, GatewayIntentBits, Collection } from 'discord.js';

import { check } from './diff.js';

const AUTH_TOKEN = process.env.AUTH_TOKEN ?? '';
const CHANNEL_ID = process.env.CHANNEL_ID ?? '';
console.log({ AUTH_TOKEN, CHANNEL_ID })

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();
const send = (msg) => client.channels.cache.get(CHANNEL_ID).send(msg);

async function load_cmds() {
	const foldersPath = path.join(__dirname, 'commands');
	const commandFolders = fs.readdirSync(foldersPath);

	for (const folder of commandFolders) {
		const commandsPath = path.join(foldersPath, folder);
		const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
		for (const file of commandFiles) {
			const filePath = path.join(commandsPath, file);
			const command = await import(filePath);

			if ('data' in command && 'execute' in command) {
				console.log("new command " + command.data.name);
				client.commands.set(command.data.name, command);
			} else {
				console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
			}
		}
	}
}

const kluci = ['lukan', 'siscurge', 'tomáš grosser'];
const holky = ['mamutik', 'ada'];
const discordmap = { 'siscurge': '296387064566644736' }

const getuid = (uname) => {
	return discordmap[uname.toLowerCase()] ?? null;
}

const optmention = (uname) => {
	const uid = getuid(uname);
	if (!uid)
		return uname;
	return userMention(uid);
}

const fmtnapsal = (who) => {
	const norm = who.toLowerCase();
	if (kluci.includes(norm))
		return `napsal`;
	if (holky.includes(norm))
		return `napsala`;
	return `napsal(a)`;
}

const fmtnew = (p) => {
	//return `${bold()} ${fmtnapsal(p.autor)} nový článek na goweb (${p['updated-nice']}):\n${hyperlink(p.title, p.link)}`;
	const exampleEmbed = {
		color: 0x0099ff,
		title: p.title,
		url: p.link,
		author: {
			name: p.autor,
			//icon_url: 'https://i.imgur.com/AfFp7pu.png',
			//url: 'https://discord.js.org',
		},
		description: p['txt'],
		/*
		thumbnail: {
			url: 'https://i.imgur.com/AfFp7pu.png',
		},
		*/
		fields: [
			{
				name: '',
				value: hyperlink("Otevřít komentáře", p['comment-link']),
				inline: false,
			},
			/*
			{ name: 'Inline field title', value: 'Some value here', inline: true, },
			{ name: 'Inline field title', value: 'Some value here', inline: true, },
			*/
		],
		image: {
			url: p['img'],
		},
		//timestamp: p['updated'],
		footer: {
			text: p['updated-nice'],
		},
	};
	//console.dir(exampleEmbed);
	return { embeds: [exampleEmbed] };
}

const refresh = async () => {
	let sentSomething = false;
	for (const p of (await check()).reverse()) {
		if (p.flags.includes("new")) {
			send(fmtnew(p));
			sentSomething = true;
		}
	}
	if(!sentSomething){
		console.log('nop');
	}
	return sentSomething;
}

client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
	refresh();
	// 10 mins
	setTimeout(refresh, 10*1000);
});

client.on(Events.MessageCreate, async interaction => {
	console.dir(interaction);
})

client.on(Events.InteractionCreate, async interaction => {
	//console.dir(interaction);
	console.log(interaction.commandName);
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

load_cmds().then(() => {
	client.login(AUTH_TOKEN);
});
