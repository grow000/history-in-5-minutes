import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const TYPE_COLORS = {
  battle: '#dc2626',
  city: '#4f46e5',
  capital: '#7c3aed',
  event: '#0d9488',
  place: '#d97706',
}

const TYPE_LABELS = {
  battle: 'Сражение',
  city: 'Город',
  capital: 'Столица',
  event: 'Событие',
  place: 'Место',
}

const ROUTE_COLORS = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#9333ea']

function useDark() {
  const get = () => {
    const attr = document.documentElement.getAttribute('data-theme')
    if (attr) return attr === 'dark'
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  }
  const [dark, setDark] = useState(get)
  useEffect(() => {
    const obs = new MutationObserver(() => setDark(get()))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])
  return dark
}

function FitBounds({ bounds }) {
  const map = useMap()
  useEffect(() => {
    if (bounds.length > 1) map.fitBounds(bounds, { padding: [36, 36], maxZoom: 7 })
  }, [map, bounds])
  return null
}

// Карта событий темы. Используется современная подложка — на ней отмечены места событий.
export default function MapView({ map }) {
  const dark = useDark()
  const [active, setActive] = useState(null)

  const bounds = useMemo(() => {
    const pts = [...(map.points ?? []).map((p) => [p.lat, p.lng]), ...(map.routes ?? []).flatMap((r) => r.path)]
    return pts
  }, [map])

  const center = map.center ?? bounds[0] ?? [55.75, 37.62]
  const types = [...new Set((map.points ?? []).map((p) => p.type ?? 'place'))]

  return (
    <div className={'mapview' + (dark ? ' mapview--dark' : '')}>
      <div className="mapview__frame">
        <MapContainer center={center} zoom={map.zoom ?? 5} scrollWheelZoom={false} className="mapview__map">
          <TileLayer
            attribution='&copy; участники <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={18}
          />
          {!map.center && <FitBounds bounds={bounds} />}
          {(map.routes ?? []).map((r, i) => (
            <Polyline
              key={r.name + i}
              positions={r.path}
              pathOptions={{ color: r.color ?? ROUTE_COLORS[i % ROUTE_COLORS.length], weight: 4, dashArray: r.dashed ? '8 8' : undefined, opacity: 0.85 }}
            >
              {!map.quiz && <Tooltip sticky>{r.name}</Tooltip>}
            </Polyline>
          ))}
          {(map.points ?? []).map((p, i) => (
            <CircleMarker
              key={p.name + i}
              center={[p.lat, p.lng]}
              radius={active === i ? 11 : 8}
              pathOptions={{
                color: '#fff',
                weight: 2,
                fillColor: TYPE_COLORS[p.type] ?? TYPE_COLORS.place,
                fillOpacity: 0.95,
              }}
              eventHandlers={{ click: () => setActive(i), mouseover: () => setActive(i) }}
            >
              {map.quiz ? (
                <Tooltip permanent direction="top" offset={[0, -6]} className="map-num">
                  {p.label ?? i + 1}
                </Tooltip>
              ) : (
                <Tooltip direction="top" offset={[0, -6]}>
                  <b>{p.name}</b>
                  {p.date ? ` · ${p.date}` : ''}
                </Tooltip>
              )}
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {!map.quiz && (
      <div className="mapview__legend">
        {types.map((t) => (
          <span key={t} className="legend-item">
            <span className="legend-dot" style={{ background: TYPE_COLORS[t] ?? TYPE_COLORS.place }} />
            {TYPE_LABELS[t] ?? 'Место'}
          </span>
        ))}
        {(map.routes ?? []).map((r, i) => (
          <span key={r.name + i} className="legend-item">
            <span className="legend-line" style={{ background: r.color ?? ROUTE_COLORS[i % ROUTE_COLORS.length] }} />
            {r.name}
          </span>
        ))}
      </div>
      )}

      {!map.quiz && (
      <ol className="mapview__list">
        {(map.points ?? []).map((p, i) => (
          <li
            key={p.name + i}
            className={active === i ? 'is-active' : ''}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            tabIndex={0}
          >
            <span className="legend-dot" style={{ background: TYPE_COLORS[p.type] ?? TYPE_COLORS.place }} />
            <div>
              <b>{p.name}</b>
              {p.date && <span className="mapview__date"> · {p.date}</span>}
              {p.text && <p>{p.text}</p>}
            </div>
          </li>
        ))}
      </ol>
      )}
      <p className="mapview__note">
        Места событий отмечены на современной карте. Границы государств того времени отличались от нынешних.
      </p>
    </div>
  )
}
