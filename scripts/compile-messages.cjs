// Offline only: extract existing source copy and compile literal text for ICU MessageFormat.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root=path.resolve(__dirname,'..');
const fields=new Set(require('../i18n/displayFields.json'));
const ui={},blog={};
const seen=new Map();
const core=JSON.parse(fs.readFileSync(path.join(root,'messages/core-translations.json'),'utf8'));
function key(source){let h=2166136261;for(let i=0;i<source.length;i++)h=Math.imul(h^source.charCodeAt(i),16777619);return 'm'+(h>>>0).toString(36);}
function add(catalog,source){if(!/[a-zA-Z]/.test(source))return;const id=key(source);if(seen.has(id)&&seen.get(id)!==source)throw new Error('Message ID collision');seen.set(id,source);catalog[id]=source;}
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const files=[...walk(path.join(root,'app')),...walk(path.join(root,'components'))].filter(f=>/\.tsx?$/.test(f)&&!f.includes(path.sep+'api'+path.sep)&&!f.includes(path.sep+'lib'+path.sep));
files.push(path.join(root,'app/lib/payments/payfast.ts'));
for(const file of files){
  const sf=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);
  function visit(n,field=''){
    if(ts.isBindingElement(n)&&fields.has(n.name.getText(sf))&&n.initializer){visit(n.initializer,n.name.getText(sf));return;}
    if(ts.isCallExpression(n)&&ts.isIdentifier(n.expression)&&n.expression.text==='copy'&&n.arguments[0]&&ts.isStringLiteral(n.arguments[0]))add(ui,n.arguments[0].text);
    if(ts.isPropertyAssignment(n)){
      const name=n.name.getText(sf).replace(/['"]/g,'');
      visit(n.initializer,fields.has(name)?name:field==='routeTitles'?field:'');return;
    }
    if(ts.isVariableDeclaration(n)&&ts.isIdentifier(n.name)&&n.name.text==='routeTitles'&&n.initializer){visit(n.initializer,'routeTitles');return;}
    if(ts.isStringLiteral(n)&&(fields.has(field)||field==='routeTitles'))add(ui,n.text);
    ts.forEachChild(n,c=>visit(c,field));
  }
  if(file.endsWith('payfast.ts')) {
    const packages=sf.statements.find(n=>ts.isVariableStatement(n)&&n.declarationList.declarations.some(d=>d.name.getText(sf)==='TOPUP_PACKAGES'));
    if(packages)visit(packages);
  } else visit(sf);
}
for(const name of ['blogPostsA.ts','blogPostsB.ts']){
  const sf=ts.createSourceFile(name,fs.readFileSync(path.join(root,'app/lib',name),'utf8'),ts.ScriptTarget.Latest,true);
  function visit(n,field=''){
    if(ts.isPropertyAssignment(n)){visit(n.initializer,n.name.getText(sf).replace(/['"]/g,''));return;}
    if(ts.isStringLiteral(n)&&!['slug','date'].includes(field)&&field)add(blog,n.text);
    ts.forEachChild(n,c=>visit(c,field));
  }
  visit(sf);
}
for(const source of Object.keys(core))add(ui,source);
const escape=source=>source.startsWith('{v0, plural,')?source:source.replace(/'/g,"''").replace(/[{}<]/g,char=>`'${char}'`).replace(/'\{'(v\d+)'\}'/g,'{$1}');
fs.mkdirSync(path.join(root,'messages/blog'),{recursive:true});
for(const [dir,sources] of [['',ui],['blog/',blog]]){
  fs.writeFileSync(path.join(root,`messages/${dir}en.json`),JSON.stringify({copy:Object.fromEntries(Object.entries(sources).sort(([a],[b])=>a.localeCompare(b)).map(([key,value])=>[key,escape(value)]))},null,2)+'\n');
  for(const locale of ['ru','pt','fr','es','nl']){
    const file=path.join(root,`messages/${dir}${locale}.json`);
    const existing=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{copy:{}};
    existing.copy=Object.fromEntries(Object.entries(existing.copy).filter(([key])=>Object.hasOwn(sources,key)));
    for(const [source,translations] of Object.entries(core)) if(Object.hasOwn(sources,key(source))) existing.copy[key(source)]=escape(translations[['ru','pt','fr','es','nl'].indexOf(locale)]);
    fs.writeFileSync(file,JSON.stringify(existing,null,2)+'\n');
  }
}
fs.writeFileSync(path.join(root,'messages/sources.json'),JSON.stringify({...ui,...blog},null,2)+'\n');
console.log(`UI: ${Object.keys(ui).length}; blog: ${Object.keys(blog).length}; total: ${Object.keys({...ui,...blog}).length} messages.`);
const ready=['en'];
for(const locale of ['ru','pt','fr','es','nl']){
  if([['',ui],['blog/',blog]].every(([dir,sources])=>{
    const messages=JSON.parse(fs.readFileSync(path.join(root,`messages/${dir}${locale}.json`),'utf8')).copy;
    return Object.keys(sources).every(key=>typeof messages[key]==='string'&&messages[key].trim());
  }))ready.push(locale);
}
fs.writeFileSync(path.join(root,'messages/readiness.json'),JSON.stringify({completeLocales:ready},null,2)+'\n');
