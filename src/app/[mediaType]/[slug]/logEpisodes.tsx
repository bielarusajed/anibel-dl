'use client';

import type { Episode } from './episodeCard';
import { useEffect } from 'react';

type Props = {
  episodes: Episode[];
};

export default function LogEpisodes({ episodes }: Props) {
  useEffect(() => {
    console.log(
      "%cHi, here is an episodes array, maybe it'll be useful for you:\n",
      'font-size: 1rem; font-weight: bold; color: #f00; margin-bottom: 0.5rem;',
      episodes,
    );
  }, [episodes]);

  return null;
}
