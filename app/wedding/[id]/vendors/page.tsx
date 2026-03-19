import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import { weddings } from '@/lib/data'

export default function VendorsPage({ params }: { params: { id: string } }) {
  const wedding = weddings.find(w => w.id === params.id) ?? weddings[0]
  const subPages = ['Kanban','Vendors','Budget','Timeline','Guests']

  const statusStyle: Record<string, { bg: string; color: string; label: string }> = {
    confirmed: { bg: 'var(--sage-light)',  color: 'var(--sage)',       label: 'Confirmed' },
    pending:   { bg: 'var(--gold-light)',  color: 'var(--gold)',       label: 'Pending'   },
    outreach:  { bg: 'var(--parchment)',   color: 'var(--stone-dark)', label: 'Outreach'  },
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
            <button style={{ fontSize: 12.5, padding: '7px 14px', borderRadius: 5, background: 'var(--ink)', color: 'var(--cream)', border: 'none', cursor: 'pointer' }}>+ Add vendor</button>
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {subPages.map(label => {
              const active = label === 'Vendors'
              const href = label === 'Kanban' ? `/wedding/${wedding.id}` : `/wedding/${wedding.id}/${label.toLowerCase()}`
              return <Link key={label} href={href} style={{ fontSize: 13, padding: '6px 14px', borderRadius: 6, textDecoration: 'none', color: active ? 'var(--ink)' : 'var(--ink-muted)', background: active ? 'var(--parchment)' : 'transparent', fontWeight: active ? 500 : 400 }}>{label}</Link>
            })}
          </div>
        </header>

        <div style={{ padding: '28px 32px' }}>
          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Confirmed', value: wedding.vendors.filter(v=>v.status==='confirmed').length, color: 'var(--sage)' },
              { label: 'Pending',   value: wedding.vendors.filter(v=>v.status==='pending').length,   color: 'var(--gold)' },
              { label: 'Outreach',  value: wedding.vendors.filter(v=>v.status==='outreach').length,  color: 'var(--stone-dark)' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--cream)', border: '1px solid var(--stone)', borderRadius: 10, padding: '14px 18px' }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--stone-dark)', marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div style={{ background: 'var(--cream)', border: '1px solid var(--stone)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--stone)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--warm)' }}>
              <div>
                <span style={{ fontSize: 13.5, fontWeight: 500 }}>All Vendors</span>
                <span style={{ fontSize: 12, fontStyle: 'italic', fontFamily: "'Cormorant Garamond',serif", color: 'var(--stone-dark)', marginLeft: 10 }}>{wedding.couple}</span>
              </div>
              <span style={{ fontSize: 10.5, background: 'var(--sage-light)', color: 'var(--sage)', padding: '3px 10px', borderRadius: 100, fontWeight: 500 }}>{wedding.vendors.length} total</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--warm)' }}>
                  {['Vendor','Category','Quote','Status','Actions'].map(h => (
                    <th key={h} style={{ fontSize: 10, fontWeight: 500, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: 0.5, padding: '10px 18px', textAlign: 'left', borderBottom: '1px solid var(--stone)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {wedding.vendors.map(v => {
                  const s = statusStyle[v.status]
                  return (
                    <tr key={v.name} style={{ borderBottom: '1px solid var(--stone)', transition: 'background 0.1s' }}>
                      <td style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: v.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 500, color: '#fff', flexShrink: 0 }}>{v.initials}</div>
                        <span style={{ fontWeight: 500 }}>{v.name}</span>
                      </td>
                      <td style={{ padding: '12px 18px', color: 'var(--ink-muted)' }}>{v.category}</td>
                      <td style={{ padding: '12px 18px', fontWeight: 500 }}>{v.quote ? `$${v.quote.toLocaleString()}` : '—'}</td>
                      <td style={{ padding: '12px 18px' }}>
                        <span style={{ fontSize: 10.5, padding: '3px 9px', borderRadius: 100, fontWeight: 500, background: s.bg, color: s.color }}>{s.label}</span>
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        <button style={{ fontSize: 11.5, padding: '4px 10px', borderRadius: 5, border: '1px solid var(--stone)', background: 'transparent', cursor: 'pointer', color: 'var(--ink-muted)' }}>View</button>
                      </td>
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
