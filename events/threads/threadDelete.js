export const data = {
    name: 'threadDelete',
    once: false,
    async execute(thread) {
		console.log('threadDelete', thread.id);

        const row = {
			event: 'threadDelete',
            channelId : thread.id,
        };

        await push_thread_row(channelId, row);
    }
};
