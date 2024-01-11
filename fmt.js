
import { AttachmentBuilder, userMention, bold, italic, strikethrough, underscore, spoiler, quote, blockQuote, hyperlink, hideLinkEmbed } from 'discord.js';

import { check } from './diff.js';
import { picfetch } from './fetchpic.js';

const kluci = ['lukan', 'siscurge', 'tomáš grosser'];
const holky = ['mamutik', 'ada'];
const discordmap = { 'siscurge': '296387064566644736', 'lukan': '299594384373186560' }

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

const preppic = async (url) => {
	let imgurl;
	let extra = {};
	if (url) {
		const buffer = await picfetch(url);
		if (buffer != null) {
			// arraybuffer -> buffer
			const name = 'pic.jpg';
			const file = new AttachmentBuilder(buffer, { name });
			imgurl = 'attachment://' + name;
			extra['files'] = [file];
			//console.dir(file)
		}
	}
	return {imgurl, extra};
}

const fmtnew_goweb = async (p) => {
	{
		const txt = `${p.autor} ${bold(optmention(p.autor))} ${fmtnapsal(p.autor)} (${p['updated-nice']}):\n${hyperlink(p.title, p.link)}`;
		console.group(`fmtnew_goweb: ${p.id}`);
		console.log(txt);
		console.groupEnd();
	}

	const {imgurl, extra} = await preppic(p.img);

	const embed = {
		color: 0xff9500,
		title: p.title,
		url: p.link,
		author: {
			name: 'goweb.cz',
			icon_url: 'https://i.imgur.com/i0sGv6R.png',
			url: 'https://goweb.cz',
		},
		description: p['txt'],
		/*
		thumbnail: {
			url: 'https://i.imgur.com/AfFp7pu.png',
		},
		*/
		fields: [
			{ name: 'Autor:', value: `${optmention(p.autor)}`, inline: true, },
			///{ name: 'Inline field title', value: 'Some value here', inline: true, },
			{
				name: '',
				value: hyperlink("Otevřít komentáře", p['comment-link']),
				inline: true,
			},
		],
		image: { url: imgurl, },
		//timestamp: p['updated'],
		footer: {
			text: p['updated-nice'],
		},
	};
	const ret = { embeds: [embed], ...extra };
	//console.log(JSON.stringify(embed, undefined, 2));
	return ret;
}

const fmt_if_new = (fmt) => async (post) => {
	if (post.flags.includes("new")) {
		return await fmt(post);
	}
	return null;
}

const fmtnew_egf = async (p) => {
	{
		const txt = `${p.autor} ${bold(optmention(p.autor))} ${fmtnapsal(p.autor)} (${p['updated-nice']}):\n${hyperlink(p.title, p.link)}`;
		console.group(`fmtnew_egf: ${p.id}`);
		console.log(txt);
		console.groupEnd();
	}

	const {imgurl, extra} = await preppic(p.img);

	const embed = {
		color: 0xfcf003,
		title: p.title,
		url: p.link,
		author: {
			name: 'eurogofed.org',
			icon_url: 'https://i.imgur.com/ZVTlugr.png',
			url: 'https://eurogofed.org/',
		},
		description: p['txt'],
		/*
		thumbnail: {
			url: 'https://i.imgur.com/AfFp7pu.png',
		},
		*/
		fields: [
			{ name: 'Autor:', value: `${optmention(p.autor)}`, inline: true, },
			{
				name: 'Kategorie',
				value: p['kat'],
				inline: true,
			},
		],
		image: { url: imgurl, },
		//timestamp: p['updated'],
		footer: {
			text: p['updated-nice'],
		},
	};
	const ret = { embeds: [embed], ...extra };
	//console.log(JSON.stringify(embed, undefined, 2));
	return ret;
}

const sites = {
	'goweb': {
		sort: (a) => a.reverse(),
		fmt_one: fmt_if_new(fmtnew_goweb)
	},
	'egf': {
		sort: (a) => a.reverse(),
		fmt_one: fmt_if_new(fmtnew_egf)
	}
}

export const fmt = async (key, updates) => {
	const { sort, fmt_one } = sites[key];

	const msgs = [];
	for (const p of sort(updates)) {
		const msg = await fmt_one(p);
		if (msg != null) {
			msgs.push(msg);
		}
	}

	return msgs;
}


async function main() {
	const key = 'egf';
	const updates = await check(key);
	const msgs = await fmt(key, updates)
	for (const msg of msgs) {
		console.log(JSON.stringify(msg?.embeds, undefined, 2));
	}
}

//main();

