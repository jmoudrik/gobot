import { check } from './diff.js';
import { fmt } from './fmt.js';
import { route } from './misc.js';


const oneMin = 60 * 1000;

const sites = {
    'goweb': {
        interval: 1 * oneMin,
    },
    'egf': {
        interval: 10 * oneMin,
    },
    'omg': {
        interval: 1 * oneMin,
    },
    'k2ss': {
        interval: 60 * oneMin,
    },
};

const refresh = async (key, send_fun, incrementCounter) => {
    console.log(`${(new Date()).toString()}: checking ${key}`)
    const updates = await check(key);
    const msgs = await fmt(key, updates);
    for (const { msg, kind } of msgs) {
        const channel = route(key, kind);
        send_fun(channel, msg).catch(console.error);
        incrementCounter(key, kind);
    }
    if (msgs.length == 0) {
        console.log('nop');
    }
    return msgs.length > 0;
}

export const setup_periodical_refresh = (send_fun, incrementCounter) => {
    for (const key of Object.keys(sites)) {
        const { interval } = sites[key];
        const refreshClozed = () => refresh(key, send_fun, incrementCounter)

        refreshClozed();
        setInterval(() => refreshClozed(), interval);
    }
}
