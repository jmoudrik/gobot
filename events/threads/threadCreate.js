export const data = {
    name: 'ThreadCreate',
    once: false,
    async execute(thread) {
		console.log('threadCreate', thread.id);
		//console.dir(thread);
    }
};
