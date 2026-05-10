const fs = require('fs');
const path = require('path');

const files = [
  'ActivityDashboard.tsx',
  'ParentDashboard.tsx',
  'TeacherDashboard.tsx'
];

const cssReplacement = `  .sidebar-brand-art {
    width: 64px;
    height: 64px;
    flex: 0 0 64px;
    border-radius: 50%;
    background: rgba(255,255,255,0.1);
    border: 3px solid rgba(255,255,255,0.8);
    box-shadow: 0 10px 24px rgba(7,17,29,0.3);
    position: relative;
    cursor: pointer;
    transition: transform 0.25s ease, box-shadow 0.25s ease;
  }
  .sidebar-brand-art:hover {
    transform: scale(1.05);
    box-shadow: 0 14px 28px rgba(7,17,29,0.4);
    border-color: #ffffff;
  }
  .sidebar-brand-art img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }

  .sidebar-brand-art .sidebar-cam-badge {
    position: absolute;
    bottom: -2px;
    right: -2px;
    background: #ffffff;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    box-shadow: 0 4px 10px rgba(0,0,0,0.25);
    border: 1px solid #e2e8f0;
    transition: background 0.2s;
  }
  .sidebar-brand-art:hover .sidebar-cam-badge {
    background: #f8fafc;
  }
  .sidebar-brand-art .sidebar-cam-badge i {
    color: #29416d;
    font-size: 11px;
  }`;

const oldCSSRegex = /  \.sidebar-brand-art \{\s+width: 58px;[\s\S]+?\.sidebar-brand-art \.sidebar-cam-badge i \{\s+color: #fff;\s+font-size: 8px;\s+\}/;

const mobileCSSReplacement = `  .sidebar-profile-cluster .sidebar-brand-art {
    width: 48px;
    height: 48px;
    flex: 0 0 48px;
    border-radius: 50%;
    border-width: 2px;
  }`;

const mobileCSSRegex = /  \.sidebar-profile-cluster \.sidebar-brand-art \{\s+width: 44px;\s+height: 44px;\s+flex: 0 0 44px;\s+border-radius: 12px;\s+\}/;

for (const file of files) {
  const filePath = path.join(__dirname, 'src', 'components', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace Main CSS
    if (oldCSSRegex.test(content)) {
      content = content.replace(oldCSSRegex, cssReplacement);
      console.log('Successfully updated main CSS in ' + file);
    } else {
      console.log('Could not find main CSS in ' + file);
    }

    // Replace Mobile CSS
    if (mobileCSSRegex.test(content)) {
      content = content.replace(mobileCSSRegex, mobileCSSReplacement);
      console.log('Successfully updated mobile CSS in ' + file);
    } else {
      console.log('Could not find mobile CSS in ' + file);
    }

    // Replace HTML inline styles
    content = content.replace(/border-radius:16px/g, 'border-radius:50%');
    console.log('Replaced inline styles for ' + file);

    fs.writeFileSync(filePath, content, 'utf8');
  } else {
    console.log('File ' + file + ' does not exist.');
  }
}
