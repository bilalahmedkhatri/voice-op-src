const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
let failed=false;
const argumentsOf=value=>[...new Set(Array.from(value.matchAll(/\{(v\d+)(?=[,}])/g),match=>match[1]))].sort();
for(const locale of ['ru','pt','fr','es','nl']){
  for(const dir of ['', 'blog/']){
    const english=JSON.parse(fs.readFileSync(path.join(root,`messages/${dir}en.json`),'utf8')).copy;
    const translated=JSON.parse(fs.readFileSync(path.join(root,`messages/${dir}${locale}.json`),'utf8')).copy;
    const missing=Object.keys(english).filter(key=>!translated[key]?.trim());
    const extra=Object.keys(translated).filter(key=>!english[key]);
    const interpolations=Object.keys(english).filter(key=>translated[key]&&(
      JSON.stringify(argumentsOf(english[key]))!==JSON.stringify(argumentsOf(translated[key])) ||
      (!english[key].startsWith('{v0, plural,')&&JSON.stringify((english[key].match(/\{v\d+\}/g)||[]).sort())!==JSON.stringify((translated[key].match(/\{v\d+\}/g)||[]).sort()))));
    console.log(`${locale} ${dir?'blog':'UI'}: ${Object.keys(english).length-missing.length}/${Object.keys(english).length}; missing=${missing.length}, extra=${extra.length}, interpolation errors=${interpolations.length}`);
    if(missing.length||extra.length||interpolations.length)failed=true;
  }
}
if(failed){console.error('Translation release gate failed. English fallback is available; incomplete locales must not be advertised as fully translated.');process.exitCode=1;}
