import { promises as fs } from 'fs';
import { getCurrent } from './get.js';

async function load(fn) {
    try {
        let data = await fs.readFile(fn, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        if (err.code == "ENOENT") {
            console.log(`load: file '${fn}' does not exist yet`);
        } else {
            console.error(err)
        }
        return null;
    }
}

async function save(fn, wut) {
    try {
        await fs.writeFile(fn, JSON.stringify(wut));
    } catch (err) {
        console.error(err);
    }
}

function isOlderThan(date, diff) {
    try {

        const parsedDate = new Date(date);
        const age = new Date() - parsedDate;
        return age > diff;
    }
    catch (e){
		console.log(e);
        return true;
    }
}

const goweb_posts_diff = async (olds, news, threshold) => {
    const ret = [];
    for (const n of news) {
        const flags = [];

        const mem = olds.filter((o) => o.id == n.id);
        if (mem.length == 0) {
            if (isOlderThan(n.updated, threshold)) {
                flags.push('new-but-old');
            } else {
                console.log(`diff: new current thing: '${n.id}': '${n.title}'`);
                flags.push('new');
            }
        } else {
            const o = mem[0];

            if (o['comment-count'] != n['comment-count']) {
                flags.push('comments');
            }
            if (o.updated != n.updated) {
                console.log(o.updated)
                console.log(n.updated)
                flags.push('updated');
            }
        }

        if (flags.length != 0) {
            ret.push({ ...n, flags: flags });
        }
    }
    return ret;
};


const sites = {
    // the threshold means
    // "we publish article (we have not seen already), if it is newer than this"
    // this is used only for dev purposes,
    // e.g. "after restart, and memory clean, how many articles do we show"
    // in prod, we check every 5 min, so anything new is safely within this limit
    'goweb': {
        comments: {
            // X days * 24 hours/day * 60 minutes/hour * 60 seconds/minute * 1000 milliseconds/second
            threshold: 1 * 24 * 60 * 60 * 1000,
            memory_file: 'comments_old_goweb.json',
            diff: goweb_posts_diff,
        },
        posts: {
            // X days * 24 hours/day * 60 minutes/hour * 60 seconds/minute * 1000 milliseconds/second
            threshold: 1 * 24 * 60 * 60 * 1000,
            memory_file: 'posts_old_goweb.json',
            diff: goweb_posts_diff,
        }
    },
    'egf': {
        posts: {
            // X days * 24 hours/day * 60 minutes/hour * 60 seconds/minute * 1000 milliseconds/second
            threshold: 1 * 24 * 60 * 60 * 1000,
            memory_file: 'posts_old_egf.json',
            diff: goweb_posts_diff,
        }
    },
    'omg': {
        posts: {
            // X days * 24 hours/day * 60 minutes/hour * 60 seconds/minute * 1000 milliseconds/second
            threshold: 1 * 24 * 60 * 60 * 1000,
            memory_file: 'posts_old_omg.json',
            diff: goweb_posts_diff,
        }
    }
}

export async function check(key) {
    const site = sites[key];
    const current = await getCurrent(key);

    const ret = {};
    for (const kind of ['posts', 'comments']) {
        if (site[kind] == undefined) continue;
        const content = current[kind];
        if (content == undefined) continue;
        const { threshold, memory_file, diff } = site[kind];
        const olds = (await load(memory_file)) ?? [];
        // what changed?
        const delta = await diff(olds, content, threshold)
        ret[kind] = delta;

        if (content.length != 0) {
            console.log(`check ${key}: got ${content.length} ${kind} (of which ${delta.length} new), saving as '${memory_file}'`);
            save(memory_file, [...(olds.filter((o) => !isOlderThan(o.updated, 10 * threshold))), ...content]);
        }
    }

    return ret;
}


async function main() {
    const stuff = await check('omg')
    console.log(JSON.stringify(stuff, undefined, 2));
}

//main();

