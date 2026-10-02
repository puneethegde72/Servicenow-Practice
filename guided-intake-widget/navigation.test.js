const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const code = fs.readFileSync(require('path').join(__dirname, 'client-script.js'), 'utf8');
let initialized, change;
const form = {
  values: {},
  visible: {},
  mandatory: {},
  isVisible(n) { return this.visible[n] !== false; },
  isMandatory(n) { return !!this.mandatory[n]; },
  setVisible(n,v) { this.visible[n]=v; },
  setMandatory(n,v) { this.mandatory[n]=v; },
  getValue(n) { return this.values[n] || ''; },
  showFieldMsg() {}
};
const pages = Array.from({length:4},(_,i)=>({
 key:'page'+i, title:'Page '+i, variables:[
  {name:'start'+i,marker:'start'},
  {name:'required'+i,label:'Required '+i,marker:'field',mandatory:true},
  {name:'optional'+i,label:'Optional '+i,marker:'field',mandatory:false},
  {name:'end'+i,marker:'end'}
 ]
}));
pages.forEach((p,i)=>form.mandatory['required'+i]=true);
const sandbox={api:{},Array};
vm.runInNewContext(code,sandbox);
const c={data:{pages}};
sandbox.api.controller.call(c,{$on(n,cb){if(n==='spModel.gForm.initialized')initialized=cb;else change=cb;}},{$on() {},$evalAsync(cb){cb();}},cb=>cb());
initialized({},form);
assert.equal(c.progress(),0);
form.values.required0='yes';
assert.equal(c.pageProgress(0),50);
assert.equal(c.pageReady(),true);
c.next();
assert.equal(c.index,1);
assert.equal(c.progress(),25);
assert.equal(c.pageReady(),false);
form.values.required1='yes';
assert.equal(c.pageReady(),true);
c.next();
assert.equal(c.progress(),50);
c.previous();
c.previous();
form.values.required0='';
assert.equal(c.progress(),25);
assert.equal(c.pageReady(),false);
form.values.required0='yes';
c.selectPage(2);
form.values.required2='yes';
c.next();
form.values.required3='yes';
c.reviewAll();
assert.equal(c.showingAll,true);
assert.equal(c.progress(),100);
let submitted=false;
c.invokeCatalogSubmit=()=>{submitted=true;};
c.submitFinal();
assert.equal(submitted,true);
console.log('Navigation, page progress, mandatory gating, regressions: passed');
