import { html } from 'hono/html'

export const ParentGateModal = () => html`
<style>
  .pg-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(12, 23, 48, 0.78);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s ease;
  }
  .pg-modal-overlay.active {
    opacity: 1;
    pointer-events: auto;
  }
  .pg-modal-card {
    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    border: 1px solid rgba(36, 61, 107, 0.14);
    border-radius: 24px;
    width: 100%;
    max-width: 440px;
    padding: 2rem 1.8rem;
    box-shadow: 0 24px 48px rgba(15, 23, 42, 0.24);
    transform: translateY(12px) scale(0.96);
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
  }
  .pg-modal-overlay.active .pg-modal-card {
    transform: translateY(0) scale(1);
  }
  .pg-modal-header {
    text-align: center;
    margin-bottom: 1.5rem;
  }
  .pg-modal-icon {
    width: 58px;
    height: 58px;
    margin: 0 auto 0.9rem;
    border-radius: 18px;
    background: linear-gradient(135deg, #243d6b 0%, #cf296d 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-size: 1.5rem;
    box-shadow: 0 10px 22px rgba(207, 41, 109, 0.25);
  }
  .pg-modal-title {
    font-family: 'Sora', sans-serif;
    font-size: 1.25rem;
    font-weight: 800;
    color: #1b2942;
    margin: 0 0 0.35rem;
  }
  .pg-modal-subtitle {
    font-size: 0.82rem;
    color: #6f7f96;
    margin: 0;
    line-height: 1.45;
  }
  .pg-pin-single-input {
    width: 100%;
    height: 58px;
    border-radius: 16px;
    border: 2px solid #dce6f1;
    background: #ffffff;
    text-align: center;
    font-family: 'Sora', monospace;
    font-size: 1.8rem;
    font-weight: 800;
    letter-spacing: 0.6em;
    padding-left: 0.6em;
    color: #1b2942;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .pg-pin-single-input:focus {
    border-color: #cf296d;
    box-shadow: 0 0 0 4px rgba(207, 41, 109, 0.15);
  }
  .pg-field-group {
    margin-bottom: 1.2rem;
  }
  .pg-field-label {
    display: block;
    font-family: 'Sora', sans-serif;
    font-size: 0.78rem;
    font-weight: 700;
    color: #1b2942;
    margin-bottom: 0.4rem;
  }
  .pg-field-input {
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: 12px;
    border: 1.5px solid #dce6f1;
    font-family: inherit;
    font-size: 0.9rem;
    color: #1b2942;
    outline: none;
    transition: border-color 0.2s;
  }
  .pg-field-input:focus {
    border-color: #243d6b;
  }
  .pg-btn-primary {
    width: 100%;
    padding: 0.85rem;
    border-radius: 14px;
    border: none;
    background: linear-gradient(135deg, #243d6b 0%, #cf296d 100%);
    color: #ffffff;
    font-family: 'Sora', sans-serif;
    font-size: 0.88rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 10px 20px rgba(36, 61, 107, 0.2);
    transition: transform 0.18s, box-shadow 0.18s;
  }
  .pg-btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 14px 26px rgba(36, 61, 107, 0.28);
  }
  .pg-btn-link {
    background: none;
    border: none;
    color: #ea8300;
    font-family: 'Sora', sans-serif;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    text-decoration: underline;
    margin-top: 0.8rem;
    display: block;
    width: 100%;
    text-align: center;
  }
  .pg-close-btn {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: rgba(0,0,0,0.05);
    border: none;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    color: #6f7f96;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
  }
  .pg-close-btn:hover {
    background: rgba(0,0,0,0.1);
    color: #1b2942;
  }
  
  /* Shake animation for incorrect PIN */
  @keyframes pgShake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-8px); }
    40%, 80% { transform: translateX(8px); }
  }
  .pg-shake {
    animation: pgShake 0.4s ease-in-out;
  }
  
  /* Active Parent Banner in Header */
  .parent-mode-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    background: linear-gradient(135deg, #102a45 0%, #cf296d 100%);
    color: #ffffff;
    padding: 0.65rem 1.2rem;
    border-radius: 14px;
    margin-bottom: 1rem;
    box-shadow: 0 8px 20px rgba(16, 42, 69, 0.18);
  }
  .parent-mode-banner strong {
    font-family: 'Sora', sans-serif;
    font-size: 0.82rem;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .parent-mode-lock-btn {
    background: rgba(255,255,255,0.18);
    border: 1px solid rgba(255,255,255,0.3);
    color: #ffffff;
    font-family: 'Sora', sans-serif;
    font-size: 0.74rem;
    font-weight: 700;
    padding: 0.4rem 0.85rem;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.18s;
  }
  .parent-mode-lock-btn:hover {
    background: #dc2626;
  }

  /* Chapter + teacher feedback rows in the Parent Area */
  .pg-report-row {
    border: 1px solid #e6edf6;
    border-radius: 12px;
    padding: 0.75rem 0.9rem;
    margin-bottom: 0.6rem;
    background: #fbfdff;
  }
  .pg-report-row:last-child { margin-bottom: 0; }
  .pg-report-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
    flex-wrap: wrap;
  }
  .pg-report-head strong {
    font-family: 'Sora', sans-serif;
    font-size: 0.88rem;
    color: #1b2942;
    min-width: 0;
  }
  .pg-report-date {
    font-size: 0.72rem;
    color: #94a3b8;
    margin-top: 0.15rem;
  }
  .pg-report-note {
    margin-top: 0.5rem;
    font-size: 0.82rem;
    line-height: 1.45;
    color: #334155;
    background: #ffffff;
    border-left: 3px solid #cf296d;
    border-radius: 0 8px 8px 0;
    padding: 0.5rem 0.7rem;
  }
  .pg-report-note.muted {
    color: #94a3b8;
    font-style: italic;
    border-left-color: #e2e8f0;
  }
</style>

<!-- 1. FIRST TIME SETUP MODAL -->
<div id="pgSetupModal" class="pg-modal-overlay">
  <div class="pg-modal-card">
    <button class="pg-close-btn" type="button" onclick="window.closePgModal('pgSetupModal')"><i class="fas fa-times"></i></button>
    <div class="pg-modal-header">
      <div class="pg-modal-icon"><i class="fas fa-shield-alt"></i></div>
      <h3 class="pg-modal-title">Setup Parent Gate</h3>
      <p class="pg-modal-subtitle">Create a 4-digit secret PIN to protect parent controls and track progress.</p>
    </div>

    <div class="pg-field-group">
      <label class="pg-field-label" for="pgSetupPinInput">Set 4-Digit Secret PIN</label>
      <input type="password" id="pgSetupPinInput" maxlength="4" placeholder="••••" class="pg-pin-single-input" inputmode="numeric" pattern="[0-9]*" autocomplete="off">
      <span style="font-size:0.7rem; color:#6f7f96; display:block; margin-top:0.5rem;">Forgot it later? Reset it with your account password — no separate recovery email needed.</span>
    </div>

    <div id="pgSetupError" style="color:#dc2626; font-size:0.78rem; font-weight:700; margin-bottom:0.8rem; text-align:center; display:none;"></div>

    <button type="button" class="pg-btn-primary" onclick="window.submitPgSetup()"><i class="fas fa-check-circle"></i> Save &amp; Unlock Parent Gate</button>
  </div>
</div>

<!-- 2. UNLOCK PIN MODAL -->
<div id="pgUnlockModal" class="pg-modal-overlay">
  <div class="pg-modal-card" id="pgUnlockCard">
    <button class="pg-close-btn" type="button" onclick="window.closePgModal('pgUnlockModal')"><i class="fas fa-times"></i></button>
    <div class="pg-modal-header">
      <div class="pg-modal-icon"><i class="fas fa-lock"></i></div>
      <h3 class="pg-modal-title">Enter Parent PIN</h3>
      <p class="pg-modal-subtitle">Enter your 4-digit PIN to access Parent Controls &amp; Analytics.</p>
    </div>

    <div class="pg-field-group">
      <label class="pg-field-label" for="pgUnlockPinInput">Enter 4-Digit Secret PIN</label>
      <input type="password" id="pgUnlockPinInput" maxlength="4" placeholder="••••" class="pg-pin-single-input" inputmode="numeric" pattern="[0-9]*" autocomplete="off">
    </div>

    <div id="pgUnlockError" style="color:#dc2626; font-size:0.78rem; font-weight:700; margin-bottom:0.8rem; text-align:center; display:none;"></div>

    <button type="button" class="pg-btn-primary" onclick="window.submitPgUnlock()"><i class="fas fa-unlock-alt"></i> Unlock Parent Gate</button>
    <button type="button" class="pg-btn-link" onclick="window.openPgForgotModal()"><i class="fas fa-key"></i> Forgot PIN? Reset it here</button>
  </div>
</div>

<!-- 3. RESET PIN MODAL
     This used to ask for a "recovery email" and then only printed "details
     sent" — nothing was ever sent, so a parent who forgot the PIN was stuck.
     Proving you know the account password is the check that actually works
     today: it needs no mail server, and Firebase verifies it server-side via
     reauthenticateWithCredential. -->
<div id="pgForgotModal" class="pg-modal-overlay">
  <div class="pg-modal-card" id="pgForgotCard">
    <button class="pg-close-btn" type="button" onclick="window.closePgModal('pgForgotModal')"><i class="fas fa-times"></i></button>
    <div class="pg-modal-header">
      <div class="pg-modal-icon"><i class="fas fa-key"></i></div>
      <h3 class="pg-modal-title">Reset Parent PIN</h3>
      <p class="pg-modal-subtitle">Confirm the account password, then choose a new 4-digit PIN.</p>
    </div>

    <div class="pg-field-group">
      <label class="pg-field-label" for="pgForgotAccountEmail">Account</label>
      <input type="email" id="pgForgotAccountEmail" class="pg-field-input" readonly style="background:#f1f5f9; color:#6f7f96;">
    </div>

    <div class="pg-field-group">
      <label class="pg-field-label" for="pgForgotPasswordInput">Account Password</label>
      <input type="password" id="pgForgotPasswordInput" class="pg-field-input" placeholder="Your login password" autocomplete="current-password">
      <span style="font-size:0.7rem; color:#6f7f96; display:block; margin-top:0.25rem;">Forgot this too? Sign out and use "Forgot password" on the login page.</span>
    </div>

    <div class="pg-field-group">
      <label class="pg-field-label" for="pgForgotNewPinInput">New 4-Digit PIN</label>
      <input type="password" id="pgForgotNewPinInput" maxlength="4" placeholder="••••" class="pg-pin-single-input" inputmode="numeric" pattern="[0-9]*" autocomplete="off">
    </div>

    <div id="pgForgotMessage" style="font-size:0.78rem; font-weight:700; margin-bottom:0.8rem; text-align:center; display:none;"></div>

    <button type="button" class="pg-btn-primary" id="pgForgotSubmitBtn" onclick="window.submitPgForgot()"><i class="fas fa-check-circle"></i> Verify &amp; Set New PIN</button>
    <button type="button" class="pg-btn-link" onclick="window.backToPgUnlock()"><i class="fas fa-arrow-left"></i> Back to PIN Entry</button>
  </div>
</div>
`
