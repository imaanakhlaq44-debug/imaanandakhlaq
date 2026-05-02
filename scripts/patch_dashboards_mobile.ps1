$patch = @"

/* ===== DASHBOARD_MOBILE_PATCH (universal safety net) ===== */
html, body {
  overflow-x: hidden !important;
  max-width: 100% !important;
  -webkit-text-size-adjust: 100%;
}
*, *::before, *::after { box-sizing: border-box; }

.table-responsive, .table-wrap, .data-table-wrap {
  width: 100% !important;
  overflow-x: auto !important;
  -webkit-overflow-scrolling: touch;
}
table { max-width: 100%; }

@media (max-width: 760px) {
  .app-container, .login-wrapper, .main-content,
  .dashboard-container, .container, .container-fluid {
    max-width: 100% !important;
    overflow-x: hidden !important;
  }
  body, p, h1, h2, h3, h4, h5, h6, span, div, a, td, th, li {
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  img, video, iframe, svg, canvas {
    max-width: 100% !important;
    height: auto;
  }
  .main-content, .workspace-topbar, .tab-panel,
  .panel, .card, .login-card {
    padding-left: 0.75rem !important;
    padding-right: 0.75rem !important;
  }
  input, select, textarea, button {
    max-width: 100% !important;
  }
  .modal, .modal-dialog, .modal-content {
    max-width: calc(100% - 1rem) !important;
    margin-left: auto !important;
    margin-right: auto !important;
  }
  .top-nav, .workspace-topbar, .nav-bar {
    padding-left: 0.65rem !important;
    padding-right: 0.65rem !important;
  }
}

@media (max-width: 480px) {
  .nav-brand .brand-title, .brand-title {
    font-size: 0.92rem !important;
  }
  .stat-card, .summary-card, .info-card {
    padding: 0.75rem !important;
  }
  h1 { font-size: 1.4rem !important; }
  h2 { font-size: 1.2rem !important; }
}
/* ===== END DASHBOARD_MOBILE_PATCH ===== */
"@

$files = @(
  'imaan_hostinger\admin-dashboard.html',
  'imaan_hostinger\super-admin-dashboard.html',
  'imaan_hostinger\teacher-dashboard.html',
  'imaan_hostinger\parent-dashboard.html'
)

foreach ($f in $files) {
  $c = Get-Content $f -Raw
  if ($c -match 'DASHBOARD_MOBILE_PATCH') {
    Write-Host "$f - already patched, skipping"
    continue
  }
  $idx = $c.LastIndexOf('</style>')
  if ($idx -lt 0) {
    Write-Host "$f - no </style> tag found, skipping"
    continue
  }
  $c = $c.Substring(0, $idx) + $patch + "`n" + $c.Substring($idx)
  Set-Content $f $c -NoNewline
  Write-Host "$f - patched ($([math]::Round((Get-Item $f).Length/1KB,1)) KB)"
}
