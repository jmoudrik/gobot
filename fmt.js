
import { AttachmentBuilder, userMention, bold, italic, strikethrough, underscore, spoiler, quote, blockQuote, hyperlink, hideLinkEmbed } from 'discord.js';

import { check } from './diff.js';
import { picfetch } from './fetchpic.js';

const kluci = ['lukan', 'siscurge', 'tomáš grosser'];
const holky = ['mamutik', 'ada'];
const discordmap = {
    'ondřej kruml': '296387064566644736', 'siscurge': '296387064566644736', 'lukan': '299594384373186560', 'kono': '575820945563058202',
    'aleš': '463272713587261450', 'hidoshito': '299595394843803648'
}

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

const preppic = async (url, name = null) => {
    let imgurl;
    let extra = {};
    if (url) {
        const buffer = await picfetch(url);
        if (buffer != null) {
            // arraybuffer -> buffer
            const realName = name ?? 'pic.jpg';
            const file = new AttachmentBuilder(buffer, { name: realName });
            imgurl = 'attachment://' + realName;
            extra['files'] = [file];
            //console.dir(file)
        }
    }
    return { imgurl, extra };
}

const fmtnew_post_goweb = async (p) => {
    {
        const txt = `${p.autor} ${bold(optmention(p.autor))} ${fmtnapsal(p.autor)} (${p['updated-nice']}):\n${hyperlink(p.title, p.link)}`;
        console.group(`fmtnew_goweb: ${p.id}`);
        console.log(txt);
        console.groupEnd();
    }

    const { imgurl, extra } = await preppic(p.img);

    const embed = {
        color: 0xff9500,
        title: p.title,
        url: p.link,
        author: {
            name: 'goweb.cz — nový článek',
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

const fmtnew_post_egf = async (p) => {
    {
        const txt = `${p.autor} ${bold(optmention(p.autor))} ${fmtnapsal(p.autor)} (${p['updated-nice']}):\n${hyperlink(p.title, p.link)}`;
        console.group(`fmtnew_egf: ${p.id}`);
        console.log(txt);
        console.groupEnd();
    }

    const { imgurl, extra } = await preppic(p.img);

    const embed = {
        color: 0xfcf003,
        title: p.title,
        url: p.link,
        author: {
            name: 'eurogofed.org — nový článek',
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

const fmtnew_post_omg = async (p) => {
    {
        const txt = `${p.autor} ${bold(optmention(p.autor))} ${fmtnapsal(p.autor)} (${p['updated-nice']}):\n${hyperlink(p.title, p.link)}`;
        console.group(`fmtnew_egf: ${p.id}`);
        console.log(txt);
        console.groupEnd();
    }
    // just post the bloody link YT embed is nice
    return `OMG, ${bold(optmention(p.autor))} má nové video!\n` + hyperlink(p.title, p.link);

    // TODO
    const { imgurl, extra } = await preppic(p.img);

    const embed = {
        color: 0xff0000,
        title: p.title,
        url: p.link,
        author: {
            name: 'YouTube — nové OMG video',
            //icon_url: 'https://i.imgur.com/ZVTlugr.png',
            //url: 'https://eurogofed.org/',
        },
        description: p['txt'],
        /*
        thumbnail: {
            url: 'https://i.imgur.com/AfFp7pu.png',
        },
        */
        fields: [
            { name: 'Autor:', value: `${optmention(p.autor)}`, inline: true, },
            //{ name: 'Kategorie', value: p['kat'], inline: true, },
        ],
        //image: { url: imgurl, },
        timestamp: p['updated'],
        //footer: { text: p['updated-nice'], },
    };
    const ret = { embeds: [embed], ...extra };
    //console.log(JSON.stringify(embed, undefined, 2));
    return ret;
}

const shorten = (s, N = 100, hyp = true) => {
    if (s.length < N)
        return s;
    return s.slice(0, N - (hyp ? 3 : 0)) + (hyp ? '...' : '');
}
const maybeMiddleOfWord = /[a-zA-Z0-9 _-]$/;
const maybe_add_ellipsis = (s) => {
    if (!s || !maybeMiddleOfWord.test(s)) {
        return s;
    }
    // if we end in what maybe is middle of word, add ellipsis
    return s + "...";
}

const space2hyphen = (s) => {
    return s.replaceAll(/ /g, '-').replaceAll(/-+/g, '-')
}

const fmtnew_comment_goweb = async (p) => {
    console.dir(p)
    /*
    {
        const txt = `${p.autor} ${bold(optmention(p.autor))} ${fmtnapsal(p.autor)} (${p['updated-nice']}):\n${hyperlink(p.title, p.link)}`;
        console.group(`fmtnew_goweb: ${p.id}`);
        console.log(txt);
        console.groupEnd();
    }
    */
    //const pname = space2hyphen((p.autor + "-" + shorten(`${p['comment']}`, 20, false)).trim());
    const pname = p.autor + '_avatar.jpg';

    const { imgurl, extra } = await preppic(p.avatarpic, pname);
    console.log({ imgurl });
    //const extra = {};

    const embed = {
        color: 0x34eb80,
        title: p.title,
        url: p.link,
        ///*
        author: {
            name: 'goweb.cz — nový komentář',
            icon_url: 'https://i.imgur.com/i0sGv6R.png',
            url: 'https://goweb.cz',
        },
        // */
        description: `${optmention(p.autor)} k článku: ${hyperlink(shorten(p.article), p['link'])}

${maybe_add_ellipsis(p['comment'])}`,
        thumbnail: {
            //url: 'https://i.imgur.com/AfFp7pu.png',
            url: imgurl,
        },
        /*
        */
        fields: [
            //{ name: 'Autor:', value: ``, inline: true, },
            //{ name: 'K článku:', value: `${}`, inline: true, },
            ///{ name: 'Inline field title', value: 'Some value here', inline: true, },
            //{ name: '', value: '', inline: true, },
        ],
        //image: { url: imgurl, },
        //timestamp: p['updated'],
        footer: { text: p['updated-nice'], },
    };
    const ret = { embeds: [embed], ...extra };
    //console.log(JSON.stringify(embed, undefined, 2));
    return ret;
}


const sites = {
    'goweb': {
        comments: {
            sort: (a) => a.reverse(),
            fmt_one: fmt_if_new(fmtnew_comment_goweb)
        },
        posts: {
            // new first on page -> new last to post
            sort: (a) => a.reverse(),
            fmt_one: fmt_if_new(fmtnew_post_goweb)
        }
    },
    'egf': {
        posts: {
            sort: (a) => a.reverse(),
            fmt_one: fmt_if_new(fmtnew_post_egf)
        }
    },
    'omg': {
        posts: {
            sort: (a) => a.reverse(),
            fmt_one: fmt_if_new(fmtnew_post_omg)
        }
    }
}

export const fmt = async (key, deltas) => {
    const formatters = sites[key];
    const msgs = [];
    for (const kind of Object.keys(deltas)) {
        if (formatters[kind] == undefined) continue;

        const { sort, fmt_one } = formatters[kind];
        const updates = deltas[kind];
        console.log(`fmt got ${updates.length}`);

        for (const p of sort(updates)) {
            const msg = await fmt_one(p);
            if (msg != null) {
                msgs.push({ msg, kind });
            }
        }
    }
    return msgs;
}


async function main() {
    const key = 'goweb';
    const deltas = await check(key);
    const msgs = await fmt(key, deltas)
    for (const msg of msgs) {
        //console.log(JSON.stringify(msg, undefined, 2));
        console.log(JSON.stringify(msg?.embeds, undefined, 2));
    }
}

//main();

