'use client';

import { useEffect, useRef, useState } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import { useToast } from '@/components/ui/use-toast';

export default function FFmpegLoader() {
  const [mounted, setMounted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const ffmpegRef = useRef<FFmpeg>(new FFmpeg());
  const toast = useToast();

  const loadFFmpeg = async () => {
    if (window.ffmpeg) return;
    setLoading(true);
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd';
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on('log', ({ message }) => console.log(message));
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    window.ffmpeg = ffmpeg;
    setLoading(false);
    toast.toast({ description: 'FFmpeg паспяхова загружаны.' });
  };

  useEffect(() => {
    setMounted(true);
    loadFFmpeg();
  }, [setMounted]);

  if (!mounted) return null;

  if (loading)
    return (
      <span className="-mb-12">
        Ідзе загрузка FFmpeg, гэта трэба для таго, каб спампоўваць відэа з плэера Anibel. Калі ласка, пачакайце…
      </span>
    );
  return null;
}
