"use client";
import { useEffect, useState } from "react";
import { getBusinessAccountId, getTenantId } from "@/lib/auth";
import { assetImageUrl, getBusinessSettings, type BusinessSettings } from "@/lib/api/business-settings";
const pending = new Map<string, Promise<BusinessSettings>>();
export function BusinessAvatar({ initials = "US", className = "h-10 w-10" }: {initials?: string; className?: string}) {
 const [image, setImage] = useState<{key:string;url:string} | null>(null);
 const [key, setKey] = useState("");
 useEffect(() => {
  let generation = 0;
  const load = () => {
   const seq = ++generation; const id = getBusinessAccountId(); const tenant = getTenantId();
   const context = `${tenant}:${id}`; setKey(context); setImage(null);
   if (!id || !tenant) return;
   let request = pending.get(context);
   if (!request) { request = getBusinessSettings(id, tenant); pending.set(context, request); }
   const currentRequest = request;
   request.then(data => {if(seq === generation && data.logo_url) setImage({key:context,url:assetImageUrl(data.logo_url)});}).catch(() => {}).finally(() => {if(pending.get(context) === currentRequest) pending.delete(context);});
  };
  load(); window.addEventListener("business-context-changed", load); window.addEventListener("business-profile-updated", load);
  return () => {generation++; window.removeEventListener("business-context-changed", load);window.removeEventListener("business-profile-updated", load);};
 }, []);
 return <span className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-white text-xs font-bold text-purple-700 ${className}`}>
  {image && image.key === key ? <img src={image.url} alt="Selected business logo" className="h-full w-full object-contain p-1" onError={() => setImage(null)} /> : initials}
 </span>;
}
