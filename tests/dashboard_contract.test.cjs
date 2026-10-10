const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('../autonomous-marketing-frontend-main/node_modules/typescript');
const root = path.resolve(__dirname, '../autonomous-marketing-frontend-main');
function load(file, imports = {}, globals = {}) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  const vm = require('node:vm');
  vm.runInNewContext(code, { exports, require: name => imports[name] || {}, Headers, Response, URLSearchParams, Error, console, process, ...globals });
  return exports;
}
const campaigns = load('lib/api/campaigns.ts');
const analytics = load('lib/api/analytics.ts');
const summary = load('lib/dashboard-summary.ts');

test('Campaign summary retains zero and counts only published posts', () => {
  assert.equal(summary.campaignPublishingSummary([], 'autonomous').progress, null);
  const result = summary.campaignPublishingSummary([{publish_status:'failed'}, {publish_status:'pending'}, {publish_status:'published'}], 'autonomous');
  assert.equal(result.published, 1);
  assert.equal(result.progress, 33);
  assert.equal(summary.campaignPublishingSummary([{publish_status:'pending'}], 'autonomous').progress, 0);
});

test('Next scheduled post uses real future eligible dates, not a next AI run estimate', () => {
  const posts = [
    {publish_status:'pending',review_status:'rejected',scheduled_for:'2030-01-02T08:00:00Z'},
    {publish_status:'pending',review_status:'pending',scheduled_for:'2030-01-02T10:00:00Z'},
    {publish_status:'pending',review_status:'approved',scheduled_for:'2030-01-03T10:00:00Z'},
    {publish_status:'published',review_status:'approved',scheduled_for:'2030-01-02T09:00:00Z'},
    {publish_status:'pending',review_status:'approved',scheduled_for:'2020-01-01T09:00:00Z'},
  ];
  const now = Date.parse('2030-01-01T00:00:00Z');
  assert.equal(summary.campaignPublishingSummary(posts,'autonomous',now).nextScheduledFor, posts[1].scheduled_for);
  assert.equal(summary.campaignPublishingSummary(posts,'human_intervention',now).nextScheduledFor, posts[2].scheduled_for);
});

test('Google performance query keeps business, date range and location and rejects stale business', async () => {
  let selected=7; const calls=[];
  const module=load('lib/api/analytics.ts',{'@/lib/auth':{getBusinessAccountId:()=>selected,getTenantId:()=> 't7'},
    '@/lib/api/client':{apiRequest:async(url,options)=>{calls.push([url,options]);return {metrics:{CALL_CLICKS:0}};}}});
  const result=await module.getGooglePerformance('2026-10-01','2026-10-02','locations/7');
  assert.equal(result.metrics.CALL_CLICKS,0);
  const params=new URL('https://example.test'+calls[0][0]).searchParams;
  assert.equal(params.get('business_account_id'),'7');
  assert.equal(params.get('start_date'),'2026-10-01');
  assert.equal(params.get('location_name'),'locations/7');
  assert.equal(calls[0][1].headers['X-Tenant-ID'],'t7');
  const stale=load('lib/api/analytics.ts',{'@/lib/auth':{getBusinessAccountId:()=>selected,getTenantId:()=> 't7'},
    '@/lib/api/client':{apiRequest:async()=>{selected=8;return {};}}});
  await assert.rejects(stale.getGooglePerformance('2026-10-01','2026-10-02'),/selection changed/);
});

test('Approval and publishing status are independent', () => {
  assert.equal(campaigns.postDisplayStatus({review_status:'approved',publish_status:'pending',scheduled_for:null}), 'Approved');
  assert.equal(campaigns.postDisplayStatus({review_status:'approved',publish_status:'pending',scheduled_for:'2026-10-08'}), 'Scheduled');
  for (const [status,label] of [['published','Published'],['failed','Failed'],['processing','Processing'],['reconciliation_required','Reconciliation required']]) {
    assert.equal(campaigns.postDisplayStatus({review_status:'approved',publish_status:status}),label);
  }
  assert.equal(campaigns.postDisplayStatus({review_status:'pending',publish_status:'pending',scheduled_for:'2026-10-08'},'autonomous'),'Scheduled');
  assert.equal(campaigns.postDisplayStatus({review_status:'pending',publish_status:'pending'},'human_intervention'),'Pending approval');
});

test('Zero is retained; unknown and partial totals are unavailable', () => {
  assert.equal(analytics.aggregateCampaignMetrics([{total_reach:0,total_clicks:0,engagement_rate:0}]).totalReach,0);
  assert.equal(analytics.aggregateCampaignMetrics([null]).totalReach,null);
  assert.equal(analytics.aggregateCampaignMetrics([]).totalClicks,null);
  assert.equal(analytics.aggregateCampaignMetrics([{total_reach:10},null]).totalReach,null);
  assert.equal(analytics.aggregateCampaignMetrics([{total_reach:0,engagement_rate:null}]).engagementRate,'Data unavailable');
});

