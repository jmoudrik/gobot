import { Events } from 'discord.js';

import { push_thread_row } from '../../misc.js';

export const data = {
    name: Events.MessageCreate,
    once: false,
    async execute(msg) {
        const { channel, channelId, content, id, author, member, createdTimestamp } = msg;
        const { type: channelType, name: channelName } = channel ?? {};
        const { id: authorId, displayName, username, globalName } = author ?? {};
        const { displayName: md, nickname: mn } = member ?? {};

        const row = {
            authorId, channelType, channelName, channelId, content, id, createdTimestamp,
            displayName: md ?? mn ?? displayName,
            displayNameAuthor: displayName,
            displayNameMember: md,
            nicknameMember: mn,
            globalName,
            username,
            event: 'messageCreate'
        };
		{
			const  { displayNameAuthor, displayNameMember, globalName, nicknameMember } = row;
			const subset = { displayNameAuthor, displayNameMember, globalName, nicknameMember };
			console.log(`messageCreate: ${JSON.stringify(subset)} -> ${channelName}: "${content}"`);
		}
        if (channelType == 11) {
            await push_thread_row(channelId, row);
        }
    }
};

