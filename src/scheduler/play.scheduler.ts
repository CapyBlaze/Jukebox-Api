import pc from "picocolors";

import { prisma } from "../prisma.js";
import * as QueueService from "../services/queue.service.js";

const CHECK_INTERVAL_MS = 5000;
const FALLBACK_DURATION_SEC = 240;

export function startPlaybackScheduler() {
    setInterval(async () => {
        try {
            const playingGroups = await prisma.group.findMany({
                where: {
                    isPlaying: true,
                    currentTrackId: { not: null },
                },
                include: {
                    queue: true,
                },
            });

            for (const group of playingGroups) {
                const currentTrack = group.queue.find((music) => music.id === group.currentTrackId);
                if (!currentTrack || !group.playbackStartedAt) continue;

                const elapsedTimeSec = (Date.now() - group.playbackStartedAt.getTime()) / 1000;
                const duration = currentTrack.durationSec ?? FALLBACK_DURATION_SEC;

                if (elapsedTimeSec >= duration) {
                    await QueueService.skip(group.code);
                }
            }
        } catch (error) {
            const date = new Date().toISOString();
            console.log(
                `${pc.gray(`[${date}]`)} ` +
                    `${pc.red(pc.bold("ERROR"))} ` +
                    `Playback scheduler encountered an error: ${pc.dim((error as Error).message)}`
            );
        }
    }, CHECK_INTERVAL_MS);

    console.log(
        `${pc.gray(`[${new Date().toISOString()}]`)} ` +
            `${pc.green(pc.bold("INFO"))} ` +
            `Playback scheduler started, checking every ${CHECK_INTERVAL_MS / 1000} seconds.`
    );
}
