'use client';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { useState } from 'react';
import { MediaResponse } from './page';
import JSZip from 'jszip';

type Props = {
  slug: string;
  chapter: MediaResponse['media']['chapters'][number];
};

export default function ChapterCard({ slug, chapter }: Props) {
  const [loading, setLoading] = useState<boolean>(false);
  const [progressState, setProgressState] = useState<{ value: number; max: number; description: string }>({
    value: 0,
    max: 0,
    description: '',
  });

  const handleDownload = async () => {
    setLoading(true);
    setProgressState({ value: 0, max: chapter.images.length + 2, description: 'Спампоўванне старонак...' });
    const files = [];
    for (let i = 0; i < chapter.images.length; i++) {
      const { large } = chapter.images[i];
      const response = await fetch(large);
      const blob = await response.blob();
      const extension = large.split('.').pop();
      setProgressState(prevState => ({ ...prevState, value: prevState.value + 1 }));
      files.push({ blob, name: `${chapter.chapter}-${i + 1}.${extension}` });
    }
    setProgressState(prevState => ({ ...prevState, value: prevState.value + 1, description: 'Стварэнне архіва...' }));
    const zip = new JSZip();
    for (const { blob, name } of files) {
      zip.file(name, blob);
    }
    const content = await zip.generateAsync({ type: 'blob' });
    setProgressState(prevState => ({ ...prevState, value: prevState.value + 1, description: 'Гатова!' }));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = `${slug}-${chapter.chapter}.zip`;
    a.click();
    URL.revokeObjectURL(a.href);
    a.remove();
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-between gap-8 border p-4 shadow">
      <div className="flex flex-grow flex-col">
        <span className="scroll-m-20 text-2xl font-semibold tracking-tight">Частка {chapter.chapter}</span>
        {chapter.title && <span className="text-sm font-semibold">Назва: {chapter.title}</span>}
      </div>
      <div className="flex flex-grow flex-col items-center gap-0.5">
        {progressState.max !== 0 && (
          <>
            <span className="text-sm font-semibold">{progressState.description}</span>
            <Progress value={progressState.value} max={progressState.max} />
          </>
        )}
      </div>
      <Button disabled={loading} onClick={() => handleDownload()}>
        Спампаваць
      </Button>
    </div>
  );
}
