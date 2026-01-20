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
import { supabase } from './supabase';

export type PlanTier = 'free' | 'plus' | 'pro';

export const getPlan = (session: any): PlanTier => {
    const plan = session?.user?.app_metadata?.plan;
    if (plan === 'plus' || plan === 'pro') {
        return plan;
    }
    return 'free';
};

export const consumeTrial = async (consume: boolean): Promise<{
    allowed: boolean;
    remaining?: number;
}> => {
    const { data, error } = await supabase.functions.invoke('consume-trial', {
        body: { consume },
    });
    if (error) {
        throw error;
    }
    return data as { allowed: boolean; remaining?: number };
};

export const createCheckoutSession = async (): Promise<string> => {
    const { data, error } = await supabase.functions.invoke('create-checkout-session');
    if (error) {
        throw error;
    }
    if (!data?.checkout_url) {
        throw new Error('Missing checkout URL.');
    }
    return data.checkout_url as string;
};

export const createCustomerPortalLink = async (): Promise<string> => {
    const { data, error } = await supabase.functions.invoke('create-customer-portal-link');
    if (error) {
        throw error;
    }
    if (!data?.customer_portal_link) {
        throw new Error('Missing customer portal link.');
    }
    return data.customer_portal_link as string;
};

