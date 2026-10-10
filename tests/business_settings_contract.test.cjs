const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const ts=require('../autonomous-marketing-frontend-main/node_modules/typescript');
function load(file, imports={}, globals={}) {
 const code=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../autonomous-marketing-frontend-main',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};vm.runInNewContext(code,{exports,require:name=>imports[name]||{},Error,Event,process,...globals});return exports;
}
test('mobile normalization accepts India local digits and rejects blank or incomplete numbers',()=>{
 const {normalizePhone}=load('lib/phone.ts');assert.equal(normalizePhone('98765 43210','India'),'+919876543210');assert.equal(normalizePhone('+44 7911 123456','UK'),'+447911123456');
 for(const value of ['', '123', '+0123456789'])assert.throws(()=>normalizePhone(value,'India'),/valid mobile/);
 assert.throws(()=>normalizePhone('9876543210','UK'),/country code/);
});
test('settings save pins business and tenant and notifies after success',async()=>{
 const calls=[];const events=[];
 const api=load('lib/api/business-settings.ts',{'@/lib/auth':{getBusinessAccountId:()=>7,getTenantId:()=> 'tenant-7'},'./client':{apiRequest:async(url,options)=>{calls.push([url,options]);return {logo_url:'/logo'};}}},{window:{dispatchEvent:e=>events.push(e.type)}});
 await api.saveBusinessSettings(7,'tenant-7',{business:{business_name:'Shop'}});
 assert.equal(calls[0][0],'/business/settings?business_account_id=7');assert.equal(calls[0][1].headers['X-Tenant-ID'],'tenant-7');assert.deepEqual(events,['business-profile-updated']);
 await assert.rejects(api.saveBusinessSettings(8,'tenant-7',{}),/selection changed/);assert.equal(calls.length,1);
});
test('business switch during save cannot update current profile UI',async()=>{
 let id=7;const events=[];
 const api=load('lib/api/business-settings.ts',{'@/lib/auth':{getBusinessAccountId:()=>id,getTenantId:()=> 'tenant-7'},'./client':{apiRequest:async()=>{id=8;return {};}}},{window:{dispatchEvent:e=>events.push(e.type)}});
 await assert.rejects(api.saveBusinessSettings(7,'tenant-7',{}),/previous business/);assert.deepEqual(events,[]);
});
