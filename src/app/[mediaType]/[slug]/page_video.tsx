import EpisodeCard, { AnibelEpisode } from './episodeCard';
import FFmpegLoader from './ffmpegLoader';
import ErrorToasts from './errorToasts';
import * as HLS from 'hls-parser';

type Props = {
  slug: string;
};

type VideoApiResponse = {
  _id: string;
  videoId: string;
  subtitles: {
    path: string;
    fonts: string[];
  }[];
  meta: {
    width: number;
    height: number;
    codec: string;
    aspectRatio: string;
    duraction: number;
    size: string;
    bitRate: string;
    format: string;
    fps: number;
  };
  processing: boolean;
  title: string;
  screenshots: string[];
  views: number;
  createdAt: number;
  __v: number;
  startedProcessingAt: number;
  hls: string;
  stream: string;
  support: {
    dub: boolean;
    sub: boolean;
  };
  host: string;
  processedAt: number;
  episode?: number;
  groupBy?: string;
  mediaType: string;
  season?: number;
};

function convertToEpisode(videoData: VideoApiResponse, type: 'sub' | 'dub'): AnibelEpisode {
  return {
    source: 'anibel',
    number: videoData.episode || 1,
    url: `https://video.anibel.net/${videoData.videoId}`,
    type,
    data: {
      videoId: videoData.videoId,
      title: videoData.title,
      subtitles: videoData.subtitles,
      stream: videoData.stream,
      hls: videoData.hls,
      host: videoData.host,
    },
  };
}

export default async function VideoPage({ slug }: Props) {
  try {
    const response = await fetch(`https://video.anibel.net/api/video/${slug}`, {
      next: { revalidate: 60 },
    });
    const videoData: VideoApiResponse = await response.json();

    // Стварэнне спісу даступных эпізодаў
    const availableEpisodes: AnibelEpisode[] = [];
    const errorMessages: string[] = [];

    // 1) Парсим HLS маніфест, каб вызначыць наяўнасць беларускай/небеларускай дарожак
    let hasBelarusianAudio = false;
    let hasNonBelarusianAudio = false;
    try {
      const manifestUrl = new URL(videoData.hls, videoData.host);
      const manifestText = await fetch(manifestUrl).then(r => r.text());
      const playlist = HLS.parse(manifestText);
      const isMaster = playlist instanceof HLS.types.MasterPlaylist;
      if (isMaster) {
        const variants = (playlist as HLS.types.MasterPlaylist).variants || [];
        const audioRenditions = variants.flatMap(v => v.audio || []);

        const isBelarusian = (value?: string): boolean => {
          if (!value) return false;
          const lower = value.toLowerCase();
          if (lower === 'bel' || lower === 'be') return true;
          return /belarus/i.test(lower) || /\u0431\u0435\u043b/i.test(lower);
        };

        hasBelarusianAudio = audioRenditions.some(a => isBelarusian(a.language) || isBelarusian(a.name));
        hasNonBelarusianAudio = audioRenditions.some(a => !isBelarusian(a.language) && !isBelarusian(a.name));
      } else {
        errorMessages.push('Плэйліст HLS нечаканы. Немагчыма вызначыць аўдыё.');
      }
    } catch {
      errorMessages.push('Не атрымалася распрацаваць маніфест HLS.');
    }

    // 2) SUB: існуюць субцітры «субцітры.ass» і ёсць небеларуская аўдыё дарожка
    const hasSubtitlesFile = videoData.subtitles.some(sub => sub.path.endsWith('субцітры.ass'));
    if (hasSubtitlesFile && hasNonBelarusianAudio) {
      availableEpisodes.push(convertToEpisode(videoData, 'sub'));
    }

    // 3) DUB: вызначаем толькі праз наяўнасць беларускай аўдыё ў плэйлісце
    if (hasBelarusianAudio) {
      availableEpisodes.push(convertToEpisode(videoData, 'dub'));
    }

    // 4) Акуратны fallback: калі нічога не вызначылі, паспрабуем кансерватыўна
    if (availableEpisodes.length === 0) {
      // Калі ёсць субцітры і хоць нейкая аўдыё дарожка не беларуская — даем SUB
      if (hasSubtitlesFile && hasNonBelarusianAudio) {
        availableEpisodes.push(convertToEpisode(videoData, 'sub'));
      }
      // Калі ёсць беларуская аўдыё — даем DUB
      else if (hasBelarusianAudio) {
        availableEpisodes.push(convertToEpisode(videoData, 'dub'));
      } else if (videoData.subtitles.length > 0) {
        // Калі не атрымалася распазнаць аўдыё, але ёсць субцітры — не дадаем SUB,
        // каб не зламаць спампоўку (у SUB патрэбная небеларуская дарожка).
      }
    }

    // Калі нічога не даступна
    if (availableEpisodes.length === 0) {
      const messages = errorMessages.length ? errorMessages : ['Няма даступных варыянтаў для спампоўвання'];
      return (
        <div className="flex flex-grow items-center justify-center">
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight lg:text-5xl">
            Няма даступных варыянтаў для спампоўвання
          </h1>
          <ErrorToasts messages={messages} />
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center gap-16 pt-12">
        <FFmpegLoader />
        <h2 className="scroll-m-20 border-b pb-2 text-center text-3xl font-semibold tracking-tight first:mt-0">
          {videoData.groupBy || videoData.title}
        </h2>
        <div className="flex w-full flex-col gap-3">
          {availableEpisodes.map((episode, index) => (
            <EpisodeCard key={`${episode.type}-${index}`} episode={episode} />
          ))}
        </div>
        {errorMessages.length > 0 && <ErrorToasts messages={errorMessages} />}
      </div>
    );
  } catch (error) {
    return (
      <div className="flex flex-grow items-center justify-center">
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight lg:text-5xl">Памылка пры загрузцы даных відэа</h1>
        <ErrorToasts messages={['Памылка пры загрузцы даных відэа']} />
      </div>
    );
  }
}
