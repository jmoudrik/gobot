import { SlashCommandBuilder } from 'discord.js';

const startTime = new Date();

function calculateUptime() {
    // Get the current time
    const currentTime = new Date();

    // Calculate the difference in milliseconds
    const diff = currentTime - startTime;

    // Convert the difference to days, hours, minutes, and seconds
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    const ps = (wut) => wut.toString().padStart(2, '0');

    return `Gobot stats\n\nuptime: **${days} days, ${ps(hours)}:${ps(minutes)}:${ps(seconds)}**`;
}

const fmtCounters = () => {
    const cnt = [];

    for (const key of Object.keys(global.counter)) {
        const val = global.counter[key];
        cnt.push(`  ${key}: **${val}**`);
    }

    return cnt.join("\n");
}

export const data = new SlashCommandBuilder()
    .setName('server')
    .setDescription('Provides information about the server.');
export async function execute(interaction) {
    console.dir(interaction)

    const content = `${calculateUptime()}\ncounters:\n${fmtCounters()}`

    await interaction.reply({ content, ephemeral: true });
}

