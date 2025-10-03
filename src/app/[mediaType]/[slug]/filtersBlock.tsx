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

  const handleChange = (value: string) => {
    const currentType = searchParams.get('type') ?? '';
    // Калі значэнне не змянілася — нічога не робім
    if ((value || '') === currentType) return;

    const params = new URLSearchParams(searchParams.toString());
    if (!value) {
      // Калі прыбралі фільтр — выдаляем параметр цалкам, каб не атрымліваць ?type=
      params.delete('type');
    } else {
      params.set('type', value);
    }
    const query = params.toString();
    router.replace(query ? `?${query}` : '?');
  };

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
