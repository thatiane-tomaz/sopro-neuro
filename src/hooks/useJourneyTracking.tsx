import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface JourneyTrack {
  id: string;
  user_id: string;
  interaction_type: string;
  started_at: string;
  finished_at: string | null;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

export const useJourneyTracking = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all tracking data for the user
  const { data: trackingData, isLoading } = useQuery({
    queryKey: ['journey-tracking', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('journey_tracking')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as JourneyTrack[];
    },
    enabled: !!user,
  });

  // Start tracking an interaction
  const startTracking = useMutation({
    mutationFn: async ({ interactionType }: { interactionType: string }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('journey_tracking')
        .insert({
          user_id: user.id,
          interaction_type: interactionType,
          started_at: new Date().toISOString(),
          progress_percentage: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journey-tracking'] });
    },
  });

  // Update tracking progress
  const updateProgress = useMutation({
    mutationFn: async ({ 
      trackingId, 
      progressPercentage, 
      finished 
    }: { 
      trackingId: string; 
      progressPercentage: number;
      finished: boolean;
    }) => {
      const updateData: any = {
        progress_percentage: progressPercentage,
      };

      if (finished) {
        updateData.finished_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('journey_tracking')
        .update(updateData)
        .eq('id', trackingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journey-tracking'] });
    },
  });

  // Check if a day is completed (both video and hypnosis at 98%+)
  const isDayCompleted = (day: number): boolean => {
    if (!trackingData) return false;
    
    const videoCompleted = trackingData.some(
      track => 
        track.interaction_type === `video_dia_${day}` && 
        track.progress_percentage >= 98 &&
        track.finished_at !== null
    );
    
    const hypnosisCompleted = trackingData.some(
      track => 
        track.interaction_type === `hipnose_dia_${day}` && 
        track.progress_percentage >= 98 &&
        track.finished_at !== null
    );
    
    return videoCompleted && hypnosisCompleted;
  };

  // Get the completion time for a day
  const getDayCompletionTime = (day: number): Date | null => {
    if (!trackingData) return null;
    
    const completedTracks = trackingData.filter(
      track => 
        (track.interaction_type === `video_dia_${day}` || 
         track.interaction_type === `hipnose_dia_${day}`) &&
        track.progress_percentage >= 98 &&
        track.finished_at !== null
    );
    
    if (completedTracks.length < 2) return null;
    
    const times = completedTracks
      .map(t => new Date(t.finished_at!))
      .sort((a, b) => b.getTime() - a.getTime());
    
    return times[0];
  };

  // Calculate current day based on what user has already seen (last completed day)
  const getCurrentDay = (): number => {
    if (!trackingData) return 1;
    
    // Find the highest completed day
    let lastCompletedDay = 0;
    for (let day = 1; day <= 21; day++) {
      if (isDayCompleted(day)) {
        lastCompletedDay = day;
      }
    }
    
    // If no day is completed yet, user is on day 1
    // Otherwise, show the last completed day
    return lastCompletedDay || 1;
  };

  // Get time until next day unlocks
  const getTimeUntilNextUnlock = (): number | null => {
    if (!trackingData) return null;
    
    const currentDay = getCurrentDay();
    if (currentDay >= 21) return null; // All days unlocked
    
    const completionTime = getDayCompletionTime(currentDay);
    if (!completionTime) return null;
    
    const unlockTime = new Date(completionTime.getTime() + 6 * 60 * 60 * 1000);
    const msUntilUnlock = unlockTime.getTime() - Date.now();
    
    return msUntilUnlock > 0 ? msUntilUnlock : 0;
  };

  return {
    trackingData,
    isLoading,
    startTracking: startTracking.mutate,
    updateProgress: updateProgress.mutate,
    isDayCompleted,
    getDayCompletionTime,
    getCurrentDay,
    getTimeUntilNextUnlock,
  };
};
