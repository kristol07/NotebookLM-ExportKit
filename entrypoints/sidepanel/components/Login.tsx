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
        <div className="login-container" style={{ padding: '20px', textAlign: 'center', position: 'relative' }}>
            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    className="export-btn"
                    style={{
                        position: 'absolute',
                        top: '20px',
                        left: '20px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        padding: '5px 10px',
                        fontWeight: 600
                    }}
                    title="Back to Dashboard"
                >
                    Back
                </button>
            )}

            <div style={{ marginTop: '40px', marginBottom: '24px' }}>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#eee' }}>NotebookLM Export Pro</h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#888' }}>Sign in to unlock advanced exports</p>
            </div>

            {message && (
                <div style={{
                    backgroundColor: message.type === 'error' ? '#3d1c1c' : '#1c3d25',
                    color: message.type === 'error' ? '#ff9999' : '#99ffbb',
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    marginBottom: '16px',
                    textAlign: 'left',
                    border: message.type === 'error' ? '1px solid #7a3333' : '1px solid #337a4a'
                }}>
                    {message.text}
                </div>
            )}

            {step === 'email' ? (
                <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{
                            padding: '10px',
                            borderRadius: '4px',
                            border: '1px solid #444',
                            background: '#222',
                            color: '#fff',
                            width: '100%',
                            boxSizing: 'border-box'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="export-btn"
                        style={{
                            padding: '10px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '13px'
                        }}
                    >
                        {loading ? 'Sending...' : 'Send Login Code'}
                    </button>
                </form>
            ) : (
                <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <p style={{ fontSize: '13px', margin: 0, textAlign: 'left', color: '#ccc' }}>
                        Enter the code sent to <strong>{email}</strong>
                    </p>
                    <input
                        type="text"
                        placeholder="Enter 6-digit Code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        style={{
                            padding: '10px',
                            borderRadius: '4px',
                            border: '1px solid #444',
                            background: '#222',
                            color: '#fff',
                            width: '100%',
                            boxSizing: 'border-box'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="export-btn"
                        style={{
                            padding: '10px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '13px'
                        }}
                    >
                        {loading ? 'Verifying...' : 'Verify & Login'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setStep('email')}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#888',
                            cursor: 'pointer',
                            fontSize: '12px',
                            marginTop: '4px',
                            textDecoration: 'underline'
                        }}
                    >
                        Wrong email? Try again
                    </button>
                </form>
            )}
        </div>
    );
}
