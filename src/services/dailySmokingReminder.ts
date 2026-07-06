// Schedules a daily local notification asking the user how many cigarettes
// they smoked yesterday. Only runs on native builds (Capacitor).
// On web it silently no-ops so the app keeps working in the browser preview.

const NOTIFICATION_ID = 4207; // arbitrary stable id
const HOUR = 9; // 09:00 local
const MINUTE = 0;

export async function scheduleDailySmokingReminder() {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return;

    const { LocalNotifications } = await import(
      "@capacitor/local-notifications"
    );

    // Request permission (idempotent — no-op if already granted)
    const perm = await LocalNotifications.requestPermissions();
    if (perm.display !== "granted") return;

    // Clear the previous instance so we don't stack duplicates
    try {
      await LocalNotifications.cancel({
        notifications: [{ id: NOTIFICATION_ID }],
      });
    } catch {
      // ignore
    }

    // First fire = next 09:00 (today if not passed yet, else tomorrow)
    const first = new Date();
    first.setHours(HOUR, MINUTE, 0, 0);
    if (first.getTime() <= Date.now()) {
      first.setDate(first.getDate() + 1);
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: NOTIFICATION_ID,
          title: "Sopro Neuro",
          body: "Quantos cigarros você fumou ontem? Registre para acompanhar sua evolução.",
          schedule: {
            at: first,
            repeats: true,
            every: "day",
            allowWhileIdle: true,
          },
          extra: { action: "log_yesterday" },
        },
      ],
    });
  } catch (e) {
    // Package not installed / not native / permission denied — silent fail.
    console.debug("dailySmokingReminder skipped:", e);
  }
}