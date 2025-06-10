/*
  # Add custom email templates for password reset

  1. Changes
    - Add custom email template for password reset in French
    - Configure email template with personalized message
*/

-- Create or update the password reset email template
INSERT INTO auth.email_templates (template_id, template_type, template_name, template_body, template_subject, template_variables, template_enabled, template_referrer_urls)
VALUES (
  'password-reset',
  'recovery',
  'Password Reset',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Réinitialisation de votre mot de passe Chaabik</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #FFD700;
    }
    .content {
      background-color: #f9f9f9;
      padding: 30px;
      border-radius: 8px;
    }
    .button {
      display: inline-block;
      background-color: #FFD700;
      color: #000 !important;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 4px;
      font-weight: bold;
      margin: 20px 0;
    }
    .footer {
      margin-top: 30px;
      text-align: center;
      font-size: 12px;
      color: #777;
    }
    .note {
      font-size: 13px;
      color: #666;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">CHAABIK</div>
    </div>
    <div class="content">
      <h2>Bonjour,</h2>
      <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Chaabik.</p>
      <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe. Ce lien est valable pendant 24 heures.</p>
      <div style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="button">Réinitialiser mon mot de passe</a>
      </div>
      <p class="note">Si vous n''avez pas demandé cette réinitialisation, vous pouvez ignorer cet e-mail en toute sécurité.</p>
      <p>Cordialement,<br>L''équipe Chaabik</p>
    </div>
    <div class="footer">
      <p>© 2025 Chaabik. Tous droits réservés.</p>
      <p>Nouakchott, Mauritanie</p>
    </div>
  </div>
</body>
</html>',
  'Réinitialisation de votre mot de passe Chaabik',
  '{"ConfirmationURL": "string"}',
  true,
  ARRAY['http://localhost:5173/reset-password', 'https://chaabik.com/reset-password']
)
ON CONFLICT (template_id) DO UPDATE SET
  template_body = EXCLUDED.template_body,
  template_subject = EXCLUDED.template_subject,
  template_variables = EXCLUDED.template_variables,
  template_enabled = EXCLUDED.template_enabled,
  template_referrer_urls = EXCLUDED.template_referrer_urls;