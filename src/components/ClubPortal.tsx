import { html } from 'hono/html'

/**
 * The public face of the Imaan Akhlaq Club.
 *
 * Styled after the concept deck rather than the app's dashboards: a light
 * page, white cards with hairline rules, generous space, and colour used only
 * where it carries meaning. A school that has seen the deck and then opens
 * this page should recognise it as the same programme — which is why the
 * house colours, the mottos and the shadows here all track clubData.ts and
 * the deck's shield, and why nothing on this page is decorative colour.
 *
 * The signed-in club — daily habits, credits, mentor verification — lives on
 * the student dashboard, not here. This page explains the four houses to a
 * visitor who may have no account at all.
 */
export const ClubPortal = () => html`
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Nunito:wght@400;600;700;800;900&display=swap');

  /* ===========================
     CLUB APP — Reset & Tokens
  =========================== */
  #club-app {
    margin: 0; padding: 0;
    font-family: 'Nunito', sans-serif;
    color: var(--ink-600);
    background: var(--page);
    min-height: 100vh;
    overflow-x: hidden;
  }
  #club-app * { box-sizing: border-box; }
  #club-app h1,#club-app h2,#club-app h3 { font-family: 'Playfair Display', serif; }

  #club-app {
    /* Brand */
    --brand-pink:   #D63678;
    --brand-orange: #E08020;
    --brand-navy:   #1E2D5A;
    --brand-tan:    #C99A6B;
    --brand-gold:   #F59E0B;
    --brand-teal:   #0F5E55;

    /* The deck's page: near-white, hairline rules, ink that is almost black
       but never pure black. Text sits on white here, so these are dark. */
    --page:     #F4F5F7;
    --card:     #FFFFFF;
    --rule:     #E4E6EA;
    --ink-900:  #16181D;
    --ink-600:  #5A6069;
    --ink-400:  #8A9099;

    /* House colours, mirroring CLUB_HOUSES in src/lib/clubData.ts. Each is a
       brand token; each 'ink' is the lettering that sits on it. Gold cannot
       carry white, which is the whole reason ink is a separate value. */
    --sidq:       #F59E0B;
    --sidq-ink:   #2B1E00;
    --amanah:     #0F5E55;
    --amanah-ink: #FFFFFF;
    --rahmah:     #D63678;
    --rahmah-ink: #FFFFFF;
    --adl:        #1E2D5A;
    --adl-ink:    #FFFFFF;
  }

  /* Utilities */
  .d-none { display: none !important; }
  .playfair { font-family: 'Playfair Display', serif; }

  /* The deck's eyebrow label: outlined, spaced, quiet. */
  .pill {
    display: inline-block;
    padding: 7px 20px;
    border-radius: 50px;
    font-size: 0.68rem;
    font-weight: 900;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    color: var(--ink-400);
    border: 1px solid var(--rule);
    background: var(--card);
  }

  /* The faint grid and the four colour washes behind every view — the deck's
     backdrop. Kept very low so it never competes with the cards. */
  .deck-surface {
    background-color: var(--page);
    background-image:
      radial-gradient(at 0% 0%, rgba(245,158,11,0.07) 0px, transparent 45%),
      radial-gradient(at 100% 0%, rgba(214,54,120,0.06) 0px, transparent 45%),
      radial-gradient(at 100% 100%, rgba(30,45,90,0.06) 0px, transparent 45%),
      radial-gradient(at 0% 100%, rgba(15,94,85,0.06) 0px, transparent 45%),
      repeating-linear-gradient(0deg, transparent, transparent 44px, rgba(22,24,29,0.022) 44px, rgba(22,24,29,0.022) 45px),
      repeating-linear-gradient(90deg, transparent, transparent 44px, rgba(22,24,29,0.022) 44px, rgba(22,24,29,0.022) 45px);
  }

  /* =============================================
     VIEW 1: LANDING
  ============================================= */
  #view-landing {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 6rem 2rem;
    position: relative;
    overflow: hidden;
  }

  .landing-title {
    font-size: clamp(2.8rem, 6vw, 5.2rem);
    font-weight: 700;
    margin: 40px 0 18px;
    color: var(--ink-900);
    line-height: 1.08;
    letter-spacing: -1px;
  }
  .landing-title .accent { color: var(--brand-gold); }

  .landing-sub {
    font-size: 1.15rem;
    color: var(--ink-600);
    margin: 0 0 14px;
    font-weight: 600;
  }
  /* The deck's closing line, in its gold serif italic. */
  .landing-tagline {
    font-style: italic;
    color: var(--brand-tan);
    font-size: 1.35rem;
    font-family: 'Playfair Display', serif;
    margin: 0 0 48px;
    font-weight: 600;
  }

  .stat-strip {
    display: flex;
    background: var(--card);
    border: 1px solid var(--rule);
    border-radius: 100px;
    padding: 18px 40px;
    margin-bottom: 48px;
    box-shadow: 0 14px 34px rgba(22,24,29,0.05);
  }
  .stat-item {
    text-align: center; padding: 0 32px;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
  }
  .stat-item:not(:last-child) { border-right: 1px solid var(--rule); }
  .stat-item strong { display: block; font-size: 2rem; color: var(--ink-900); font-weight: 800; margin-bottom: 2px; }
  .stat-item span { font-size: 0.72rem; color: var(--ink-400); font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; }

  .btn-enter {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    background: var(--brand-navy);
    color: #fff;
    padding: 19px 46px;
    border-radius: 50px;
    font-family: 'Nunito', sans-serif;
    font-weight: 800;
    font-size: 1.1rem;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    border: none;
    cursor: pointer;
    box-shadow: 0 10px 25px rgba(30,45,90,0.22);
    transition: transform 0.3s cubic-bezier(0.175,0.885,0.32,1.275), box-shadow 0.3s, background 0.3s;
  }
  .btn-enter i { font-size: 1.2rem; color: var(--brand-gold); transition: transform 0.3s; }
  .btn-enter:hover { transform: translateY(-4px); box-shadow: 0 16px 34px rgba(30,45,90,0.3); background: #17224A; }
  .btn-enter:hover i { transform: translateX(6px); }

  /* =============================================
     VIEW 2: THE FOUR HOUSES
  ============================================= */
  #view-houses {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    padding-bottom: 1rem;
  }

  .houses-header {
    max-width: 1360px;
    width: 100%;
    margin: 0 auto;
    padding: 4.5rem 2rem 2.5rem;
  }
  .houses-main-title {
    font-size: clamp(2rem, 4vw, 3.3rem);
    font-weight: 700;
    margin: 18px 0 14px;
    color: var(--ink-900);
    letter-spacing: -0.5px;
  }
  .houses-main-title .accent { color: var(--brand-gold); }
  .houses-desc {
    font-size: 1.02rem;
    color: var(--ink-600);
    line-height: 1.75;
    max-width: 720px;
    margin: 0;
  }
  .houses-desc .hl { color: var(--ink-900); font-weight: 800; }

  .four-col-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 22px;
    padding: 0 2rem 3rem;
    max-width: 1360px;
    width: 100%;
    margin: 0 auto;
  }

  /* A white card with a coloured cap — the deck's house table. Colour names
     the house at the top; everything below it is read off white, so no habit
     text ever has to fight a background for legibility. */
  .house-col {
    background: var(--card);
    border: 1px solid var(--rule);
    border-radius: 18px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 28px rgba(22,24,29,0.05);
    transition: transform 0.35s cubic-bezier(0.175,0.885,0.32,1.275), box-shadow 0.35s;
  }
  .house-col:hover { transform: translateY(-8px); box-shadow: 0 24px 48px rgba(22,24,29,0.12); }

  .hcol-cap {
    padding: 1.6rem 1.5rem 1.4rem;
    position: relative;
    overflow: hidden;
  }
  .hcol-cap::before {
    content: '';
    position: absolute; top: 0; right: 0; width: 140px; height: 140px;
    background: rgba(255,255,255,0.10);
    border-radius: 50%;
    transform: translate(35%, -45%);
  }
  /* Cap background and ink both come from the house. Sidq's gold takes dark
     ink; the other three take white. */
  .hc-sidq   .hcol-cap { background: var(--sidq);   color: var(--sidq-ink); }
  .hc-amanah .hcol-cap { background: var(--amanah); color: var(--amanah-ink); }
  .hc-rahmah .hcol-cap { background: var(--rahmah); color: var(--rahmah-ink); }
  .hc-adl    .hcol-cap { background: var(--adl);    color: var(--adl-ink); }

  .hcol-number {
    font-size: 0.65rem; font-weight: 900; letter-spacing: 3px;
    text-transform: uppercase; opacity: 0.6; margin-bottom: 14px;
    position: relative;
  }
  .hcol-icon { font-size: 2.1rem; margin-bottom: 8px; position: relative; }
  .hcol-arabic { font-size: 1.2rem; opacity: 0.75; margin-bottom: 4px; letter-spacing: 1px; position: relative; }
  /* Inherits the cap's ink. Without this the site-wide h2 rule wins and every
     house name renders in brand navy — unreadable on three of the four caps. */
  .hcol-name { font-size: 1.6rem; font-weight: 700; margin: 0 0 2px; color: inherit; position: relative; }
  .hcol-sub { font-size: 0.85rem; font-weight: 700; opacity: 0.75; position: relative; }

  .hcol-body { padding: 1.4rem 1.5rem 1.5rem; display: flex; flex-direction: column; flex: 1; }

  .hcol-motto {
    font-family: 'Playfair Display', serif;
    font-style: italic;
    font-size: 0.94rem;
    color: var(--ink-600);
    line-height: 1.5;
    margin-bottom: 22px;
    padding-left: 13px;
    border-left: 3px solid;
  }
  .hc-sidq   .hcol-motto { border-left-color: var(--sidq); }
  .hc-amanah .hcol-motto { border-left-color: var(--amanah); }
  .hc-rahmah .hcol-motto { border-left-color: var(--rahmah); }
  .hc-adl    .hcol-motto { border-left-color: var(--adl); }

  .hcol-section-label {
    font-size: 0.62rem; font-weight: 900; letter-spacing: 2px;
    text-transform: uppercase; color: var(--ink-400); margin-bottom: 12px;
  }

  /* The deck's habit boxes: each one its own tile, so three habits read as
     three separate asks rather than a paragraph. */
  .habit-row {
    background: #F7F8FA;
    border: 1px solid var(--rule);
    border-radius: 10px;
    padding: 11px 13px;
    margin-bottom: 9px;
  }
  .habit-name { font-weight: 800; font-size: 0.86rem; color: var(--ink-900); margin-bottom: 3px; }
  .habit-desc { font-size: 0.79rem; color: var(--ink-600); line-height: 1.45; }

  /* The shadows are the one dark note on the page, exactly as the deck sets
     them against the protectors. */
  .shadow-badge {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: #22262E;
    border-radius: 50px;
    padding: 7px 15px;
    font-size: 0.71rem;
    font-weight: 800;
    color: #F2C6C6;
    margin-top: 14px;
    align-self: flex-start;
  }
  .shadow-badge i { opacity: 0.8; }

  /* House cards state that membership is granted, not chosen. */
  .house-assigned {
    margin-top: auto;
    padding-top: 16px;
    text-align: center;
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--ink-400);
  }
  .house-assigned i { margin-right: 6px; }

  .club-cta {
    max-width: 720px;
    margin: 1rem auto 1.5rem;
    padding: 2.4rem 2rem;
    text-align: center;
    background: var(--card);
    border: 1px solid var(--rule);
    border-radius: 20px;
    box-shadow: 0 10px 28px rgba(22,24,29,0.05);
  }
  .club-cta h3 { margin: 0 0 10px; color: var(--ink-900); font-size: 1.55rem; }
  .club-cta p {
    color: var(--ink-600);
    line-height: 1.7;
    margin: 0 auto 22px;
    max-width: 520px;
    font-size: 0.95rem;
  }
  .club-cta-btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: var(--brand-navy);
    color: #fff;
    padding: 14px 34px;
    border-radius: 50px;
    font-weight: 900;
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 0.84rem;
    transition: transform 0.25s, box-shadow 0.25s, background 0.25s;
  }
  .club-cta-btn i { color: var(--brand-gold); }
  .club-cta-btn:hover { transform: translateY(-3px); box-shadow: 0 12px 26px rgba(30,45,90,0.25); background: #17224A; }

  .back-link {
    text-align: center;
    padding: 0.5rem 1.5rem 2.5rem;
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--ink-400);
    cursor: pointer;
  }
  .back-link:hover { color: var(--ink-900); }

  /* Responsive */
  @media (max-width: 1100px) {
    .four-col-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 768px) {
    .stat-strip { flex-direction: column; border-radius: 20px; padding: 20px; gap: 18px; }
    .stat-item { padding: 10px 0; }
    .stat-item:not(:last-child) { border-right: none; border-bottom: 1px solid var(--rule); }
  }
  @media (max-width: 620px) {
    .four-col-grid { grid-template-columns: 1fr; }
    .houses-header { padding: 3rem 1.25rem 2rem; }
    .four-col-grid { padding: 0 1.25rem 2rem; }
  }
</style>

<div id="club-app">

  <!-- ═══════════════ VIEW 1: LANDING ═══════════════ -->
  <div id="view-landing" class="deck-surface d-none">
    <div style="position:relative; z-index:2; max-width: 1000px; width: 100%;">
      <div class="pill">School-Level Character &amp; Ethics Programme</div>

      <h1 class="landing-title playfair">Imaan <span class="accent">Akhlaq</span> Club</h1>

      <p class="landing-sub">Character &amp; Ethics Development Program — Class 1–10</p>
      <p class="landing-tagline">"One Club. Four Values. Lifelong Impact."</p>

      <div class="stat-strip">
        <div class="stat-item"><strong>90%</strong><span>Character Focus</span></div>
        <div class="stat-item"><strong>10%</strong><span>Academic Conduct</span></div>
        <div class="stat-item"><strong>4</strong><span>Value Houses</span></div>
        <div class="stat-item"><strong>4</strong><span>Growth Tiers</span></div>
      </div>

      <button class="btn-enter" onclick="goToHouses()">
        Meet the Four Houses <i class="fas fa-arrow-right"></i>
      </button>
    </div>
  </div>

  <!-- ═══════════════ VIEW 2: THE FOUR HOUSES ═══════════════ -->
  <div id="view-houses" class="deck-surface d-none">
    <div class="houses-header">
      <div class="pill">Identity &amp; Belonging</div>
      <h1 class="houses-main-title playfair">Four Houses. <span class="accent">One Character.</span></h1>
      <p class="houses-desc">
        Each house is not merely a team — it is an identity and a mission. Students don't just join a
        house; they embody it. The <span class="hl">daily micro-habit</span> is the secret weapon —
        tiny acts of character that compound into unshakeable ethical identity.
      </p>
    </div>

    <div class="four-col-grid">

      <!-- SIDQ -->
      <div class="house-col hc-sidq">
        <div class="hcol-cap">
          <div class="hcol-number">House 01</div>
          <div class="hcol-icon">⭐</div>
          <div class="hcol-arabic">الصِّدْق</div>
          <h2 class="hcol-name playfair">House of Sidq</h2>
          <div class="hcol-sub">Truthfulness</div>
        </div>
        <div class="hcol-body">
          <div class="hcol-motto">"We speak truth even when it costs us."</div>
          <div class="hcol-section-label">Daily Micro-Habits</div>
          <div class="habit-row">
            <div class="habit-name">Daily Truth</div>
            <div class="habit-desc">Say one hard truth that needs to be said</div>
          </div>
          <div class="habit-row">
            <div class="habit-name">Own It</div>
            <div class="habit-desc">Acknowledge one mistake without excuse</div>
          </div>
          <div class="habit-row">
            <div class="habit-name">Honest Mirror</div>
            <div class="habit-desc">Give one friend a genuine, kind piece of feedback</div>
          </div>
          <div class="shadow-badge"><i class="fas fa-skull"></i> Defeats Kadhib (Deception)</div>
          <div class="house-assigned"><i class="fas fa-school"></i> Allocated by your school</div>
        </div>
      </div>

      <!-- AMANAH -->
      <div class="house-col hc-amanah">
        <div class="hcol-cap">
          <div class="hcol-number">House 02</div>
          <div class="hcol-icon">🛡️</div>
          <div class="hcol-arabic">الأمانة</div>
          <h2 class="hcol-name playfair">House of Amanah</h2>
          <div class="hcol-sub">Responsibility &amp; Trust</div>
        </div>
        <div class="hcol-body">
          <div class="hcol-motto">"We carry every duty with honor."</div>
          <div class="hcol-section-label">Daily Micro-Habits</div>
          <div class="habit-row">
            <div class="habit-name">Unprompted Duty</div>
            <div class="habit-desc">Complete one responsibility without being reminded</div>
          </div>
          <div class="habit-row">
            <div class="habit-name">Return with Care</div>
            <div class="habit-desc">Return something borrowed in better condition</div>
          </div>
          <div class="habit-row">
            <div class="habit-name">On Time, Every Time</div>
            <div class="habit-desc">Honor one time commitment without delay</div>
          </div>
          <div class="shadow-badge"><i class="fas fa-skull"></i> Defeats Ghaflah (Negligence)</div>
          <div class="house-assigned"><i class="fas fa-school"></i> Allocated by your school</div>
        </div>
      </div>

      <!-- RAHMAH -->
      <div class="house-col hc-rahmah">
        <div class="hcol-cap">
          <div class="hcol-number">House 03</div>
          <div class="hcol-icon">❤️</div>
          <div class="hcol-arabic">الرَّحْمَة</div>
          <h2 class="hcol-name playfair">House of Rahmah</h2>
          <div class="hcol-sub">Compassion &amp; Kindness</div>
        </div>
        <div class="hcol-body">
          <div class="hcol-motto">"We leave no one behind."</div>
          <div class="hcol-section-label">Daily Micro-Habits</div>
          <div class="habit-row">
            <div class="habit-name">Lonely Outreach</div>
            <div class="habit-desc">Check on one person who seems isolated or sad</div>
          </div>
          <div class="habit-row">
            <div class="habit-name">Proactive Help</div>
            <div class="habit-desc">Offer your help before being asked</div>
          </div>
          <div class="habit-row">
            <div class="habit-name">One Kind Word</div>
            <div class="habit-desc">Say something meaningful to someone struggling</div>
          </div>
          <div class="shadow-badge"><i class="fas fa-skull"></i> Defeats Qasawah (Harshness)</div>
          <div class="house-assigned"><i class="fas fa-school"></i> Allocated by your school</div>
        </div>
      </div>

      <!-- ADL -->
      <div class="house-col hc-adl">
        <div class="hcol-cap">
          <div class="hcol-number">House 04</div>
          <div class="hcol-icon">⚖️</div>
          <div class="hcol-arabic">الْعَدْل</div>
          <h2 class="hcol-name playfair">House of Adl</h2>
          <div class="hcol-sub">Fairness &amp; Justice</div>
        </div>
        <div class="hcol-body">
          <div class="hcol-motto">"We stand for what is right, always."</div>
          <div class="hcol-section-label">Daily Micro-Habits</div>
          <div class="habit-row">
            <div class="habit-name">Speak Up</div>
            <div class="habit-desc">Challenge one unfair situation you witness</div>
          </div>
          <div class="habit-row">
            <div class="habit-name">Fair Distribution</div>
            <div class="habit-desc">Ensure equity in any group task or sharing</div>
          </div>
          <div class="habit-row">
            <div class="habit-name">Defend the Weak</div>
            <div class="habit-desc">Stand up for someone being treated unjustly</div>
          </div>
          <div class="shadow-badge"><i class="fas fa-skull"></i> Defeats Zulm (Injustice)</div>
          <div class="house-assigned"><i class="fas fa-school"></i> Allocated by your school</div>
        </div>
      </div>

    </div>

    <div class="club-cta">
      <h3 class="playfair">Already a member?</h3>
      <p>Your house, your daily habits and your Value Credits are on your student dashboard. Your mentor approves each habit before the credits land.</p>
      <a class="club-cta-btn" href="/student-activities">Open my club <i class="fas fa-arrow-right"></i></a>
    </div>

    <div class="back-link" onclick="goToLanding()">← Back to Overview</div>
  </div>

  <!-- This page used to carry a third view that let anyone pick a house and
       tick habits into localStorage, which taught students that the credits
       were theirs to award. They are not: a mentor approves every one, and
       the house is allocated by the school. Keeping a fake version of that
       loop here would have been teaching the opposite of what the club is
       for. -->

</div>

<script>
  (() => {
    // Two static views and a switch between them. There is no state to keep:
    // membership is a field on the student's /users doc, written by the
    // school, and the habits it unlocks are read from Firestore on the
    // dashboard. This page stores nothing about the visitor.
    function showView(id) {
      ['view-landing', 'view-houses'].forEach((v) => {
        const el = document.getElementById(v);
        if (el) el.classList.add('d-none');
      });
      const next = document.getElementById(id);
      if (next) next.classList.remove('d-none');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    window.goToHouses = () => showView('view-houses');
    window.goToLanding = () => showView('view-landing');

    showView('view-landing');
  })();
</script>
`
