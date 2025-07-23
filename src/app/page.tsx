'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ThemeToggle } from '@/components/theme-toggle';
import GithubButton from '@/components/github-button';

const pathNameRegex = /^\/(?<mediaType>anime|cinema|manga)\/(?<slug>\S+)$/i;
const videoPathNameRegex = /^\/(?<uuid>\S+)$/i;

function getURLorNull(value: string): URL | null {
  try {
    return new URL(value);
  } catch (e) {
    return null;
  }
}

function isValidAnibelURL(url: URL): boolean {
  if (url.hostname === 'anibel.net') return url.pathname.match(pathNameRegex) !== null;
  if (url.hostname === 'video.anibel.net') return url.pathname.match(videoPathNameRegex) !== null;
  return false;
}

const formSchema = z.object({
  url: z
    .string()
    .min(1, 'Устаўце спасылку на тайтл')
    .url({ message: 'Няверная спасылка' })
    .refine(value => {
      const url = getURLorNull(value);
      return url && (url.hostname === 'anibel.net' || url.hostname === 'video.anibel.net');
    }, 'Спасылка мае весці на anibel.net або video.anibel.net')
    .refine(value => {
      const url = getURLorNull(value);
      return url && isValidAnibelURL(url);
    }, 'Няверны фармат спасылкі'),
});

export default function Home() {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { url: '' },
  });

  function onSubmit({ url }: z.infer<typeof formSchema>) {
    try {
      const parsedURL = new URL(url);

      if (parsedURL.hostname === 'anibel.net') {
        const { mediaType, slug } = parsedURL.pathname.match(pathNameRegex)?.groups ?? {};
        if (!mediaType || !slug) return form.setError('url', { message: 'Няверны фармат спасылкі' });
        router.push(`/${mediaType}/${slug}`);
      } else if (parsedURL.hostname === 'video.anibel.net') {
        const { uuid } = parsedURL.pathname.match(videoPathNameRegex)?.groups ?? {};
        if (!uuid) return form.setError('url', { message: 'Няверны фармат спасылкі' });
        router.push(`/video/${uuid}`);
      }
    } catch (e) {
      console.error(e);
      form.setError('url', { message: 'Няверны фармат спасылкі' });
    }
  }

  return (
    <main className="container flex h-screen flex-col">
      <div className="container flex w-full justify-end gap-2 pt-4">
        <ThemeToggle />
        <GithubButton />
      </div>
      <div className="flex flex-grow flex-col items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">Anibel DL</h1>
          <span className="scroll-m-20 text-xl font-semibold tracking-tight">
            Устаўце спасылку на тайтл, каб спампаваць відэа
          </span>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full flex-row items-center gap-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel />
                  <FormControl>
                    <Input
                      placeholder="https://anibel.net/mediaType/slug або https://video.anibel.net/uuid"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription />
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button>Спампаваць!</Button>
          </form>
        </Form>
      </div>
    </main>
  );
}
