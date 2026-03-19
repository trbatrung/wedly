import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import { weddings } from '@/lib/data'

const KANBAN_COLS = [
  { key: 'outreach',    label: 'Outreach',    color: 'var(--blush)' },
  { key: 'inprogress',  label: 'In progress', color: 'var(--gold)'  },
  { key: 'review',      label: 'Review',      color: 'var(--dusty)' },
  { key: 'done',        label: 'Done',        color: 'var(--sage)'  },
]

const KANBAN_CARDS: Record<string, { title: string; tag: string; tagBg: string; tagColor: string }[]> = {
  outreach:   [
    { title: 'Contact florists',    tag: 'Decor',   tagBg: 'var(--parchment)',   tagColor: 'var(--stone-dark)' },
    { title: 'DJ availability',     tag: 'Music',   tagBg: 'var(--gold-light)',  tagColor: 'var(--gold)' },
    { title: 'Hair stylist quotes', tag: 'Beauty',  tagBg: 'var(--dusty-light)', tagColor: 'var(--dusty)' },
  ],
  inprogress: [
    { title: 'Venue contract',       tag: 'Urgent',  tagBg: 'var(--blush-light)', tagColor: 'var(--blush)' },
    { title: 'Bride makeup trial',   tag: 'Beauty',  tagBg: 'var(--dusty-light)', tagColor: 'var(--dusty)' },
    { title: 'Catering menu tasting',tag: 'Catering',tagBg: 'var(--gold-light)',  tagColor: 'var(--gold)' },
  ],
  review:     [
    { title: 'Ceremony music list',  tag: 'Music',   tagBg: 'var(--gold-light)',  tagColor: 'var(--gold)' },
    { title: 'Seating draft',        tag: 'Guests',  tagBg: 'var(--sage-light)',  tagColor: 'var(--sage)' },
  ],
  done:       [
    { title: 'Save the dates',       tag: 'Done', tagBg: 'var(--sage-light)', tagColor: 'var(--sage)' },
    { title: 'Budget approved',      tag: 'Done', tagBg: 'var(--sage-light)', tagColor: 'var(--sage)' },
    { title: 'Venue booked',         tag: 'Done', tagBg: 'var(--sage-light)', tagColor: 'var(--sage)' },
    { title: 'Photographer signed',  tag: 'Done', tagBg: 'var(--sage-light)', tagColor: 'var(--sage)' },
  ],
}

