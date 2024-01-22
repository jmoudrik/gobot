import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import * as fs from 'fs';

import { Client, Events, GatewayIntentBits, Collection } from 'discord.js';

import { check } from './diff.js';
import { fmt } from './fmt.js';

const AUTH_TOKEN = process.env.AUTH_TOKEN ?? '';
const DEFAULT_CHANNEL_ID = process.env.CHANNEL_ID ?? '';
const CHANNEL_OVERRIDE = JSON.parse(process.env.CHANNEL_OVERRIDE ?? '{}');

console.log({ CHANNEL_OVERRIDE });

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();
const send = (chid, msg) => client.channels.cache.get(chid).send(msg);

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
const oneMin = 60 * 1000;

const sites = {
    'goweb': {
        // every 5 mins
        interval: 5 * oneMin,
    },
    'egf': {
        interval: 10 * oneMin,
    },
    'omg': {
        interval: 1 * oneMin,
    }
};

const refresh = async (key) => {
    console.log(`${(new Date()).toString()}: checking ${key}`)
    const updates = await check(key);
    const msgs = await fmt(key, updates);
    for (const { msg, kind } of msgs) {
        const channel = (CHANNEL_OVERRIDE[key] ?? {})[kind] ?? DEFAULT_CHANNEL_ID;
        send(channel, msg).catch(console.error);
    }
    if (msgs.length == 0) {
        console.log('nop');
    }
    return msgs.length > 0;
}

client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    for (const key of Object.keys(sites)) {
        const { interval } = sites[key];
        refresh(key);
        setInterval(() => refresh(key), interval);
    }
});

client.on(Events.MessageCreate, async interaction => {
    console.dir(interaction);
})

client.on(Events.InteractionCreate, async interaction => {
    //console.dir(interaction);
    console.log({ user: interaction.user, commandName: interaction.commandName });
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
