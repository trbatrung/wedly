import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import { weddings } from '@/lib/data'

export default function BudgetPage({ params }: { params: { id: string } }) {
  const wedding = weddings.find(w => w.id === params.id) ?? weddings[0]
  const spent = wedding.budget_breakdown.reduce((s, c) => s + c.amount, 0)
  const pct = Math.round((spent / wedding.budget) * 100)
  const subPages = ['Kanban','Vendors','Budget','Timeline','Guests']

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
            <button style={{ fontSize: 12.5, padding: '7px 14px', borderRadius: 5, background: 'var(--ink)', color: 'var(--cream)', border: 'none', cursor: 'pointer' }}>Export report</button>
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {subPages.map(label => {
              const active = label === 'Budget'
              const href = label === 'Kanban' ? `/wedding/${wedding.id}` : `/wedding/${wedding.id}/${label.toLowerCase()}`
              return <Link key={label} href={href} style={{ fontSize: 13, padding: '6px 14px', borderRadius: 6, textDecoration: 'none', color: active ? 'var(--ink)' : 'var(--ink-muted)', background: active ? 'var(--parchment)' : 'transparent', fontWeight: active ? 500 : 400 }}>{label}</Link>
            })}
          </div>
        </header>

        <div style={{ padding: '28px 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Summary card */}
            <div style={{ background: 'var(--cream)', border: '1px solid var(--stone)', borderRadius: 14, padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginBottom: 3 }}>Total budget</div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 36 }}>${wedding.budget.toLocaleString()}</div>
                  <div style={{ fontSize: 12, color: 'var(--sage)', fontWeight: 500, marginTop: 2 }}>${(wedding.budget - spent).toLocaleString()} remaining</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginBottom: 3 }}>Spent</div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 36 }}>${spent.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 2 }}>{pct}% of total</div>
                </div>
              </div>
              <div style={{ background: 'var(--parchment)', borderRadius: 100, height: 8, marginBottom: 24, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: 'var(--sage)', borderRadius: 100 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {wedding.budget_breakdown.map(c => (
                  <div key={c.category} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: 'var(--ink-soft)', flex: 1 }}>{c.category}</span>
                    <div style={{ flex: 2, background: 'var(--parchment)', borderRadius: 100, height: 5, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.round((c.amount/c.total)*100)}%`, height: '100%', background: c.color, borderRadius: 100 }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 500, minWidth: 70, textAlign: 'right' }}>${c.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories detail */}
            <div style={{ background: 'var(--cream)', border: '1px solid var(--stone)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--stone)', background: 'var(--warm)', fontSize: 13.5, fontWeight: 500 }}>Category breakdown</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Category','Budget','Spent','Remaining'].map(h => (
                      <th key={h} style={{ fontSize: 10, fontWeight: 500, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: 0.5, padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid var(--stone)', background: 'var(--warm)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {wedding.budget_breakdown.map(c => (
                    <tr key={c.category} style={{ borderBottom: '1px solid var(--stone)' }}>
                      <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color }} />
                        {c.category}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--ink-muted)' }}>${c.total.toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 500 }}>${c.amount.toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', color: c.amount > c.total ? 'var(--blush)' : 'var(--sage)', fontWeight: 500 }}>${(c.total - c.amount).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
