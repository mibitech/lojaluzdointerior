import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type TemplateType = 'password_changed'

const baseLayout = (content: string) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f0f0f0;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0f0;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td align="center" style="background-color:#1a1a2e;border-radius:12px 12px 0 0;padding:36px 40px 28px;">
              <p style="margin:0 0 8px;font-size:28px;letter-spacing:8px;color:#c9a84c;">✦ ✦ ✦</p>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">
                Loja Amor da Pátria
              </h1>
              <p style="margin:6px 0 0;color:#c9a84c;font-size:12px;letter-spacing:3px;text-transform:uppercase;">
                Fraternidade &bull; Verdade &bull; Justiça
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:40px 48px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color:#1a1a2e;border-radius:0 0 12px 12px;padding:24px 40px;">
              <p style="margin:0;color:#c9a84c;font-size:11px;letter-spacing:2px;text-transform:uppercase;">
                Loja Amor da Pátria &mdash; Comunicação Oficial
              </p>
              <p style="margin:8px 0 0;color:#6b6b8a;font-size:11px;">
                Esta é uma mensagem automática. Por favor, não responda a este e-mail.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

function buildEmailContent(templateType: TemplateType, toName: string): { subject: string; htmlContent: string } {
  if (templateType === 'password_changed') {
    const date = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    const content = `
      <div style="text-align:center;margin-bottom:32px;">
        <div style="display:inline-block;width:64px;height:64px;background-color:#1a1a2e;border-radius:50%;line-height:64px;font-size:28px;">
          🔑
        </div>
      </div>
      <h2 style="margin:0 0 8px;color:#1a1a2e;font-size:22px;font-weight:700;text-align:center;">
        Senha Alterada
      </h2>
      <p style="margin:0 0 28px;color:#888;font-size:13px;text-align:center;letter-spacing:1px;text-transform:uppercase;">
        Confirmação de segurança
      </p>
      <p style="margin:0 0 16px;color:#333;font-size:15px;line-height:1.7;">
        Olá, <strong>${toName}</strong>,
      </p>
      <p style="margin:0 0 24px;color:#333;font-size:15px;line-height:1.7;">
        Sua senha foi alterada com sucesso em <strong>${date}</strong>.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td style="background-color:#fff5f5;border-left:4px solid #e53e3e;border-radius:4px;padding:16px 20px;">
            <p style="margin:0;color:#c53030;font-size:14px;line-height:1.6;">
              <strong>Não foi você?</strong><br>
              Se você não realizou esta alteração, entre em contato com o administrador da Loja imediatamente para bloquear o acesso.
            </p>
          </td>
        </tr>
      </table>
      <hr style="border:none;border-top:1px solid #eee;margin:28px 0;">
      <p style="margin:0;color:#888;font-size:13px;line-height:1.6;text-align:center;">
        Fraternalmente,<br>
        <strong style="color:#1a1a2e;">Secretaria da Loja Amor da Pátria</strong>
      </p>`
    return {
      subject: 'Senha alterada — Loja Amor da Pátria',
      htmlContent: baseLayout(content),
    }
  }

  throw new Error(`Template desconhecido: ${templateType}`)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user?.email) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const templateType = body.templateType as TemplateType

    if (templateType !== 'password_changed') {
      return new Response(JSON.stringify({ error: 'Template inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const brevoKey = Deno.env.get('BREVO_API_KEY')
    const senderEmail = Deno.env.get('BREVO_SENDER_EMAIL')
    if (!brevoKey || !senderEmail) {
      return new Response(JSON.stringify({ error: 'Configuração de e-mail ausente' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const toName = user.user_metadata?.full_name || user.email
    const { subject, htmlContent } = buildEmailContent(templateType, toName)

    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': brevoKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Loja Amor da Pátria', email: senderEmail },
        to: [{ email: user.email, name: toName }],
        subject,
        htmlContent,
      }),
    })

    if (!brevoResponse.ok) {
      const brevoError = await brevoResponse.json()
      console.error('Erro Brevo:', brevoError)
      return new Response(JSON.stringify({ error: 'Falha ao enviar e-mail' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Erro inesperado:', error)
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
