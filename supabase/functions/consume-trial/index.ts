/*
 * Copyright (C) 2026 kristol07
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TRIAL_LIMIT = 15;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const { consume } = await req.json().catch(() => ({ consume: false }));

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return new Response('Missing server configuration', { status: 500, headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response('Missing authorization header', { status: 401, headers: corsHeaders });
  }

  const accessToken = authHeader.replace('Bearer ', '').trim();
  if (!accessToken) {
    return new Response('Missing access token', { status: 401, headers: corsHeaders });
  }
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !user) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders });
  }

  const plan = user.app_metadata?.plan;
  if (plan === 'plus' || plan === 'pro') {
    return new Response(JSON.stringify({ allowed: true, remaining: null }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: existing, error: fetchError } = await supabase
    .from('trial_usage')
    .select('used_count')
    .eq('user_id', user.id)
    .maybeSingle();

  if (fetchError) {
    return new Response('Failed to check trial', { status: 500, headers: corsHeaders });
  }

  const usedCount = existing?.used_count ?? 0;
  if (usedCount >= TRIAL_LIMIT) {
    return new Response(JSON.stringify({ allowed: false, remaining: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!consume) {
    const remaining = Math.max(TRIAL_LIMIT - usedCount, 0);
    return new Response(JSON.stringify({ allowed: true, remaining }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const nextUsed = usedCount + 1;
  const { error: upsertError } = await supabase
    .from('trial_usage')
    .upsert({ user_id: user.id, used_count: nextUsed, updated_at: new Date().toISOString() });

  if (upsertError) {
    return new Response('Failed to update trial', { status: 500, headers: corsHeaders });
  }

  const remaining = Math.max(TRIAL_LIMIT - nextUsed, 0);
  return new Response(JSON.stringify({ allowed: true, remaining }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});

