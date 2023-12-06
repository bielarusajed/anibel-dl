import type { ReactNode } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { Undo2Icon } from 'lucide-react';
import GithubButton from '@/components/github-button';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <main className="container flex flex-col">
      <div className="flex w-full justify-between pt-4">
        <Link href="/" className="flex flex-row items-center gap-0.5 text-sm font-medium leading-none hover:underline">
          <Undo2Icon className="h-4 w-4" />
          Назад
        </Link>
        <div className="flex gap-2">
          <ThemeToggle />
          <GithubButton />
        </div>
      </div>
      <span className="scroll-m-20 text-xl tracking-tight text-muted-foreground">
        Не закрывайце ўкладку, пакуль спампоўваецца серыя
      </span>
      {children}
    </main>
  );
}
