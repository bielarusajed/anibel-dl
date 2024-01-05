// noinspection GraphQLUnresolvedReference

import { cacheExchange, createClient, fetchExchange, gql, type TypedDocumentNode } from '@urql/core';
import { registerUrql } from '@urql/next/rsc';
import { Suspense } from 'react';
import FiltersBlock from './filtersBlock';
import { EpisodeList } from './episodeList';
import { Skeleton } from '@/components/ui/skeleton';
import FFmpegLoader from '@/app/[mediaType]/[slug]/ffmpegLoader';

export type MediaResponse = {
  media: {
    title: {
      be: string;
      en: string;
    };
    episodes: {
      type: 'sub' | 'dub';
      episode: number;
      url: string;
    }[];
  };
};
const episodesQuery: TypedDocumentNode<MediaResponse, { mediaType: string; slug: string }> = gql`
  query episodes($mediaType: MediaTypes!, $slug: String!) {
    media(mediaType: $mediaType, slug: $slug) {
      title {
        be
        en
      }
      episodes {
        type
        episode
        url
      }
    }
  }
`;

const makeClient = () => {
  return createClient({
    url: 'https://anibel.net/graphql',
    exchanges: [cacheExchange, fetchExchange],
    requestPolicy: 'network-only',
  });
};
const { getClient } = registerUrql(makeClient);

type Props = {
  params: { mediaType: string; slug: string };
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default async function TitlePage({ params: { mediaType, slug }, searchParams }: Props) {
  const { type: _type } = searchParams ?? {};
  const type = Array.isArray(_type) ? _type[0] : _type;
  const result = await getClient().query(
    episodesQuery,
    { mediaType, slug },
    { fetchOptions: { next: { revalidate: 60 } } },
  );

  console.log(result);

  if (!result.data?.media?.episodes.length)
    return (
      <div className="flex flex-grow items-center justify-center">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          На жаль, нічога не знайшлося!
        </h1>
      </div>
    );
  const episodes = result.data.media.episodes;

  return (
    <div className="flex flex-col items-center justify-center gap-16 pt-12">
      <FFmpegLoader />
      <h2 className="scroll-m-20 border-b pb-2 text-center text-3xl font-semibold tracking-tight first:mt-0">
        {result.data.media.title.be}
      </h2>
      <div className="flex w-full flex-col gap-1.5">
        <FiltersBlock className="pl-2" />
        <Suspense
          key={type || 'all'}
          fallback={
            <div className="flex w-full flex-col gap-3">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          }
        >
          <EpisodeList episodes={type ? episodes.filter(episode => episode.type === type) : episodes} />
        </Suspense>
      </div>
    </div>
  );
}
