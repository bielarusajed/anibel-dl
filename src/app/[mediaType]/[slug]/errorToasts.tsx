'use client';

import { useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

type Props = {
  messages: string[];
};

export default function ErrorToasts({ messages }: Props) {
  const { toast: pushToast } = useToast();

  useEffect(() => {
    if (!messages || messages.length === 0) return;
    for (const message of messages) {
      pushToast({ title: 'Памылка', description: message, variant: 'destructive' });
    }
  }, [messages, pushToast]);

  return null;
}