test('API sends selected tenant rather than overriding explicit context', async () => {
  const captured=[];
  const client=load('lib/api/client.ts',{'@/lib/auth':{getAuthorizationHeader:()=>null,getTenantId:()=> 'tenant-two'}},
    {fetch:async (url,options)=>{ captured.push(options.headers); return new Response('{}',{headers:{'content-type':'application/json'}}); }});
  await client.apiRequest('/campaigns');
  assert.equal(captured[0].get('X-Tenant-ID'),'tenant-two');
  await client.apiRequest('/campaigns',{headers:{'X-Tenant-ID':'explicit'}});
  assert.equal(captured[1].get('X-Tenant-ID'),'explicit');
});

test('Business switch emits reload event and stores selected ID', () => {
  const store=new Map(); const events=[];
  const auth=load('lib/auth.ts',{}, { window:{dispatchEvent:event=>events.push(event.type)},Event,
    localStorage:{getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value),removeItem:key=>store.delete(key)}});
  auth.saveTenantContext('tenant-two',7);
  assert.equal(auth.getBusinessAccountId(),7);
  assert.equal(auth.getTenantId(),'tenant-two');
  assert.deepEqual(events,['business-context-changed']);
});

test('Dashboard uses selected business, typed status, and no sample metric fallbacks', () => {
  const source=fs.readFileSync(path.join(root,'components/dashboard/dashboard-page.tsx'),'utf8');
  assert.ok(!source.includes('business_account_id: 1'));
  assert.ok(!source.includes('(post as any)'));
  assert.ok(!source.includes('128.4K'));
  assert.ok(!source.includes('3,842'));
  assert.ok(source.includes('post.publish_status === "published"'));
});

test('Google Business calls follow selected business and preserve location query', async () => {
  let selected=2;const calls=[];
  const google=load('lib/api/google-business.ts',{'../auth':{getBusinessAccountId:()=>selected,getTenantId:()=> 't1'},'./client':{apiRequest:async(path,options)=>{calls.push([path,options]);return {};}}});
  await google.getGoogleReviews('accounts/1/locations/2');
  assert.equal(calls[0][0],'/google-business/reviews?location_name=accounts%2F1%2Flocations%2F2&business_account_id=2');
  selected=7;
  await google.sendReviewReply({review_id:5,reply_text:'Thanks'});
  assert.equal(calls[1][0],'/google-business/reviews/send-reply?business_account_id=7');
  assert.equal(JSON.parse(calls[1][1].body).review_id,5);
  selected=null;
  await assert.rejects(google.getGoogleBusinessStatus(),/Select a business/);
  assert.equal(calls.length,2);
});

test('Checkout uses minor amount and real signed response and waits for verification', async () => {
  const calls=[];const store=new Map();let options;
  const receipt={razorpay_order_id:'order_123',razorpay_payment_id:'pay_123',razorpay_signature:'signed'};
  class Checkout { constructor(input){options=input;} on(){} close(){} open(){void options.handler(receipt);} }
  const helper=load('lib/api/onboarding.ts',{'@/lib/auth':{getTenantId:()=> 't1'},'@/lib/api/client':{apiRequest:async(path,opts)=>{
    calls.push([path,opts]);
    if(path.endsWith('my-subscription'))return {status:'active',plan:{plan_code:'free'}};
    if(path.endsWith('create-order'))return {order_id:'order_123',amount_minor:99900,currency:'INR',checkout_key:'rzp_test_key'};
    return {status:'success'};
  }}},{window:{Razorpay:Checkout},sessionStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)}});
  await helper.checkoutSubscription('premium');
  assert.equal(options.amount,99900);assert.equal(options.key,'rzp_test_key');
  const verify=calls.find(([path])=>path.endsWith('verify-payment'));
  assert.deepEqual(JSON.parse(verify[1].body),{order_id:'order_123',payment_id:'pay_123',signature:'signed',provider:'razorpay'});
  assert.equal(verify[1].headers['X-Tenant-ID'],'t1');assert.equal(store.size,0);
});

test('Checkout cancellation cannot activate a subscription', async () => {
  const calls=[];let options;
  class Checkout {constructor(input){options=input;}on(){}open(){options.modal.ondismiss();}close(){} }
  const helper=load('lib/api/onboarding.ts',{'@/lib/auth':{getTenantId:()=> 't1'},'@/lib/api/client':{apiRequest:async(path)=>{
    calls.push(path);return path.endsWith('create-order')?{order_id:'order_1',amount_minor:99900,currency:'INR',checkout_key:'key'}:{status:'active',plan:{plan_code:'free'}};
  }}},{window:{Razorpay:Checkout},sessionStorage:{getItem:()=>null}});
  await assert.rejects(helper.checkoutSubscription('premium'),/cancelled/);
  assert.ok(!calls.some(path=>path.endsWith('verify-payment')));
});

