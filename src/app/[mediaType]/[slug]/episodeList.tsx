import EpisodeCard, { AnibelEpisode, Episode, GoogleEpisode } from './episodeCard';
import { MediaResponse } from './page';
import { useRef, useState } from 'react';

const typePriorities = {
  sub: 0,
  dub: 1,
};

type Props = {
  episodes: MediaResponse['media']['episodes'];
};

export async function EpisodeList({ episodes: rawEpisodes }: Props) {
  const episodes: Episode[] = [];

  for (const episode of rawEpisodes) {
    try {
      const url = new URL(episode.url);
      if (url.host === 'drive.google.com') {
        const { fileId } = url.pathname.match(/\/file\/d\/(?<fileId>\S+)\/\S+/i)?.groups ?? {};
        if (!fileId) continue;
        episodes.push({
          source: 'google',
          number: episode.episode,
          url: `https://drive.google.com/uc?id=${fileId}`,
          type: episode.type,
        } as GoogleEpisode);
        continue;
      }
      if (url.host === 'video.anibel.net') {
        const videoId = url.pathname.slice(1);
        const body = new FormData();
        body.set('videoId', videoId);
        const response = await fetch('https://api.anibel.stream/video', { method: 'POST', body });
        const data = (await response.json()) as AnibelEpisode['data'];
        episodes.push({
          source: 'anibel',
          number: episode.episode,
          url: episode.url,
          type: episode.type,
          data,
        } as AnibelEpisode);
      }
    } catch {}
  }

  episodes.sort((a, b) => a.number - b.number || typePriorities[a.type] - typePriorities[b.type]);
  return (
    <div className="flex flex-col gap-3">
      {episodes.map(episode => (
        <EpisodeCard key={`${episode.source}-${episode.number}-${episode.url}`} episode={episode} />
      ))}
    </div>
  );
}
