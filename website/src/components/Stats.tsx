import { useState, useEffect } from 'react'
import './Stats.css'

interface StatsProps {
  totalTerms: number
}

export default function Stats({ totalTerms }: StatsProps) {
  const [downloads, setDownloads] = useState<string>('—')

  useEffect(() => {
    fetch('https://api.npmjs.org/downloads/point/last-month/toxibr')
      .then(res => res.json())
      .then(data => {
        if (data.downloads !== undefined) {
          setDownloads(formatNumber(data.downloads))
        }
      })
      .catch(() => setDownloads('—'))
  }, [])

  return (
    <section className="stats-section">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value accent">{totalTerms}</div>
          <div className="stat-label">Termos bloqueados</div>
        </div>
        <div className="stat-card">
          <div className="stat-value green">&lt; 1ms</div>
          <div className="stat-label">Por mensagem</div>
        </div>
        <div className="stat-card">
          <div className="stat-value pink">{downloads}</div>
          <div className="stat-label">Downloads / mes (npm)</div>
        </div>
      </div>
    </section>
  )
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k'
  return n.toString()
}
