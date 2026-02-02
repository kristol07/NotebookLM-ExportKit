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
import React, { useState } from 'react';
import { supabase } from '../../../utils/supabase';
import { signInWithGoogleOAuth } from '../../../utils/supabase-oauth';
import { useI18n } from '../i18n/i18n';

export default function Login({ onClose }: { onClose?: () => void }) {
    const { t } = useI18n();
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
    const [googleLoading, setGoogleLoading] = useState(false);

    const showMessage = (type: 'error' | 'success', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    };

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: true
            }
        });
        if (error) {
            showMessage('error', error.message);
        } else {
            showMessage('success', t('login.codeSentSuccess'));
            setStep('otp');
        }
        setLoading(false);
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        const { error } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: 'email',
        });

        if (error) {
            showMessage('error', error.message);
        } else {
            showMessage('success', t('login.signedInSuccess'));
        }
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        setMessage(null);
        try {
            await signInWithGoogleOAuth();
        } catch (err: any) {
            showMessage('error', err?.message || t('login.googleError'));
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div className="exportkit-shell">
            <div className="login-container">
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="export-btn small ghost"
                        title={t('login.backToDashboard')}
                    >
                        {t('common.back')}
                    </button>
                )}

                <div className="login-card">
                    <div className="login-header">
                        <div className="brand-line">
                            <span className="brand-dot" aria-hidden="true"></span>
                            {t('app.name')}
                        </div>
                        <p className="login-subtitle">{t('login.subtitle')}</p>
                        {/* <ul className="login-benefits">
                            <li>Advanced formats for study workflows</li>
                            <li>Google Drive delivery with any account</li>
                        </ul> */}
                    </div>

                    {message && (
                        <div className={`message-box ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    {step === 'email' ? (
                        <form onSubmit={handleSendOtp} className="login-form">
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={googleLoading}
                                className="export-btn primary"
                            >
                                {googleLoading ? t('login.googleOpening') : t('login.googleContinue')}
                            </button>
                            <div className="login-divider">
                                <span>{t('common.orUseEmail')}</span>
                            </div>
                            <div className="login-email">
                                <label className="login-label" htmlFor="login-email">{t('common.email')}</label>
                                <input
                                    id="login-email"
                                    type="email"
                                    placeholder={t('login.emailPlaceholder')}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="login-input"
                                />
                                <p className="login-helper">{t('login.emailHelper')}</p>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="export-btn primary"
                                >
                                    {loading ? t('login.sending') : t('login.sendCode')}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="login-form">
                            <p className="login-hint">
                                {t('login.otpHint', { email })}
                            </p>
                            <input
                                type="text"
                                placeholder={t('login.otpPlaceholder')}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                                className="login-input"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="export-btn primary"
                            >
                                {loading ? t('login.verifying') : t('login.verify')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep('email')}
                                className="link-button"
                            >
                                {t('login.useDifferentEmail')}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

