'use client';

import { useEffect } from 'react';
import { MediaResponse } from './page';

type Props = {
  chapters: MediaResponse['media']['chapters'];
};

export default function LogChapters({ chapters }: Props) {
  useEffect(() => {
    console.log(
      "%cHi, here is a chapters array, maybe it'll be useful for you:\n",
      'font-size: 1rem; font-weight: bold; color: #f00; margin-bottom: 0.5rem;',
      chapters,
    );
  }, [chapters]);

  return null;
}
