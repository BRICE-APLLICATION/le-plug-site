import { useState } from 'react'
import Starfield from './components/Starfield'
import { AccessDenied, AgeGate, isAgeVerified } from './components/AgeGate'
import ProductCard from './components/ProductCard'
import ProductModal from './components/ProductModal'
import { useProducts } from './lib/useProducts'

function App() {
  const [ageStatus, setAgeStatus] = useState(() =>
    isAgeVerified() ? 'verified' : 'pending',
  )
  const [selectedProduct, setSelectedProduct] = useState(null)
  const { products, loading, error, refetch } = useProducts()

  if (ageStatus === 'denied') {
    return <AccessDenied />
  }

  return (
    <div className="relative min-h-screen">
      <Starfield />

      {ageStatus === 'pending' && (
        <AgeGate
          onConfirm={() => setAgeStatus('verified')}
          onDeny={() => setAgeStatus('denied')}
        />
      )}

      {ageStatus === 'verified' && (
        <div className="relative z-10 min-h-screen flex flex-col">
          <header className="border-b border-white/15 py-8 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-wide-xl">LE PLUG</h1>
            <p className="text-white/50 text-sm mt-2 uppercase tracking-widest">
              Mélasse à chicha — pré-commande
            </p>
          </header>

          <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-10">
            {loading && <p className="text-center text-white/50">Chargement des saveurs...</p>}
            {error && (
              <p className="text-center text-white/70 border border-white/30 p-4">
                Impossible de charger les produits. Vérifie la configuration Supabase.
              </p>
            )}

            {!loading && !error && (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                {products.map((product, i) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={i}
                    onSelect={setSelectedProduct}
                  />
                ))}
              </div>
            )}
          </main>

          <footer className="border-t border-white/15 py-6 text-center text-white/40 text-xs uppercase tracking-widest">
            Paiement cash ou Interac au pickup — 18 ans et plus
          </footer>
        </div>
      )}

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onOrderPlaced={refetch}
        />
      )}
    </div>
  )
}

export default App
