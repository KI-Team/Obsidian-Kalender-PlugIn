'use strict';
// Parsing only: plugin source is never evaluated by this check.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const acorn = require('acorn'), walk = require('acorn-walk');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
const ast = acorn.parse(source, {ecmaVersion:2022, locations:true});
const localeAST = acorn.parse(fs.readFileSync(path.join(root, 'src/locales.js'),'utf8'), {ecmaVersion:2022});
function literal(n) {
  if(n.type === 'Literal') return n.value;
  if(n.type === 'ArrayExpression') return n.elements.map(literal);
  if(n.type === 'ObjectExpression') {const out=Object.create(null);for(const p of n.properties){const key=p.key.name || p.key.value;if(key in out)throw Error('Duplicate key: '+key);out[key]=literal(p.value);}return out;}
  throw Error('Not a literal: '+n.type);
}
const catalogs=literal(localeAST.body.find(n=>n.type==='ExpressionStatement' && n.expression.type==='AssignmentExpression').expression.right);
const strings=catalogs.strings, keys=Object.keys(strings.en), refs=[],dynamic=[],imports=[],dangerous=[],cancel=[];
const placeholders = s => [...s.matchAll(/\{(\d+)\}/g)].map(m=>m[1]).sort();
const name=n=>n.type==='Identifier'?n.name:n.type==='MemberExpression'?(n.property.name||n.property.value):'';
const regexNames=new Set();
walk.simple(ast,{VariableDeclarator(n){if(n.id.type==='Identifier' && n.init?.regex)regexNames.add(n.id.name);}});
let regexExecCalls=0;
walk.simple(ast,{
 CallExpression(n){const fn=name(n.callee);if(n.callee.type==='Identifier'&&fn==='require')imports.push(n.arguments[0]?.value);
  if(n.callee.type==='Identifier'&&fn==='t'){const a=n.arguments[0];if(a?.type==='Literal')refs.push({key:a.value,line:n.loc.start.line,args:n.arguments.length-1});else dynamic.push({line:n.loc.start.line,expression:source.slice(a.start,a.end)});}
  const regexExec=fn==='exec' && n.callee.type==='MemberExpression' && (n.callee.object.regex || (n.callee.object.type==='Identifier' && regexNames.has(n.callee.object.name)));
  if(regexExec)regexExecCalls++;
  else if(['eval','Function','fetch','requestUrl','exec','execSync','spawn','spawnSync','insertAdjacentHTML','setHTML'].includes(fn))dangerous.push({name:fn,line:n.loc.start.line});
  if(fn==='addEventListener' && n.arguments[0]?.value==='pointercancel')cancel.push(source.slice(n.arguments[1].start,n.arguments[1].end));
 },
 NewExpression(n){if(['Function','XMLHttpRequest','WebSocket','Worker'].includes(name(n.callee)))dangerous.push({name:name(n.callee),line:n.loc.start.line});},
 AssignmentExpression(n){if(['innerHTML','outerHTML'].includes(name(n.left)))dangerous.push({name:name(n.left),line:n.loc.start.line});}
});
const translations = Object.fromEntries(Object.entries(strings).map(([lang,dict])=>[lang,{count:Object.keys(dict).length,missing:keys.filter(k=>!(k in dict)),extra:Object.keys(dict).filter(k=>!(k in strings.en)),placeholders:keys.filter(k=>JSON.stringify(placeholders(dict[k]||''))!==JSON.stringify(placeholders(strings.en[k])))}]));
const missing=refs.filter(r=>!(r.key in strings.en));
const wrongArgs=refs.filter(r=>r.key in strings.en && placeholders(strings.en[r.key]).some(p=>Number(p)>=r.args));
const families=['month','week','day','agenda'].map(x=>'v_'+x).concat(['day','week','month','year'].map(x=>'u_'+x),['default','red','orange','yellow','green','blue','purple'].map(x=>'c_'+x),['desktop','mobile','none','all'].map(x=>'s_fullScope_'+x),['day','week','month','year'].flatMap(x=>['repeat_'+x,'repeat_'+x+'_one','repeat_'+x+'_few','repeat_'+x+'_many']));
const familyMissing=families.filter(k=>!(k in strings.en));
const css=fs.readFileSync(path.join(root,'styles.css'),'utf8');
const errors=missing.length+wrongArgs.length+familyMissing.length+dangerous.length+Object.values(translations).reduce((sum,x)=>sum+x.missing.length+x.extra.length+x.placeholders.length,0);
const hashes={};for(const f of ['main.js','styles.css','manifest.json','LICENSE','src/main.js','src/core.js','src/locales.js','src/draft-modal.js'])hashes[f]=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex');
const report={date:new Date().toISOString(),method:'Static AST parsing without importing or executing plugin code',parser:{name:'acorn',version:acorn.version,ecmaVersion:2022},syntax:'PASS',imports,translations,staticTranslationCalls:refs.length,missing,wrongArgs,familyMissing,dynamicTranslationCalls:dynamic,dangerousCalls:dangerous,regexExecCalls,pointerCancelHandlers:cancel,cssRemoteResources:/@import|url\s*\(/i.test(css),sha256:hashes,passed:errors===0};
fs.writeFileSync(path.join(root,'tests/static-results.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:report.passed,imports,translations,missing,wrongArgs,familyMissing,dangerous,pointerCancelHandlers:cancel},null,2));
if(errors)process.exitCode=1;
