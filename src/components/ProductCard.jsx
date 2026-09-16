export default function ProductCard({ product, onSelect, index }) {
  const soldOut = product.stock <= 0

  return (
    <button
      type="button"
      onClick={() => !soldOut && onSelect(product)}
      disabled={soldOut}
      className={`card-shadow group relative border border-white/15 bg-black text-left p-4 flex flex-col gap-3 transition-transform duration-300 ${
        soldOut ? 'opacity-40 cursor-not-allowed' : 'hover:scale-[1.03] hover:border-white'
      }`}
    >
      <div className="aspect-square w-full overflow-hidden flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="spin-jar w-4/5 h-4/5 object-contain group-hover:[animation-play-state:paused]"
            style={{ '--spin-delay': `${index * -1.2}s` }}
          />
        ) : (
          <span className="text-4xl font-bold tracking-widest text-white/30">
            {product.name?.[0] ?? '?'}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h3 className="uppercase tracking-widest text-sm font-bold">{product.name}</h3>
        <span className="text-sm">{Number(product.price).toFixed(0)}$</span>
      </div>

      {soldOut && (
        <span className="absolute top-3 right-3 border border-white px-2 py-1 text-[10px] uppercase tracking-widest bg-black">
          Épuisé
        </span>
      )}
    </button>
  )
}
