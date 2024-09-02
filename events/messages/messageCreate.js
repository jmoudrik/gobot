import { Events } from 'discord.js';

import { push_thread_row } from '../../misc.js';

export const data = {
    name: Events.MessageCreate,
    once: false,
    async execute(msg) {
        console.log('messageCreate');
        const { channel, channelId, content, id, author, createdTimestamp } = msg;
        const { type: channelType, name: channelName } = channel ?? {};
        const { id: authorId } = author ?? {};

        if (channelType == 11) {
            const row = {
                authorId, channelType, channelName, channelId, content, id, createdTimestamp,
                event: 'messageCreate'
            };
            await push_thread_row(channelId, row);
        }
    }
};



