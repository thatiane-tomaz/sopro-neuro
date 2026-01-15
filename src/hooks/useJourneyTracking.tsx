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
      
      try {
        const { data, error } = await supabase
          .from('journey_tracking')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching journey tracking:', error);
          return [];
        }
        return (data || []) as JourneyTrack[];
      } catch (error) {
        console.error('Error in journey tracking query:', error);
        return [];
      }
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes - tracking changes more frequently
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Start tracking an interaction
  const startTracking = useMutation({
    mutationFn: async ({ interactionType }: { interactionType: string }): Promise<JourneyTrack | null> => {
      if (!user) {
        console.error('User not authenticated for tracking');
        return null;
      }

      try {
        // Check if there's already an existing tracking for this interaction
        const { data: existing } = await supabase
          .from('journey_tracking')
          .select('*')
          .eq('user_id', user.id)
          .eq('interaction_type', interactionType)
          .maybeSingle();

        // If already exists and not completed, return the existing one
        if (existing && !existing.finished_at) {
          return existing as JourneyTrack;
        }

        // Create new tracking
        const { data, error } = await supabase
          .from('journey_tracking')
          .insert({
            user_id: user.id,
            interaction_type: interactionType,
            started_at: new Date().toISOString(),
            progress_percentage: 0,
          })
          .select()
          .maybeSingle();

        if (error) {
          console.error('Error starting tracking:', error);
          return null;
        }
        return data as JourneyTrack | null;
      } catch (error) {
        console.error('Error in startTracking:', error);
        return null;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journey-tracking'] });
    },
    onError: (error) => {
      console.error('Mutation error in startTracking:', error);
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
      if (!trackingId) {
        console.error('No trackingId provided');
        return null;
      }

      try {
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
          .maybeSingle();

        if (error) {
          console.error('Error updating progress:', error);
          return null;
        }
        return data;
      } catch (error) {
        console.error('Error in updateProgress:', error);
        return null;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journey-tracking'] });
    },
    onError: (error) => {
      console.error('Mutation error in updateProgress:', error);
    },
  });

  // Get progress for a specific day and type
  const getDayProgress = (day: number, type: 'video' | 'hypnosis'): { started: boolean; completed: boolean; percentage: number } => {
    if (!trackingData) return { started: false, completed: false, percentage: 0 };
    
    const interactionType = type === 'video' ? `video_dia_${day}` : `hipnose_dia_${day}`;
    const track = trackingData.find(t => t.interaction_type === interactionType);
    
    if (!track) return { started: false, completed: false, percentage: 0 };
    
    // Content is completed if finished_at is set (user watched to the end)
    return {
      started: true,
      completed: track.finished_at !== null,
      percentage: track.progress_percentage,
    };
  };

  // Check if a day is completed (both video and hypnosis finished)
  // For Phase 2 (days 8-14), only hypnosis is required
  // A content is completed if it has finished_at set (user watched to the end)
  const isDayCompleted = (day: number): boolean => {
    if (!trackingData || !Array.isArray(trackingData)) return false;
    
    // Phase 2 (days 8-14) only requires hypnosis
    const isPhase2 = day >= 8 && day <= 14;
    
    // Content is completed if ANY tracking record has finished_at set
    // This handles multiple tracking records for the same content
    const hypnosisCompleted = trackingData.some(
      track => 
        track.interaction_type === `hipnose_dia_${day}` && 
        track.finished_at !== null
    );
    
    if (isPhase2) {
      return hypnosisCompleted;
    }
    
    const videoCompleted = trackingData.some(
      track => 
        track.interaction_type === `video_dia_${day}` && 
        track.finished_at !== null
    );
    
    console.log(`[isDayCompleted] Day ${day}: video=${videoCompleted}, hypnosis=${hypnosisCompleted}`);
    
    return videoCompleted && hypnosisCompleted;
  };

  // Get the completion time for a day
  const getDayCompletionTime = (day: number): Date | null => {
    if (!trackingData || !Array.isArray(trackingData)) return null;
    
    // Phase 2 (days 8-14) only requires hypnosis
    const isPhase2 = day >= 8 && day <= 14;
    
    // Get completed tracks (with finished_at set) - filter first, then find the earliest completion
    // This handles the case where user has multiple tracking records for the same content
    const completedVideoTracks = trackingData.filter(
      track => 
        track.interaction_type === `video_dia_${day}` &&
        track.finished_at !== null
    );
    
    const completedHypnosisTracks = trackingData.filter(
      track => 
        track.interaction_type === `hipnose_dia_${day}` &&
        track.finished_at !== null
    );
    
    // Get the earliest completion time for each type (first time user completed it)
    const videoTrack = completedVideoTracks.length > 0 
      ? completedVideoTracks.reduce((earliest, current) => 
          new Date(current.finished_at!) < new Date(earliest.finished_at!) ? current : earliest
        )
      : null;
    
    const hypnosisTrack = completedHypnosisTracks.length > 0
      ? completedHypnosisTracks.reduce((earliest, current) =>
          new Date(current.finished_at!) < new Date(earliest.finished_at!) ? current : earliest
        )
      : null;
    
    // For Phase 2, only hypnosis is required
    if (isPhase2) {
      return hypnosisTrack ? new Date(hypnosisTrack.finished_at!) : null;
    }
    
    // For Phase 1, both are required - return the later completion time
    if (!videoTrack || !hypnosisTrack) return null;
    
    const videoTime = new Date(videoTrack.finished_at!);
    const hypnosisTime = new Date(hypnosisTrack.finished_at!);
    
    return videoTime > hypnosisTime ? videoTime : hypnosisTime;
  };

  // Calculate current day based on what user has already seen (last completed day)
  const getCurrentDay = (): number => {
    if (!trackingData || !Array.isArray(trackingData) || trackingData.length === 0) return 1;
    
    // Find the highest completed day
    let lastCompletedDay = 0;
    for (let day = 1; day <= 21; day++) {
      if (isDayCompleted(day)) {
        lastCompletedDay = day;
      }
    }
    
    // If no day is completed yet, user is on day 1
    // Otherwise, return the next day to work on (unless already at 21)
    if (lastCompletedDay === 0) return 1;
    return Math.min(lastCompletedDay + 1, 21);
  };

  // Get time until next day unlocks
  const getTimeUntilNextUnlock = (): number | null => {
    if (!trackingData) return null;
    
    const currentDay = getCurrentDay();
    if (currentDay >= 21) return null; // All days unlocked
    
    // Get the completion time of the PREVIOUS day (the one that was just completed)
    const previousDay = currentDay - 1;
    if (previousDay < 1) return null;
    
    const completionTime = getDayCompletionTime(previousDay);
    if (!completionTime) return null;
    
    const unlockTime = new Date(completionTime.getTime() + 6 * 60 * 60 * 1000);
    const msUntilUnlock = unlockTime.getTime() - Date.now();
    
    return msUntilUnlock > 0 ? msUntilUnlock : 0;
  };

  // Check if a day is time-locked (6h wait after previous day completion)
  const isDayTimeLocked = (day: number): boolean => {
    if (day <= 1) return false; // Day 1 is never time-locked
    
    const previousDay = day - 1;
    if (!isDayCompleted(previousDay)) return true; // Previous day not done = locked
    
    const completionTime = getDayCompletionTime(previousDay);
    if (!completionTime) return true;
    
    const unlockTime = new Date(completionTime.getTime() + 6 * 60 * 60 * 1000);
    return Date.now() < unlockTime.getTime();
  };

  return {
    trackingData,
    isLoading,
    startTracking: startTracking.mutateAsync,
    updateProgress: updateProgress.mutate,
    isDayCompleted,
    isDayTimeLocked,
    getDayProgress,
    getDayCompletionTime,
    getCurrentDay,
    getTimeUntilNextUnlock,
  };
};
