/** HTML de l'email de confirmation d'inscription (envoyé via Mailtrap en dev). */
function verifyEmailTemplate({ username, verifyLink }) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirme ton adresse email</title>
</head>
<body style="margin:0; padding:0; background:#F7F7F7; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F7F7; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%; background:#FFFFFF; border-radius:16px; overflow:hidden; border:2px solid #E5E5E5;">

          <tr>
            <td style="background:#58CC02; padding:24px; text-align:center;">
              <span style="font-size:20px; font-weight:900; color:#FFFFFF;">DuoLingua</span>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 32px 8px;">
              <h1 style="margin:0 0 16px; font-size:22px; font-weight:900; color:#3C3C3C;">
                Bienvenue${username ? ` ${username}` : ''} !
              </h1>
              <p style="margin:0 0 24px; font-size:15px; line-height:1.6; color:#777777;">
                Encore une étape avant de commencer à apprendre : confirme ton adresse email en
                cliquant sur le bouton ci-dessous. Ce lien expire dans <strong>24 heures</strong>.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 32px; text-align:center;">
              <a href="${verifyLink}"
                style="display:inline-block; background:#58CC02; color:#FFFFFF; text-decoration:none;
                       font-weight:900; font-size:15px; padding:14px 32px; border-radius:16px;
                       border-bottom:4px solid #58A700;">
                Confirmer mon email
              </a>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 32px;">
              <p style="margin:0 0 8px; font-size:13px; color:#AFAFAF;">
                Si le bouton ne fonctionne pas, copie ce lien dans ton navigateur :
              </p>
              <p style="margin:0; font-size:13px; color:#1CB0F6; word-break:break-all;">
                ${verifyLink}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 32px; background:#F7F7F7; border-top:2px solid #E5E5E5;">
              <p style="margin:0; font-size:12px; color:#AFAFAF; text-align:center;">
                Si tu n'es pas à l'origine de cette inscription, ignore simplement cet email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

module.exports = { verifyEmailTemplate };
