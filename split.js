import fs from 'fs';
import path from 'path';

const indexPath = path.join(process.cwd(), 'src/index.tsx');
let content = fs.readFileSync(indexPath, 'utf-8');

// The main string literal is inside function generateHTML(): string { return `...` }
const match = content.match(/function generateHTML\(\): string \{\s*return `([\s\S]*?)`\s*\}/);
if (!match) {
    console.error("Could not find the generateHTML function");
    process.exit(1);
}

const htmlContent = match[1];

// Split by <!-- ===== 
const parts = htmlContent.split('<!-- ===== ');

const componentsDir = path.join(process.cwd(), 'src/components');
if (!fs.existsSync(componentsDir)) {
    fs.mkdirSync(componentsDir, { recursive: true });
}

let imports = `import { html } from 'hono/html'\n`;
let assemble = ``;

for (let i = 0; i < parts.length; i++) {
    let part = parts[i];
    if (i === 0) {
        // First part is usually doctype and head up until scroll progress
        // Actually, head could be part 0
        const htmlStr = part.trim();
        if (htmlStr) {
            fs.writeFileSync(path.join(componentsDir, 'Head.tsx'), `import { html } from 'hono/html';\nexport const Head = () => html\`\\n${htmlStr}\\n\`;\n`);
            imports += `import { Head } from './components/Head'\n`;
            assemble += `\${Head()}\n`;
        }
        continue;
    }

    const titleEndIndex = part.indexOf(' ===== -->');
    if (titleEndIndex !== -1) {
        let title = part.substring(0, titleEndIndex).trim();
        let rest = part.substring(titleEndIndex + 10);
        
        let componentName = title.split(' / ')[0].split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
        componentName = componentName.replace(/[^a-zA-Z0-9]/g, '');
        if (!componentName) componentName = `Section${i}`;

        fs.writeFileSync(path.join(componentsDir, `${componentName}.tsx`), `import { html } from 'hono/html';\nexport const ${componentName} = () => html\`\\n<!-- ===== ${title} ===== -->\\n${rest}\\n\`;\n`);
        imports += `import { ${componentName} } from './components/${componentName}'\n`;
        assemble += `\${${componentName}()}\n`;
    }
}

const newIndexContent = content.replace(
    /function generateHTML\(\): string \{\s*return `([\s\S]*?)`\s*\}/,
    `// Components
${imports}

function generateHTML() {
  return html\`\${Head()}\n${assemble}\`
}`
);

fs.writeFileSync(indexPath, newIndexContent);
console.log("Successfully split index.tsx into modular components in src/components!");
