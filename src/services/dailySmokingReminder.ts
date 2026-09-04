// O lembrete diário ("quantos cigarros você fumou ontem?") passou a ser enviado
// pelo servidor (central de comunicações), para que o texto e o horário possam
// ser ajustados sem publicar uma nova versão do app.
// Aqui apenas cancelamos o antigo agendamento local, evitando mensagem dupla
// em quem já tem a versão anterior instalada.

const NOTIFICATION_ID = 4207; // id do agendamento local antigo

export async function cancelDailySmokingReminder() {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return;

    const { LocalNotifications } = await import(
      "@capacitor/local-notifications"
    );
    await LocalNotifications.cancel({
      notifications: [{ id: NOTIFICATION_ID }],
    });
  } catch (e) {
    console.debug("cancelDailySmokingReminder skipped:", e);
  }
}
