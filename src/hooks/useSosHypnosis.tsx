import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useBrainSparks } from '@/hooks/useBrainSparks';
import { supabase } from '@/integrations/supabase/client';
import { getSignedMediaUrl } from '@/lib/mediaUrl';

const HYPNOSIS_BUCKET = 'hypnosis';
const getStorageKey = (userId: string) => `sos_next_index_${userId}`;
const SOS_COUNT_CACHE_KEY = 'sos_total_count';
const SOS_COUNT_CACHE_TTL = 1000 * 60 * 60; // 1 hour

export const useSosHypnosis = () => {
  const { user } = useAuth();
  const { award } = useBrainSparks();
  const [totalSos, setTotalSos] = useState<number>(() => {
    try {
      const cached = localStorage.getItem(SOS_COUNT_CACHE_KEY);
      if (cached) {
        const { count, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < SOS_COUNT_CACHE_TTL) return count;
      }
    } catch {}
    return 2; // safe fallback
  });

  // Probe storage to find how many sos_N.MP3 files exist
  useEffect(() => {
    let cancelled = false;

    const probe = async () => {
      let count = 0;
      try {
        const { data, error } = await supabase.storage
          .from(HYPNOSIS_BUCKET)
          .list('', { limit: 1000 });
        if (error || !data) return;
        const names = new Set(data.map((f) => f.name.toLowerCase()));
        for (let i = 1; i <= 20; i++) {
          if (names.has(`sos_${i}.mp3`)) count = i;
          else break;
        }
      } catch {
        return;
      }

      if (!cancelled && count > 0) {
        setTotalSos(count);
        localStorage.setItem(SOS_COUNT_CACHE_KEY, JSON.stringify({ count, timestamp: Date.now() }));
      }
    };

    // Check if cache is still valid
    try {
      const cached = localStorage.getItem(SOS_COUNT_CACHE_KEY);
      if (cached) {
        const { timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < SOS_COUNT_CACHE_TTL) return;
      }
    } catch {}

    probe();

    return () => { cancelled = true; };
  }, []);

  const getNextIndex = useCallback((): number => {
    if (!user) return 0;
    const stored = localStorage.getItem(getStorageKey(user.id));
    return stored ? parseInt(stored, 10) : 0;
  }, [user]);

  const [nextIndex, setNextIndex] = useState<number>(() => {
    if (!user) return 0;
    return getNextIndex();
  });

  const getSosHypnosis = useCallback(async (): Promise<{ title: string; fileUrl: string | null; index: number }> => {
    const currentIndex = getNextIndex() % totalSos;
    const sosNumber = currentIndex + 1;

    const newIndex = (currentIndex + 1) % totalSos;
    if (user) {
      localStorage.setItem(getStorageKey(user.id), String(newIndex));
    }
    setNextIndex(newIndex);

    award('sos_used', { sos_number: sosNumber });

    const fileUrl = await getSignedMediaUrl(HYPNOSIS_BUCKET, `sos_${sosNumber}.MP3`, 'hypnosis');

    return {
      title: 'Hipnose SOS',
      fileUrl,
      index: currentIndex,
    };
  }, [user, getNextIndex, totalSos, award]);

  return {
    getSosHypnosis,
    nextIndex,
    totalSos,
  };
};
