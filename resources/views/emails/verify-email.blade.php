<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Verify Your Email</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f4f6f9;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            color: #1f2937;
        }
        .email-wrapper {
            width: 100%;
            padding: 40px 0;
        }
        .email-container {
            max-width: 560px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        .email-header {
            background: linear-gradient(135deg, #2563eb, #1e40af);
            padding: 32px 40px;
            text-align: center;
        }
        .email-header-logo {
            font-size: 32px;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: -1px;
        }
        .email-header-title {
            color: rgba(255, 255, 255, 0.9);
            font-size: 16px;
            margin-top: 6px;
        }
        .email-body {
            padding: 40px;
        }
        .email-greeting {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 16px;
        }
        .email-text {
            font-size: 15px;
            line-height: 1.7;
            color: #4b5563;
            margin-bottom: 24px;
        }
        .email-button {
            display: inline-block;
            background-color: #2563eb;
            color: #ffffff;
            font-size: 15px;
            font-weight: 600;
            padding: 14px 36px;
            border-radius: 8px;
            text-decoration: none;
            text-align: center;
        }
        .email-button-wrap {
            text-align: center;
            margin: 28px 0;
        }
        .email-footer {
            padding: 24px 40px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 13px;
            color: #9ca3af;
        }
        .email-footer a {
            color: #2563eb;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-container">
            <div class="email-header">
                <div class="email-header-logo">IB</div>
                <div class="email-header-title">IsDB-BISEW Connect</div>
            </div>
            <div class="email-body">
                <div class="email-greeting">Hello, {{ $user->name }}!</div>
                <div class="email-text">
                    Thank you for creating an account on IsDB-BISEW Connect. Please click the button below
                    to verify your email address.
                </div>
                <div class="email-button-wrap">
                    <a class="email-button" href="{{ $url }}">Verify Email</a>
                </div>
                <div class="email-text" style="margin-top: 20px;">
                    If you did not create an account, please ignore this email.
                </div>
            </div>
            <div class="email-footer">
                &copy; {{ date('Y') }} IsDB-BISEW Connect. All rights reserved.<br>
                If the button above doesn't work, copy and paste this URL into your browser:<br>
                <a href="{{ $url }}">{{ $url }}</a>
            </div>
        </div>
    </div>
</body>
</html>
