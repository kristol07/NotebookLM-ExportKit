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
