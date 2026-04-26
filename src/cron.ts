import cron from "node-cron";
import { getEphemeris, formatForecastText } from "./ephemeris";
import { generateForecastNarrative, sendViaNameclaw } from "./agent";
import { getDueReminders, markReminderDelivered } from "./db";

export function initCrons(): void {
  const tz = process.env.TZ ?? process.env.TIMEZONE ?? "UTC";

  // Daily 07:00 alchemical forecast
  cron.schedule(
    "0 7 * * *",
    async () => {
      console.log("[Cron] 07:00 — generating daily alchemical forecast");
      try {
        const ephem = getEphemeris();
        const rawForecast = formatForecastText(ephem);
        const narrative = await generateForecastNarrative(rawForecast);
        const fullMessage = `${rawForecast}\n\n---\n${narrative}`;
        await sendViaNameclaw(fullMessage);
        console.log("[Cron] Daily forecast dispatched");
      } catch (err) {
        console.error("[Cron] Forecast error:", err);
      }
    },
    { timezone: tz }
  );

  // Every 5 minutes — deliver due reminders
  cron.schedule("*/5 * * * *", async () => {
    try {
      const due = getDueReminders();
      if (due.length === 0) return;

      console.log(`[Cron] Delivering ${due.length} reminder(s)`);
      for (const reminder of due) {
        const message = `⏰ REMINDER: ${reminder.title}\n\n${reminder.body}`;
        await sendViaNameclaw(message);
        markReminderDelivered(reminder.id);
        console.log(`[Cron] Delivered reminder #${reminder.id}: ${reminder.title}`);
      }
    } catch (err) {
      console.error("[Cron] Reminder delivery error:", err);
    }
  });

  console.log(`[Cron] Scheduled — daily forecast at 07:00 ${tz}, reminders every 5 min`);
}
