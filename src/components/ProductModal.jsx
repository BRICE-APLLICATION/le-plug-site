import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const PICKUP_ADDRESS = '6405 rue de Champagnier'

export default function ProductModal({ product, onClose, onOrderPlaced }) {
  const [quantity, setQuantity] = useState(1)
  const [fulfillment, setFulfillment] = useState('pickup')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const maxQuantity = product.stock
  const total = useMemo(() => (Number(product.price) * quantity).toFixed(2), [product.price, quantity])

  function decrementQty() {
    setQuantity((q) => Math.max(1, q - 1))
  }

  function incrementQty() {
    setQuantity((q) => Math.min(maxQuantity, q + 1))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (fulfillment !== 'pickup') return
    if (!name.trim() || !phone.trim()) {
      setError('Nom et téléphone sont obligatoires.')
      return
    }

    setSubmitting(true)
    setError(null)

    const { data: order, error: rpcError } = await supabase
      .rpc('place_order', {
        p_product_id: product.id,
        p_quantity: quantity,
        p_customer_name: name.trim(),
        p_customer_phone: phone.trim(),
        p_fulfillment_type: fulfillment,
      })
      .single()

    if (rpcError) {
      setSubmitting(false)
      setError(
        rpcError.message?.includes('stock')
          ? "Stock insuffisant pour cette quantité."
          : "Une erreur est survenue. Réessaie.",
      )
      return
    }

    supabase.functions
      .invoke('send-order-email', {
        body: {
          orderId: order.id,
          customerName: name.trim(),
          customerPhone: phone.trim(),
          productName: product.name,
          quantity,
          totalPrice: total,
          pickupAddress: PICKUP_ADDRESS,
        },
      })
      .catch((err) => console.error('Email notification failed', err))

    setSubmitting(false)
    setSuccess(true)
    onOrderPlaced?.()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm px-0 sm:px-6">
      <div className="relative w-full sm:max-w-md max-h-[92vh] overflow-y-auto bg-black border border-white/20 p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white text-xl leading-none"
          aria-label="Fermer"
        >
          ✕
        </button>

        {success ? (
          <div className="py-10 text-center">
            <p className="text-lg mb-2">Commande reçue !</p>
            <p className="text-white/70 text-sm leading-relaxed">
              Tu seras contacté dans l'heure pour organiser le pickup. Prépare
              du cash ou un paiement Interac.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 border border-white px-6 py-2 uppercase tracking-widest text-sm hover:bg-white hover:text-black transition-colors"
            >
              Fermer
            </button>
          </div>
        ) : (
          <>
            <div className="aspect-square w-full overflow-hidden bg-white/5 border border-white/10 mb-4 flex items-center justify-center">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl font-bold text-white/30">{product.name?.[0] ?? '?'}</span>
              )}
            </div>

            <h2 className="uppercase tracking-widest font-bold text-lg mb-1">{product.name}</h2>
            <p className="text-white/70 mb-4">{Number(product.price).toFixed(0)}$ CAD / unité</p>

            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm uppercase tracking-widest text-white/60">Quantité</span>
              <div className="flex items-center border border-white/30">
                <button
                  type="button"
                  onClick={decrementQty}
                  className="w-9 h-9 flex items-center justify-center hover:bg-white/10"
                >
                  −
                </button>
                <span className="w-10 text-center">{quantity}</span>
                <button
                  type="button"
                  onClick={incrementQty}
                  disabled={quantity >= maxQuantity}
                  className="w-9 h-9 flex items-center justify-center hover:bg-white/10 disabled:opacity-30"
                >
                  +
                </button>
              </div>
            </div>

            <p className="mb-6 text-sm">
              Total : <span className="font-bold">{total}$ CAD</span>
            </p>

            <div className="mb-6">
              <span className="text-sm uppercase tracking-widest text-white/60 block mb-2">
                Mode de réception
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFulfillment('pickup')}
                  className={`border px-3 py-2 text-sm uppercase tracking-widest transition-colors ${
                    fulfillment === 'pickup'
                      ? 'border-white bg-white text-black'
                      : 'border-white/30 hover:border-white'
                  }`}
                >
                  Pickup
                </button>
                <div className="relative">
                  <button
                    type="button"
                    disabled
                    className="w-full border border-white/10 px-3 py-2 text-sm uppercase tracking-widest text-white/30 cursor-not-allowed"
                  >
                    Livraison
                  </button>
                </div>
              </div>
              <p className="text-xs text-white/40 mt-2">
                Bientôt disponible — Zone desservie : DIX30, Brossard
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Nom complet"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-transparent border border-white/30 px-3 py-2 outline-none focus:border-white placeholder:text-white/40"
              />
              <input
                type="tel"
                placeholder="Numéro de téléphone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="bg-transparent border border-white/30 px-3 py-2 outline-none focus:border-white placeholder:text-white/40"
              />

              {error && <p className="text-sm text-white/80 border border-white/40 px-3 py-2">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 border border-white px-6 py-3 uppercase tracking-widest text-sm hover:bg-white hover:text-black transition-colors disabled:opacity-50"
              >
                {submitting ? 'Envoi...' : 'Confirmer la commande'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
