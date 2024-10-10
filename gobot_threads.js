import { list_recent_channels, read_thread_rows, route } from './misc.js';
import { ask_llm, sanitize } from './claude_summarizer.js';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_MIN_MS = 60 * 1000;
const FIVE_SEC_MS = 5 * 1000;

// must be longer than how long does the await report take
const TIMER_RESOLUTION_MS = 4 * 60 * 1000;
//const TIMER_RESOLUTION_MS = 5 * 1000;

const HOUR_REX = /T\d{2}:00:/;
const MIN10_REX = /T\d{2}:\d0:/;
// this is ISO so afaik prague is +2h
const EVERY_MORNING_REX = /T05:3[0-9]/;
//const EVERY_MORNING_REX = /T14:31:/;

const rule_match_rex = (rex) => {
	return () => {
		const now = new Date();
		const dt = now.toISOString()
		console.log("rule_match_rex", {rex, dt});

		return rex.test(dt);
	}
};


const report_stuffs = {
//    'threads-10min': {
//		disabled:false,
//        listInterval: 10 * ONE_MIN_MS,
//        label: "Vlákna aktivní během posledních 10min:\n",
//        refresh_rule: rule_match_rex(MIN10_REX),
//        // not more frequently than
//        minDelta: 5 * ONE_MIN_MS,
//		route_name: ['threads', 'hourly']
//    },
    'threads-daily': {
		disabled: false,
        listInterval: ONE_DAY_MS,
        label: "Vlákna aktivní za posledních 24h:\n",
        refresh_rule: rule_match_rex(EVERY_MORNING_REX),
        // not more frequently than
        minDelta: ONE_DAY_MS - 30 * ONE_MIN_MS,
		route_name: ['threads', 'daily']
    },
};

// row from messageCreate.js
// const row = {authorId, channelType, channelName, channelId, content, id, createdTimestamp};
//
// row from threadUpdate.js
//        const row = {
//            channelId,
//            channelType,
//            channelName,
//            createdTimestamp,
//            parentId: newThread.parentId,
//            ownerId: newThread.ownerId,
//            archived: newThread.archived,
//            locked: newThread.locked,
//            autoArchiveDuration: newThread.autoArchiveDuration
//        };
//
// threadDelete row
//        const row = {
//			event: 'threadDelete',
//            channelId : thread.id,
//        };



const ms_ts_to_iso = (ms) => {
    return new Date(ms).toISOString()
    //return isNaN(date.getTime()) ? 'Invalid Date' : date.toISOString();
};

const MAX_CONTEXT_MSGS = 100;

let RUNNING = false;

const report = async (key, listSince, send_fun, incrementCounter, label, send_to_channel) => {
    const sinceTimeList = Date.now() - listSince;
    console.log(`${(new Date()).toISOString()}: reporting ${key}, listSince ${listSince}\t(${ms_ts_to_iso(sinceTimeList)})`);

	if(RUNNING){
		console.log("already running");
		return false;
	}
	RUNNING = true;

    const tids = await list_recent_channels(sinceTimeList);
    //console.log({ tids });

    const threads = [];
    for (const { channelid, filename, mtime } of tids) {
		if(channelid == send_to_channel){
			continue;
		}
        const agg = {
            channelId: channelid,
            deleted: false,
            name: null,
            messages: [],
            authors: new Set(),
        }
        await read_thread_rows(channelid, (row) => {
            console.assert(row.channelId == channelid);

            if (row.createdTimestamp && row.createdTimestamp < sinceTimeList) {
                return; // Skip old rows
            }

            if (row.event === 'threadDelete') {
                agg.deleted = true;
            } else {
                agg.name = row.channelName || agg.name;

                if (row.content) {
                    agg.messages.push({
                        authorid: row.authorId,
                        displayName: row.displayName,
                        content: row.content
                    });
                    agg.authors.add(row.authorId);
                }
            }
        });
        threads.push(agg);
    }

    const output_rows = [];
    for (const thread of threads) {
        const { channelId, name, deleted, messages } = thread;
        const header = `<#${channelId}>`;
        if (deleted) {
            output_rows.push(`- ${header} byl smazán`);
            continue;
        }
        const texts = [];
        const msgs_ctx = messages.slice(Math.max(0, messages.length - MAX_CONTEXT_MSGS), messages.length - 1);
        for (const { authorid, content, displayName } of msgs_ctx) {
			//texts.push(`<p><user>${authorid}</user>: ${sanitize(content)}</p>`);
            texts.push(`<p><user>${displayName}</user>: ${sanitize(content)}</p>`);
        }
        const head = `<id>${channelId}</id>${sanitize(name)}`;
        const body = texts.join('\n');
        let summary = name;
        if (!deleted && messages.length > 0) {
            console.log("Asking LLM for:", head);
            const llmsum = await ask_llm(head, body);
            console.log("LLM response:", llmsum);
            if (llmsum && llmsum.length > 0) {
                summary = llmsum;
            }
        }
        if (summary != null && summary.length > 0) {
            output_rows.push(`- ${header}: ${summary}`);
        }
    }
    if (output_rows.length > 0) {
		const msg = label + output_rows.join('\n');
    	console.log("sending ", msg.length, " since ",  ms_ts_to_iso(sinceTimeList));
        send_fun(send_to_channel, msg);
    }
    for (const row of output_rows) {
        console.log(row);
    }
    console.log();
	return true;
}


export const setup_periodical_report = (send_fun, incrementCounter) => {
    const last = {};

    setInterval(async () => {
        for (const key of Object.keys(report_stuffs)) {
            const { disabled, minDelta, refresh_rule, listInterval, label, route_name} = report_stuffs[key];
			if(disabled == true) {
				console.log("disabled", key);
				continue;
			}
			const [rk, rv] = route_name;
			const send_to = route(rk, rv);

            const lt = last[key] ?? 0;
            const now = new Date();
            const delta = now - lt;
			const shouldrefresh = refresh_rule();
			//console.log("tick",{key, delta, minDelta, shouldrefresh});
            if (delta >= minDelta && shouldrefresh) {
				
				try{
                	const ret = await report(key, listInterval, send_fun, incrementCounter, label, send_to);
					if(ret){
						last[key] = now;
					}
				}catch(e){
					console.log(e);
				}finally{
					RUNNING = false;
				}
            }
        }
    }, TIMER_RESOLUTION_MS);
};
