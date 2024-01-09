import fetch from "node-fetch";
import jsdom from "jsdom";

const { JSDOM } = jsdom;

async function get() {
	const ret = await fetch("https://goweb.cz");
	//console.log(ret.status)
	if (ret.status != 200) {
		return null;
	}

	const body = await ret.text();
	return body;
}

async function parse(body) {
	const dom = new JSDOM(body);
	const doc = dom.window.document;
	const posts = [];

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
	return posts;
}

export async function getCurrent(){
	const body = await get();
	if(body == null){
		return []
	}
	return await parse(body)

}

// use an async main function
async function main() {
	const posts = await getCurrent();
	console.log(JSON.stringify(posts));
}

//main();


