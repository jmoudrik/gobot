import fetch from "node-fetch";
import jsdom from "jsdom";

const { JSDOM } = jsdom;

const parseEgfDate = (dateString) => {
	const [day, month, rest] = dateString.split('.');
	const [year, time] = rest.split(' ');
	const [hours, minutes] = time.split(':');

	const date = new Date(
		parseInt(year),       // year
		parseInt(month) - 1,  // month, counts from 0 (January is 0, December is 11)
		parseInt(day),        // day
		parseInt(hours),      // hours
		parseInt(minutes)     // minutes
	);

	return date;
}

const parse_goweb_cmt_date = (dateString) => {
	const cleanedDate = dateString.replace(/[.]|v/g, "").trim();
	const toks = cleanedDate.replace(/ +/g, ' ').split(' ')
	const [day, month, year, time] = toks;
	const [hours, minutes] = time.split(':');

	//console.log({dateString, day, month, year, time, hours, minutes, toks});

	const date = new Date(
		parseInt(year),        // year
		parseInt(month) - 1,   // month, Index starting from 0 (January is 0, December is 11)
		parseInt(day),         // day
		parseInt(hours),       // hours
		parseInt(minutes)      // minutes
	);
	return date;
}

const sites = {
	'goweb': {
		'url': "https://goweb.cz",
		'parse': async (body) => {
			const dom = new JSDOM(body);
			const doc = dom.window.document;
			const posts = [];
			const comments = [];

			for (const post of doc.querySelectorAll('article')) {
				const p = {};
				p['id'] = post.id;

				const a = post.querySelector('a.fusion-rollover-link');
				p['link'] = a.href;
				p['title'] = a.textContent;

				p['autor'] = post.querySelector('span.vcard span.fn').textContent;
				p['updated'] = post.querySelector('span.updated').textContent;
				p['img'] = post.querySelector('div.fusion-image-wrapper img').src;
				p['txt'] = post.querySelector('div.fusion-post-content-container').textContent;

				p['updated-nice'] = post.querySelector('span.updated').nextElementSibling.textContent;
				p['comment-count'] = post.querySelector('span.fusion-comments').textContent;
				p['comment-link'] = post.querySelector('span.fusion-comments a').href;
				posts.push(p);
			}

			const lis = doc.querySelectorAll('div.decent-comments li')

			for (const li of lis) {
				const c = {
					avatarpic: li.querySelector('span.comment-avatar img').src,
					autor: li.querySelector('span.comment-author').textContent,
					'updated-nice': li.querySelector('span.comment-date').textContent.trim(),
					link: li.querySelector('span.comment-link a')?.href,
					article: li.querySelector('span.comment-link a')?.textContent,
					comment: li.querySelector('span.comment-excerpt').textContent.trim(),
				};

				const toks = c.link?.split('#');
				c['id'] = toks[toks.length - 1];
				c['updated'] = parse_goweb_cmt_date(c['updated-nice']).toISOString();
				comments.push(c);
			}

			return { posts, comments };
		}
	},
	'egf': {
		'url': "https://eurogofed.org/",
		'parse': async (body) => {
			const dom = new JSDOM(body);
			const doc = dom.window.document;
			const posts = [];
			// div with post, div with spacer
			const divs = doc.querySelectorAll('h2')[0].nextElementSibling.children[0].children[2].children
			if (divs.length == 0) {
				console.error("watchout divs empty");
				// JM TOOD bugreport
			}
			for (let i = 0; i < divs.length; i += 2) {
				// div with post
				const post = divs[i];
				const p = {};

				const as = post.querySelectorAll('a');
				p['img'] = as[0]?.href;

				p['link'] = "https://eurogofed.org/" + as[1]?.href;
				p['title'] = as[1]?.textContent.trim();

				const toks = p.link?.split('=');
				p['id'] = toks[toks.length - 1]

				const subdivs = post.querySelectorAll('div');
				const sline = subdivs[2].textContent.split('|').map((s) => s.trim());
				const hasAuthor = sline[0].startsWith('By');
				const authorOffset = hasAuthor ? 1 : 0;
				if (hasAuthor) {
					p['autor'] = sline[0].replace(/^By/, '').trim();
				}
				p['kat'] = sline[authorOffset];
				p['updated-nice'] = sline[authorOffset + 1];
				//console.dir(sline);
				p['updated'] = parseEgfDate(p['updated-nice']).toISOString();
				p['txt'] = subdivs[3].textContent.trim().replace(/Read more...$/, '').trim();

				posts.push(p);
			}
			return { posts };
		}
	}
};


async function get(url) {
	const ret = await fetch(url);
	//console.log(ret.status)
	if (ret.status != 200) {
		return null;
	}
	const body = await ret.text();
	return body;
}


export async function getCurrent(key, overrides = {}) {
	const { url, parse } = { ...sites[key], ...overrides };

	const body = await get(url);
	if (body == null) {
		return []
	}

	return await parse(body)

}

// use an async main function
async function main() {
	const ret = await getCurrent('goweb');
	const { posts, comments } = ret;
	console.log(JSON.stringify(comments, undefined, 2));
}

//main();


