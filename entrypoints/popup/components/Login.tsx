import React, { useState } from 'react';
import { supabase } from '../../../utils/supabase';

export default function Login() {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'email' | 'otp'>('email');

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) {
            alert(error.message);
        } else {
            alert('Code sent! Check your email.');
            setStep('otp');
        }
        setLoading(false);
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: 'email',
        });

        if (error) {
            alert(error.message);
        } else {
            // Session updates automatically via onAuthStateChange in App.tsx
        }
        setLoading(false);
    };

    return (
        <div className="login-container" style={{ padding: '20px', textAlign: 'center' }}>
            <h2>NotebookLM Export Pro</h2>
            <p>Sign in to unlock export features</p>

            {step === 'email' ? (
                <form onSubmit={handleSendOtp}>
                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ padding: '8px', width: '100%', marginBottom: '10px' }}
                    />
                    <button type="submit" disabled={loading} style={{ padding: '8px 16px' }}>
                        {loading ? 'Sending...' : 'Send Login Code'}
                    </button>
                </form>
            ) : (
                <form onSubmit={handleVerifyOtp}>
                    <p style={{ fontSize: '12px', marginBottom: '10px' }}>Enter the code from your email.</p>
                    <input
                        type="text"
                        placeholder="Enter Code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        style={{ padding: '8px', width: '100%', marginBottom: '10px' }}
                    />
                    <button type="submit" disabled={loading} style={{ padding: '8px 16px' }}>
                        {loading ? 'Verifying...' : 'Verify & Login'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setStep('email')}
                        style={{ display: 'block', margin: '10px auto', background: 'none', border: 'none', color: 'blue', cursor: 'pointer', fontSize: '12px' }}
                    >
                        Back to Email
                    </button>
                </form>
            )}
        </div>
    );
}
