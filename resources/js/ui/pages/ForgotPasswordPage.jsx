import React from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPasswordPage() {
    const [email, setEmail] = React.useState('');
    const [message, setMessage] = React.useState('');
    const [error, setError] = React.useState('');
    const [busy, setBusy] = React.useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setMessage('');
        setError('');
        setBusy(true);

        try {
            await window.axios.post('/api/v1/auth/forgot-password', { email });
            setMessage('If that email address is registered, you will receive a password reset link shortly.');
            setEmail('');
        } catch (err) {
            const msg = err?.response?.data?.errors?.email?.[0]
                || err?.response?.data?.message
                || 'Something went wrong. Please try again.';
            setError(msg);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">IB</div>
                <h1 className="auth-title">Reset your password</h1>
                <p className="auth-subtitle">Enter your email and we'll send you a reset link</p>

                {message && (
                    <div className="form-success" style={{ textAlign: 'center', marginBottom: 16 }}>
                        {message}
                    </div>
                )}

                {!message && (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                className="form-input"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <button
                                className="btn btn-primary"
                                style={{ width: '100%', justifyContent: 'center' }}
                                disabled={busy}
                                type="submit"
                            >
                                {busy ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </div>

                        {error && <div className="form-error" style={{ textAlign: 'center' }}>{error}</div>}
                    </form>
                )}

                <div className="auth-toggle">
                    <Link to="/">Back to Sign In</Link>
                </div>
            </div>
        </div>
    );
}
