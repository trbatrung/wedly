import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import { weddings } from '@/lib/data'

export default function GuestsPage({ params }: { params: { id: string } }) {
  const wedding = weddings.find(w => w.id === params.id) ?? weddings[0]
  const subPages = ['Kanban','Vendors','Budget','Timeline','Guests']
  const confirmed = wedding.guests.filter(g => g.rsvp === 'confirmed').length
  const pending   = wedding.guests.filter(g => g.rsvp === 'pending').length
  const declined  = wedding.guests.filter(g => g.rsvp === 'declined').length

  const rsvpStyle: Record<string, { bg: string; color: string }> = {
    confirmed: { bg: 'var(--sage-light)',  color: 'var(--sage)'       },
    pending:   { bg: 'var(--gold-light)',  color: 'var(--gold)'       },
    declined:  { bg: 'var(--blush-light)', color: 'var(--blush)'      },
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ marginLeft: 220, flex: 1 }}>
        <header style={{ background: 'var(--cream)', borderBottom: '1px solid var(--stone)', padding: '14px 32px', position: 'sticky', top: 0, zIndex: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: wedding.color }} />
              <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontStyle: 'italic', fontWeight: 300 }}>{wedding.couple}</h1>
            </div>
            <button style={{ fontSize: 12.5, padding: '7px 14px', borderRadius: 5, background: 'var(--ink)', color: 'var(--cream)', border: 'none', cursor: 'pointer' }}>+ Add guests</button>
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {subPages.map(label => {
              const active = label === 'Guests'
              const href = label === 'Kanban' ? `/wedding/${wedding.id}` : `/wedding/${wedding.id}/${label.toLowerCase()}`
              return <Link key={label} href={href} style={{ fontSize: 13, padding: '6px 14px', borderRadius: 6, textDecoration: 'none', color: active ? 'var(--ink)' : 'var(--ink-muted)', background: active ? 'var(--parchment)' : 'transparent', fontWeight: active ? 500 : 400 }}>{label}</Link>
            })}
          </div>
        </header>

        <div style={{ padding: '28px 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Total invited', value: wedding.guests.length, color: 'var(--ink)' },
              { label: 'Confirmed',     value: confirmed,             color: 'var(--sage)' },
              { label: 'Pending',       value: pending,               color: 'var(--gold)' },
              { label: 'Declined',      value: declined,              color: 'var(--blush)' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--cream)', border: '1px solid var(--stone)', borderRadius: 10, padding: '14px 18px' }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--stone-dark)', marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--cream)', border: '1px solid var(--stone)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--stone)', background: 'var(--warm)', fontSize: 13.5, fontWeight: 500 }}>Guest list</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['Name','RSVP','Dietary','Table'].map(h => (
                    <th key={h} style={{ fontSize: 10, fontWeight: 500, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: 0.5, padding: '10px 18px', textAlign: 'left', borderBottom: '1px solid var(--stone)', background: 'var(--warm)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {wedding.guests.map(g => {
                  const s = rsvpStyle[g.rsvp]
                  return (
                    <tr key={g.name} style={{ borderBottom: '1px solid var(--stone)' }}>
                      <td style={{ padding: '11px 18px', fontWeight: 500 }}>{g.name}</td>
                      <td style={{ padding: '11px 18px' }}>
                        <span style={{ fontSize: 10.5, padding: '2px 9px', borderRadius: 100, fontWeight: 500, background: s.bg, color: s.color, textTransform: 'capitalize' }}>{g.rsvp}</span>
                      </td>
                      <td style={{ padding: '11px 18px', color: 'var(--ink-muted)' }}>{g.dietary}</td>
                      <td style={{ padding: '11px 18px', color: g.table ? 'var(--ink-soft)' : 'var(--stone-dark)' }}>{g.table ? `Table ${g.table}` : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
