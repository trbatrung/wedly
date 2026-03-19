import Link from 'next/link'

export default function Home() {
  return (
    <main style={{ background: 'var(--cream)', minHeight: '100vh' }}>

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 56px',
        background: 'rgba(253,250,245,0.92)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--stone)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', border: '1.5px solid var(--blush)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', width: 16, height: 16, borderRadius: '50%', border: '1px solid var(--gold)', opacity: 0.5 }} />
          </div>
          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, color: 'var(--ink)' }}>Wedly</span>
        </div>
        <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          <a href="#how"      style={{ fontSize: 13.5, color: 'var(--ink-muted)', textDecoration: 'none' }}>How it works</a>
          <a href="#features" style={{ fontSize: 13.5, color: 'var(--ink-muted)', textDecoration: 'none' }}>Features</a>
          <a href="#faq"      style={{ fontSize: 13.5, color: 'var(--ink-muted)', textDecoration: 'none' }}>FAQ</a>
          <Link href="/dashboard" className="btn-primary">Request early access</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 1240, margin: '0 auto', padding: '160px 56px 100px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: 32, height: 1, background: 'var(--blush)', opacity: 0.7 }} />
            <span style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--blush)', fontWeight: 500 }}>For wedding planners</span>
          </div>
          <h1 style={{ fontSize: 64, lineHeight: 1.0, letterSpacing: -1.5, marginBottom: 28, fontWeight: 300 }}>
            10 weddings.<br />Not 10<br /><em style={{ fontStyle: 'italic', color: 'var(--blush)' }}>spreadsheets.</em>
          </h1>
          <p style={{ fontSize: 18, color: 'var(--ink-muted)', lineHeight: 1.7, marginBottom: 16, maxWidth: 440 }}>
            When you manage multiple weddings in separate sheets, things slip. Wrong details go to the wrong couple. Vendors get missed. Deadlines get lost.
          </p>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: 22, color: 'var(--ink)', lineHeight: 1.6, marginBottom: 36, maxWidth: 440 }}>
            Wedly keeps every wedding separate, organised, and beautiful — in one place.
          </p>
          <div style={{ display: 'flex', gap: 12, marginBottom: 48 }}>
            <Link href="/dashboard" className="btn-primary" style={{ padding: '13px 28px', fontSize: 15 }}>Request early access</Link>
            <a href="#how" className="btn-outline" style={{ padding: '13px 28px', fontSize: 15 }}>See how it works</a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 24, borderTop: '1px solid var(--stone)' }}>
            <div style={{ display: 'flex' }}>
              {['#8FAB8A','#C4705A','#A8883A','#B5748A'].map((c, i) => (
                <div key={i} style={{ width: 30, height: 30, borderRadius: '50%', background: c, border: '2px solid var(--cream)', marginLeft: i === 0 ? 0 : -7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 500, color: '#fff' }}>
                  {['LN','MT','HP','TH'][i]}
                </div>
              ))}
            </div>
            <div>
              <div style={{ color: 'var(--gold)', fontSize: 12, letterSpacing: 1 }}>★★★★★</div>
              <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>Loved by wedding planners across Vietnam</div>
            </div>
          </div>
        </div>

        {/* Dashboard preview */}
        <div>
          <div style={{ background: '#fff', border: '1px solid var(--stone)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 40px 100px rgba(28,24,20,0.12)' }}>
            <div style={{ background: 'var(--warm)', borderBottom: '1px solid var(--stone)', padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {['#F5A7A7','#F5D4A7','#A7D4A7'].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />)}
              </div>
              <span style={{ fontSize: 11, color: 'var(--ink-muted)', marginLeft: 6, fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic' }}>Nguyen & Tran · 14/06/2025</span>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                {[{ name: 'Nguyen & Tran', c: '#C4705A', active: true },{ name: 'Pham & Le', c: '#4D6B44', active: false },{ name: 'Hoang & Bui', c: '#A8883A', active: false }].map(w => (
                  <div key={w.name} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 100, background: w.active ? 'var(--parchment)' : 'transparent', border: '1px solid var(--stone)', fontSize: 10.5, fontWeight: w.active ? 500 : 400, color: w.active ? 'var(--ink)' : 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: w.c }} />{w.name}
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                {[
                  { col: 'Outreach',    cards: ['Contact florists','DJ quotes'],   count: 3, c: 'var(--blush)' },
                  { col: 'In progress', cards: ['Venue contract','Makeup trial'],  count: 3, c: 'var(--gold)'  },
                  { col: 'Review',      cards: ['Menu tasting'],                   count: 2, c: 'var(--dusty)' },
                  { col: 'Done',        cards: ['Save-the-dates','Budget set'],    count: 6, c: 'var(--sage)'  },
                ].map(({ col, cards, count, c }) => (
                  <div key={col} style={{ background: 'var(--warm)', borderRadius: 7, padding: 8, border: '1px solid var(--stone)' }}>
                    <div style={{ fontSize: 9, fontWeight: 500, color: 'var(--ink-muted)', marginBottom: 7, display: 'flex', justifyContent: 'space-between', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      <span>{col}</span><span style={{ color: c }}>{count}</span>
                    </div>
                    {cards.map(card => (
                      <div key={card} style={{ background: '#fff', border: '1px solid var(--stone)', borderRadius: 5, padding: '6px 7px', marginBottom: 5, fontSize: 9.5, fontWeight: 500, color: 'var(--ink)' }}>{card}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PAIN QUOTE */}
      <div style={{ background: 'var(--ink)', padding: '60px 56px', textAlign: 'center' }}>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 30, color: 'var(--cream)', fontWeight: 300, maxWidth: 680, margin: '0 auto', lineHeight: 1.5 }}>
          "I once sent the wrong seating chart to a couple. It had another couple's guest names on it. That was the moment I knew spreadsheets were not enough."
        </p>
        <p style={{ fontSize: 13, color: 'var(--stone-mid)', marginTop: 16 }}>— A wedding planner managing 8 weddings at once</p>
      </div>

      {/* HOW IT WORKS */}
      <section id="how" style={{ maxWidth: 1240, margin: '0 auto', padding: '100px 56px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 24, height: 1, background: 'var(--blush)', opacity: 0.7 }} />
          <span style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--blush)', fontWeight: 500 }}>Simple by design</span>
        </div>
        <h2 style={{ fontSize: 48, lineHeight: 1.06, marginBottom: 56, fontWeight: 300 }}>How Wedly <em style={{ fontStyle: 'italic', color: 'var(--blush)' }}>works</em></h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 2, background: 'var(--stone)', borderRadius: 16, overflow: 'hidden' }}>
          {[
            { step: '01', icon: '💍', title: 'Create a wedding', body: 'Add the couple name, wedding date, and budget. Wedly creates a fully separate workspace just for them — no more mixing files.' },
            { step: '02', icon: '📋', title: 'Plan everything in one place', body: 'Tasks, vendors, budget, timeline, guest list — all inside that one wedding. Switch between weddings in one click.' },
            { step: '03', icon: '🔗', title: 'Share a portal with the couple', body: 'One click gives the couple a beautiful, read-only view of their wedding progress. No app download, no login needed.' },
          ].map(s => (
            <div key={s.step} style={{ background: 'var(--cream)', padding: '40px 36px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 48, fontWeight: 300, color: 'var(--stone)', lineHeight: 1 }}>{s.step}</span>
                <span style={{ fontSize: 28 }}>{s.icon}</span>
              </div>
              <h3 style={{ fontSize: 24, marginBottom: 12, color: 'var(--ink)' }}>{s.title}</h3>
              <p style={{ fontSize: 14.5, color: 'var(--ink-muted)', lineHeight: 1.7 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DIVIDER */}
      <div style={{ display: 'flex', alignItems: 'center', maxWidth: 1240, margin: '0 auto', padding: '0 56px' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--stone)' }} />
        <div style={{ padding: '0 20px', color: 'var(--blush)', opacity: 0.4, fontSize: 18, letterSpacing: 6, fontFamily: "'Cormorant Garamond',serif" }}>❧ ✦ ❧</div>
        <div style={{ flex: 1, height: 1, background: 'var(--stone)' }} />
      </div>

      {/* FEATURES */}
      <section id="features" style={{ maxWidth: 1240, margin: '0 auto', padding: '100px 56px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 24, height: 1, background: 'var(--blush)', opacity: 0.7 }} />
          <span style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--blush)', fontWeight: 500 }}>Everything in one place</span>
        </div>
        <h2 style={{ fontSize: 48, lineHeight: 1.06, marginBottom: 14, fontWeight: 300 }}>From first meeting to <em style={{ fontStyle: 'italic', color: 'var(--blush)' }}>final dance</em></h2>
        <p style={{ fontSize: 17, color: 'var(--ink-muted)', marginBottom: 52, maxWidth: 520, lineHeight: 1.65 }}>Built specifically for weddings — not adapted from a generic tool.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'var(--stone)', border: '1px solid var(--stone)', borderRadius: 16, overflow: 'hidden' }}>
          {[
            { icon: '⬛', bg: 'var(--sage-light)',  title: 'Kanban task board',    body: 'See every task for every wedding at a glance. Drag from "to do" to "done" — nothing falls through.',      href: '/dashboard' },
            { icon: '👥', bg: 'var(--blush-light)', title: 'Vendor management',     body: 'All vendors in one place per wedding. Contacts, quotes, contracts, and status — no more digging through email.', href: '/wedding/anderson-kim/vendors' },
            { icon: '📅', bg: 'var(--gold-light)',  title: 'Day-of timeline',       body: 'Build the run-of-show in minutes. Share with vendors so everyone knows exactly where to be and when.',      href: '/wedding/anderson-kim/timeline' },
            { icon: '💰', bg: 'var(--gold-light)',  title: 'Budget tracker',        body: 'Set a budget, track every expense by category. Your client always knows where their money is going.',       href: '/wedding/anderson-kim/budget' },
            { icon: '🎉', bg: 'var(--sage-light)',  title: 'Guest list & RSVPs',    body: 'Manage all guests, dietary needs, and table assignments. No more tabs inside tabs inside tabs.',            href: '/wedding/anderson-kim/guests' },
            { icon: '🔗', bg: 'var(--blush-light)', title: 'Couple sharing portal', body: 'One link gives the couple a live, beautiful view of their wedding — read-only, no account needed.',        href: 'https://wedly-sepia.vercel.app/share/anderson-kim' },
          ].map(f => (
            <Link key={f.title} href={f.href} style={{ background: 'var(--cream)', padding: '32px 28px', textDecoration: 'none', display: 'block' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontSize: 22, marginBottom: 10, color: 'var(--ink)' }}>{f.title}</h3>
              <p style={{ fontSize: 13.5, color: 'var(--ink-muted)', lineHeight: 1.65 }}>{f.body}</p>
              <div style={{ marginTop: 14, fontSize: 12.5, color: 'var(--blush)', fontWeight: 500 }}>See live demo →</div>
            </Link>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <div style={{ background: 'var(--warm)', borderTop: '1px solid var(--stone)', borderBottom: '1px solid var(--stone)', padding: '90px 56px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{ fontSize: 48, fontWeight: 300 }}>What planners <em style={{ fontStyle: 'italic', color: 'var(--blush)' }}>are saying</em></h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
            {[
              { quote: 'I have 8 active weddings right now. Before this I had 8 Google Sheet tabs open all day. One time I copy-pasted the wrong guest list into an email to a couple. Never again.', name: 'Linh Nguyen', role: 'Wedding coordinator, Ho Chi Minh City', av: 'LN', c: '#8FAB8A', featured: false },
              { quote: 'The vendor section alone saves me an hour every week. I used to search my Gmail to find old quotes. Now everything is right there, by wedding, with the status already tracked.', name: 'Mai Tran', role: 'Senior planner, Hanoi', av: 'MT', c: '#C4705A', featured: true },
              { quote: 'My couples love the sharing link. They stop messaging me asking for updates because they can just check themselves. It makes me look so much more professional.', name: 'Huong Pham', role: 'Freelance planner, Da Nang', av: 'HP', c: '#A8883A', featured: false },
            ].map(t => (
              <div key={t.name} style={{ background: '#fff', border: t.featured ? '2px solid var(--ink)' : '1px solid var(--stone)', borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'flex', gap: 3 }}>{[1,2,3,4,5].map(s => <span key={s} style={{ color: 'var(--gold)', fontSize: 13 }}>★</span>)}</div>
                <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: 'var(--ink-soft)', lineHeight: 1.6, fontStyle: 'italic', flex: 1 }}>"{t.quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: t.c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 500, color: '#fff', flexShrink: 0 }}>{t.av}</div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{t.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <section id="faq" style={{ maxWidth: 800, margin: '0 auto', padding: '100px 56px' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <h2 style={{ fontSize: 48, fontWeight: 300 }}><em style={{ fontStyle: 'italic', color: 'var(--blush)' }}>Questions</em> & answers</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            { q: 'Do I need to be tech-savvy to use Wedly?', a: 'Not at all. If you can use Google Sheets, you can use Wedly. It is designed to feel familiar — just more organised. Most planners are fully set up within their first session.' },
            { q: 'Can I import my existing spreadsheets?', a: 'Yes. You can upload your existing Google Sheets or Excel files and Wedly will pull in your vendor lists, guest lists, and task items automatically. No need to start from scratch.' },
            { q: 'Do my couples need to create an account?', a: 'No. You share a private link with them and they can view their wedding portal instantly — no signup, no app download. Works on any phone or computer.' },
            { q: 'Is each wedding completely separate?', a: 'Yes — this is the core of Wedly. Every wedding is its own workspace. There is no way for one couple\'s information to appear in another couple\'s portal. Each link only shows that specific wedding.' },
            { q: 'What happens to my data if I stop using Wedly?', a: 'You can export everything at any time — vendor lists, guest lists, budgets, timelines — as Excel or PDF. Your data is always yours.' },
            { q: 'Is Wedly available in Vietnamese?', a: 'Vietnamese language support is coming very soon. Early access is in English, but full Vietnamese localisation is our top priority before public launch.' },
          ].map((faq, i) => (
            <div key={i} style={{ background: 'var(--cream)', border: '1px solid var(--stone)', borderRadius: 12, padding: '22px 28px', marginBottom: 2 }}>
              <div style={{ fontSize: 15.5, fontWeight: 500, color: 'var(--ink)', marginBottom: 10, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ color: 'var(--blush)', fontFamily: "'Cormorant Garamond',serif", fontSize: 22, lineHeight: 1, flexShrink: 0 }}>Q</span>
                {faq.q}
              </div>
              <div style={{ fontSize: 14.5, color: 'var(--ink-muted)', lineHeight: 1.7, paddingLeft: 28 }}>{faq.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div style={{ background: 'var(--ink)', padding: '110px 56px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: "radial-gradient(ellipse 600px 400px at 50% 50%, rgba(196,112,90,0.1) 0%, transparent 70%)", pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span style={{ fontSize: 11, letterSpacing: 2.5, textTransform: 'uppercase', color: 'var(--stone-mid)', display: 'block', marginBottom: 20 }}>Join the waitlist</span>
          <h2 style={{ fontSize: 56, color: 'var(--cream)', fontWeight: 300, lineHeight: 1.05, marginBottom: 20 }}>
            Stop managing weddings<br />in <em style={{ fontStyle: 'italic', color: 'var(--stone-mid)' }}>10 different sheets.</em>
          </h2>
          <p style={{ color: 'var(--stone-mid)', fontSize: 17, maxWidth: 480, margin: '0 auto 36px', lineHeight: 1.65 }}>
            Wedly is in early access for wedding planners in Vietnam. Request your spot and we will be in touch within 24 hours.
          </p>
          <Link href="/dashboard" style={{ background: 'var(--cream)', color: 'var(--ink)', padding: '15px 40px', borderRadius: 5, fontSize: 15, fontWeight: 500, textDecoration: 'none', display: 'inline-block' }}>
            Request early access
          </Link>
          <div style={{ marginTop: 20, fontSize: 12.5, color: 'var(--stone-dark)' }}>Free during early access · No credit card needed · Vietnamese support coming soon</div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ background: 'var(--warm)', borderTop: '1px solid var(--stone)', padding: '40px 56px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: 'var(--ink)' }}>Wedly</div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-muted)', fontStyle: 'italic', fontFamily: "'Cormorant Garamond',serif", marginTop: 2 }}>Every wedding, perfectly organised.</div>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          {['How it works','Features','FAQ','Contact'].map(l => <a key={l} href="#" style={{ fontSize: 13, color: 'var(--ink-muted)', textDecoration: 'none' }}>{l}</a>)}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--stone-dark)' }}>© 2026 Wedly. All rights reserved.</div>
      </footer>

    </main>
  )
}
