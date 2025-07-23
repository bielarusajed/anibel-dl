import EpisodeCard, { AnibelEpisode } from './episodeCard';
import FFmpegLoader from './ffmpegLoader';

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
    console.dir(videoData);
    console.log('=== DEBUG INFO ===');
    console.log('Support object:', videoData.support);
    console.log('Subtitles array:', videoData.subtitles);
    console.log('Subtitles length:', videoData.subtitles.length);
    videoData.subtitles.forEach((sub, index) => {
      console.log(`Subtitle ${index}:`, sub.path);
    });

    // Стварэнне спісу даступных эпізодаў
    const availableEpisodes: AnibelEpisode[] = [];

    // Вызначаем даступныя тыпы па назвах файлаў субцітраў
    const hasSubtitles = videoData.subtitles.some(sub => sub.path.endsWith('субцітры.ass'));
    const hasSigns = videoData.subtitles.some(sub => sub.path.endsWith('надпісы.ass'));

    console.log('Has субцітры.ass (SUB):', hasSubtitles);
    console.log('Has надпісы.ass (DUB):', hasSigns);

    if (hasSubtitles) {
      console.log('Adding SUB episode based on subtitle file');
      availableEpisodes.push(convertToEpisode(videoData, 'sub'));
    }

    if (hasSigns) {
      console.log('Adding DUB episode based on signs file');
      availableEpisodes.push(convertToEpisode(videoData, 'dub'));
    }

    // Fallback: калі няма спецыфічных файлаў, але ёсць субцітры - паказаць як sub
    if (availableEpisodes.length === 0 && videoData.subtitles.length > 0) {
      console.log('No specific subtitle files found, but subtitles exist - adding SUB episode as fallback');
      availableEpisodes.push(convertToEpisode(videoData, 'sub'));
    }

    console.log('Final available episodes:', availableEpisodes.length);
    console.log(
      'Episodes:',
      availableEpisodes.map(ep => ({ type: ep.type, number: ep.number })),
    );

    // Калі нічога не даступна
    if (availableEpisodes.length === 0) {
      return (
        <div className="flex flex-grow items-center justify-center">
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight lg:text-5xl">
            Няма даступных варыянтаў для спампоўвання
          </h1>
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
      </div>
    );
  } catch (error) {
    console.error('Error fetching video data:', error);
    return (
      <div className="flex flex-grow items-center justify-center">
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight lg:text-5xl">Памылка пры загрузцы даных відэа</h1>
      </div>
    );
  }
}
