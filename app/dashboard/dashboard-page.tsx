import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import { weddings, upcomingMilestones } from '@/lib/data'

export default function Dashboard() {
  const tasks = weddings[0].tasks

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ marginLeft: 220, flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* TOPBAR */}
        <header style={{ background: 'var(--cream)', borderBottom: '1px solid var(--stone)', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 40 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontStyle: 'italic' }}>Good morning, Sofia.</div>
            <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 1 }}>Thursday, March 19 · 5 active weddings</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: 'transparent', color: 'var(--ink-muted)', border: '1px solid var(--stone)' }}>⬆ Import sheet</button>
            <Link href="/wedding/anderson-kim" className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }}>+ New wedding</Link>
          </div>
        </header>

        <div style={{ padding: '28px 32px', flex: 1 }}>

          {/* STATS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 28 }}>
            {[
              { label: 'Active weddings',    value: '5',     sub: '↑ 2 from last month',    color: 'var(--blush)' },
              { label: 'Tasks due this week', value: '12',   sub: '7 done · 5 remaining',   color: 'var(--sage)' },
              { label: 'Budget managed',     value: '$312k', sub: 'Across all weddings',    color: 'var(--gold)' },
              { label: 'Vendors confirmed',  value: '38',    sub: '9 pending replies',       color: 'var(--dusty)' },
            ].map((s, i) => (
              <div key={s.label} className={`fade-up fade-up-${i + 1}`} style={{ background: 'var(--cream)', border: '1px solid var(--stone)', borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: 0.5, textTransform: 'uppercase', color: 'var(--stone-dark)', marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 34, lineHeight: 1, marginBottom: 6 }}>{s.value}</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>

            {/* WEDDING CARDS */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontSize: 24 }}>Your <em style={{ fontStyle: 'italic', color: 'var(--blush)' }}>weddings</em></h2>
                <button style={{ fontSize: 12.5, color: 'var(--ink-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>View all →</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
                {weddings.map(w => (
                  <div key={w.id} className="fade-up" style={{ background: 'var(--cream)', border: '1px solid var(--stone)', borderRadius: 14, overflow: 'hidden', transition: 'box-shadow 0.2s, transform 0.15s' }}>
                    <div style={{ height: 4, background: w.color }} />
                    <div style={{ padding: '16px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 19, fontStyle: 'italic' }}>{w.couple}</div>
                        <span style={{ fontSize: 10.5, fontWeight: 500, padding: '3px 9px', borderRadius: 100, background: 'var(--blush-light)', color: 'var(--blush)', whiteSpace: 'nowrap' }}>{w.statusLabel}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                        {[`📅 ${w.date}`, `💰 $${(w.budget/1000).toFixed(0)}k`, `🎉 ${w.guestCount} guests`].map(m => (
                          <div key={m} style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{m}</div>
                        ))}
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-muted)', marginBottom: 5 }}>
                          <span>Progress</span><span>{w.progress}%</span>
                        </div>
                        <div style={{ background: 'var(--parchment)', borderRadius: 100, height: 5, overflow: 'hidden' }}>
                          <div style={{ width: `${w.progress}%`, height: '100%', background: w.color, borderRadius: 100 }} />
                        </div>
                      </div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--stone)', padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: w.color, fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic' }}>{w.daysAway} days to go</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link href={`/share/${w.id}`} style={{ fontSize: 11.5, padding: '5px 12px', borderRadius: 5, border: '1px solid var(--stone)', background: 'transparent', color: 'var(--ink-muted)', textDecoration: 'none' }}>Share link</Link>
                        <Link href={`/wedding/${w.id}`} style={{ fontSize: 11.5, padding: '5px 12px', borderRadius: 5, background: 'var(--ink)', color: 'var(--cream)', textDecoration: 'none' }}>Open →</Link>
                      </div>
                    </div>
                  </div>
                ))}

                {/* New wedding card */}
                <Link href="/wedding/anderson-kim" style={{ border: '1.5px dashed var(--stone-mid)', borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '36px 20px', textDecoration: 'none', minHeight: 200, transition: 'all 0.2s' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', border: '1.5px solid var(--stone-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: 'var(--stone-dark)' }}>+</div>
                  <div style={{ fontSize: 13, color: 'var(--stone-dark)', fontWeight: 500 }}>Add a new wedding</div>
                  <div style={{ fontSize: 11.5, color: 'var(--stone-mid)', textAlign: 'center' }}>Import a spreadsheet or<br />start from scratch</div>
                </Link>
              </div>
            </div>

            {/* RIGHT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Milestones */}
              <div style={{ background: 'var(--cream)', border: '1px solid var(--stone)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--stone)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13.5, fontWeight: 500 }}>Upcoming milestones</span>
                  <button style={{ fontSize: 11.5, color: 'var(--ink-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Calendar →</button>
                </div>
                <div style={{ padding: 8 }}>
                  {upcomingMilestones.map(m => (
                    <div key={m.title} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 10px', borderRadius: 8 }}>
                      <div style={{ width: 38, textAlign: 'center', background: 'var(--parchment)', borderRadius: 7, padding: '5px 4px', flexShrink: 0 }}>
                        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, lineHeight: 1, fontWeight: 300 }}>{m.day}</div>
                        <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: 0.5, textTransform: 'uppercase', color: 'var(--stone-dark)' }}>{m.mon}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>{m.sub}</div>
                      </div>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, fontWeight: 500, background: m.tagBg, color: m.tagColor, flexShrink: 0 }}>{m.tag}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tasks */}
              <div style={{ background: 'var(--cream)', border: '1px solid var(--stone)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--stone)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13.5, fontWeight: 500 }}>Tasks due soon</span>
                  <Link href="/wedding/anderson-kim" style={{ fontSize: 11.5, color: 'var(--ink-muted)', textDecoration: 'none' }}>View all →</Link>
                </div>
                <div style={{ padding: 8 }}>
                  {tasks.slice(0, 5).map(t => (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 10px', borderRadius: 8 }}>
                      <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${t.done ? 'var(--sage)' : 'var(--stone-mid)'}`, background: t.done ? 'var(--sage)' : 'transparent', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {t.done && <span style={{ color: '#fff', fontSize: 10 }}>✓</span>}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, color: t.done ? 'var(--stone-dark)' : 'var(--ink-soft)', textDecoration: t.done ? 'line-through' : 'none' }}>{t.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 2 }}>
                          <span style={{ color: 'var(--blush)', fontWeight: 500 }}>Anderson &amp; Kim</span> · {t.due}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Share nudge */}
              <div style={{ background: 'var(--ink)', borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🔗</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--cream)', marginBottom: 2 }}>Share Anderson &amp; Kim's portal</div>
                  <div style={{ fontSize: 11.5, color: 'var(--stone-mid)' }}>Couple hasn't viewed in 5 days</div>
                </div>
                <Link href="/share/anderson-kim" style={{ fontSize: 12, fontWeight: 500, padding: '7px 14px', borderRadius: 6, background: 'rgba(255,255,255,0.12)', color: 'var(--cream)', border: '1px solid rgba(255,255,255,0.15)', textDecoration: 'none', whiteSpace: 'nowrap' }}>Copy link</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
