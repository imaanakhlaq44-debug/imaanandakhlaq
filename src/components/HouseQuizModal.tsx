import { html } from 'hono/html'

/**
 * The house quiz, for a self-study member who has nobody to allocate them.
 *
 * Shown on the student dashboard when an individual account has no house yet —
 * not only at signup, so that the members who registered before this existed
 * are also picked up the next time they open the club.
 *
 * The card cannot be dismissed by clicking away. That is not a dark pattern
 * here: without a house there is no club at all, and an overlay a child closes
 * by accident leaves them exactly where they started, on an empty page telling
 * them to ask a teacher they do not have. They can still leave it and use the
 * rest of the dashboard — the club section simply stays as it was.
 *
 * Nothing in this file knows which house an answer belongs to. The questions
 * arrive already stripped (see houseQuizHelpersJS) and the answers are scored
 * by the assignHouseFromQuiz callable.
 */
export const HouseQuizModal = () => html`
<style>
  .hq-overlay {
    position: fixed;
    inset: 0;
    z-index: 9998;
    background: rgba(12, 23, 48, 0.8);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s ease;
  }
  .hq-overlay.active { opacity: 1; pointer-events: auto; }

  .hq-card {
    background: #ffffff;
    border-radius: 22px;
    width: 100%;
    max-width: 560px;
    /* The quiz is longer than the viewport on a phone, so the card scrolls
       inside itself rather than the page scrolling behind the overlay. */
    max-height: min(88vh, 780px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 24px 48px rgba(15, 23, 42, 0.28);
    transform: translateY(14px);
    transition: transform 0.25s ease;
  }
  .hq-overlay.active .hq-card { transform: translateY(0); }

  /* The card's flex column has to continue through the view wrapper, or the
     head/body/foot are laid out inside an unconstrained div and the card's
     overflow:hidden clips the footer straight off the bottom of a phone.
     min-height:0 is what actually lets .hq-body scroll instead of stretching
     its parent — a flex item will not shrink below its content without it. */
  .hq-view {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }

  .hq-head {
    padding: 1.5rem 1.6rem 1.1rem;
    border-bottom: 1px solid #e9edf3;
    flex-shrink: 0;
  }
  .hq-eyebrow {
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #cf296d;
    margin-bottom: 0.4rem;
  }
  .hq-title { margin: 0 0 0.35rem; font-size: 1.3rem; color: #1e2d5a; font-weight: 800; }
  .hq-sub { margin: 0; font-size: 0.88rem; color: #64748b; line-height: 1.6; }

  .hq-progress { height: 4px; background: #eef2f7; flex-shrink: 0; }
  .hq-progress-bar {
    height: 100%;
    width: 0;
    background: #cf296d;
    transition: width 0.3s ease;
  }

  .hq-body { padding: 1.4rem 1.6rem; overflow-y: auto; flex: 1; min-height: 0; }

  .hq-q { margin-bottom: 1.8rem; }
  .hq-q:last-child { margin-bottom: 0.5rem; }
  .hq-q-n {
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #94a3b8;
    display: block;
    margin-bottom: 0.3rem;
  }
  .hq-prompt { font-weight: 700; color: #1e2d5a; font-size: 0.98rem; line-height: 1.55; }
  /* Many self-study families read the Urdu first, so it sits with the English
     rather than behind a toggle. */
  .hq-prompt-ur {
    display: block;
    direction: rtl;
    text-align: right;
    font-size: 0.92rem;
    color: #475569;
    line-height: 2;
    margin-top: 0.2rem;
  }

  .hq-options { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.8rem; }
  .hq-opt {
    display: flex;
    align-items: flex-start;
    gap: 0.7rem;
    padding: 0.75rem 0.9rem;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    background: #f8fafc;
    cursor: pointer;
    text-align: left;
    width: 100%;
    transition: border-color 0.15s, background 0.15s;
  }
  .hq-opt:hover { border-color: #cbd5e1; }
  .hq-opt.is-picked { border-color: #cf296d; background: #fff; }
  .hq-tick {
    flex: 0 0 22px;
    height: 22px;
    border-radius: 7px;
    border: 2px solid #cbd5e1;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 0.65rem;
    margin-top: 1px;
  }
  .hq-opt.is-picked .hq-tick { background: #cf296d; border-color: #cf296d; }
  .hq-opt-text { flex: 1; min-width: 0; }
  .hq-opt-en { display: block; font-size: 0.9rem; color: #1e293b; line-height: 1.5; }
  .hq-opt-ur {
    display: block;
    direction: rtl;
    text-align: right;
    font-size: 0.86rem;
    color: #64748b;
    line-height: 1.95;
    margin-top: 0.15rem;
  }

  .hq-foot {
    padding: 1.1rem 1.6rem 1.4rem;
    border-top: 1px solid #e9edf3;
    display: flex;
    align-items: center;
    gap: 0.7rem;
    flex-wrap: wrap;
    flex-shrink: 0;
  }
  .hq-count { font-size: 0.8rem; font-weight: 700; color: #94a3b8; margin-right: auto; }
  .hq-count.is-ok { color: #16a34a; }
  .hq-btn {
    border: none;
    border-radius: 999px;
    padding: 0.6rem 1.5rem;
    font-size: 0.9rem;
    font-weight: 800;
    cursor: pointer;
    font-family: inherit;
  }
  .hq-btn.go { background: #cf296d; color: #fff; }
  .hq-btn.go:disabled { background: #e2e8f0; color: #94a3b8; cursor: not-allowed; }
  .hq-btn.later { background: #f1f5f9; color: #64748b; }

  /* ---- the result ---- */
  .hq-result { padding: 2.2rem 1.8rem; text-align: center; overflow-y: auto; }
  .hq-crest {
    width: 84px; height: 84px;
    border-radius: 24px;
    margin: 0 auto 1.1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.4rem;
  }
  .hq-result h3 { margin: 0 0 0.3rem; font-size: 1.45rem; color: #1e2d5a; font-weight: 800; }
  .hq-result .hq-motto { margin: 0 0 1rem; color: #64748b; font-size: 0.92rem; font-style: italic; }
  .hq-shadow {
    background: #1e2d5a;
    color: #cbd5e1;
    border-radius: 14px;
    padding: 0.9rem 1.1rem;
    text-align: left;
    margin-bottom: 1.3rem;
  }
  .hq-shadow strong { display: block; color: #fbbf24; font-size: 0.95rem; margin-bottom: 0.25rem; }
  .hq-shadow p { margin: 0; font-size: 0.83rem; line-height: 1.6; }

  @media (max-width: 30rem) {
    .hq-head, .hq-body, .hq-foot { padding-left: 1.1rem; padding-right: 1.1rem; }
    .hq-foot .hq-btn { flex: 1; }
  }
</style>

<div id="houseQuizModal" class="hq-overlay" role="dialog" aria-modal="true" aria-labelledby="hqTitle">
  <div class="hq-card">
    <div id="hqQuizView" class="hq-view">
      <div class="hq-head">
        <div class="hq-eyebrow">Imaan &amp; Akhlaq Club</div>
        <h2 class="hq-title" id="hqTitle">Which house are you?</h2>
        <p class="hq-sub">
          Six situations. Tick the answer that is most like you — not the one that sounds best.
          There is no better or worse house, and you only do this once.
        </p>
      </div>
      <div class="hq-progress"><div class="hq-progress-bar" id="hqProgressBar"></div></div>
      <div class="hq-body" id="hqQuestions"></div>
      <div class="hq-foot">
        <span class="hq-count" id="hqCount"></span>
        <button type="button" class="hq-btn later" onclick="window.closeHouseQuiz()">Not now</button>
        <button type="button" class="hq-btn go" id="hqSubmit" onclick="window.submitHouseQuiz()" disabled>
          Join my house
        </button>
      </div>
    </div>

    <div id="hqResultView" class="hq-view d-none">
      <div class="hq-result">
        <div class="hq-crest" id="hqCrest">🛡️</div>
        <h3 id="hqHouseName">Your house</h3>
        <p class="hq-motto" id="hqMotto"></p>
        <div class="hq-shadow">
          <strong id="hqShadowName"></strong>
          <p id="hqShadowDesc"></p>
        </div>
        <button type="button" class="hq-btn go" onclick="window.finishHouseQuiz()">Start my habits</button>
      </div>
    </div>
  </div>
</div>
`;
