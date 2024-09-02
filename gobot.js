import { Client, Events, GatewayIntentBits, Collection } from 'discord.js';

import { setup_periodical_refresh } from './gobot_posts.js';
import { setup_periodical_report } from './gobot_threads.js';
import { load_dir } from './misc.js';

const AUTH_TOKEN = process.env.AUTH_TOKEN ?? '';
if (!AUTH_TOKEN) {
    throw Error("no token")
}
//console.log({ AUTH_TOKEN});

global.counter = {};
const incrementCounter = (key, kind) => {
    const k = `${key}-${kind}`;
    global.counter[k] = (global.counter[k] ?? 0) + 1;
}
incrementCounter("counter", "test");

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
client.commands = new Collection();
const send = (chid, msg) => client.channels.cache.get(chid).send(msg);

async function load_cmds() {
	await load_dir('commands', (command, filePath) => {
        if ('data' in command && 'execute' in command) {
            console.log("registering command " + command.data.name);
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    });
}

async function load_events() {
    await load_dir('events', (event, filePath) => {
        console.log("registering event handler " + event.data.name);
        if (event.data.once) {
            client.once(event.data.name, async (...args) => await event.data.execute(...args));
        } else {
            client.on(event.data.name, async (...args) => await event.data.execute(...args));
        }
    });
}

client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    setup_periodical_refresh(send, incrementCounter);
    setup_periodical_report(send, incrementCounter);
});

//client.on(Events.MessageCreate, async interaction => { console.dir(interaction); })
//client.on(Events.ThreadCreate, async interaction => { console.log("ThreadCreate"); console.dir(interaction); })

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
    load_events()
}).then(() => {
    client.login(AUTH_TOKEN);
}).then(() => {
    console.log('logged in');
});

