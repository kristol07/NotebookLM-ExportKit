import { supabase } from './supabase';
import { browser } from 'wxt/browser';

const DEFAULT_REDIRECT_PATH = 'supabase-oauth';
const DEFAULT_GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

export const getGoogleDriveOAuthScopes = () => {
    const manifest = browser.runtime.getManifest() as {
        oauth2?: { scopes?: string[] };
    };
    const scopes = manifest.oauth2?.scopes;
    if (Array.isArray(scopes) && scopes.length > 0) {
        return scopes.join(' ');
    }
    return DEFAULT_GOOGLE_DRIVE_SCOPE;
};

export const signInWithGoogleOAuth = async (scopes?: string) => {
    const redirectTo = browser.identity.getRedirectURL(DEFAULT_REDIRECT_PATH);
    if (import.meta.env.DEV) {
        console.info('[auth] Google OAuth redirectTo:', redirectTo);
    }

    const options: {
        redirectTo: string;
        scopes?: string;
        queryParams: { access_type: string; prompt: string };
        skipBrowserRedirect: boolean;
    } = {
        redirectTo,
        queryParams: { access_type: 'offline', prompt: 'consent' },
        skipBrowserRedirect: true,
    };
    if (scopes) {
        options.scopes = scopes;
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options,
    });

    if (error) {
        throw error;
    }
    if (!data?.url) {
        throw new Error('Supabase did not return an OAuth URL.');
    }

    const resultUrl = await browser.identity.launchWebAuthFlow({
        url: data.url,
        interactive: true,
    });

    if (!resultUrl) {
        throw new Error('OAuth flow did not return a redirect URL.');
    }

    const url = new URL(resultUrl);
    const errorDescription = url.searchParams.get('error_description') || url.searchParams.get('error');
    if (errorDescription) {
        throw new Error(errorDescription);
    }

    const code = url.searchParams.get('code');
    if (code) {
        const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
            throw exchangeError;
        }
        return exchangeData.session ?? null;
    }

    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    if (accessToken && refreshToken) {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
        });
        if (sessionError) {
            throw sessionError;
        }
        return sessionData.session ?? null;
    }

    throw new Error('No auth code or tokens returned from OAuth flow.');
};
