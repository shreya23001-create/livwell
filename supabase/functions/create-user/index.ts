import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, password, name, phone, role, status, designation, avatar_url } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'email and password are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Create auth user without affecting caller's session
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, phone, role },
    });

    if (authErr) {
      return new Response(JSON.stringify({ error: authErr.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = authData.user.id;

    // Upsert profile row
    const { error: profileErr } = await supabase.from('profiles').upsert({
      id:          userId,
      name:        name        ?? '',
      email:       email,
      phone:       phone       ?? null,
      role:        role        ?? 'customer',
      status:      status      ?? 'active',
      designation: designation ?? null,
      avatar_url:  avatar_url  ?? null,
    });

    if (profileErr) {
      return new Response(JSON.stringify({ error: profileErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ id: userId }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
