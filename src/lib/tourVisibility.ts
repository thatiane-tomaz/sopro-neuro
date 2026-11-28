// A new version invites existing accounts again without reusing the test flag.
export const TOUR_VERSION = "v2";

export function tourStorageKey(userId: string): string {
  return `sopro_tour_${TOUR_VERSION}:${userId}`;
}

export function shouldShowTour(userId: string | undefined, seen: string | null): boolean {
  return Boolean(userId) && seen === null;
}