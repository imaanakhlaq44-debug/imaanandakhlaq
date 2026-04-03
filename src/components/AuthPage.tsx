import { html } from 'hono/html'

export const AuthPage = () => html`
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  
  :root {
    --bg: #161B22; /* Deep charcoal navy */
    --bg-darker: #0d1117;
    --neu-hl: rgba(255, 255, 255, 0.035);
    --neu-sh: rgba(0, 0, 0, 0.6);
    --neu-sh-soft: rgba(0, 0, 0, 0.4);
    
    /* Neumorphic Shadows */
    --raised: -8px -8px 16px var(--neu-hl), 8px 8px 16px var(--neu-sh);
    --raised-hover: -10px -10px 20px var(--neu-hl), 10px 10px 20px var(--neu-sh);
    --raised-sm: -4px -4px 8px var(--neu-hl), 4px 4px 8px var(--neu-sh);
    --inset: inset -4px -4px 8px var(--neu-hl), inset 4px 4px 8px var(--neu-sh);
    --inset-deep: inset -6px -6px 12px var(--neu-hl), inset 6px 6px 12px var(--neu-sh);
    
    /* Active Glows */
    --glow-orange: rgba(255, 120, 0, 0.4);
    --glow-red: rgba(239, 68, 68, 0.4);
    --brand-accent: #FF7800;
    --brand-light: #FFA726;

    /* Text */
    --text-pri: #E2E8F0;
    --text-sec: #8E9BAE;
  }

  * { margin:0; padding:0; box-sizing:border-box; }
  
  .auth-wrapper {
    min-height: 100vh;
    background: var(--bg);
    font-family: 'Inter', 'Segoe UI', sans-serif;
    color: var(--text-pri);
    position: relative;
    overflow-x: hidden;
  }

  /* Soft Ambient Lights */
  .orb { position:absolute; border-radius:50%; filter:blur(100px); pointer-events:none; z-index:0; }
  .orb-1 { width:500px; height:500px; background:rgba(255,120,0,0.04); top:-100px; left:-100px; }
  .orb-2 { width:400px; height:400px; background:rgba(255,255,255,0.02); bottom:-100px; right:-50px; }
  .orb-3 { width:300px; height:300px; background:rgba(255,80,0,0.03); top:40%; left:30%; }

  .auth-container { max-width:960px; margin:0 auto; padding:40px 20px; position:relative; z-index:1; }

  /* Back link */
  .back-link { display:inline-flex; align-items:center; gap:8px; color:var(--text-sec); text-decoration:none; font-size:0.9rem; margin-bottom:30px; transition:all .3s; }
  .back-link:hover { color:var(--brand-light); text-shadow: 0 0 10px var(--glow-orange); }

  /* Brand header */
  .auth-brand { text-align:center; margin-bottom:50px; }
  .auth-brand-icon {
    display: inline-flex; align-items: center; justify-content: center;
    width: 80px; height: 80px; border-radius: 20px;
    background: var(--bg); box-shadow: var(--raised);
    margin-bottom: 20px;
  }
  .auth-brand-icon i, .role-icon i, .success-icon i, .reset-overlay .fa-unlock-alt {
    display: inline-block;
    background: linear-gradient(135deg, #FFB74D, #F57C00);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 4px 6px rgba(0,0,0,0.6)) drop-shadow(0 -1px 1px rgba(255,255,255,0.15));
  }
  .auth-brand-icon i { font-size: 2.8rem; }
  
  .auth-brand h1 { font-size:2.2rem; font-weight:800; color:var(--text-pri); margin-bottom:8px; letter-spacing:-0.5px; }
  .auth-brand p { color:var(--text-sec); font-size:0.95rem; }

  /* Section titles */
  .section-title { font-size:1.3rem; font-weight:700; color:var(--text-pri); margin-bottom:8px; display:flex; align-items:center; gap:10px; }
  .section-title i { color: var(--brand-accent); filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)); }
  .section-subtitle { color:var(--text-sec); font-size:0.9rem; margin-bottom:30px; }
  .section-divider { height:2px; background:var(--bg); box-shadow:var(--inset); border-radius:2px; margin:50px 0; }

  /* Role cards grid */
  .role-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:20px; margin-bottom:10px; }
  @media(max-width:640px){ .role-grid { grid-template-columns:1fr; } }

  .role-card {
    background: var(--bg);
    border-radius: 20px;
    padding: 28px 24px; cursor: pointer;
    box-shadow: var(--raised);
    transition: all .3s cubic-bezier(.4,0,.2,1);
    position: relative; border: 1px solid transparent;
  }
  .role-card:hover { box-shadow: var(--raised-hover); transform: translateY(-3px); }
  .role-card.active {
    box-shadow: var(--inset);
    border-color: rgba(255,120,0,0.3);
  }

  .role-card-individual { grid-column: 1 / -1; }

  .role-icon {
    display: inline-flex; align-items: center; justify-content: center;
    width: 60px; height: 60px; border-radius: 16px;
    background: var(--bg); box-shadow: var(--raised-sm);
    margin-bottom: 20px;
  }
  .role-icon i { font-size: 1.8rem; }

  .role-card.active .role-icon { box-shadow: var(--inset); }

  .trial-badge { display:inline-flex; align-items:center; gap:6px; background:var(--bg); color:var(--brand-light); padding:6px 14px; border-radius:20px; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; box-shadow:var(--inset); margin-top:12px; }

  .role-name { font-size:1.1rem; font-weight:700; color:var(--text-pri); margin-bottom:6px; }
  .role-desc { font-size:0.85rem; color:var(--text-sec); line-height:1.5; }

  /* Registration forms */
  .reg-form-wrapper {
    max-height:0; overflow:hidden; transition:max-height .5s cubic-bezier(.4,0,.2,1), opacity .3s;
    opacity:0; margin-top:0;
  }
  .reg-form-wrapper.open { max-height:1000px; opacity:1; margin-top:24px; }

  .reg-form, .login-section {
    background: var(--bg);
    border-radius: 24px;
    padding: 40px;
    box-shadow: var(--raised);
    border: 1px solid rgba(255,255,255,0.02);
  }
  .login-section { max-width: 480px; margin: 0 auto; box-shadow: var(--raised-hover); }

  .reg-form h3, .login-section h3 { font-size:1.2rem; font-weight:800; color:var(--text-pri); margin-bottom:24px; display:flex; align-items:center; gap:10px; }
  .reg-form h3 i, .login-section h3 i { color: var(--brand-accent); filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)); }
  .login-section .login-sub { color:var(--text-sec); font-size:0.9rem; margin-bottom:30px; text-align:center; }
  .login-section h3 { justify-content: center; font-size: 1.4rem; }

  .form-row { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
  @media(max-width:640px){ .form-row { grid-template-columns:1fr; gap:0; } }

  .fg { margin-bottom:20px; position: relative; }
  .fg label { display:block; font-size:0.8rem; font-weight:600; color:var(--text-sec); margin-bottom:8px; margin-left:4px; text-transform:uppercase; letter-spacing:0.5px; }
  
  .fg input, .fg select {
    width: 100%; padding: 14px 16px;
    background: var(--bg); border: 2px solid transparent;
    border-radius: 12px;
    color: var(--text-pri); font-size: 0.95rem; font-family: 'Inter', sans-serif;
    box-shadow: var(--inset);
    transition: all .3s ease; outline: none;
  }
  .pw-wrap input { padding-right: 48px; }

  .fg input:focus, .fg select:focus {
    border-color: rgba(255,120,0,0.2);
    box-shadow: var(--inset), 0 0 12px var(--glow-orange);
  }
  .fg input::placeholder { color: #475569; }
  
  .fg input.error {
    border-color: rgba(239,68,68,0.3);
    box-shadow: var(--inset), 0 0 12px var(--glow-red);
  }

  .fg .code-input {
    font-family:'JetBrains Mono',monospace; font-size:1.1rem; letter-spacing:3px;
    text-align:center; text-transform:uppercase; color: var(--brand-light);
  }

  /* Buttons */
  .btn-register, .btn-login, .btn-continue {
    width: 100%; padding: 16px; border: none; border-radius: 12px; font-size: 1rem;
    font-weight: 700; cursor: pointer; transition: all .2s cubic-bezier(.4,0,.2,1);
    color: var(--brand-accent); font-family: 'Inter', sans-serif;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    background: var(--bg);
    box-shadow: var(--raised);
    margin-top: 10px; letter-spacing: 0.5px;
  }
  
  .btn-register:hover, .btn-login:hover, .btn-continue:hover {
    box-shadow: var(--raised-hover), 0 0 15px var(--glow-orange);
    color: var(--brand-light); transform: translateY(-2px);
  }
  .btn-register:active, .btn-login:active, .btn-continue:active {
    box-shadow: var(--inset); color: var(--brand-accent); transform: translateY(2px);
  }

  /* Divider */
  .or-divider { display:flex; align-items:center; gap:12px; margin:24px 0; color:var(--text-sec); font-size:0.85rem; font-weight:600; text-transform:uppercase; letter-spacing:1px; }
  .or-divider::before, .or-divider::after { content:''; flex:1; height:2px; background:var(--bg); box-shadow:var(--inset); border-radius:2px; }

  /* Password toggle */
  .pw-wrap { position:relative; }
  .pw-toggle {
    position:absolute; right:16px; top:50%; transform:translateY(-50%);
    background:var(--bg); border:none; color:var(--text-sec); cursor:pointer; font-size:1rem;
    width: 32px; height: 32px; border-radius: 8px; box-shadow: var(--raised-sm);
    display:flex; align-items:center; justify-content:center;
  }
  .pw-toggle:active { box-shadow: var(--inset); }
  .pw-toggle:hover { color: var(--brand-light); }

  .forgot-link { display:block; text-align:center; color:var(--text-sec); font-size:0.9rem; margin-top:20px; cursor:pointer; text-decoration:none; transition:all .3s; font-weight:500; }
  .forgot-link:hover { color:var(--brand-light); text-shadow: 0 0 10px var(--glow-orange); }

  /* Success & Reset Modals */
  .success-overlay, .reset-overlay {
    position:fixed; inset:0;
    background:rgba(13,17,23,0.85); backdrop-filter:blur(8px);
    display:none; justify-content:center; align-items:center; z-index:9999;
  }
  .success-overlay.show, .reset-overlay.show { display:flex; }
  
  .success-card {
    background: var(--bg); padding: 48px;
    border-radius: 24px; border: 1px solid rgba(255,255,255,0.03);
    box-shadow: var(--raised-hover), 0 30px 60px rgba(0,0,0,0.8);
    text-align: center; max-width: 460px; width: 90%;
    animation: modalPop .4s cubic-bezier(.34,1.56,.64,1);
  }
  @keyframes modalPop { from{transform:scale(0.9);opacity:0;} to{transform:scale(1);opacity:1;} }
  
  .success-icon { font-size:4rem; margin-bottom:20px; animation:checkBounce .6s ease; }
  @keyframes checkBounce { 0%{transform:scale(0);} 60%{transform:scale(1.1);} 100%{transform:scale(1);} }
  
  .success-card h3, .reset-overlay h3 { font-size:1.5rem; font-weight:800; color:var(--text-pri); margin-bottom:12px; }
  .success-card p, .reset-overlay p { color:var(--text-sec); font-size:0.95rem; margin-bottom:24px; line-height: 1.6; }

  .code-display {
    background: var(--bg);
    box-shadow: var(--inset-deep);
    border-radius: 16px; padding: 20px; margin: 24px 0;
  }
  .code-display .code-label { font-size:0.8rem; color:var(--text-sec); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; font-weight: 600; }
  .code-display .code-value {
    font-family:'JetBrains Mono',monospace; font-size:1.6rem; font-weight:800;
    color: var(--brand-light); letter-spacing:4px; text-shadow: 0 0 10px var(--glow-orange);
  }
  
  .copy-btn {
    background: var(--bg); box-shadow: var(--raised-sm); color: var(--text-sec);
    padding: 8px 20px; border-radius: 10px; font-size: 0.85rem; cursor: pointer;
    transition: all .2s; margin-top: 12px; font-weight: 600; border: none;
  }
  .copy-btn:hover { color: var(--brand-light); box-shadow: var(--raised), 0 0 10px var(--glow-orange); }
  .copy-btn:active { box-shadow: var(--inset); }

  /* Toast */
  .auth-toast {
    position:fixed; top:24px; right:24px; padding:16px 28px; border-radius:12px;
    font-size:0.95rem; font-weight:600; z-index:99999; transform:translateX(150%);
    transition:transform .4s cubic-bezier(.4,0,.2,1); 
    background: var(--bg); box-shadow: var(--raised-hover);
    color: var(--text-pri); border-left: 4px solid transparent;
  }
  .auth-toast.show { transform:translateX(0); }
  .auth-toast.success { border-left-color: #10b981; }
  .auth-toast.error { border-left-color: #ef4444; }
</style>

<div class="auth-wrapper">
  <div class="orb orb-1"></div>
  <div class="orb orb-2"></div>
  <div class="orb orb-3"></div>

  <div class="auth-container">
    <a href="/" class="back-link"><i class="fas fa-arrow-left"></i> Back to Home</a>

    <div class="auth-brand">
      <div class="auth-brand-icon"><i class="fas fa-mosque"></i></div>
      <h1>Imaan & Akhlaq</h1>
      <p>Islamic Education Platform — Register or Login to Continue</p>
    </div>

    <!-- ========== REGISTRATION SECTION ========== -->
    <div class="section-title"><i class="fas fa-user-plus" style="color:#818cf8;"></i> Create Your Account</div>
    <p class="section-subtitle">Choose your role to get started. Schools register freely — Teachers, Students & Parents need an invitation code.</p>

    <div class="role-grid">
      <div class="role-card role-card-school" onclick="selectRole('school')">
        <div class="role-icon"><i class="fas fa-school"></i></div>
        <div class="role-name">Register as School</div>
        <div class="role-desc">Create your school profile and get a unique school code to manage teachers & students.</div>
      </div>
      <div class="role-card role-card-teacher" onclick="selectRole('teacher')">
        <div class="role-icon"><i class="fas fa-chalkboard-teacher"></i></div>
        <div class="role-name">Register as Teacher</div>
        <div class="role-desc">Use your invitation code provided by your school to join the platform.</div>
      </div>
      <div class="role-card role-card-student" onclick="selectRole('student')">
        <div class="role-icon"><i class="fas fa-user-graduate"></i></div>
        <div class="role-name">Register as Student</div>
        <div class="role-desc">Enter your student code given by your school to start learning activities.</div>
      </div>
      <div class="role-card role-card-parent" onclick="selectRole('parent')">
        <div class="role-icon"><i class="fas fa-user-friends"></i></div>
        <div class="role-name">Register as Parent</div>
        <div class="role-desc">Use your parent code to monitor and approve your child's learning progress.</div>
      </div>
      <div class="role-card role-card-individual" onclick="selectRole('individual')">
        <div class="role-icon"><i class="fas fa-user-astronaut"></i></div>
        <div class="role-name">Register as Individual</div>
        <div class="role-desc">Get instant access to all Imaan & Akhlaq learning products. No invitation code needed — start your free trial today!</div>
        <div class="trial-badge"><i class="fas fa-gift"></i> 3-Day Free Trial — All Products Included</div>
      </div>
    </div>

    <!-- SCHOOL REG FORM -->
    <div id="form-school" class="reg-form-wrapper">
      <div class="reg-form">
        <h3><i class="fas fa-school" style="color:#818cf8;"></i> School Registration</h3>
        <div class="fg"><label>School Name</label><input id="regSchoolName" placeholder="e.g. Imaan Academy"></div>
        <div class="form-row">
          <div class="fg"><label>Admin Name</label><input id="regSchoolAdmin" placeholder="e.g. Principal Usman"></div>
          <div class="fg"><label>Location</label><input id="regSchoolLoc" placeholder="e.g. Islamabad"></div>
        </div>
        <div class="form-row">
          <div class="fg"><label>Email</label><input id="regSchoolEmail" type="email" placeholder="admin@school.pk"></div>
          <div class="fg"><label>Phone</label><input id="regSchoolPhone" placeholder="03XXXXXXXXX"></div>
        </div>
        <div class="form-row">
          <div class="fg"><label>Password</label><div class="pw-wrap"><input id="regSchoolPw" type="password" placeholder="Create password"><button class="pw-toggle" onclick="togglePw('regSchoolPw')"><i class="fas fa-eye"></i></button></div></div>
          <div class="fg"><label>Confirm Password</label><div class="pw-wrap"><input id="regSchoolPw2" type="password" placeholder="Confirm password"><button class="pw-toggle" onclick="togglePw('regSchoolPw2')"><i class="fas fa-eye"></i></button></div></div>
        </div>
        <button class="btn-register btn-register-school" onclick="registerSchool()"><i class="fas fa-check-circle"></i> Register School</button>
      </div>
    </div>

    <!-- TEACHER REG FORM -->
    <div id="form-teacher" class="reg-form-wrapper">
      <div class="reg-form">
        <h3><i class="fas fa-chalkboard-teacher" style="color:#34d399;"></i> Teacher Registration</h3>
        <div class="fg"><label>Invitation Code</label><input id="regTchCode" class="code-input" placeholder="TCH-XXXXX" maxlength="9"></div>
        <div class="fg"><label>Full Name</label><input id="regTchName" placeholder="e.g. Ustadh Zaid"></div>
        <div class="form-row">
          <div class="fg"><label>Email</label><input id="regTchEmail" type="email" placeholder="teacher@email.com"></div>
          <div class="fg"><label>Phone</label><input id="regTchPhone" placeholder="03XXXXXXXXX"></div>
        </div>
        <div class="form-row">
          <div class="fg"><label>Password</label><div class="pw-wrap"><input id="regTchPw" type="password" placeholder="Create password"><button class="pw-toggle" onclick="togglePw('regTchPw')"><i class="fas fa-eye"></i></button></div></div>
          <div class="fg"><label>Confirm Password</label><div class="pw-wrap"><input id="regTchPw2" type="password" placeholder="Confirm password"><button class="pw-toggle" onclick="togglePw('regTchPw2')"><i class="fas fa-eye"></i></button></div></div>
        </div>
        <button class="btn-register btn-register-teacher" onclick="registerWithCode('teacher')"><i class="fas fa-check-circle"></i> Register as Teacher</button>
      </div>
    </div>

    <!-- STUDENT REG FORM -->
    <div id="form-student" class="reg-form-wrapper">
      <div class="reg-form">
        <h3><i class="fas fa-user-graduate" style="color:#fbbf24;"></i> Student Registration</h3>
        <div class="fg"><label>Invitation Code</label><input id="regStuCode" class="code-input" placeholder="STU-XXXXX" maxlength="9"></div>
        <div class="fg"><label>Full Name</label><input id="regStuName" placeholder="e.g. Ali Ahmed"></div>
        <div class="form-row">
          <div class="fg"><label>Email (or Parent's Email)</label><input id="regStuEmail" type="email" placeholder="student@email.com"></div>
          <div class="fg"><label>Phone (or Parent's Phone)</label><input id="regStuPhone" placeholder="03XXXXXXXXX"></div>
        </div>
        <div class="form-row">
          <div class="fg"><label>Password</label><div class="pw-wrap"><input id="regStuPw" type="password" placeholder="Create password"><button class="pw-toggle" onclick="togglePw('regStuPw')"><i class="fas fa-eye"></i></button></div></div>
          <div class="fg"><label>Confirm Password</label><div class="pw-wrap"><input id="regStuPw2" type="password" placeholder="Confirm password"><button class="pw-toggle" onclick="togglePw('regStuPw2')"><i class="fas fa-eye"></i></button></div></div>
        </div>
        <button class="btn-register btn-register-student" onclick="registerWithCode('student')"><i class="fas fa-check-circle"></i> Register as Student</button>
      </div>
    </div>

    <!-- PARENT REG FORM -->
    <div id="form-parent" class="reg-form-wrapper">
      <div class="reg-form">
        <h3><i class="fas fa-user-friends" style="color:#f472b6;"></i> Parent Registration</h3>
        <div class="fg"><label>Invitation Code</label><input id="regParCode" class="code-input" placeholder="PAR-XXXXX" maxlength="9"></div>
        <div class="fg"><label>Full Name</label><input id="regParName" placeholder="e.g. Mr. Ahmed"></div>
        <div class="form-row">
          <div class="fg"><label>Email</label><input id="regParEmail" type="email" placeholder="parent@email.com"></div>
          <div class="fg"><label>Phone</label><input id="regParPhone" placeholder="03XXXXXXXXX"></div>
        </div>
        <div class="form-row">
          <div class="fg"><label>Password</label><div class="pw-wrap"><input id="regParPw" type="password" placeholder="Create password"><button class="pw-toggle" onclick="togglePw('regParPw')"><i class="fas fa-eye"></i></button></div></div>
          <div class="fg"><label>Confirm Password</label><div class="pw-wrap"><input id="regParPw2" type="password" placeholder="Confirm password"><button class="pw-toggle" onclick="togglePw('regParPw2')"><i class="fas fa-eye"></i></button></div></div>
        </div>
        <button class="btn-register btn-register-parent" onclick="registerWithCode('parent')"><i class="fas fa-check-circle"></i> Register as Parent</button>
      </div>
    </div>

    <!-- INDIVIDUAL REG FORM -->
    <div id="form-individual" class="reg-form-wrapper">
      <div class="reg-form" style="border-color:rgba(6,182,212,0.2);">
        <h3><i class="fas fa-user-astronaut" style="color:#22d3ee;"></i> Individual Registration <span class="trial-badge" style="margin-left:8px; margin-top:0;"><i class="fas fa-gift"></i> 3-Day Free Trial</span></h3>
        <div style="background:rgba(6,182,212,0.08); border:1px solid rgba(6,182,212,0.2); border-radius:10px; padding:14px; margin-bottom:18px; font-size:0.85rem; color:#67e8f9;">
          <i class="fas fa-info-circle me-1"></i> <strong>Free Trial:</strong> Get full access to all stories, activities, dashboards & learning tools for 3 days. After that, a subscription is required to continue.
        </div>
        <div class="fg"><label>Full Name</label><input id="regIndName" placeholder="e.g. Muhammad Ali"></div>
        <div class="form-row">
          <div class="fg"><label>Email</label><input id="regIndEmail" type="email" placeholder="your@email.com"></div>
          <div class="fg"><label>Phone</label><input id="regIndPhone" placeholder="03XXXXXXXXX"></div>
        </div>
        <div class="form-row">
          <div class="fg"><label>Password</label><div class="pw-wrap"><input id="regIndPw" type="password" placeholder="Create password"><button class="pw-toggle" onclick="togglePw('regIndPw')"><i class="fas fa-eye"></i></button></div></div>
          <div class="fg"><label>Confirm Password</label><div class="pw-wrap"><input id="regIndPw2" type="password" placeholder="Confirm password"><button class="pw-toggle" onclick="togglePw('regIndPw2')"><i class="fas fa-eye"></i></button></div></div>
        </div>
        <button class="btn-register btn-register-individual" onclick="registerIndividual()"><i class="fas fa-rocket"></i> Start Free Trial</button>
      </div>
    </div>

    <!-- ========== DIVIDER ========== -->
    <div class="section-divider"></div>

    <!-- ========== LOGIN SECTION ========== -->
    <div class="login-section">
      <h3><i class="fas fa-sign-in-alt" style="color:#818cf8; margin-right:8px;"></i> Welcome Back</h3>
      <p class="login-sub">Already registered? Login with your email or phone number.</p>
      <div class="fg"><label>Email or Phone</label><input id="loginId" placeholder="Enter your email or phone number"></div>
      <div class="fg"><label>Password</label><div class="pw-wrap"><input id="loginPw" type="password" placeholder="Your password"><button class="pw-toggle" onclick="togglePw('loginPw')"><i class="fas fa-eye"></i></button></div></div>
      <button class="btn-login" onclick="loginUser()"><i class="fas fa-sign-in-alt me-2"></i> Login</button>
      <a class="forgot-link" onclick="showResetModal()"><i class="fas fa-key me-1"></i> Forgot Password?</a>
    </div>

    <div style="text-align:center; margin-top:40px; color:#334155; font-size:0.8rem;">
      &copy; 2026 Imaan & Akhlaq — An Ilm O Amal Initiative
    </div>
  </div>
</div>

<!-- SUCCESS MODAL -->
<div id="successOverlay" class="success-overlay">
  <div class="success-card">
    <div class="success-icon"><i class="fas fa-check-circle"></i></div>
    <h3 id="successTitle">Registration Successful!</h3>
    <p id="successMsg">Your account has been created.</p>
    <div id="successCodes"></div>
    <button class="btn-continue" id="successBtn" onclick="closeSuccess()">Continue to Login</button>
  </div>
</div>

<!-- RESET PASSWORD MODAL -->
<div id="resetOverlay" class="reset-overlay">
  <div class="success-card">
    <div style="font-size:2.5rem; color:#818cf8; margin-bottom:16px;"><i class="fas fa-unlock-alt"></i></div>
    <h3>Reset Password</h3>
    <p>Enter your registered email or phone to reset your password.</p>
    <div class="fg" style="text-align:left;"><label>Email or Phone</label><input id="resetId" placeholder="Enter email or phone"></div>
    <div id="resetNewPw" style="display:none;">
      <div class="fg" style="text-align:left;"><label>New Password</label><div class="pw-wrap"><input id="resetPwVal" type="password" placeholder="New password"><button class="pw-toggle" onclick="togglePw('resetPwVal')"><i class="fas fa-eye"></i></button></div></div>
      <div class="fg" style="text-align:left;"><label>Confirm Password</label><div class="pw-wrap"><input id="resetPwVal2" type="password" placeholder="Confirm new password"><button class="pw-toggle" onclick="togglePw('resetPwVal2')"><i class="fas fa-eye"></i></button></div></div>
    </div>
    <button class="btn-continue" onclick="resetPassword()" id="resetBtn">Find Account</button>
    <button class="copy-btn" style="margin-top:12px; width:100%; padding:10px;" onclick="closeReset()">Cancel</button>
  </div>
</div>

<!-- TOAST -->
<div id="authToast" class="auth-toast"></div>

<script>
document.addEventListener('DOMContentLoaded', () => {
  // Load DB from localStorage or use defaults
  let DB = JSON.parse(localStorage.getItem('imaan_auth_db') || 'null');
  if (!DB) {
    DB = {
      schools: [{ school_id:'sch_001', name:'Imaan Academy', location:'Lahore', school_code:'SCH-IA001' }],
      school_admins: [{ admin_id:'adm_001', school_id:'sch_001', name:'Principal Usman', email:'usman@imaanacademy.pk', phone:'03001234567', password:'admin123' }],
      teachers: [{ teacher_id:'tch_001', school_id:'sch_001', name:'Ustadh Zaid', assigned_class:'Class 3', email:'zaid@imaanacademy.pk', phone:'03009876543', password:'teacher123', invitation_code:'TCH-ZD001' }],
      parents: [{ parent_id:'par_001', name:'Mr. Ahmed', email:'ahmed@example.com', phone:'03005551234', password:'parent123', linked_student_id:'stu_101', invitation_code:'PAR-AH001' }],
      students: [
        { student_id:'stu_101', school_id:'sch_001', class_id:'Class 3', parent_id:'par_001', name:'Ali Ahmed', age:8, avatar:'fas fa-child', base_points:0, email:'', phone:'', password:'student123', invitation_code:'STU-AL001' },
        { student_id:'stu_102', school_id:'sch_001', class_id:'Class 3', parent_id:'par_002', name:'Bilal Hashmi', age:9, avatar:'fas fa-user-graduate', base_points:450, email:'', phone:'', password:'student123', invitation_code:'STU-BL002' },
        { student_id:'stu_103', school_id:'sch_001', class_id:'Class 3', parent_id:'par_003', name:'Zainab Raza', age:8, avatar:'fas fa-female', base_points:600, email:'', phone:'', password:'student123', invitation_code:'STU-ZR003' }
      ],
      users: [
        { user_id:'usr_001', role:'school_admin', linked_id:'adm_001', email:'usman@imaanacademy.pk', phone:'03001234567', password:'admin123', name:'Principal Usman' },
        { user_id:'usr_002', role:'teacher', linked_id:'tch_001', email:'zaid@imaanacademy.pk', phone:'03009876543', password:'teacher123', name:'Ustadh Zaid' },
        { user_id:'usr_003', role:'parent', linked_id:'par_001', email:'ahmed@example.com', phone:'03005551234', password:'parent123', name:'Mr. Ahmed' }
      ],
      invitation_codes: [
        { code:'TCH-ZD001', type:'teacher', school_id:'sch_001', status:'used', used_by:'tch_001' },
        { code:'STU-AL001', type:'student', school_id:'sch_001', status:'used', used_by:'stu_101' },
        { code:'PAR-AH001', type:'parent', school_id:'sch_001', status:'used', used_by:'par_001' }
      ]
    };
    saveDB();
  }

  function saveDB() { localStorage.setItem('imaan_auth_db', JSON.stringify(DB)); }
  function genCode(prefix) { return prefix + '-' + Math.random().toString(36).substr(2,5).toUpperCase(); }
  function genId(prefix) { return prefix + '_' + Math.floor(100 + Math.random()*900); }

  function showToast(msg, type) {
    const t = document.getElementById('authToast');
    t.textContent = msg; t.className = 'auth-toast ' + type + ' show';
    setTimeout(() => t.classList.remove('show'), 3500);
  }

  // Role selection
  window.selectRole = (role) => {
    document.querySelectorAll('.role-card').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.reg-form-wrapper').forEach(f => f.classList.remove('open'));
    document.querySelector('.role-card-' + role).classList.add('active');
    document.getElementById('form-' + role).classList.add('open');
    setTimeout(() => document.getElementById('form-' + role).scrollIntoView({ behavior:'smooth', block:'center' }), 100);
  };

  // Password toggle
  window.togglePw = (id) => {
    const inp = document.getElementById(id);
    const icon = inp.nextElementSibling?.querySelector('i') || inp.parentElement.querySelector('.pw-toggle i');
    if (inp.type === 'password') { inp.type = 'text'; icon.className = 'fas fa-eye-slash'; }
    else { inp.type = 'password'; icon.className = 'fas fa-eye'; }
  };

  // ===== SCHOOL REGISTRATION =====
  window.registerSchool = () => {
    const name = document.getElementById('regSchoolName').value.trim();
    const admin = document.getElementById('regSchoolAdmin').value.trim();
    const loc = document.getElementById('regSchoolLoc').value.trim();
    const email = document.getElementById('regSchoolEmail').value.trim();
    const phone = document.getElementById('regSchoolPhone').value.trim();
    const pw = document.getElementById('regSchoolPw').value;
    const pw2 = document.getElementById('regSchoolPw2').value;

    if (!name || !admin || !email || !phone || !pw) return showToast('Please fill all required fields', 'error');
    if (pw !== pw2) return showToast('Passwords do not match', 'error');
    if (pw.length < 6) return showToast('Password must be at least 6 characters', 'error');
    if (DB.users.find(u => u.email === email || u.phone === phone)) return showToast('Email or phone already registered', 'error');

    const schoolCode = genCode('SCH');
    const schoolId = genId('sch');
    const adminId = genId('adm');

    DB.schools.push({ school_id:schoolId, name:name, location:loc, school_code:schoolCode });
    DB.school_admins.push({ admin_id:adminId, school_id:schoolId, name:admin, email:email, phone:phone, password:pw });
    DB.users.push({ user_id:genId('usr'), role:'school_admin', linked_id:adminId, email:email, phone:phone, password:pw, name:admin });
    saveDB();

    document.getElementById('successTitle').textContent = '🏫 School Registered!';
    document.getElementById('successMsg').textContent = 'Your school "' + name + '" is now on the platform. Share your school code with your admin team.';
    document.getElementById('successCodes').innerHTML =
      '<div class="code-display"><div class="code-label">Your School Code</div><div class="code-value">' + schoolCode + '</div>' +
      '<button class="copy-btn" onclick="navigator.clipboard.writeText(\\'' + schoolCode + '\\');this.textContent=\\'Copied!\\'"><i class="fas fa-copy me-1"></i> Copy Code</button></div>';
    document.getElementById('successBtn').onclick = () => { closeSuccess(); window.location.href='/auth'; };
    document.getElementById('successOverlay').classList.add('show');
  };

  // ===== CODE-BASED REGISTRATION (Teacher / Student / Parent) =====
  window.registerWithCode = (role) => {
    let code, name, email, phone, pw, pw2;
    if (role === 'teacher') {
      code = document.getElementById('regTchCode').value.trim().toUpperCase();
      name = document.getElementById('regTchName').value.trim();
      email = document.getElementById('regTchEmail').value.trim();
      phone = document.getElementById('regTchPhone').value.trim();
      pw = document.getElementById('regTchPw').value;
      pw2 = document.getElementById('regTchPw2').value;
    } else if (role === 'student') {
      code = document.getElementById('regStuCode').value.trim().toUpperCase();
      name = document.getElementById('regStuName').value.trim();
      email = document.getElementById('regStuEmail').value.trim();
      phone = document.getElementById('regStuPhone').value.trim();
      pw = document.getElementById('regStuPw').value;
      pw2 = document.getElementById('regStuPw2').value;
    } else {
      code = document.getElementById('regParCode').value.trim().toUpperCase();
      name = document.getElementById('regParName').value.trim();
      email = document.getElementById('regParEmail').value.trim();
      phone = document.getElementById('regParPhone').value.trim();
      pw = document.getElementById('regParPw').value;
      pw2 = document.getElementById('regParPw2').value;
    }

    if (!code || !name || !email || !phone || !pw) return showToast('Please fill all required fields', 'error');
    if (pw !== pw2) return showToast('Passwords do not match', 'error');
    if (pw.length < 6) return showToast('Password must be at least 6 characters', 'error');
    if (DB.users.find(u => u.email === email || u.phone === phone)) return showToast('Email or phone already registered', 'error');

    const prefix = role === 'teacher' ? 'TCH-' : role === 'student' ? 'STU-' : 'PAR-';
    if (!code.startsWith(prefix)) return showToast('Invalid code format. Expected ' + prefix + 'XXXXX', 'error');

    const inv = DB.invitation_codes.find(c => c.code === code && c.type === role && c.status === 'unused');
    if (!inv) return showToast('Invalid or already used invitation code', 'error');

    inv.status = 'used';
    const linkedId = genId(role === 'teacher' ? 'tch' : role === 'student' ? 'stu' : 'par');
    inv.used_by = linkedId;

    if (role === 'teacher') {
      DB.teachers.push({ teacher_id:linkedId, school_id:inv.school_id, name:name, assigned_class:inv.assigned_class||'Unassigned', email:email, phone:phone, password:pw, invitation_code:code });
    } else if (role === 'student') {
      DB.students.push({ student_id:linkedId, school_id:inv.school_id, class_id:inv.class_id||'Class 3', parent_id:'unassigned', name:name, age:8, avatar:'fas fa-user', base_points:0, email:email, phone:phone, password:pw, invitation_code:code });
    } else {
      const linkedStuCode = inv.linked_student_code || '';
      const stu = DB.students.find(s => s.invitation_code === linkedStuCode);
      if (stu) stu.parent_id = linkedId;
      DB.parents.push({ parent_id:linkedId, name:name, email:email, phone:phone, password:pw, linked_student_id:stu?stu.student_id:'', invitation_code:code });
    }

    DB.users.push({ user_id:genId('usr'), role:role, linked_id:linkedId, email:email, phone:phone, password:pw, name:name });
    saveDB();

    const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
    document.getElementById('successTitle').textContent = '✅ ' + roleLabel + ' Registered!';
    document.getElementById('successMsg').textContent = 'Welcome, ' + name + '! You can now login with your email or phone.';
    document.getElementById('successCodes').innerHTML = '';
    document.getElementById('successBtn').textContent = 'Go to Login';
    document.getElementById('successBtn').onclick = () => { closeSuccess(); document.querySelector('.login-section').scrollIntoView({ behavior:'smooth' }); };
    document.getElementById('successOverlay').classList.add('show');
  };

  // ===== INDIVIDUAL REGISTRATION =====
  window.registerIndividual = () => {
    const name = document.getElementById('regIndName').value.trim();
    const email = document.getElementById('regIndEmail').value.trim();
    const phone = document.getElementById('regIndPhone').value.trim();
    const pw = document.getElementById('regIndPw').value;
    const pw2 = document.getElementById('regIndPw2').value;

    if (!name || !email || !phone || !pw) return showToast('Please fill all required fields', 'error');
    if (pw !== pw2) return showToast('Passwords do not match', 'error');
    if (pw.length < 6) return showToast('Password must be at least 6 characters', 'error');
    if (DB.users.find(u => u.email === email || u.phone === phone)) return showToast('Email or phone already registered', 'error');

    const indId = genId('ind');
    const trialStart = new Date().toISOString();
    const trialEnd = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

    if (!DB.individuals) DB.individuals = [];
    DB.individuals.push({ individual_id:indId, name:name, email:email, phone:phone, password:pw, trial_start:trialStart, trial_end:trialEnd, subscription_status:'trial' });
    DB.users.push({ user_id:genId('usr'), role:'individual', linked_id:indId, email:email, phone:phone, password:pw, name:name, trial_start:trialStart, trial_end:trialEnd });
    saveDB();

    const endDate = new Date(trialEnd);
    const endStr = endDate.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' });

    document.getElementById('successTitle').textContent = '🚀 Welcome Aboard!';
    document.getElementById('successMsg').textContent = 'Your 3-day free trial has started. Enjoy full access to all Imaan & Akhlaq products!';
    document.getElementById('successCodes').innerHTML =
      '<div class="code-display" style="border-color:rgba(6,182,212,0.3); background:rgba(6,182,212,0.08);">' +
      '<div class="code-label">Free Trial Active</div>' +
      '<div class="code-value" style="color:#22d3ee; font-size:1.2rem; letter-spacing:1px;"><i class="fas fa-clock me-2"></i>3 Days</div>' +
      '<div style="margin-top:8px; font-size:0.8rem; color:#94a3b8;">Trial ends on <strong style="color:#67e8f9;">' + endStr + '</strong></div>' +
      '<div style="margin-top:6px; font-size:0.75rem; color:#64748b;">After trial, subscribe to continue access.</div>' +
      '</div>';
    document.getElementById('successBtn').textContent = 'Start Learning';
    document.getElementById('successBtn').onclick = () => { closeSuccess(); document.querySelector('.login-section').scrollIntoView({ behavior:'smooth' }); };
    document.getElementById('successOverlay').classList.add('show');
  };

  // ===== LOGIN =====
  window.loginUser = () => {
    const id = document.getElementById('loginId').value.trim();
    const pw = document.getElementById('loginPw').value;
    if (!id || !pw) return showToast('Please enter email/phone and password', 'error');

    const user = DB.users.find(u => (u.email === id || u.phone === id) && u.password === pw);
    if (!user) return showToast('Invalid credentials. Please try again.', 'error');

    // Check individual trial expiry
    if (user.role === 'individual') {
      const now = new Date();
      const trialEnd = new Date(user.trial_end);
      if (now > trialEnd) {
        return showToast('Your 3-day trial has expired. Please subscribe to continue.', 'error');
      }
      const hoursLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60));
      if (hoursLeft <= 24) {
        showToast('⚠️ Trial expires in ' + hoursLeft + ' hours! Subscribe to keep access.', 'error');
      }
    }

    sessionStorage.setItem('auth_user', JSON.stringify(user));
    showToast('Login successful! Redirecting...', 'success');

    setTimeout(() => {
      if (user.role === 'school_admin') {
        const admin = DB.school_admins.find(a => a.admin_id === user.linked_id);
        const school = DB.schools.find(s => s.school_id === admin?.school_id);
        sessionStorage.setItem('admin_session', JSON.stringify({ adminId:admin.admin_id, adminName:admin.name, schoolId:school.school_id, schoolName:school.name }));
        window.location.href = '/admin/dashboard';
      } else if (user.role === 'teacher') {
        window.location.href = '/teacher/dashboard';
      } else if (user.role === 'student') {
        window.location.href = '/student/activities';
      } else if (user.role === 'parent') {
        window.location.href = '/parent/dashboard';
      } else if (user.role === 'individual') {
        window.location.href = '/student/activities';
      }
    }, 1000);
  };

  // ===== FORGOT PASSWORD =====
  window.showResetModal = () => { document.getElementById('resetOverlay').classList.add('show'); };
  window.closeReset = () => {
    document.getElementById('resetOverlay').classList.remove('show');
    document.getElementById('resetNewPw').style.display = 'none';
    document.getElementById('resetBtn').textContent = 'Find Account';
    document.getElementById('resetBtn').onclick = resetPassword;
  };

  let resetUser = null;
  window.resetPassword = () => {
    const id = document.getElementById('resetId').value.trim();
    if (!id) return showToast('Please enter your email or phone', 'error');
    resetUser = DB.users.find(u => u.email === id || u.phone === id);
    if (!resetUser) return showToast('No account found with this email/phone', 'error');

    document.getElementById('resetNewPw').style.display = 'block';
    document.getElementById('resetBtn').textContent = 'Update Password';
    document.getElementById('resetBtn').onclick = () => {
      const np = document.getElementById('resetPwVal').value;
      const np2 = document.getElementById('resetPwVal2').value;
      if (!np || np.length < 6) return showToast('Password must be at least 6 characters', 'error');
      if (np !== np2) return showToast('Passwords do not match', 'error');
      resetUser.password = np;
      // Also update in role-specific arrays
      if (resetUser.role === 'school_admin') { const a = DB.school_admins.find(x=>x.admin_id===resetUser.linked_id); if(a) a.password=np; }
      if (resetUser.role === 'teacher') { const t = DB.teachers.find(x=>x.teacher_id===resetUser.linked_id); if(t) t.password=np; }
      if (resetUser.role === 'parent') { const p = DB.parents.find(x=>x.parent_id===resetUser.linked_id); if(p) p.password=np; }
      if (resetUser.role === 'student') { const s = DB.students.find(x=>x.student_id===resetUser.linked_id); if(s) s.password=np; }
      saveDB();
      showToast('Password updated successfully!', 'success');
      closeReset();
    };
  };

  window.closeSuccess = () => { document.getElementById('successOverlay').classList.remove('show'); };

  // Enter key handlers
  document.getElementById('loginPw').addEventListener('keyup', (e) => { if(e.key==='Enter') loginUser(); });
});
</script>
`
