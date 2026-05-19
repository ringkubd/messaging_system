import React from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token') || '';
    const emailParam = searchParams.get('email') || '';

    const [email, setEmail] = React.useState(emailParam);
    const [password, setPassword] = React.useState('');
    const [passwordConfirmation, setPasswordConfirmation] = React.useState('');
    const [error, setError] = React.useState('');
    const [busy, setBusy] = React.useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setError('');
        setBusy(true);

        try {
            await window.axios.post('/api/v1/auth/reset-password', {
                token,
                email,
                password,
                password_confirmation: passwordConfirmation,
            });

            navigate('/?reset=success');
        } catch (err) {
            const msg = err?.response?.data?.errors?.email?.[0]
                || err?.response?.data?.message
                || 'Something went wrong. The link may have expired.';
            setError(msg);
        } finally {
            setBusy(false);
        }
    }

    if (!token || !emailParam) {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <div className="auth-logo">IB</div>
                    <h1 className="auth-title">Invalid Link</h1>
                    <p className="auth-subtitle">This password reset link is invalid or has expired.</p>
                    <div className="auth-toggle">
                        <Link to="/">Back to Sign In</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">IB</div>
                <h1 className="auth-title">Set new password</h1>
                <p className="auth-subtitle">Choose a new password for your account</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            className="form-input"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            readOnly
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">New Password</label>
                        <input
                            className="form-input"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Min. 8 characters"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Confirm Password</label>
                        <input
                            className="form-input"
                            type="password"
                            value={passwordConfirmation}
                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                            placeholder="Repeat your new password"
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
                            {busy ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </div>

                    {error && <div className="form-error" style={{ textAlign: 'center' }}>{error}</div>}
                </form>

                <div className="auth-toggle">
                    <Link to="/">Back to Sign In</Link>
                </div>
            </div>
        </div>
    );
}
