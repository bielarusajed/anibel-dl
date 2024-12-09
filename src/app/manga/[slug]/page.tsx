// noinspection GraphQLUnresolvedReference

import { Skeleton } from '@/components/ui/skeleton';
import { cacheExchange, createClient, fetchExchange, gql, type TypedDocumentNode } from '@urql/core';
import { registerUrql } from '@urql/next/rsc';
import { Suspense } from 'react';
import ChapterCard from './chapterCard';
import LogChapters from './logChapters';

export type MediaResponse = {
  media: {
    title: {
      be: string;
      en: string;
    };
    chapters: {
      title: string;
      chapter: number;
      images: {
        large: string;
      }[];
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
      chapters {
        title
        chapter
        images {
          large
        }
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
  params: { slug: string };
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default async function TitlePage({ params: { slug }, searchParams }: Props) {
  const result = await getClient().query(
    episodesQuery,
    { mediaType: 'manga', slug: decodeURIComponent(slug) },
    { fetchOptions: { next: { revalidate: 60 } } },
  );

  if (!result.data?.media?.chapters.length)
    return (
      <div className="flex flex-grow items-center justify-center">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          На жаль, нічога не знайшлося!
        </h1>
      </div>
    );
  const chapters = result.data.media.chapters;

  return (
    <div className="flex flex-col items-center justify-center gap-8 pt-12">
      <h2 className="scroll-m-20 border-b pb-2 text-center text-3xl font-semibold tracking-tight first:mt-0">
        {result.data.media.title.be}
      </h2>
      <Suspense
        fallback={
          <div className="flex w-full flex-col gap-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        }
      >
        <div className="flex w-full flex-col gap-3">
          <LogChapters chapters={chapters} />
          {chapters
            .toSorted((a, b) => a.chapter - b.chapter)
            .map(chapter => (
              <ChapterCard key={chapter.chapter} slug={slug} chapter={chapter} />
            ))}
        </div>
      </Suspense>
    </div>
  );
}
