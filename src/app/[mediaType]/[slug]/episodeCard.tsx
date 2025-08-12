'use client';

import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import * as HLS from 'hls-parser';
import urlJoin from 'url-join';
import { Progress } from '@/components/ui/progress';

export type GoogleEpisode = {
  source: 'google';
  number: number;
  url: string;
  type: 'sub' | 'dub';
};

export type AnibelEpisode = {
  source: 'anibel';
  number: number;
  url: string;
  type: 'sub' | 'dub';
  data: {
    videoId: string;
    title: string;
    subtitles: { path: string; fonts: any[] }[];
    stream: string;
    hls: string;
    host: string;
  };
};

export type Episode = GoogleEpisode | AnibelEpisode;

type Props = { episode: Episode };

const sourceNames = {
  google: 'Google Drive',
  anibel: 'Плэер Anibel',
};

const typeNames = {
  sub: 'Субцітры',
  dub: 'Агучка',
};

const fontsMimes = {
  TTF: 'application/x-truetype-font',
  OTF: 'font/otf',
  WOFF: 'font/woff',
} as { [key: string]: string };

export default function EpisodeCard({ episode }: Props) {
  const [loading, setLoading] = useState<boolean>(false);
  const [progressState, setProgressState] = useState<{ value: number; max: number; description: string }>({
    value: 0,
    max: 0,
    description: '',
  });
  const toast = useToast();

  let ffmpeg: FFmpeg | null = null;
  if (typeof window !== 'undefined') if (window.ffmpeg) ffmpeg = window.ffmpeg;

  const handleCopyLink = async () => {
    if (episode.source !== 'anibel') return;
    const manifestUrl = await new Promise<URL>(r => r(new URL(episode.data.hls, episode.data.host))).catch(() => null);
    if (!manifestUrl)
      return toast.toast({
        title: 'Памылка скапіявання',
        description: 'Не атрымалася пабудаваць спасылку на маніфест.',
        variant: 'destructive',
      });
    navigator.clipboard.writeText(manifestUrl.toString()).then(() => {
      toast.toast({
        title: 'Спасылка скапіявана',
        description: 'Спасылка на плэй-ліст была паспяхова скапіявана ў ваш буфер абмену.',
      });
    });
  };

  const handleDownload = async (height?: number | 'sub' | 'dub' | 'signs') => {
    if (episode.source === 'google') return window.open(episode.url, '_blank');
    if (episode.source !== 'anibel')
      return toast.toast({
        title: 'Немагчыма спампаваць',
        description: 'Невядомая крыніца відэа.',
        variant: 'destructive',
      });
    if (height === 'sub') {
      const subFile = episode.data.subtitles.find(s => s.path.endsWith('субцітры.ass')) || episode.data.subtitles[0];
      if (!subFile)
        return toast.toast({
          title: 'Няма файла субцітраў',
          description: 'Файл "субцітры.ass" не знойдзены.',
          variant: 'destructive',
        });
      const a = document.createElement('a');
      a.href = new URL(subFile.path, episode.data.host).href;
      a.target = '_blank';
      a.click();
      return a.remove();
    }

    if (height === 'signs') {
      const signsFile = episode.data.subtitles.find(s => s.path.endsWith('надпісы.ass'));
      if (!signsFile)
        return toast.toast({
          title: 'Няма файла надпісаў',
          description: 'Файл "надпісы.ass" не знойдзены.',
          variant: 'destructive',
        });
      const a = document.createElement('a');
      a.href = new URL(signsFile.path, episode.data.host).href;
      a.target = '_blank';
      a.click();
      return a.remove();
    }

    if (!ffmpeg)
      return toast.toast({
        title: 'FFmpeg адсутнічае',
        description: 'Калі ласка, перазагрузіце старонку і паспрабуйце зноў',
        variant: 'destructive',
      });
    setLoading(true);

    const baseUrl = urlJoin(episode.data.host, episode.data.hls.split('/').slice(0, -1).join('/'));
    const mUrl = await new Promise<URL>(r => r(new URL(episode.data.hls, episode.data.host))).catch(() => null);
    if (!mUrl)
      return toast.toast({
        title: 'Памылка спампоўвання',
        description: 'Не атрымалася пабудаваць спасылку на маніфест.',
        variant: 'destructive',
      });
    const manifest = await fetch(mUrl)
      .then(r => r.text())
      .catch(() => null);
    if (!manifest)
      return toast.toast({
        title: 'Памылка спампоўвання',
        description: 'Не атрымалася атрымаць змесціва маніфеста.',
        variant: 'destructive',
      });

    const playlist = HLS.parse(manifest);
    if (!(playlist instanceof HLS.types.MasterPlaylist))
      return toast.toast({
        title: 'Памылка апрацоўкі',
        description: 'Спампаваны плэйліст памылковы.',
        variant: 'destructive',
      });

    let variant: HLS.types.Variant | null = null;

    if (typeof height === 'number')
      variant = playlist.variants.reduce(function (prev, curr) {
        return Math.abs((curr.resolution?.height || 0) - height) < Math.abs((prev.resolution?.height || 0) - height)
          ? curr
          : prev;
      });
    if (!variant) variant = playlist.variants.find(() => true) || null;
    if (!variant)
      return toast.toast({
        title: 'Памылка апрацоўкі',
        description: 'Спампаваны плэйліст не змяшчае відэа.',
        variant: 'destructive',
      });

    const videoBaseUrl = urlJoin(baseUrl, variant.uri.split('/').slice(0, -1).join('/'));
    const videoManifestUrl = urlJoin(baseUrl, variant.uri);
    const videoManifest = await fetch(videoManifestUrl)
      .then(r => r.text())
      .catch(() => null);
    if (!videoManifest)
      return toast.toast({
        title: 'Памылка спампоўвання',
        description: 'Не атрымалася спампаваць маніфест відэа.',
        variant: 'destructive',
      });

    const video = HLS.parse(videoManifest);
    if (!(video instanceof HLS.types.MediaPlaylist))
      return toast.toast({
        title: 'Памылка апрацоўкі',
        description: 'Спампаваны плэйліст відэа памылковы.',
        variant: 'destructive',
      });

    const audioVariant = variant.audio.find(audio => {
      if (episode.type === 'dub') return !!audio.language?.match(/^bel?$/i);
      if (episode.type === 'sub') return !audio.language?.match(/^bel?$/i);
    });

    if (!audioVariant)
      return toast.toast({
        title: 'Памылка апрацоўкі',
        description: 'Аўдыё не было знойдзенае.',
        variant: 'destructive',
      });

    const audioBaseUrl = urlJoin(baseUrl, audioVariant.uri?.split('/').slice(0, -1).join('/') || '');
    const audioManifestUrl = urlJoin(baseUrl, audioVariant.uri || '');
    const audioManifest = await fetch(audioManifestUrl)
      .then(r => r.text())
      .catch(() => null);
    if (!audioManifest)
      return toast.toast({
        title: 'Памылка спампоўвання',
        description: 'Не атрымалася спампаваць маніфест аўдыё.',
        variant: 'destructive',
      });

    const audio = HLS.parse(audioManifest);
    if (!(audio instanceof HLS.types.MediaPlaylist))
      return toast.toast({
        title: 'Памылка апрацоўкі',
        description: 'Спампаваны плэйліст аўдыё памылковы.',
        variant: 'destructive',
      });

    // Выбар файла субцітраў для ўбудавання ў выніковае відэа:
    //  - для SUB: поўныя субцітры ("субцітры.ass"), калі няма — бярэм першы даступны
    //  - для DUB: толькі знак-субы ("надпісы.ass"), калі няма — не ўбудоўваем нічога
    const fullSubs = episode.data.subtitles.find(s => s.path.endsWith('субцітры.ass'));
    const signSubs = episode.data.subtitles.find(s => s.path.endsWith('надпісы.ass'));
    const subtitles = episode.type === 'sub' ? fullSubs || episode.data.subtitles[0] : signSubs || undefined;

    setProgressState({
      value: 0,
      max:
        height !== 'dub'
          ? video.segments.length + audio.segments.length + (subtitles?.fonts.length ? subtitles?.fonts.length + 7 : 6)
          : audio.segments.length + 1,
      description: height !== 'dub' ? 'Спампоўванне відэа…' : 'Спампоўванне аўдыё…',
    });

    await ffmpeg.createDir('video');
    await ffmpeg.createDir('audio');
    await ffmpeg.createDir('fonts');

    if (height !== 'dub') {
      await ffmpeg.writeFile('video/manifest.m3u8', videoManifest);
      const videoInit = video.segments[0].map?.uri;
      if (videoInit)
        await ffmpeg.writeFile(urlJoin('video', videoInit), await fetchFile(urlJoin(videoBaseUrl, videoInit)));
      setProgressState(prevState => ({ ...prevState, value: prevState.value + 1 }));
      for (const segment of video.segments) {
        await ffmpeg.writeFile(urlJoin('video', segment.uri), await fetchFile(urlJoin(videoBaseUrl, segment.uri)));
        setProgressState(prevState => ({ ...prevState, value: prevState.value + 1 }));
      }

      setProgressState(prevState => ({ ...prevState, description: 'Спампоўванне субцітраў…' }));
      SUB_DOWNLOAD: if (subtitles) {
        await ffmpeg.writeFile('subtitles.ass', await fetchFile(new URL(subtitles.path, episode.data.host).href));
        setProgressState(prevState => ({
          ...prevState,
          value: prevState.value + 1,
          description: 'Спампоўванне шрыфтоў…',
        }));
        if (subtitles.fonts.length === 0) break SUB_DOWNLOAD;
        const fonts = await fetch('/api/fonts', {
          method: 'POST',
          body: JSON.stringify({ fontNames: subtitles.fonts }),
          headers: { 'Content-Type': 'application/json' },
        })
          .then(r => r.json() as Promise<string[]>)
          .catch(() => null);
        setProgressState(prevState => ({ ...prevState, value: prevState.value + 1 }));
        if (!fonts) {
          toast.toast({
            title: 'Памылка спампоўвання шрыфтоў',
            description: 'Не атрымалася атрымаць спіс шрыфтоў. Выніковы файл не будзе змяшчаць шрыфты.',
            variant: 'destructive',
          });
          break SUB_DOWNLOAD;
        }
        for (const font of fonts) {
          await ffmpeg.writeFile(urlJoin('fonts', font.split('/').slice(-1)[0]), await fetchFile(font));
          setProgressState(prevState => ({ ...prevState, value: prevState.value + 1 }));
        }
        setProgressState(prevState => ({
          ...prevState,
          value: prevState.value + subtitles.fonts.length - fonts.length,
        }));
      }
      setProgressState(prevState => ({ ...prevState, description: 'Спампоўванне аўдыё…' }));
    }
    await ffmpeg.writeFile('audio/manifest.m3u8', audioManifest);
    const audioInit = audio.segments[0].map?.uri;
    if (audioInit)
      await ffmpeg.writeFile(urlJoin('audio', audioInit), await fetchFile(urlJoin(audioBaseUrl, audioInit)));
    setProgressState(prevState => ({ ...prevState, value: prevState.value + 1 }));
    for (const segment of audio.segments) {
      await ffmpeg.writeFile(urlJoin('audio', segment.uri), await fetchFile(urlJoin(audioBaseUrl, segment.uri)));
      setProgressState(prevState => ({ ...prevState, value: prevState.value + 1 }));
    }

    setProgressState(prevState => ({ ...prevState, description: 'Аб’яднанне спампаваных файлаў…' }));
    try {
      if (height !== 'dub') {
        await ffmpeg.exec(['-i', 'video/manifest.m3u8', '-c:v', 'copy', 'video.mp4']);
        setProgressState(prevState => ({ ...prevState, value: prevState.value + 1 }));
      }
      await ffmpeg.exec(['-i', 'audio/manifest.m3u8', '-c:a', 'copy', 'audio.m4a']);
      setProgressState(prevState => ({ ...prevState, value: prevState.value + 1 }));

      await ffmpeg
        .listDir('audio')
        .then(f => Promise.all(f.filter(f => !f.isDir).map(f => ffmpeg!.deleteFile(`audio/${f.name}`))))
        .then(() => ffmpeg?.deleteDir('audio'));

      if (height === 'dub') {
        const data = await ffmpeg.readFile('audio.m4a');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([data], { type: 'audio/mp4' }));
        a.download = episode.data.title + '.m4a';
        a.click();
        URL.revokeObjectURL(a.href);
        a.remove();
        await ffmpeg.deleteFile('audio.m4a');
        setProgressState(prevState => ({ ...prevState, value: prevState.value + 1, description: 'Гатова!' }));
        return setLoading(false);
      }

      await ffmpeg
        .listDir('video')
        .then(f => Promise.all(f.filter(f => !f.isDir).map(f => ffmpeg!.deleteFile(`video/${f.name}`))))
        .then(() => ffmpeg?.deleteDir('video'));

      await ffmpeg.exec([
        '-i',
        'video.mp4',
        '-i',
        'audio.m4a',
        ...[subtitles ? ['-i', 'subtitles.ass'] : []].flat(),
        '-c',
        'copy',
        ...[
          subtitles
            ? (await ffmpeg.listDir('fonts'))
                .filter(f => !f.isDir)
                .map((f, i) => [
                  '-attach',
                  `fonts/${f.name}`,
                  `-metadata:s:t:${i}`,
                  `mimetype=${fontsMimes[f.name.split('.').slice(-1)[0].toUpperCase()] || 'application/octet-stream'}`,
                ])
                .flat()
            : [],
        ].flat(),
        'output.mkv',
      ]);
      setProgressState(prevState => ({ ...prevState, value: prevState.value + 1, description: 'Гатова!' }));
      await ffmpeg.deleteFile('video.mp4');
      await ffmpeg.deleteFile('audio.m4a');
      await ffmpeg
        .listDir('fonts')
        .then(f => Promise.all(f.filter(f => !f.isDir).map(f => ffmpeg!.deleteFile(`fonts/${f.name}`))))
        .then(() => ffmpeg!.deleteDir('fonts'));
    } catch (e) {
      toast.toast({
        title: 'Памылка апрацоўкі спампаваных файлаў',
        description: 'Паспрабуйце абнавіць старонку і паўтарыць зноў.',
        variant: 'destructive',
      });
    }

    const data = await ffmpeg.readFile('output.mkv');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([data], { type: 'video/mkv' }));
    a.download = episode.data.title + (episode.data.title.endsWith('.mkv') ? '' : '.mkv');
    a.click();
    URL.revokeObjectURL(a.href);
    a.remove();

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-between gap-8 border p-4 shadow">
      <div className="flex flex-grow flex-col">
        <span className="scroll-m-20 text-2xl font-semibold tracking-tight">Серыя {episode.number}</span>
        {episode.source === 'anibel' && (
          <span className="text-sm text-muted-foreground">Назва файла: {episode.data.title}</span>
        )}
        <span className="text-sm font-semibold">Тып: {typeNames[episode.type]}</span>
        <span className="text-sm font-semibold">Крыніца: {sourceNames[episode.source]}</span>
      </div>
      <div className="flex flex-grow flex-col items-center gap-0.5">
        {progressState.max !== 0 && (
          <>
            <span className="text-sm font-semibold">{progressState.description}</span>
            <Progress value={progressState.value} max={progressState.max} />
          </>
        )}
      </div>
      {episode.source === 'anibel' ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button disabled={loading} variant="outline">
              Спампаваць
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            <DropdownMenuItem disabled={!ffmpeg} onClick={() => handleDownload(1080)}>
              1080p
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!ffmpeg} onClick={() => handleDownload(720)}>
              720p
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!ffmpeg} onClick={() => handleDownload(360)}>
              360p
            </DropdownMenuItem>
            {episode.type === 'sub' && (
              <DropdownMenuItem onClick={() => handleDownload('sub')}>Толькі субцітры</DropdownMenuItem>
            )}
            {episode.type === 'dub' && episode.data.subtitles.some(s => s.path.endsWith('надпісы.ass')) && (
              <DropdownMenuItem onClick={() => handleDownload('signs')}>Надпісы</DropdownMenuItem>
            )}
            {episode.type === 'dub' && (
              <DropdownMenuItem disabled={!ffmpeg} onClick={() => handleDownload('dub')}>
                Толькі агучка
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => handleCopyLink()}>Скапіяваць спасылку на плэй-ліст</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button disabled={loading} onClick={() => handleDownload()}>
          Спампаваць
        </Button>
      )}
    </div>
  );
}
