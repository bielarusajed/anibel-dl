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

const pathNameRegex = /^\/(?<mediaType>anime|cinema)\/(?<slug>\S+)$/i;

function getURLorNull(value: string): URL | null {
  try {
    return new URL(value);
  } catch (e) {
    return null;
  }
}

const formSchema = z.object({
  url: z
    .string()
    .min(1, 'Устаўце спасылку на тайтл')
    .url({ message: 'Няверная спасылка' })
    .refine(value => getURLorNull(value)?.hostname === 'anibel.net', 'Спасылка мае весці на Anibel.net')
    .refine(value => getURLorNull(value)?.pathname.match(pathNameRegex), 'Няверны фармат спасылкі'),
});

export default function Home() {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { url: '' },
  });

  function onSubmit({ url }: z.infer<typeof formSchema>) {
    try {
      const { mediaType, slug } = new URL(url).pathname.match(pathNameRegex)?.groups ?? {};
      if (!mediaType || !slug) return form.setError('url', { message: 'Must be a valid title URL' });
      router.push(`/${mediaType}/${slug}`);
    } catch (e) {
      console.error(e);
      form.setError('url', { message: 'Must be a valid title URL' });
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
                    <Input placeholder="https://anibel.net/mediaType/slug" {...field} />
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
