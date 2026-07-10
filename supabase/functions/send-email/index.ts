import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const BREVO_API_KEY        = Deno.env.get('BREVO_API_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      // Load email template
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

    // Load custom SMTP config from site_settings
    const { data: smtpRow } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'smtp_config')
      .maybeSingle();

    let smtpCfg: Record<string, string> | null = null;
    if (smtpRow?.value) {
      try { smtpCfg = JSON.parse(smtpRow.value); } catch {}
    }

    const hasSmtp = smtpCfg?.host && smtpCfg?.username && smtpCfg?.password;

    if (hasSmtp) {
      // ── Send via custom SMTP ──────────────────────────
      const fromName  = smtpCfg!.from_name  || 'Livwell';
      const fromEmail = smtpCfg!.from_email || smtpCfg!.username;
      const replyTo   = smtpCfg!.reply_to   || fromEmail;
      const port      = parseInt(smtpCfg!.port || '587', 10);
      const tls       = smtpCfg!.encryption === 'SSL';

      console.log('Using custom SMTP:', smtpCfg!.host, 'port:', port, 'from:', fromEmail);

      const client = new SMTPClient({
        connection: {
          hostname: smtpCfg!.host,
          port,
          tls,
          auth: { username: smtpCfg!.username, password: smtpCfg!.password },
        },
      });

      await client.send({
        from:     `${fromName} <${fromEmail}>`,
        to:       data.to_email,
        replyTo,
        subject,
        html,
      });
      await client.close();

      return new Response(JSON.stringify({ sent: true, to: data.to_email, via: 'smtp' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      // ── Fallback: Brevo API ───────────────────────────
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