export default function WeddingPage({ params }: { params: { id: string } }) {
  const wedding = weddings.find(w => w.id === params.id) ?? weddings[0]

  const subPages = [
    { href: `/wedding/${wedding.id}`,          label: 'Kanban'   },
    { href: `/wedding/${wedding.id}/vendors`,  label: 'Vendors'  },
    { href: `/wedding/${wedding.id}/budget`,   label: 'Budget'   },
    { href: `/wedding/${wedding.id}/timeline`, label: 'Timeline' },
    { href: `/wedding/${wedding.id}/guests`,   label: 'Guests'   },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ marginLeft: 220, flex: 1 }}>

        {/* TOP */}
        <header style={{ background: 'var(--cream)', borderBottom: '1px solid var(--stone)', padding: '14px 32px', position: 'sticky', top: 0, zIndex: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: wedding.color }} />
              <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontStyle: 'italic', fontWeight: 300 }}>{wedding.couple}</h1>
              <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{wedding.date} · {wedding.daysAway} days away</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href={`/share/${wedding.id}`} style={{ fontSize: 12.5, padding: '7px 14px', borderRadius: 5, border: '1px solid var(--stone)', color: 'var(--ink-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>🔗 Share with couple</Link>
              <button style={{ fontSize: 12.5, padding: '7px 14px', borderRadius: 5, background: 'var(--ink)', color: 'var(--cream)', border: 'none', cursor: 'pointer' }}>+ Add task</button>
            </div>
          </div>
          {/* Sub-nav */}
          <div style={{ display: 'flex', gap: 2 }}>
            {subPages.map(p => {
              const active = p.label === 'Kanban'
              return (
                <Link key={p.href} href={p.href} style={{
                  fontSize: 13, padding: '6px 14px', borderRadius: 6, textDecoration: 'none',
                  color: active ? 'var(--ink)' : 'var(--ink-muted)',
                  background: active ? 'var(--parchment)' : 'transparent',
                  fontWeight: active ? 500 : 400,
                  transition: 'all 0.15s',
                }}>{p.label}</Link>
              )
            })}
          </div>
        </header>

        {/* PROGRESS BAND */}
        <div style={{ background: 'var(--cream)', borderBottom: '1px solid var(--stone)', padding: '12px 32px', display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-muted)', marginBottom: 5 }}>
              <span>Overall progress</span><span style={{ fontWeight: 500, color: wedding.color }}>{wedding.progress}%</span>
            </div>
            <div style={{ background: 'var(--parchment)', borderRadius: 100, height: 5, overflow: 'hidden' }}>
              <div style={{ width: `${wedding.progress}%`, height: '100%', background: wedding.color, borderRadius: 100, transition: 'width 0.5s' }} />
            </div>
          </div>
          {[
            { label: 'Budget', value: `$${(wedding.budget/1000).toFixed(0)}k` },
            { label: 'Guests', value: wedding.guests },
            { label: 'Vendors', value: `${wedding.vendors.filter(v => v.status === 'confirmed').length} confirmed` },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'right', paddingLeft: 20, borderLeft: '1px solid var(--stone)' }}>
              <div style={{ fontSize: 10, color: 'var(--stone-dark)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
              <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* KANBAN */}
        <div style={{ padding: '24px 32px', overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, minWidth: 800 }}>
            {KANBAN_COLS.map(col => (
              <div key={col.key}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '0 4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{col.label}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 500, color: col.color, background: 'var(--parchment)', padding: '1px 7px', borderRadius: 100 }}>{KANBAN_CARDS[col.key].length}</span>
                </div>
                <div style={{ background: 'var(--warm)', borderRadius: 10, padding: 10, border: '1px solid var(--stone)', minHeight: 200 }}>
                  {KANBAN_CARDS[col.key].map(card => (
                    <div key={card.title} style={{ background: '#fff', border: '1px solid var(--stone)', borderRadius: 8, padding: '10px 12px', marginBottom: 8, cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.1s' }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 7 }}>{card.title}</div>
                      <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 100, background: card.tagBg, color: card.tagColor, fontWeight: 500 }}>{card.tag}</span>
                    </div>
                  ))}
                  <button style={{ width: '100%', padding: '8px', borderRadius: 7, border: '1px dashed var(--stone-mid)', background: 'transparent', fontSize: 12, color: 'var(--stone-dark)', cursor: 'pointer', marginTop: 4 }}>+ Add task</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM QUICK LINKS */}
        <div style={{ padding: '0 32px 32px', display: 'flex', gap: 12 }}>
          {[
            { href: `/wedding/${wedding.id}/vendors`,  icon: '👥', label: 'View vendors',  sub: `${wedding.vendors.filter(v=>v.status==='confirmed').length} confirmed` },
            { href: `/wedding/${wedding.id}/budget`,   icon: '💰', label: 'Budget tracker', sub: `$${(wedding.budget/1000).toFixed(0)}k total` },
            { href: `/wedding/${wedding.id}/timeline`, icon: '📅', label: 'Day timeline',   sub: `${wedding.timeline.length} events` },
            { href: `/wedding/${wedding.id}/guests`,   icon: '🎉', label: 'Guest list',     sub: `${wedding.guests} invited` },
            { href: `/share/${wedding.id}`,            icon: '🔗', label: 'Couple portal',  sub: 'Read-only view' },
          ].map(q => (
            <Link key={q.href} href={q.href} style={{ flex: 1, background: 'var(--cream)', border: '1px solid var(--stone)', borderRadius: 10, padding: '14px 16px', textDecoration: 'none', transition: 'border-color 0.15s, transform 0.1s' }}>
              <div style={{ fontSize: 18, marginBottom: 6 }}>{q.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 2 }}>{q.label}</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>{q.sub}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
