import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';

export default function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = React.useState('loading');
    const [message, setMessage] = React.useState('');

    React.useEffect(() => {
        let mounted = true;
        async function verify() {
            const id = searchParams.get('id');
            const hash = searchParams.get('hash');

            if (!id || !hash) {
                if (mounted) {
                    setStatus('error');
                    setMessage('Invalid verification link.');
                }
                return;
            }

            try {
                const response = await window.axios.get(`/api/v1/auth/email/verify/${id}/${hash}`);
                if (mounted) {
                    setStatus('success');
                    setMessage(response.data.message);
                }
            } catch (error) {
                if (mounted) {
                    setStatus('error');
                    setMessage(error?.response?.data?.message || 'Verification failed.');
                }
            }
        }
        verify();
        return () => { mounted = false; };
    }, [searchParams]);

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">IB</div>
                <h1 className="auth-title">IsDB-BISEW Connect</h1>

                {status === 'loading' && (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                        <div className="spinner" />
                        <p style={{ marginTop: 16, color: '#6b7280' }}>Verifying your email...</p>
                    </div>
                )}

                {status === 'success' && (
                    <>
                        <div className="form-success" style={{ textAlign: 'center', margin: '16px 0' }}>
                            {message}
                        </div>
                        <div className="form-group">
                            <Link to="/" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', display: 'flex' }}>
                                Go to Login
                            </Link>
                        </div>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="form-error" style={{ textAlign: 'center', margin: '16px 0' }}>
                            {message}
                        </div>
                        <div className="form-group">
                            <Link to="/" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', display: 'flex' }}>
                                Back to Login
                            </Link>
                        </div>
                        <div className="auth-toggle" style={{ marginTop: 8 }}>
                            <Link to="/verify-notice">Resend verification email</Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
