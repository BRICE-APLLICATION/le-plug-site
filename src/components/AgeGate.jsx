const STORAGE_KEY = 'le-plug-age-verified'

export function isAgeVerified() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function setAgeVerified() {
  try {
    localStorage.setItem(STORAGE_KEY, 'true')
  } catch {
    // ignore storage errors (private browsing, etc.)
  }
}

export function AgeGate({ onConfirm, onDeny }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black px-6">
      <div className="max-w-sm w-full text-center border border-white/20 p-8">
        <h1 className="text-2xl tracking-wide-xl font-bold mb-6">LE PLUG</h1>
        <p className="text-lg mb-8">As-tu 18 ans ou plus ?</p>
        <div className="flex gap-4 justify-center">
          <button
            type="button"
            onClick={() => {
              setAgeVerified()
              onConfirm()
            }}
            className="flex-1 border border-white px-6 py-3 uppercase tracking-widest text-sm hover:bg-white hover:text-black transition-colors"
          >
            Oui
          </button>
          <button
            type="button"
            onClick={onDeny}
            className="flex-1 border border-white/40 text-white/60 px-6 py-3 uppercase tracking-widest text-sm hover:border-white hover:text-white transition-colors"
          >
            Non
          </button>
        </div>
      </div>
    </div>
  )
}

export function AccessDenied() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black px-6">
      <div className="max-w-sm w-full text-center">
        <h1 className="text-xl tracking-wide-xl font-bold mb-4">ACCÈS REFUSÉ</h1>
        <p className="text-white/70">
          Ce site est réservé aux personnes de 18 ans et plus.
        </p>
      </div>
    </div>
  )
}
