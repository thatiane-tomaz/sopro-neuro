import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

const STORAGE_BASE = 'https://kpewsvpufzkyejchncta.supabase.co/storage/v1/object/public/hypnosis';
const getStorageKey = (userId: string) => `sos_next_index_${userId}`;
const SOS_COUNT_CACHE_KEY = 'sos_total_count';
const SOS_COUNT_CACHE_TTL = 1000 * 60 * 60; // 1 hour

export const useSosHypnosis = () => {
  const { user } = useAuth();
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
      // Check sequentially: sos_1, sos_2, ... until a HEAD request fails
      for (let i = 1; i <= 20; i++) {
        try {
          const res = await fetch(`${STORAGE_BASE}/sos_${i}.MP3`, { method: 'HEAD' });
          if (res.ok) {
            count = i;
          } else {
            break;
          }
        } catch {
          break;
        }
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

  const getSosHypnosis = useCallback((): { title: string; fileUrl: string; index: number } => {
    const currentIndex = getNextIndex() % totalSos;
    const sosNumber = currentIndex + 1;

    const newIndex = (currentIndex + 1) % totalSos;
    if (user) {
      localStorage.setItem(getStorageKey(user.id), String(newIndex));
    }
    setNextIndex(newIndex);

    return {
      title: 'Hipnose SOS',
      fileUrl: `${STORAGE_BASE}/sos_${sosNumber}.MP3`,
      index: currentIndex,
    };
  }, [user, getNextIndex, totalSos]);

  return {
    getSosHypnosis,
    nextIndex,
    totalSos,
  };
};
