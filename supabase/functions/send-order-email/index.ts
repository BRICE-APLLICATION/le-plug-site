// Supabase Edge Function — envoie un email de notification de commande via Resend.
// Déployer avec : supabase functions deploy send-order-email
// Variable d'environnement requise (secret) : RESEND_API_KEY

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const NOTIFY_EMAIL = 'afroface49@gmail.com'
// Domaine expéditeur : à remplacer par un domaine vérifié dans Resend,
// ou garder onboarding@resend.dev pour tester sans vérification de domaine.
const FROM_EMAIL = 'Le Plug <onboarding@resend.dev>'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY manquant dans les secrets de la fonction')
    }

    const {
      customerName,
      customerPhone,
      productName,
      quantity,
      totalPrice,
      pickupAddress,
    } = await req.json()

    const html = `
      <h2>Nouvelle commande — Le Plug</h2>
      <p><strong>Client :</strong> ${customerName}</p>
      <p><strong>Téléphone :</strong> ${customerPhone}</p>
      <p><strong>Saveur :</strong> ${productName}</p>
      <p><strong>Quantité :</strong> ${quantity}</p>
      <p><strong>Prix total :</strong> ${totalPrice}$ CAD</p>
      <p><strong>Adresse de pickup à donner au client :</strong> ${pickupAddress}</p>
    `

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [NOTIFY_EMAIL],
        subject: `Nouvelle commande — ${productName} x${quantity}`,
        html,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Resend error: ${errText}`)
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
