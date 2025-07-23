import MediaPage from './page_media';
import VideoPage from './page_video';

type Props = {
  params: { mediaType: string; slug: string };
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default async function TitlePage({ params: { mediaType, slug }, searchParams }: Props) {
  if (mediaType === 'video') return <VideoPage slug={slug} />;
  return <MediaPage mediaType={mediaType} slug={slug} searchParams={searchParams} />;
}
