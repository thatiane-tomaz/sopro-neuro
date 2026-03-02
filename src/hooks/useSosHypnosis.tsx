import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

// Total number of SOS hypnosis files available in storage
const TOTAL_SOS_HYPNOSES = 5;

const getStorageKey = (userId: string) => `sos_next_index_${userId}`;

export const useSosHypnosis = () => {
  const { user } = useAuth();

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
    const currentIndex = getNextIndex();
    const sosNumber = currentIndex + 1; // sos_1, sos_2, etc.

    // Advance to next, wrapping around
    const newIndex = (currentIndex + 1) % TOTAL_SOS_HYPNOSES;
    if (user) {
      localStorage.setItem(getStorageKey(user.id), String(newIndex));
    }
    setNextIndex(newIndex);

    return {
      title: `Hipnose SOS #${sosNumber}`,
      fileUrl: `https://kpewsvpufzkyejchncta.supabase.co/storage/v1/object/public/hypnosis/sos_${sosNumber}.mp3`,
      index: currentIndex,
    };
  }, [user, getNextIndex]);

  return {
    getSosHypnosis,
    nextIndex,
    totalSos: TOTAL_SOS_HYPNOSES,
  };
};
