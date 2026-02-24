<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <title>Bienvenido</title>
  </head>
  <body style="margin:0; padding:0; background:#0f172a; color:#e2e8f0; font-family: Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a; padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background:#0b1220; border-radius:16px; padding:24px; border:1px solid #1e293b;">
            <tr>
              <td style="color:#94a3b8; font-size:12px; letter-spacing:0.2em; text-transform:uppercase;">
                Privex
              </td>
            </tr>
            <tr>
              <td style="color:#ffffff; font-size:22px; font-weight:700; padding-top:8px;">
                Bienvenido, {{ $user->name }}
              </td>
            </tr>
            <tr>
              <td style="color:#cbd5f5; font-size:14px; padding-top:12px;">
                Tu cuenta fue creada correctamente. Usa las siguientes credenciales para ingresar:
              </td>
            </tr>
            <tr>
              <td style="padding-top:12px; color:#e2e8f0; font-size:14px;">
                <strong>Correo:</strong> {{ $user->email }}<br>
                <strong>Contrasena:</strong> {{ $password }}
              </td>
            </tr>
            <tr>
              <td style="padding-top:20px;">
                <a href="{{ $loginUrl }}" style="display:inline-block; background:#22d3ee; color:#0b1220; text-decoration:none; padding:12px 18px; border-radius:10px; font-weight:700; font-size:14px;">
                  Ingresar al panel
                </a>
              </td>
            </tr>
            <tr>
              <td style="color:#94a3b8; font-size:12px; padding-top:20px;">
                Si no solicitaste este acceso, puedes ignorar este mensaje.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
