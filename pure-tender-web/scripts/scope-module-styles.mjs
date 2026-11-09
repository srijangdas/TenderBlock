import fs from 'node:fs';
import postcss from 'postcss';
for (const name of ['evaluator', 'operations']) {
  const scope = `.${name}-portal`;
  const root = postcss.parse(fs.readFileSync(`styles/${name}.original.css`, 'utf8'));
  root.walkAtRules(rule => { if (['import', 'theme', 'custom-variant'].includes(rule.name)) rule.remove(); });
  root.walkRules(rule => {
    if (rule.parent.type === 'atrule' && /keyframes$/.test(rule.parent.name)) return;
    rule.selectors = rule.selectors.map(selector => {
      if (selector === ':root' || selector === 'body') return scope;
      if (selector === 'html.dark' || selector === 'html.dark body') return `html.dark ${scope}`;
      if (selector.startsWith('html.dark ')) return selector.replace('html.dark ', `html.dark ${scope} `);
      return `${scope} ${selector}`;
    });
  });
  fs.writeFileSync(`src/modules/${name}/style.css`, `/* Scoped from the supplied ${name} frontend. Regenerate with npm run styles:scope. */\n${root.toString()}`);
}
