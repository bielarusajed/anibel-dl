'use client';

import { GithubIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GithubButton() {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => window.open('https://github.com/bielarusajed/anibel-dl', '_blank')}
    >
      <GithubIcon className="h-[1.2rem] w-[1.2rem]" />
    </Button>
  );
}
