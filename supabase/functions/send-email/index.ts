import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const BREVO_API_KEY        = Deno.env.get('BREVO_API_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sendViaSmtp(cfg: Record<string, string>, to: string, subject: string, html: string): Promise<void> {
  const port     = parseInt(cfg.port || '587', 10);
  const fromName = cfg.from_name  || 'Livwell';
  const fromEmail= cfg.from_email || cfg.username;
  const replyTo  = cfg.reply_to   || fromEmail;

  // Build raw MIME message
  const boundary = `----=_Part_${Date.now()}`;
  const mime = [
    `From: ${fromName} <${fromEmail}>`,
    `To: ${to}`,
    `Reply-To: ${replyTo}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: quoted-printable`,
    ``,
    html,
    `--${boundary}--`,
  ].join('\r\n');

  const encoder = new TextEncoder();

  // Helper to read a line from the connection
  async function readLine(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<string> {
    const chunks: Uint8Array[] = [];
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      chunks.push(value);
      const text = new TextDecoder().decode(value);
      if (text.includes('\n')) break;
    }
    return new TextDecoder().decode(chunks.reduce((a, b) => { const c = new Uint8Array(a.length + b.length); c.set(a); c.set(b, a.length); return c; }, new Uint8Array()));
  }

  const conn = await Deno.connect({ hostname: cfg.host, port });
  const writer = conn.writable.getWriter();
  const reader = conn.readable.getReader();

  const send = async (cmd: string) => { await writer.write(encoder.encode(cmd + '\r\n')); };
  const expect = async (code: string) => {
    const line = await readLine(reader);
    if (!line.startsWith(code)) throw new Error(`SMTP error: ${line.trim()}`);
    return line;
  };

  await expect('220');
  await send(`EHLO livwell.ae`);
  // Read multi-line EHLO response
  let ehlo = '';
  while (!ehlo.includes('\n')) { ehlo += await readLine(reader); if (ehlo.includes('250 ')) break; }

  // STARTTLS
  await send('STARTTLS');
  await expect('220');

  // Upgrade to TLS
  const tlsConn = await Deno.startTls(conn, { hostname: cfg.host });
  const tlsWriter = tlsConn.writable.getWriter();
  const tlsReader = tlsConn.readable.getReader();
  const sendTls = async (cmd: string) => { await tlsWriter.write(encoder.encode(cmd + '\r\n')); };
  const expectTls = async (code: string) => {
    const line = await readLine(tlsReader);
    if (!line.startsWith(code)) throw new Error(`SMTP TLS error: ${line.trim()}`);
    return line;
  };

  await sendTls(`EHLO livwell.ae`);
  let ehlo2 = '';
  while (!ehlo2.includes('\n')) { ehlo2 += await readLine(tlsReader); if (ehlo2.includes('250 ')) break; }

  // AUTH LOGIN
  await sendTls('AUTH LOGIN');
  await expectTls('334');
  await sendTls(btoa(cfg.username));
  await expectTls('334');
  await sendTls(btoa(cfg.password));
  await expectTls('235');

  await sendTls(`MAIL FROM:<${fromEmail}>`);
  await expectTls('250');
  await sendTls(`RCPT TO:<${to}>`);
  await expectTls('250');
  await sendTls('DATA');
  await expectTls('354');
  await sendTls(mime + '\r\n.');
  await expectTls('250');
  await sendTls('QUIT');

  tlsWriter.releaseLock();
  tlsConn.close();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const body = await req.json();
    const { type, data } = body;

    console.log('Sending email type:', type, 'to:', data.to_email);

    let subject: string;
    let html: string;

    if (type === 'smtp_test') {
      subject = 'SMTP Test — Livwell Real Estate';
      html = '<p>This is a test email from your Livwell SMTP configuration. If you received this, your SMTP settings are working correctly.</p>';
    } else {
      const { data: tpl, error: tplErr } = await supabase
        .from('email_templates')
        .select('subject, body, from_name, from_email, enabled')
        .eq('key', type)
        .maybeSingle();

      if (tplErr || !tpl) {
        console.error('Template not found:', type, tplErr);
        return new Response(JSON.stringify({ error: 'Template not found: ' + type }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!tpl.enabled) {
        return new Response(JSON.stringify({ skipped: true, reason: 'Template disabled' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const interpolate = (str: string) =>
        str.replace(/\{\{(\w+)\}\}/g, (_: string, k: string) => data[k] ?? '');

      subject = interpolate(tpl.subject);
      html    = interpolate(tpl.body);
    }

    // Load custom SMTP config
    const { data: smtpRow } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'smtp_config')
      .maybeSingle();

    let smtpCfg: Record<string, string> | null = null;
    if (smtpRow?.value) {
      try { smtpCfg = JSON.parse(smtpRow.value); } catch {}
    }

    const hasSmtp = !!(smtpCfg?.host && smtpCfg?.username && smtpCfg?.password);

    if (hasSmtp) {
      console.log('Using custom SMTP:', smtpCfg!.host);
      await sendViaSmtp(smtpCfg!, data.to_email, subject, html);
      return new Response(JSON.stringify({ sent: true, to: data.to_email, via: 'smtp' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      // Fallback: Brevo API
      const fromName  = 'LivWell';
      const fromEmail = 'shreya23001@gmail.com';

      console.log('Using Brevo fallback from:', fromEmail, 'to:', data.to_email);

      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender:      { name: fromName, email: fromEmail },
          to:          [{ email: data.to_email }],
          subject,
          htmlContent: html,
        }),
      });

      const resBody = await res.json();
      console.log('Brevo response:', res.status, JSON.stringify(resBody));

      if (!res.ok) {
        return new Response(JSON.stringify({ error: resBody }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ sent: true, to: data.to_email, via: 'brevo', id: resBody.messageId }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (e: any) {
    console.error('Send email error:', e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
