import { Skeleton } from '@/components/ui/skeleton';
import FiltersBlock from '@/app/[mediaType]/[slug]/filtersBlock';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center gap-16 pt-12">
      <Skeleton className="-mb-12 h-6 w-full" />
      <Skeleton className="h-11 w-full" />
      <div className="flex w-full flex-col gap-1.5">
        <FiltersBlock className="pl-2" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}
