'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { MicIcon, SubtitlesIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
};

export default function FiltersBlock({ className }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (value: string) => router.push(`?type=${value}`);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-sm font-medium leading-none">Фільтраваць:</span>
      <ToggleGroup type="single" onValueChange={handleChange} value={searchParams.get('type') ?? ''}>
        <ToggleGroupItem value="sub" aria-label="Паказваць субцітры">
          <SubtitlesIcon className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="dub" aria-label="Паказваць агучку">
          <MicIcon className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
