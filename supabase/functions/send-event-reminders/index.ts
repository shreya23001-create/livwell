import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY  = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL    = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (_req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const now = new Date();

  // Find events starting 55–65 minutes from now that haven't been notified
  const windowStart = new Date(now.getTime() + 25 * 60 * 1000);
  const windowEnd   = new Date(now.getTime() + 35 * 60 * 1000);

  const todayDate  = windowStart.toISOString().split('T')[0];
  const startTime  = windowStart.toTimeString().slice(0, 5); // HH:MM
  const endTime    = windowEnd.toTimeString().slice(0, 5);   // HH:MM

  const { data: events, error } = await supabase
    .from('calendar_events')
    .select('id, agent_email, title, type, date, time, duration, client, property, notes')
    .eq('notified', false)
    .eq('date', todayDate)
    .gte('time', startTime)
    .lte('time', endTime);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!events || events.length === 0) {
    return new Response(JSON.stringify({ sent: 0, message: 'No events to notify' }), { status: 200 });
  }

  let sent = 0;

  for (const ev of events) {
    const eventTime = formatTime(ev.time);
    const typeLabel = { viewing: 'Property Viewing', meeting: 'Meeting', followup: 'Follow-up', call: 'Call' }[ev.type as string] ?? ev.type;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 28px 32px;">
          <div style="color: #fff; font-size: 22px; font-weight: 700;">Livwell</div>
          <div style="color: rgba(255,255,255,0.8); font-size: 13px; margin-top: 2px;">Agent Portal</div>
        </div>
        <div style="padding: 32px;">
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 12px 16px; margin-bottom: 24px;">
            <div style="font-size: 13px; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: 0.05em;">⏰ Reminder — 30 Minutes Away</div>
          </div>
          <h2 style="margin: 0 0 8px; font-size: 20px; color: #1a1a2e;">${ev.title}</h2>
          <div style="display: inline-block; background: #ede9fe; color: #6366f1; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 20px; margin-bottom: 20px;">${typeLabel}</div>

          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 13px; width: 100px;">📅 Date</td>
              <td style="padding: 8px 0; color: #1a1a2e; font-size: 13px; font-weight: 600;">${formatDate(ev.date)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">🕐 Time</td>
              <td style="padding: 8px 0; color: #1a1a2e; font-size: 13px; font-weight: 600;">${eventTime} (${ev.duration} min)</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">👤 Client</td>
              <td style="padding: 8px 0; color: #1a1a2e; font-size: 13px; font-weight: 600;">${ev.client}</td>
            </tr>
            ${ev.property ? `<tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">🏠 Property</td><td style="padding: 8px 0; color: #1a1a2e; font-size: 13px; font-weight: 600;">${ev.property}</td></tr>` : ''}
            ${ev.notes ? `<tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px; vertical-align: top;">📝 Notes</td><td style="padding: 8px 0; color: #1a1a2e; font-size: 13px;">${ev.notes}</td></tr>` : ''}
          </table>

          <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #f3f4f6; color: #9ca3af; font-size: 12px;">
            This is an automated reminder from Livwell Agent Portal.
          </div>
        </div>
      </div>
    `;

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    'Livwell <onboarding@resend.dev>',
        to:      [ev.agent_email],
        subject: `⏰ Reminder: ${ev.title} at ${eventTime} — 30 minutes away`,
        html,
      }),
    });

    if (emailRes.ok) {
      // Mark as notified so we don't send again
      await supabase
        .from('calendar_events')
        .update({ notified: true })
        .eq('id', ev.id);
      sent++;
    } else {
      const errBody = await emailRes.text();
      console.error(`Failed to send email for event ${ev.id}:`, errBody);
    }
  }

  return new Response(JSON.stringify({ sent, total: events.length }), { status: 200 });
});

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-AE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}
