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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const creemApiKey = Deno.env.get('CREEM_API_KEY');

  if (!supabaseUrl || !supabaseServiceRoleKey || !creemApiKey) {
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

  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('creem_customer_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (customerError || !customer?.creem_customer_id) {
    return new Response('Customer not found', { status: 404, headers: corsHeaders });
  }

  const portalResponse = await fetch('https://api.creem.io/v1/customers/billing', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': creemApiKey,
    },
    body: JSON.stringify({
      customer_id: customer.creem_customer_id,
    }),
  });

  if (!portalResponse.ok) {
    const errorText = await portalResponse.text();
    return new Response(errorText || 'Failed to create portal link', { status: 400, headers: corsHeaders });
  }

  const data = await portalResponse.json();
  return new Response(JSON.stringify({ customer_portal_link: data.customer_portal_link }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});

