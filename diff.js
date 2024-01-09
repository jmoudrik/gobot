import { promises as fs } from 'fs';
import { getCurrent } from './get.js';

const MEMORY = 'posts_old.json';

async function load(fn) {
	try {
		let data = await fs.readFile(fn, 'utf8');
		return JSON.parse(data);
	} catch (err) {
		console.error(err)
		return null;
	}
}

async function save(fn, wut) {
	try {
		console.log("saving as " + fn);
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

// 7 days * 24 hours/day * 60 minutes/hour * 60 seconds/minute * 1000 milliseconds/second
const oneWeek = 7 * 24 * 60 * 60 * 1000;

export async function check() {
	const news = await getCurrent();
	const olds = (await load(MEMORY)) ?? [];

	const ret = [];
	
	for (const n of news) {
		const flags = [];

		const mem = olds.filter((o) => o.id == n.id);
		if (mem.length == 0 ) {
			if(isOlderThan(n.updated, oneWeek)){
				flags.push('new-but-old');
			} else {
				console.log(`new article: ${n.id} '${n.title}'`);
				flags.push('new');
			}
		} else {
			const o = mem[0];

			if (o['comment-count'] != n['comment-count']) {
				flags.push('comments');
			}
			if (o.updated != n.updated) {
				flags.push('updated');
			}
		}

		if(flags.length != 0){
			ret.push({ ...n, flags: flags });
		}
	}

	if (news.length != 0) {
		save(MEMORY, news);
	}

	return ret
}


async function main() {
	for(const p of await check()){
		console.log(JSON.stringify(p, undefined, 2));
	}
}


//main();

