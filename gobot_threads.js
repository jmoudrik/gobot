import { list_recent_channels, read_thread_rows, route } from './misc.js';
import { ask_llm, sanitize } from './claude_summarizer.js';

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

const report = async (key, listSince, send_fun, incrementCounter, label, send_to_channel) => {

    const sinceTimeList = Date.now() - listSince;
    console.log(`${(new Date()).toISOString()}: reporting ${key}, listSince ${listSince}\t(${ms_ts_to_iso(sinceTimeList)})`);
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
        for (const { authorid, content } of msgs_ctx) {
            texts.push(`<p><user>${authorid}</user>: ${sanitize(content)}</p>`);
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
    console.log("channel changes since", ms_ts_to_iso(sinceTimeList));
    if (output_rows.length > 0) {
        send_fun(send_to_channel, label + output_rows.join('\n'));
    }
    for (const row of output_rows) {
        console.log(row);
    }
    console.log();
    console.log();
    console.log();
	return true;
}


const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_MIN_MS = 60 * 1000;
const FIVE_SEC_MS = 5 * 1000;
const TIMER_RESOLUTION_MS = 10 * 1000;

const HOUR_REX = /T\d{2}:00:/

const rule_match_every_whole_hour = () => {
    const now = new Date();
    return HOUR_REX.test(now.toISOString());
};

const report_stuffs = {
    'threads-hourly': {
        listInterval: 60 * ONE_MIN_MS,
        label: "Vlákna aktivní během poslední hodiny:\n",
        refresh_rule: rule_match_every_whole_hour,
        // not more frequently than
        minDelta: 30 * ONE_MIN_MS,
		route_name: ['threads', 'hourly']
    },
};

export const setup_periodical_report = (send_fun, incrementCounter) => {
    const last = {};

    setInterval(async () => {
        for (const key of Object.keys(report_stuffs)) {
            const { minDelta, refresh_rule, listInterval, label, route_name} = report_stuffs[key];
			const [rk, rv] = route_name;
			const send_to = route(rk, rv);

            const lt = last[key] ?? 0;
            const now = new Date();
            const delta = now - lt;
            if (delta >= minDelta && refresh_rule()) {
				
				try{
                	const ret = await report(key, listInterval, send_fun, incrementCounter, label, send_to);
					if(ret){
						last[key] = now;
					}
				}catch(e){
					console.log(e);
				}
            }
        }
    }, TIMER_RESOLUTION_MS);
};
