import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    const subject   = interpolate(tpl.subject);
    const html      = interpolate(tpl.body);
    // Always use verified Gmail sender
    const fromName  = 'LivWell';
    const fromEmail = 'shreya23001@gmail.com';

    console.log('Sending from:', fromEmail, 'to:', data.to_email, 'subject:', subject);

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key':      BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender:      { name: fromName, email: fromEmail },
        to:          [{ email: data.to_email }],
        subject,
        htmlContent: html,
      }),
    });

    const resBody = await res.json();
    console.log('Brevo response status:', res.status, JSON.stringify(resBody));

    if (!res.ok) {
      return new Response(JSON.stringify({ error: resBody }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ sent: true, to: data.to_email, id: resBody.messageId }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e: any) {
    console.error('Send email error:', e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
