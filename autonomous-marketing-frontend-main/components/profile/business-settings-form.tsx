"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getBusinessAccountId, getTenantId } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";
import { uploadCatalogueAsset, type AudienceResponse } from "@/lib/api/onboarding";
import { assetImageUrl, getBusinessSettings, saveBusinessSettings, type BusinessSettings, type BusinessSettingsInput } from "@/lib/api/business-settings";
const ageOptions = ["18-24", "25-34", "35-44", "45-54", "55+", "All Ages"];
const split = (value: string) => value.split(/[,\n]/).map(x=>x.trim()).filter(Boolean);
const inputClass = "mt-2 h-11 w-full rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:opacity-60";
function Field({label,value,onChange,required=false,type="text"}:{label:string;value:string;onChange:(v:string)=>void;required?:boolean;type?:string}) {
 return <label className="block text-sm font-medium">{label}{required && <span className="text-red-600"> *</span>}<input aria-label={label} type={type} required={required} value={value} onChange={e=>onChange(e.target.value)} className={inputClass}/></label>;
}
function ListField({label,value,onChange}:{label:string;value:string[];onChange:(v:string[])=>void}) {
 const [text,setText]=useState(value.join(", "));const ref=useRef<HTMLInputElement>(null);const serialized=value.join(", ");
 useEffect(()=>{if(document.activeElement!==ref.current)setText(serialized);},[serialized]);
 return <label className="block text-sm font-medium">{label}<input ref={ref} aria-label={label} value={text} onChange={e=>{setText(e.target.value);onChange(split(e.target.value));}} className={inputClass}/></label>;
}
function draft(data: BusinessSettings, audience?: AudienceResponse | null): BusinessSettingsInput {
 const business = data.business || {business_name:"", category:"",description:"",website:null,country:"India",city:null,pincode:null};
 const brand = data.brand || {brand_name:business.business_name,industry:business.category,tone:"",logo_position:"upper_right",contact_position:"lower_right",phone:"",logo_asset_id:null};
 let selected = audience ?? data.audiences[0] ?? null;
 if (selected && !selected.age_groups?.length) {
  const legacy = selected.description?.match(/(?:^| \| )Age: ([^|]+)/)?.[1];
  selected = {...selected,age_groups:legacy ? split(legacy) : []};
 }
 if (selected) selected = {...selected,description:(selected.description || "").split(" | ").filter(part=>!part.startsWith("Age: ") && !part.startsWith("Gender: ")).join(" | ")};
 return {business:{...business},brand:{...brand},audience_id:selected?.id || null,audience:selected ? {...selected} : null,preferences:data.preferences ? {...data.preferences} : {id:0,tenant_id:data.business?.tenant_id || "",business_account_id:data.business?.business_account_id || 0,primary_goal:"Increase sales",secondary_goals:[],content_types:[],approval_mode:"human_intervention",timezone:Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",preferred_posting_time:"10:00",posting_frequency:"daily"}};
}
export function BusinessSettingsForm() {
 const [context,setContext] = useState<{id:number;tenant:string}|null>(null);
 const [saved,setSaved] = useState<BusinessSettings|null>(null);
 const [form,setForm] = useState<BusinessSettingsInput|null>(null);
 const [loading,setLoading] = useState(true); const [saving,setSaving] = useState(false);
 const [error,setError] = useState(""); const [message,setMessage] = useState("");
 const [logo,setLogo] = useState<File|null>(null); const [preview,setPreview] = useState<string|null>(null);
 const epoch = useRef(0); const logoInput = useRef<HTMLInputElement>(null);
 useEffect(()=> {
  const load = async () => {
   const seq=++epoch.current;const id=getBusinessAccountId();const tenant=getTenantId();
   setForm(null);setSaved(null);setLogo(null);setMessage("");setError("");setContext(id && tenant ? {id,tenant}:null);setLoading(true);
   if(!id || !tenant) {setError("Select a business before editing its details.");setLoading(false);return;}
   try {const data=await getBusinessSettings(id,tenant);if(seq!==epoch.current)return;setSaved(data);setForm(draft(data));}
   catch(err) {if(seq===epoch.current)setError(err instanceof Error?err.message:"Unable to load business details.");}
   finally {if(seq===epoch.current)setLoading(false);}
  };
  void load(); window.addEventListener("business-context-changed",load);
  return ()=>{epoch.current++;window.removeEventListener("business-context-changed",load);};
 },[]);
 useEffect(()=>{if(!logo){setPreview(null);return;}const url=URL.createObjectURL(logo);setPreview(url);return()=>URL.revokeObjectURL(url);},[logo]);
 function business(key: keyof BusinessSettingsInput["business"],value:string) {setForm(prev=>prev?{...prev,business:{...prev.business,[key]:value}}:prev);setMessage("");}
 function brand(key: keyof BusinessSettingsInput["brand"],value:string) {setForm(prev=>prev?{...prev,brand:{...prev.brand,[key]:value}}:prev);setMessage("");}
 function audience(key:keyof AudienceResponse,value:unknown) {setForm(prev=>prev && prev.audience?{...prev,audience:{...prev.audience,[key]:value}}:prev);setMessage("");}
 async function submit(event:React.FormEvent) {
  event.preventDefault();if(!form || !context || saving)return;
  const seq=epoch.current;setSaving(true);setError("");setMessage("");
  try {
   const phone=normalizePhone(form.brand.phone || "",form.business.country);
   for(const value of [form.business.business_name,form.business.category,form.business.description,form.business.country,form.brand.tone]) if(!value.trim())throw new Error("Business name, industry, description, country and brand tone are required.");
   for(const color of [form.brand.primary_color,form.brand.secondary_color,form.brand.accent_color])if(color && !/^#[0-9a-f]{6}$/i.test(color))throw new Error("Brand colors must use six-digit hex values, e.g. #7c3aed.");
   const ensure=()=>{if(getBusinessAccountId()!==context.id || getTenantId()!==context.tenant || seq!==epoch.current)throw new Error("Business selection changed. Reload the form.");};
   ensure();let logoId=form.brand.logo_asset_id;
   if(logo){const asset=await uploadCatalogueAsset(context.id,context.tenant,logo,"logo");ensure();logoId=asset.id;}
   const website=form.business.website?.trim() || null;
   const payload={...form,business:{...form.business,business_name:form.business.business_name.trim(),category:form.business.category.trim(),description:form.business.description.trim(),country:form.business.country.trim(),website},brand:{...form.brand,brand_name:form.business.business_name.trim(),brand_description:form.business.description.trim(),industry:form.business.category.trim(),website,phone,logo_asset_id:logoId}};
   const result=await saveBusinessSettings(context.id,context.tenant,payload);ensure();setSaved(result);setForm(draft(result,result.audiences.find(a=>a.id===form.audience_id)));setLogo(null);if(logoInput.current)logoInput.current.value="";setMessage("Business details saved successfully.");
  } catch(err){if(seq===epoch.current)setError(err instanceof Error?err.message:"Unable to save. Please retry.");}
  finally{setSaving(false);}
 }
 if(loading)return <p role="status" className="p-6">Loading business details…</p>;
 if(!form)return <div role="alert" className="rounded-xl border border-red-200 p-5 text-red-700">{error} <Link href="/onboarding" className="underline">Complete business setup</Link></div>;
 const logoUrl=preview || (saved?.logo_url ? assetImageUrl(saved.logo_url):null);
 return <form onSubmit={submit} className="space-y-6">
  <div><h2 className="text-xl font-bold">Business & brand settings</h2><p className="mt-1 text-sm text-muted-foreground">Edit the selected business details used for your marketing. Login credentials remain separate.</p></div>
  {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
  {message && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p>}
  {!saved?.brand?.phone && <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Add your mobile number to complete your business profile.</p>}
  <fieldset disabled={saving} className="space-y-6 disabled:opacity-70">
   <section className="rounded-2xl border border-border bg-card p-5 sm:p-6"><h3 className="font-semibold">Business logo</h3><div className="mt-4 flex flex-wrap items-center gap-5">
    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border bg-white">{logoUrl ? <img src={logoUrl} alt="Business logo preview" className="h-full w-full object-contain p-2"/>:<span className="text-sm text-muted-foreground">No logo</span>}</div>
    <div><label className="ui-button-secondary inline-flex cursor-pointer items-center border px-4 py-2 text-sm" htmlFor="business-logo">Change business logo</label><input ref={logoInput} id="business-logo" type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={e=>{const file=e.target.files?.[0];if(!file)return;if(!["image/png","image/jpeg","image/webp"].includes(file.type) || file.size>10*1024*1024){setError("Choose a PNG, JPEG or WebP image under 10 MB.");e.target.value="";return;}setError("");setMessage("");setLogo(file);}}/><p className="mt-2 text-xs text-muted-foreground">PNG, JPEG or WebP · Up to 10 MB. Save to update your profile logo.</p></div>
   </div></section>
   <section className="rounded-2xl border border-border bg-card p-5 sm:p-6"><h3 className="mb-4 font-semibold">Business details</h3><div className="grid gap-4 sm:grid-cols-2">
    <Field label="Business name" value={form.business.business_name} required onChange={v=>business("business_name",v)}/><Field label="Industry" value={form.business.category} required onChange={v=>business("category",v)}/>
    <Field label="Website (optional)" type="url" value={form.business.website||""} onChange={v=>business("website",v)}/><Field label="Mobile number" type="tel" value={form.brand.phone||""} required onChange={v=>brand("phone",v)}/>
    <Field label="Country" value={form.business.country} required onChange={v=>business("country",v)}/><Field label="City" value={form.business.city||""} onChange={v=>business("city",v)}/>
    <Field label="PIN / postal code" value={form.business.pincode||""} onChange={v=>business("pincode",v)}/><Field label="Address" value={form.brand.address||""} onChange={v=>brand("address",v)}/>
    <Field label="Business contact email" type="email" value={form.brand.email||""} onChange={v=>brand("email",v)}/><Field label="WhatsApp number (optional)" type="tel" value={form.brand.whatsapp||""} onChange={v=>brand("whatsapp",v)}/>
   </div><p className="mt-3 text-xs text-muted-foreground">Use a country code for mobile numbers. Indian 10-digit numbers are saved with +91.</p><label className="mt-4 block text-sm font-medium">Business description *<textarea required aria-label="Business description" value={form.business.description} onChange={e=>business("description",e.target.value)} className={`${inputClass} min-h-24 py-3`}/></label></section>
   <section className="rounded-2xl border border-border bg-card p-5 sm:p-6"><h3 className="mb-4 font-semibold">Brand identity</h3><div className="grid gap-4 sm:grid-cols-2"><Field label="Brand tone" required value={form.brand.tone} onChange={v=>brand("tone",v)}/><Field label="Custom voice guidelines" value={form.brand.custom_voice||""} onChange={v=>brand("custom_voice",v)}/>
    <Field label="Primary color" value={form.brand.primary_color||""} onChange={v=>brand("primary_color",v)}/><Field label="Secondary color" value={form.brand.secondary_color||""} onChange={v=>brand("secondary_color",v)}/><Field label="Accent color" value={form.brand.accent_color||""} onChange={v=>brand("accent_color",v)}/>
   </div></section>
   <section className="rounded-2xl border border-border bg-card p-5 sm:p-6"><h3 className="mb-4 font-semibold">Target audience</h3>
    {saved && saved.audiences.length>1 && <label className="mb-4 block text-sm">Audience to edit<select aria-label="Audience to edit" className={inputClass} value={form.audience_id||""} onChange={e=>{const item=saved.audiences.find(a=>a.id===Number(e.target.value));if(item)setForm({...form,...{audience:draft(saved,item).audience,audience_id:item.id}});}}>{saved.audiences.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>}
    {form.audience ? <><Field label="Audience name" required value={form.audience.name} onChange={v=>audience("name",v)}/><label className="mt-4 block text-sm">Audience description<textarea aria-label="Audience description" className={`${inputClass} min-h-20 py-3`} value={form.audience.description||""} onChange={e=>audience("description",e.target.value)}/></label>
     <div className="mt-4"><p className="mb-2 text-sm font-medium">Age groups</p><div className="flex flex-wrap gap-3">{ageOptions.map(age=><label key={age} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.audience!.age_groups.includes(age)} onChange={e=>audience("age_groups",e.target.checked?(age==="All Ages"?[age]:[...form.audience!.age_groups.filter(x=>x!=="All Ages"),age]):form.audience!.age_groups.filter(x=>x!==age))}/>{age}</label>)}</div></div>
     <div className="mt-4 grid gap-4 sm:grid-cols-2"><ListField label="Genders (comma separated)" value={form.audience.genders} onChange={v=>audience("genders",v)}/><ListField label="Target locations (comma separated)" value={form.audience.locations} onChange={v=>audience("locations",v)}/></div>
    </> : <button type="button" className="ui-button-secondary border px-4 py-2 text-sm" onClick={()=>setForm({...form,audience:{id:0,tenant_id:context!.tenant,business_account_id:context!.id,name:`${form.business.business_name} Audience`,description:"",age_groups:[],genders:[],locations:[],languages:[],interests:[],pain_points:[],needs:[]}})}>Add audience details</button>}
   </section>
   {form.preferences && <section className="rounded-2xl border border-border bg-card p-5 sm:p-6"><h3 className="mb-4 font-semibold">Marketing preferences</h3><div className="grid gap-4 sm:grid-cols-2">
    <Field label="Primary goal" required value={form.preferences.primary_goal} onChange={v=>setForm({...form,preferences:{...form.preferences!,primary_goal:v}})}/><ListField label="Other goals (comma separated)" value={form.preferences.secondary_goals} onChange={v=>setForm({...form,preferences:{...form.preferences!,secondary_goals:v}})}/>
    <Field label="Timezone" required value={form.preferences.timezone} onChange={v=>setForm({...form,preferences:{...form.preferences!,timezone:v}})}/><Field label="Posting time" type="time" value={form.preferences.preferred_posting_time} required onChange={v=>setForm({...form,preferences:{...form.preferences!,preferred_posting_time:v}})}/>
    <label className="text-sm">Approval mode<select aria-label="Approval mode" className={inputClass} value={form.preferences.approval_mode} onChange={e=>setForm({...form,preferences:{...form.preferences!,approval_mode:e.target.value as "autonomous"|"human_intervention"}})}><option value="human_intervention">Require approval</option><option value="autonomous">Autonomous publishing</option></select></label>
    <label className="text-sm">Posting frequency<select aria-label="Posting frequency" className={inputClass} value={form.preferences.posting_frequency} onChange={e=>setForm({...form,preferences:{...form.preferences!,posting_frequency:e.target.value as typeof form.preferences.posting_frequency}})}><option value="daily">Daily</option><option value="weekdays">Weekdays</option><option value="three_times_per_week">Three times per week</option>{form.preferences.posting_frequency_config != null && <option value="custom">Existing custom schedule</option>}</select></label>
   </div></section>}
   <div className="flex flex-wrap gap-3"><button type="submit" className="ui-button-primary px-6 py-3 text-sm font-semibold">{saving?"Saving…":"Save business details"}</button><button type="button" className="ui-button-secondary border px-5 py-3 text-sm" onClick={()=>{if(saved)setForm(draft(saved,saved.audiences.find(a=>a.id===form.audience_id)));setLogo(null);if(logoInput.current)logoInput.current.value="";setError("");setMessage("");}}>Cancel changes</button><Link href="/catalogue" className="px-3 py-3 text-sm text-purple-700 underline">Manage catalogue photos</Link><Link href="/connections" className="px-3 py-3 text-sm text-purple-700 underline">Manage connected accounts</Link></div>
  </fieldset>
 </form>;
}
