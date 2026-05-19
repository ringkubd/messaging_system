import React from 'react';
import { Link } from 'react-router-dom';

export default function VerifyNoticePage({ onLogout }) {
    const [resending, setResending] = React.useState(false);
    const [resendMessage, setResendMessage] = React.useState('');

    async function handleResend() {
        setResending(true);
        setResendMessage('');
        try {
            const response = await window.axios.post('/api/v1/auth/email/resend');
            setResendMessage(response.data.message);
        } catch (error) {
            setResendMessage(error?.response?.data?.message || 'Could not resend verification email.');
        } finally {
            setResending(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">IB</div>
                <h1 className="auth-title">Verify Your Email</h1>

                <div style={{ textAlign: 'center', margin: '24px 0' }}>
                    <p style={{ color: '#4b5563', lineHeight: 1.7, marginBottom: 8 }}>
                        Thanks for creating an account!
                    </p>
                    <p style={{ color: '#4b5563', lineHeight: 1.7 }}>
                        We've sent a verification email to your registered address.
                        Please check your inbox and click the verification link to activate your account.
                    </p>
                </div>

                <div className="form-group">
                    <button
                        className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center' }}
                        onClick={handleResend}
                        disabled={resending}
                    >
                        {resending ? 'Sending...' : 'Resend Verification Email'}
                    </button>
                </div>

                {resendMessage && (
                    <div
                        className={resendMessage.includes('Could not') || resendMessage.includes('already') ? 'form-error' : 'form-success'}
                        style={{ textAlign: 'center' }}
                    >
                        {resendMessage}
                    </div>
                )}

                <div className="auth-toggle" style={{ marginTop: 8 }}>
                    <Link to="/" onClick={onLogout}>Back to Login</Link>
                </div>
            </div>
        </div>
    );
}
