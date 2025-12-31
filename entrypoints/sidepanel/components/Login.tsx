import React, { useState } from 'react';
import { supabase } from '../../../utils/supabase';

export default function Login({ onClose }: { onClose?: () => void }) {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

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
            showMessage('success', 'Code sent! Check your email.');
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
            // Session updates automatically via onAuthStateChange in App.tsx
        }
        setLoading(false);
    };

    return (
        <div className="exportkit-shell">
            <div className="login-container">
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="export-btn small ghost"
                        title="Back to Dashboard"
                    >
                        Back
                    </button>
                )}

                <div className="login-card">
                    <div className="login-header">
                        <div className="brand-line">
                            <span className="brand-dot" aria-hidden="true"></span>
                            NotebookLM ExportKit
                        </div>
                        <p className="login-subtitle">Sign in to unlock advanced exports</p>
                    </div>

                    {message && (
                        <div className={`message-box ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    {step === 'email' ? (
                        <form onSubmit={handleSendOtp} className="login-form">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="login-input"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="export-btn primary"
                            >
                                {loading ? 'Sending...' : 'Send Login Code'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="login-form">
                            <p className="login-hint">
                                Enter the code sent to <strong>{email}</strong>
                            </p>
                            <input
                                type="text"
                                placeholder="Enter 6-digit Code"
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
                                {loading ? 'Verifying...' : 'Verify & Login'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep('email')}
                                className="link-button"
                            >
                                Wrong email? Try again
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
