import { html } from 'hono/html'

export const AuthPage = () => html`
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  
  :root {
    --brand-pink:   #D63678;
    --brand-orange: #E08020;
    --brand-navy:   #1E2D5A;
    --bg-color:     #f8fafc;
    --card-bg:      #ffffff;
    --border-color: #e2e8f0;
    --text-pri:     #0f172a;
    --text-sec:     #64748b;
    --focus-ring:   rgba(214, 54, 120, 0.2);
  }

  * { margin:0; padding:0; box-sizing:border-box; }
  
  body { background-color: var(--bg-color); }

  .auth-wrapper {
    min-height: 100vh;
    font-family: 'Inter', sans-serif;
    color: var(--text-pri);
    display: flex;
    flex-direction: column;
  }

  .auth-nav {
    padding: 30px 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .back-link {
    display: inline-flex; align-items: center; gap: 8px;
    color: var(--text-sec); text-decoration: none; font-size: 0.95rem; font-weight: 500;
    transition: color 0.2s;
  }
  .back-link:hover { color: var(--brand-pink); }

  .brand-logo { display:flex; align-items:center; gap:12px; text-decoration:none; color:var(--brand-navy); font-size:1.3rem; font-weight:800; font-family:'Fredoka One', cursive;}
  .brand-logo i { background: linear-gradient(135deg, var(--brand-pink), var(--brand-orange)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 1.8rem; }

  .auth-container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 20px 20px 60px;
    display: grid;
    grid-template-columns: 1.2fr 0.8fr;
    gap: 60px;
    width: 100%;
    flex: 1;
  }

  @media(max-width: 900px) {
    .auth-container { grid-template-columns: 1fr; gap: 40px; }
  }

  /* Shared Container Styles */
  .auth-box {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    padding: 40px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  }

  .auth-box-title { font-size: 1.5rem; font-weight: 700; color: var(--text-pri); margin-bottom: 8px; letter-spacing: -0.5px; }
  .auth-box-desc { font-size: 0.95rem; color: var(--text-sec); margin-bottom: 30px; line-height: 1.5; }

  /* Role List (Vertical) */
  .role-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; }
  .role-item {
    display: flex; align-items: center; gap: 16px;
    padding: 16px 20px;
    border: 1px solid var(--border-color);
    border-radius: 12px;
    cursor: pointer;
    background: #fff;
    transition: all 0.2s ease;
  }
  .role-item:hover { border-color: #cbd5e1; background: #f8fafc; }
  .role-item.active { border-color: var(--brand-pink); background: #fff1f2; box-shadow: 0 0 0 1px var(--brand-pink); }
  
  .role-img { width: 44px; height: 44px; object-fit: contain; }
  .role-item-info { flex: 1; }
  .role-item-name { font-size: 1.05rem; font-weight: 600; color: var(--text-pri); margin-bottom: 2px;}
  .role-item-desc { font-size: 0.85rem; color: var(--text-sec); line-height: 1.3;}
  
  .trial-badge { display:inline-block; background: #fef08a; color: #a16207; font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 6px; margin-left: 8px; text-transform:uppercase;}

  /* Forms */
  .reg-form-wrapper { display: none; margin-top: 30px; animation: fadeIn 0.3s ease; }
  .reg-form-wrapper.open { display: block; }
  @keyframes fadeIn { from{opacity:0; transform:translateY(-10px);} to{opacity:1; transform:translateY(0);} }

  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .form-grid.single { grid-template-columns: 1fr; }
  @media(max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }

  .form-group { margin-bottom: 18px; }
  .form-label { display: block; font-size: 0.875rem; font-weight: 500; color: var(--text-pri); margin-bottom: 6px; }
  
  .form-control {
    width: 100%;
    padding: 12px 16px;
    font-family: 'Inter', sans-serif;
    font-size: 0.95rem;
    color: var(--text-pri);
    background: #fff;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    transition: all 0.2s;
  }
  .form-control::placeholder { color: #94a3b8; }
  .form-control:focus { outline: none; border-color: var(--brand-pink); box-shadow: 0 0 0 3px var(--focus-ring); }
  .form-control.error { border-color: #ef4444; box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15); }

  .code-input-lg { font-family: 'JetBrains Mono', monospace; font-size: 1.1rem; letter-spacing: 2px; text-transform: uppercase; font-weight: 600; color: var(--brand-navy); }

  .pw-wrapper { position: relative; }
  .pw-wrapper .form-control { padding-right: 45px; }
  .pw-toggle { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-sec); cursor: pointer; font-size: 1.1rem; }
  .pw-toggle:hover { color: var(--brand-navy); }

  .btn {
    width: 100%;
    padding: 14px 20px;
    font-family: 'Inter', sans-serif;
    font-size: 1rem; font-weight: 600;
    border-radius: 8px; border: none;
    cursor: pointer; transition: all 0.2s;
    display: flex; justify-content: center; align-items: center; gap: 8px;
  }
  .btn-primary { background: var(--brand-navy); color: white; }
  .btn-primary:hover { background: #152243; }
  
  .btn-accent { background: var(--brand-pink); color: white; }
  .btn-accent:hover { background: #be185d; }

  .forgot-link { display: block; text-align: center; margin-top: 16px; font-size: 0.9rem; color: var(--brand-pink); text-decoration: none; font-weight: 500; cursor: pointer; }
  .forgot-link:hover { text-decoration: underline; }

  /* Modals */
  .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: none; align-items: center; justify-content: center; z-index: 9999; }
  .modal-overlay.show { display: flex; }
  .modal-card { background: white; border-radius: 16px; padding: 40px; width: 90%; max-width: 420px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); animation: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); text-align: center; }
  @keyframes pop { from{transform:scale(0.95);opacity:0;} to{transform:scale(1);opacity:1;} }
  
  .modal-icon { font-size: 3.5rem; color: #10b981; margin-bottom: 20px; }
  .modal-title { font-size: 1.4rem; font-weight: 700; color: var(--brand-navy); margin-bottom: 12px; }
  .modal-desc { font-size: 0.95rem; color: var(--text-sec); margin-bottom: 24px; line-height: 1.5; }

  .invitation-code-box { background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
  .code-label { font-size: 0.85rem; font-weight: 600; color: var(--text-sec); margin-bottom: 8px; text-transform: uppercase; }
  .code-value { font-family: 'JetBrains Mono', monospace; font-size: 1.4rem; font-weight: 700; color: var(--brand-pink); letter-spacing: 2px; }

  /* Toast Notification */
  .toast { position: fixed; top: 20px; right: 20px; padding: 16px 24px; background: white; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border-left: 4px solid transparent; font-size: 0.95rem; font-weight: 500; z-index: 10000; transform: translateX(120%); transition: transform 0.3s ease; }
  .toast.show { transform: translateX(0); }
  .toast.success { border-left-color: #10b981; color: #064e3b; }
  .toast.error { border-left-color: #ef4444; color: #7f1d1d; }

</style>

<div class="auth-wrapper">
  
  <!-- Navigation Header -->
  <header class="auth-nav">
    <a href="/" class="back-link"><i class="fas fa-arrow-left"></i> Back to Homepage</a>
    <a href="/" class="brand-logo"><i class="fas fa-mosque"></i> Imaan & Akhlaq</a>
  </header>

  <main class="auth-container">
    
    <!-- LEFT: Registration Focus -->
    <section>
      <h1 style="font-size:2.2rem; font-family:'Fredoka One', cursive; color:var(--brand-navy); margin-bottom:10px;">Create your account</h1>
      <p style="color:var(--text-sec); font-size:1rem; margin-bottom:30px; max-width:500px;">Choose a role below to start. Schools register directly. Teachers, Students, and Parents need school invitations.</p>

      <div class="role-list">
        
        <div class="role-item role-item-school" onclick="selectRole('school')">
          <img src="./kidba_assets/img/3d_school.png" class="role-img" alt="School">
          <div class="role-item-info">
            <div class="role-item-name">School Admin</div>
            <div class="role-item-desc">Register your school and manage users.</div>
          </div>
          <i class="fas fa-chevron-right" style="color:var(--border-color);"></i>
        </div>

        <div class="role-item role-item-teacher" onclick="selectRole('teacher')">
          <img src="./kidba_assets/img/3d_teacher.png" class="role-img" alt="Teacher">
          <div class="role-item-info">
            <div class="role-item-name">Teacher</div>
            <div class="role-item-desc">Join your school using an invitation code.</div>
          </div>
          <i class="fas fa-chevron-right" style="color:var(--border-color);"></i>
        </div>

        <div class="role-item role-item-student" onclick="selectRole('student')">
          <img src="./kidba_assets/img/3d_student.png" class="role-img" alt="Student">
          <div class="role-item-info">
            <div class="role-item-name">Student / Child</div>
            <div class="role-item-desc">Start your gamified learning journey.</div>
          </div>
          <i class="fas fa-chevron-right" style="color:var(--border-color);"></i>
        </div>

        <div class="role-item role-item-parent" onclick="selectRole('parent')">
          <img src="./kidba_assets/img/3d_parent.png" class="role-img" alt="Parent">
          <div class="role-item-info">
            <div class="role-item-name">Parent</div>
            <div class="role-item-desc">Monitor progress using a parent code.</div>
          </div>
          <i class="fas fa-chevron-right" style="color:var(--border-color);"></i>
        </div>

        <div class="role-item role-item-individual" onclick="selectRole('individual')">
          <div style="width:44px; height:44px; background:#f1f5f9; border-radius:12px; display:flex; align-items:center; justify-content:center; color:var(--brand-gold); font-size:1.5rem;"><i class="fas fa-rocket"></i></div>
          <div class="role-item-info">
            <div class="role-item-name">Individual Access <span class="trial-badge">Free Trial</span></div>
            <div class="role-item-desc">Try out all features free for 3 days.</div>
          </div>
          <i class="fas fa-chevron-right" style="color:var(--border-color);"></i>
        </div>

      </div>

      <!-- DYNAMIC FORMS BELLOW -->
      <!-- School Form -->
      <div id="form-school" class="reg-form-wrapper">
        <div class="auth-box">
          <h3 class="auth-box-title">School Registration</h3>
          <p class="auth-box-desc">Input your administration details.</p>
          
          <div class="form-grid">
            <div class="form-group"><label class="form-label">School Name</label><input type="text" class="form-control" id="regSchoolName" placeholder="Imaan Academy"></div>
            <div class="form-group"><label class="form-label">Admin Name</label><input type="text" class="form-control" id="regSchoolAdmin" placeholder="M. Usman"></div>
            <div class="form-group"><label class="form-label">Location/City</label><input type="text" class="form-control" id="regSchoolLoc" placeholder="Dubai"></div>
            <div class="form-group"><label class="form-label">Phone Number</label><input type="text" class="form-control" id="regSchoolPhone" placeholder="+971 XX XXXX"></div>
          </div>
          <div class="form-group"><label class="form-label">Work Email</label><input type="email" class="form-control" id="regSchoolEmail" placeholder="admin@school.com"></div>
          <div class="form-grid">
            <div class="form-group"><label class="form-label">Password</label><div class="pw-wrapper"><input type="password" class="form-control" id="regSchoolPw" placeholder="Create password"><button class="pw-toggle" onclick="togglePw('regSchoolPw')"><i class="fas fa-eye"></i></button></div></div>
            <div class="form-group"><label class="form-label">Confirm Password</label><div class="pw-wrapper"><input type="password" class="form-control" id="regSchoolPw2" placeholder="Confirm password"><button class="pw-toggle" onclick="togglePw('regSchoolPw2')"><i class="fas fa-eye"></i></button></div></div>
          </div>
          <button class="btn btn-accent" onclick="registerSchool()">Create School Account</button>
        </div>
      </div>

      <!-- Teacher Form -->
      <div id="form-teacher" class="reg-form-wrapper">
        <div class="auth-box">
          <h3 class="auth-box-title">Teacher Registration</h3>
          <p class="auth-box-desc">Enter the invite code given by your school admin.</p>
          
          <div class="form-group"><label class="form-label">Invitation Code</label><input type="text" class="form-control code-input-lg" id="regTchCode" placeholder="TCH-XXXXX" maxlength="9"></div>
          <div class="form-grid">
            <div class="form-group"><label class="form-label">Full Name</label><input type="text" class="form-control" id="regTchName" placeholder="Zaid Ahmed"></div>
            <div class="form-group"><label class="form-label">Phone</label><input type="text" class="form-control" id="regTchPhone" placeholder="03XXXXXXXXX"></div>
          </div>
          <div class="form-group"><label class="form-label">Email Address</label><input type="email" class="form-control" id="regTchEmail" placeholder="teacher@school.com"></div>
          <div class="form-grid">
            <div class="form-group"><label class="form-label">Password</label><div class="pw-wrapper"><input type="password" class="form-control" id="regTchPw"><button class="pw-toggle" onclick="togglePw('regTchPw')"><i class="fas fa-eye"></i></button></div></div>
            <div class="form-group"><label class="form-label">Confirm Password</label><div class="pw-wrapper"><input type="password" class="form-control" id="regTchPw2"><button class="pw-toggle" onclick="togglePw('regTchPw2')"><i class="fas fa-eye"></i></button></div></div>
          </div>
          <button class="btn btn-primary" onclick="registerWithCode('teacher')">Join as Teacher</button>
        </div>
      </div>

      <!-- Student Form -->
      <div id="form-student" class="reg-form-wrapper">
        <div class="auth-box">
          <h3 class="auth-box-title">Student Registration</h3>
          <p class="auth-box-desc">Enter the student code provided by the school.</p>
          <div class="form-group"><label class="form-label">Student Code</label><input type="text" class="form-control code-input-lg" id="regStuCode" placeholder="STU-XXXXX" maxlength="9"></div>
          <div class="form-group"><label class="form-label">Student Full Name</label><input type="text" class="form-control" id="regStuName" placeholder="Ali Raza"></div>
          <div class="form-grid">
            <div class="form-group"><label class="form-label">Student/Parent Email</label><input type="email" class="form-control" id="regStuEmail" placeholder="email@example.com"></div>
            <div class="form-group"><label class="form-label">Parent Phone</label><input type="text" class="form-control" id="regStuPhone" placeholder="03XXXXXXXXX"></div>
          </div>
          <div class="form-grid">
            <div class="form-group"><label class="form-label">Password</label><div class="pw-wrapper"><input type="password" class="form-control" id="regStuPw"><button class="pw-toggle" onclick="togglePw('regStuPw')"><i class="fas fa-eye"></i></button></div></div>
            <div class="form-group"><label class="form-label">Confirm Password</label><div class="pw-wrapper"><input type="password" class="form-control" id="regStuPw2"><button class="pw-toggle" onclick="togglePw('regStuPw2')"><i class="fas fa-eye"></i></button></div></div>
          </div>
          <button class="btn btn-primary" onclick="registerWithCode('student')">Create Student Profile</button>
        </div>
      </div>

       <!-- Parent Form -->
      <div id="form-parent" class="reg-form-wrapper">
        <div class="auth-box">
          <h3 class="auth-box-title">Parent Registration</h3>
          <p class="auth-box-desc">Link to your child using the parent invitation code.</p>
          <div class="form-group"><label class="form-label">Parent Invite Code</label><input type="text" class="form-control code-input-lg" id="regParCode" placeholder="PAR-XXXXX" maxlength="9"></div>
          <div class="form-group"><label class="form-label">Parent Full Name</label><input type="text" class="form-control" id="regParName" placeholder="Zubair Ahmed"></div>
          <div class="form-grid">
            <div class="form-group"><label class="form-label">Email</label><input type="email" class="form-control" id="regParEmail" placeholder="parent@example.com"></div>
            <div class="form-group"><label class="form-label">Phone No.</label><input type="text" class="form-control" id="regParPhone" placeholder="03XXXXXXXXX"></div>
          </div>
          <div class="form-grid">
            <div class="form-group"><label class="form-label">Password</label><div class="pw-wrapper"><input type="password" class="form-control" id="regParPw"><button class="pw-toggle" onclick="togglePw('regParPw')"><i class="fas fa-eye"></i></button></div></div>
            <div class="form-group"><label class="form-label">Confirm Password</label><div class="pw-wrapper"><input type="password" class="form-control" id="regParPw2"><button class="pw-toggle" onclick="togglePw('regParPw2')"><i class="fas fa-eye"></i></button></div></div>
          </div>
          <button class="btn btn-primary" onclick="registerWithCode('parent')">Connect Account</button>
        </div>
      </div>

       <!-- Individual Form -->
      <div id="form-individual" class="reg-form-wrapper">
        <div class="auth-box" style="border-top: 4px solid var(--brand-gold);">
          <h3 class="auth-box-title">Individual Registration</h3>
          <p class="auth-box-desc">Instant access with 3-day full-feature trial.</p>
          <div class="form-group"><label class="form-label">Full Name</label><input type="text" class="form-control" id="regIndName" placeholder="Your Name"></div>
          <div class="form-grid">
            <div class="form-group"><label class="form-label">Email</label><input type="email" class="form-control" id="regIndEmail" placeholder="you@email.com"></div>
            <div class="form-group"><label class="form-label">Phone No.</label><input type="text" class="form-control" id="regIndPhone" placeholder="03XXXXXXXXX"></div>
          </div>
          <div class="form-grid">
            <div class="form-group"><label class="form-label">Password</label><div class="pw-wrapper"><input type="password" class="form-control" id="regIndPw"><button class="pw-toggle" onclick="togglePw('regIndPw')"><i class="fas fa-eye"></i></button></div></div>
            <div class="form-group"><label class="form-label">Confirm Password</label><div class="pw-wrapper"><input type="password" class="form-control" id="regIndPw2"><button class="pw-toggle" onclick="togglePw('regIndPw2')"><i class="fas fa-eye"></i></button></div></div>
          </div>
          <button class="btn btn-primary" style="background:var(--brand-gold); color:#7c2d12;" onclick="registerIndividual()"><i class="fas fa-rocket"></i> Start 3-Day Trial</button>
        </div>
      </div>

    </section>

    <!-- RIGHT: Login Focus -->
    <aside>
      <div class="auth-box" style="position:sticky; top:40px;">
        <h3 class="auth-box-title">Welcome back</h3>
        <p class="auth-box-desc">Log in to enter your portal.</p>

        <div class="form-group">
          <label class="form-label">Email or Phone Number</label>
          <input type="text" class="form-control" id="loginId" placeholder="name@school.com">
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <div class="pw-wrapper">
            <input type="password" class="form-control" id="loginPw" placeholder="ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢">
            <button class="pw-toggle" onclick="togglePw('loginPw')"><i class="fas fa-eye"></i></button>
          </div>
        </div>
        
        <button class="btn btn-primary" onclick="loginUser()">Sign In</button>
        <a class="forgot-link" onclick="showResetModal()">Forgot your password?</a>
      </div>
    </aside>

  </main>
</div>

<!-- SUCCESS MODAL -->
<div id="successOverlay" class="modal-overlay">
  <div class="modal-card">
    <div class="modal-icon"><i class="fas fa-check-circle"></i></div>
    <h3 class="modal-title" id="successTitle">Registration Successful</h3>
    <p class="modal-desc" id="successMsg">Your account is ready.</p>
    <div id="successCodes"></div>
    <button class="btn btn-primary" id="successBtn" onclick="closeSuccess()">Continue to Sign In</button>
  </div>
</div>

<!-- RESET PASSWORD MODAL -->
<div id="resetOverlay" class="modal-overlay">
  <div class="modal-card" style="text-align:left;">
    <h3 class="modal-title">Reset Password</h3>
    <p class="modal-desc">Enter your email or phone to reset credentials.</p>
    <div class="form-group"><label class="form-label">Email or Phone</label><input type="text" class="form-control" id="resetId" placeholder="e.g. name@school.com"></div>
    
    <div id="resetNewPw" style="display:none;">
      <div class="form-group"><label class="form-label">New Password</label><div class="pw-wrapper"><input type="password" class="form-control" id="resetPwVal"><button class="pw-toggle" onclick="togglePw('resetPwVal')"><i class="fas fa-eye"></i></button></div></div>
      <div class="form-group"><label class="form-label">Confirm Password</label><div class="pw-wrapper"><input type="password" class="form-control" id="resetPwVal2"><button class="pw-toggle" onclick="togglePw('resetPwVal2')"><i class="fas fa-eye"></i></button></div></div>
    </div>
    
    <div style="display:flex; gap:12px; margin-top:24px;">
      <button class="btn" style="background:#e2e8f0; color:var(--text-pri);" onclick="closeReset()">Cancel</button>
      <button class="btn btn-primary" onclick="resetPassword()" id="resetBtn">Find Account</button>
    </div>
  </div>
</div>

<!-- TOAST -->
<div id="authToast" class="toast"></div>

<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
  import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
  import { getFirestore, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

  const firebaseConfig = {
    apiKey: "AIzaSyA4MrV-oXhK_johreyzIucti5RFrKcvyG8",
    authDomain: "imaan-app-1d2da.firebaseapp.com",
    projectId: "imaan-app-1d2da",
    storageBucket: "imaan-app-1d2da.firebasestorage.app",
    messagingSenderId: "373650938167",
    appId: "1:373650938167:web:e9da1317c118bc720d22b2"
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  function showToast(msg, type) {
    const t = document.getElementById('authToast');
    t.textContent = msg; t.className = 'toast ' + type + ' show';
    setTimeout(() => t.classList.remove('show'), 3500);
  }

  function genCode(prefix) { return prefix + '-' + Math.random().toString(36).substr(2,5).toUpperCase(); }
  function genId(prefix) { return prefix + '_' + Math.floor(100 + Math.random()*900); }

  window.selectRole = (role) => {
    document.querySelectorAll('.role-item').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.reg-form-wrapper').forEach(f => f.classList.remove('open'));
    document.querySelector('.role-item-' + role).classList.add('active');
    document.getElementById('form-' + role).classList.add('open');
    setTimeout(() => document.getElementById('form-' + role).scrollIntoView({ behavior:'smooth', block:'center' }), 100);
  };

  window.togglePw = (id) => {
    const inp = document.getElementById(id);
    const icon = inp.nextElementSibling?.querySelector('i') || inp.parentElement.querySelector('.pw-toggle i');
    if (inp.type === 'password') { inp.type = 'text'; icon.className = 'fas fa-eye-slash'; }
    else { inp.type = 'password'; icon.className = 'fas fa-eye'; }
  };

  window.closeSuccess = () => document.getElementById('successOverlay').classList.remove('show');

  window.registerSchool = async () => {
    const name = document.getElementById('regSchoolName').value.trim();
    const admin = document.getElementById('regSchoolAdmin').value.trim();
    const loc = document.getElementById('regSchoolLoc').value.trim();
    const email = document.getElementById('regSchoolEmail').value.trim();
    const phone = document.getElementById('regSchoolPhone').value.trim();
    const pw = document.getElementById('regSchoolPw').value;
    const pw2 = document.getElementById('regSchoolPw2').value;

    if (!name || !admin || !email || !phone || !pw) return showToast('Please fill all fields', 'error');
    if (pw !== pw2) return showToast('Passwords do not match', 'error');

    try {
      showToast('Registering...', 'success');
      const userCredential = await createUserWithEmailAndPassword(auth, email, pw);
      const user = userCredential.user;
      const code = genCode('SCH');
      const sId = genId('sch');
      
      await setDoc(doc(db, "schools", sId), { name: name, location: loc, school_code: code, admin_uid: user.uid });
      await setDoc(doc(db, "users", user.uid), { role: 'school_admin', email: email, phone: phone, name: admin, school_id: sId });
      
      document.getElementById('successTitle').textContent = 'School Registered!';
      document.getElementById('successMsg').textContent = 'Your school code is required to invite teachers, students and parents.';
      document.getElementById('successCodes').innerHTML = '<div class="invitation-code-box"><div class="code-label">School Code</div><div class="code-value">'+code+'</div></div>';
      document.getElementById('successOverlay').classList.add('show');
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  window.registerWithCode = async (role) => {
    let pre = role==='teacher'?'TCH':role==='student'?'STU':'PAR';
    let p = role === 'teacher' ? 'Tch' : role === 'student' ? 'Stu' : 'Par';
    
    const code = document.getElementById('reg'+p+'Code').value.trim().toUpperCase();
    const name = document.getElementById('reg'+p+'Name').value.trim();
    const email = document.getElementById('reg'+p+'Email').value.trim();
    const phone = document.getElementById('reg'+p+'Phone').value.trim();
    const pw = document.getElementById('reg'+p+'Pw').value;
    const pw2 = document.getElementById('reg'+p+'Pw2').value;

    if (!code || !name || !email || !phone || !pw) return showToast('Please fill missing fields', 'error');
    if (pw !== pw2) return showToast('Passwords mismatch', 'error');
    if (!code.startsWith(pre+'-')) return showToast('Invalid code format. Must start with '+pre+'-', 'error');

    try {
      showToast('Validating code...', 'success');
      
      const inviteReq = await getDoc(doc(db, "invites", code));
      if (!inviteReq.exists()) {
         return showToast('Invalid or unrecognized code.', 'error');
      }

      const inviteData = inviteReq.data();
      if (inviteData.status !== 'pending') {
         return showToast('This code has already been used or is inactive.', 'error');
      }
      if (inviteData.role !== role) {
         return showToast('This code is not for the ' + role + ' role.', 'error');
      }

      showToast('Code accepted. Creating account...', 'success');
      const userCredential = await createUserWithEmailAndPassword(auth, email, pw);
      const user = userCredential.user;
      
      const userPayload = { 
         role: role, 
         email: email, 
         phone: phone, 
         name: name, 
         invitation_code: code,
         school_id: inviteData.school_id
      };
      
      if (inviteData.class_id) userPayload.class_id = inviteData.class_id;
      if (inviteData.linked_student_code) userPayload.linked_student_code = inviteData.linked_student_code;

      // 1. Create User
      await setDoc(doc(db, "users", user.uid), userPayload);
      
      // 2. Mark invite as used
      await updateDoc(doc(db, "invites", code), {
         status: 'used',
         used_by_uid: user.uid,
         used_at: new Date().toISOString()
      });

      document.getElementById('successTitle').textContent = 'Account Ready!';
      document.getElementById('successMsg').textContent = 'Welcome '+name+', you can log in now.';
      document.getElementById('successCodes').innerHTML = '';
      document.getElementById('successOverlay').classList.add('show');
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  window.registerIndividual = async () => {
    const name = document.getElementById('regIndName').value.trim();
    const email = document.getElementById('regIndEmail').value.trim();
    const phone = document.getElementById('regIndPhone').value.trim();
    const pw = document.getElementById('regIndPw').value;
    const pw2 = document.getElementById('regIndPw2').value;

    if (!name || !email || !phone || !pw) return showToast('Required fields missing', 'error');
    if (pw !== pw2) return showToast('Passwords mismatch', 'error');

    try {
      showToast('Creating trial account...', 'success');
      const userCredential = await createUserWithEmailAndPassword(auth, email, pw);
      const trialEnd = new Date(Date.now() + 3*24*60*60*1000).toISOString();
      
      await setDoc(doc(db, "users", userCredential.user.uid), { role: 'individual', email: email, phone: phone, name: name, trial_end: trialEnd });

      document.getElementById('successTitle').textContent = 'Welcome Aboard!';
      document.getElementById('successMsg').textContent = 'Your 3-day free trial has been activated.';
      document.getElementById('successCodes').innerHTML = '';
      document.getElementById('successOverlay').classList.add('show');
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  window.loginUser = async () => {
    const id = document.getElementById('loginId').value.trim();
    const pw = document.getElementById('loginPw').value;
    if (!id || !pw) return showToast('Enter email and password', 'error');

    try {
      showToast('Logging in...', 'success');
      const userCredential = await signInWithEmailAndPassword(auth, id, pw);
      const user = userCredential.user;
      
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        sessionStorage.setItem('auth_user', JSON.stringify({ uid: user.uid, ...userData }));
        
        showToast('Success! Redirecting...', 'success');
        setTimeout(() => {
          if (userData.role === 'school_admin') window.location.href = './admin-dashboard.html';
          else if (userData.role === 'teacher') window.location.href = './teacher-dashboard.html';
          else if (userData.role === 'student' || userData.role === 'individual') window.location.href = './student-activities.html';
          else if (userData.role === 'parent') window.location.href = './parent-dashboard.html';
        }, 1000);
      } else {
        showToast('User record not found in system.', 'error');
      }
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  window.showResetModal = () => document.getElementById('resetOverlay').classList.add('show');
  window.closeReset = () => {
    document.getElementById('resetOverlay').classList.remove('show');
  };
  
  window.resetPassword = async () => {
    const id = document.getElementById('resetId').value.trim();
    if (!id) return showToast('Please enter your email', 'error');
    
    try {
      showToast('Sending reset email...', 'success');
      await sendPasswordResetEmail(auth, id);
      showToast('Reset email sent! Check your inbox.', 'success');
      setTimeout(closeReset, 2000);
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

</script>
`
