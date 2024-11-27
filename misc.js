import * as fs from 'fs';
import * as readline from 'readline';
import * as path from 'path';
import { fileURLToPath } from 'url';

const DEFAULT_CHANNEL_ID = process.env.DEFAULT_CHANNEL_ID ?? '';
const CHANNEL_OVERRIDE = JSON.parse(process.env.CHANNEL_OVERRIDE ?? '{}');

console.log({ DEFAULT_CHANNEL_ID, CHANNEL_OVERRIDE });

if (!DEFAULT_CHANNEL_ID) {
    throw Error("no default channel id, bad config")
}

// key ~ goweb, kind ~ posts
export const route = (key, kind) => (CHANNEL_OVERRIDE[key] ?? {})[kind] ?? DEFAULT_CHANNEL_ID;

for (const [key, kind] of [
    ['goweb', 'posts'],
    ['goweb', 'comments'],
    ['omg', 'posts'],
    ['egf', 'posts'],
    ['k2ss', 'posts'],
    ['threads', 'hourly'],
    ['threads', 'daily'],
    ['threads', 'weekly'],
]) {
    console.log(`route test: will route '${key}' '${kind}' to '${route(key, kind)}'`);
}


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export async function load_dir(dir, callback) {
    const foldersPath = path.join(__dirname, dir);
    const subfolders = fs.readdirSync(foldersPath);

    for (const folder of subfolders) {
        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const mod = await import(filePath);

            callback(mod, filePath);
        }
    }
}

const cid2path = (channelid) => path.join(__dirname, 'db', `${channelid}.json`);

export const push_thread_row = async (channelid, data) => {
    console.log("PUSH channel=",channelid, " event=", data.event ?? "no event");
    const filePath = cid2path(channelid);
    const jsonData = JSON.stringify(data);
    await fs.promises.appendFile(filePath, jsonData + '\n');
}


export const read_thread_rows = async (channelid, callback) => {
    const filePath = cid2path(channelid);
    const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        try {
            const data = JSON.parse(line);
            await callback(data);
        } catch (error) {
            console.error(`Error parsing line: ${line}`, error);
        }
    }
}

export const list_recent_channels = async (sinceTime) => {
    const dbPath = path.join(__dirname, 'db');
    const files = await fs.promises.readdir(dbPath);
    const recentChannels = [];

    for (const filename of files) {
        if (filename.endsWith('.json')) {
            const filePath = path.join(dbPath, filename);
            const stats = await fs.promises.stat(filePath);
            const modifiedTime = stats.mtime.getTime();
            if (sinceTime <= modifiedTime) {
                recentChannels.push({ filename, channelid: filename.replace('.json', ''), mtime: modifiedTime });
            }
        }
    }

    return recentChannels;
}


