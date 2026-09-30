import { lazy, Suspense } from 'react'

// Leaflet загружается только когда открыта вкладка с картой
const MapView = lazy(() => import('./MapView.jsx'))

export default function LazyMap({ map }) {
  return (
    <Suspense fallback={<div className="mapview__skeleton">Загружаем карту…</div>}>
      <MapView map={map} />
    </Suspense>
  )
}
