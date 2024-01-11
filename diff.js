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
	const parsedDate = new Date(date);
	const age = new Date() - parsedDate;
	return age > diff;
}
const goweb_diff = async (olds, news, threshold) => {
	const ret = [];
	for (const n of news) {
		const flags = [];

		const mem = olds.filter((o) => o.id == n.id);
		if (mem.length == 0) {
			if (isOlderThan(n.updated, threshold)) {
				flags.push('new-but-old');
			} else {
				console.log(`diff: new current article: '${n.id}': '${n.title}'`);
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
	'goweb': {
		// X days * 24 hours/day * 60 minutes/hour * 60 seconds/minute * 1000 milliseconds/second
		threshold: 1 * 24 * 60 * 60 * 1000,
		memory_file: 'posts_old_goweb.json',
		diff: goweb_diff,
	},
	'egf': {
		// X days * 24 hours/day * 60 minutes/hour * 60 seconds/minute * 1000 milliseconds/second
		threshold: 1 * 24 * 60 * 60 * 1000,
		memory_file: 'posts_old_egf.json',
		diff: goweb_diff,
	}
}

export async function check(key) {
	const { threshold, memory_file, diff } = sites[key];

	const current = await getCurrent(key);
	const olds = (await load(memory_file)) ?? [];
	// what changed?
	const delta = await diff(olds, current, threshold)

	if (current.length != 0) {
		console.log(`check ${key}: got ${current.length} posts (of which ${delta.length} new), saving as '${memory_file}'`);
		save(memory_file, current);
	}
	return delta
}


async function main() {
	for (const p of await check('egf')) {
		console.log(JSON.stringify(p, undefined, 2));
	}
}

//main();