test('Failed verification retry verifies the same receipt without a second charge', async () => {
  const calls=[];const store=new Map();let options;let rejectVerification=true;
  class Checkout {constructor(input){options=input;}on(){}open(){void options.handler({razorpay_order_id:'order_1',razorpay_payment_id:'pay_1',razorpay_signature:'sig'});}close(){} }
  const helper=load('lib/api/onboarding.ts',{'@/lib/auth':{getTenantId:()=> 't1'},'@/lib/api/client':{apiRequest:async(path)=>{
    calls.push(path);
    if(path.endsWith('my-subscription'))return {status:'active',plan:{plan_code:'free'}};
    if(path.endsWith('create-order'))return {order_id:'order_1',amount_minor:99900,currency:'INR',checkout_key:'key'};
    if(rejectVerification)throw Error('verification unavailable');
    return {status:'success'};
  }}},{window:{Razorpay:Checkout},sessionStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)}});
  await assert.rejects(helper.checkoutSubscription('premium'),/verification unavailable/);
  assert.equal(store.size,1);rejectVerification=false;
  await helper.checkoutSubscription('premium');
  assert.equal(calls.filter(path=>path.endsWith('create-order')).length,1);
  assert.equal(calls.filter(path=>path.endsWith('verify-payment')).length,2);
});

test('Existing active paid subscription does not open checkout again', async () => {
  const helper=load('lib/api/onboarding.ts',{'@/lib/auth':{getTenantId:()=> 't1'},'@/lib/api/client':{apiRequest:async(path)=>{
    assert.ok(path.endsWith('my-subscription'));return {status:'active',plan:{plan_code:'premium'},current_period_end:'2099-01-01T00:00:00Z'};
  }}},{sessionStorage:{getItem:()=>null}});
  await helper.checkoutSubscription('premium');
});

function onboardingFixture(failStep) {
  const records=new Map();const calls=[];let bid=1,tid='t1';let fail=failStep;
  const helper=load('lib/api/onboarding.ts',{'@/lib/phone':load('lib/phone.ts'),'@/lib/auth':{getBusinessAccountId:()=>bid,getTenantId:()=>tid,saveTenantContext:(t,b)=>{tid=t;bid=b;}},'@/lib/api/client':{apiRequest:async(path,options={})=>{
    calls.push([path,options.method||'GET']);
    const base=path.split('?')[0];
    if(base==='/business-accounts')return [{id:1,tenant_id:'t1',name:'Shop',status:'active'}];
    if(base==='/assets/upload') { if(fail==='logo'){fail=null;throw Error('Logo upload failed');}return {id:'logo-id'}; }
    if((options.method||'GET')==='GET')return base==='/audiences'?(records.has(base)?[records.get(base)]:[]):records.get(base)||null;
    if(base===fail){fail=null;throw Error(`${base} failed`);}
    const body=JSON.parse(options.body);const record={id:1,...body};
    records.set(base.startsWith('/audiences/')?'/audiences':base,record);return record;
  }}},{FormData:class {append(){}}});
  const data={businessName:'Shop',industry:'Retail',description:'Products',country:'India',brandTone:'Friendly',website:'',city:'Delhi',pincode:'',targetLocations:[],targetAudience:'Families',ageGroups:[],genders:[],goals:['Sales'],logoFile:{},brandColors:{primary:'#fff'},phone:'9876543210',catalogueFiles:[]};
  return {helper,data,calls,records};
}

test('Onboarding retries saved profiles without creating duplicate audience or brand', async () => {
  const {helper,data,calls}=onboardingFixture('/marketing-preferences');
  await assert.rejects(helper.saveOnboarding(data),/marketing-preferences failed/);
  await helper.saveOnboarding(data);
  for(const path of ['/business','/audiences','/brand'])assert.equal(calls.filter(([p,m])=>p===path&&m==='POST').length,1);
});

test('Logo failure stops onboarding before brand or completion; retry succeeds', async () => {
  const {helper,data,calls}=onboardingFixture('logo');
  await assert.rejects(helper.saveOnboarding(data),/Logo upload failed/);
  assert.ok(!calls.some(([p,m])=>p==='/brand'&&m==='POST'));
  assert.ok(!calls.some(([p,m])=>p==='/marketing-preferences'&&m==='POST'));
  await helper.saveOnboarding(data);
  assert.equal(calls.filter(([p,m])=>p==='/audiences'&&m==='POST').length,1);
});

test('Platform distribution counts confirmed publications and excludes plans/failures', () => {
  const result=analytics.publishedPlatformCounts([{publications:[{platform:'instagram',status:'published',external_id:'ig1'},{platform:'facebook',status:'failed',external_id:null}]},{publications:[{platform:'linkedin',status:'processing',external_id:null}]}]);
  assert.equal(result.instagram,1);assert.equal(result.facebook,0);assert.equal(result.linkedin,0);
});

test('Google Business ignores responses for a previous business selection', async () => {
  let selected=1;let finish;
  const google=load('lib/api/google-business.ts',{'../auth':{getBusinessAccountId:()=>selected,getTenantId:()=> 't1'},'./client':{apiRequest:()=>new Promise(resolve=>{finish=resolve;})}});
  const response=google.getGoogleBusinessStatus();selected=2;finish({business_name:'Previous shop'});
  await assert.rejects(response,/Business selection changed/);
});


