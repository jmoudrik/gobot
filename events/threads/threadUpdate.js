import { push_thread_row } from '../../misc.js';

export const data = {
    name: 'threadUpdate',
    once: false,
    async execute(oldThread, newThread) {
        console.log('threadUpdate');
        
        if (oldThread.id !== newThread.id) {
            console.log('Thread IDs do not match');
            return;
        }

        const channelId = newThread.id;
        const channelType = newThread.type;
        const channelName = newThread.name;
        const createdTimestamp = newThread.createdTimestamp;

        const row = {
			event: 'threadUpdate',
            channelId,
            channelType,
            channelName,
            createdTimestamp,
            parentId: newThread.parentId,
            ownerId: newThread.ownerId,
            archived: newThread.archived,
            locked: newThread.locked,
            autoArchiveDuration: newThread.autoArchiveDuration
        };

        await push_thread_row(channelId, row);
    }
};
