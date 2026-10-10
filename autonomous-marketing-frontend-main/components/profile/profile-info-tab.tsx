"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getUserMeta } from "@/lib/auth";
import { BusinessAvatar } from "./business-avatar";
export function ProfileInfoTab() {
 const [user,setUser]=useState({name:"",email:""});useEffect(()=>setUser(getUserMeta()),[]);
 return <div className="space-y-6"><section className="rounded-2xl border border-border bg-card p-6">
  <h2 className="text-lg font-bold">Your account</h2><div className="mt-5 flex flex-wrap items-center gap-5"><BusinessAvatar initials={(user.name.slice(0,2)||"US").toUpperCase()} className="h-20 w-20"/><div><p className="text-lg font-semibold">{user.name||"My Account"}</p><p className="mt-1 text-sm text-muted-foreground">{user.email||"Signed-in account"}</p><Link href="/profile?tab=settings" className="mt-3 inline-block text-sm font-semibold text-purple-700 underline">Change business logo</Link></div></div>
  <p className="mt-5 text-sm text-muted-foreground">Your profile image uses the selected business logo. Edit your business mobile number, address, branding and audience in Business settings.</p>
  <Link href="/profile?tab=settings" className="ui-button-primary mt-5 inline-flex px-5 py-3 text-sm font-semibold">Edit business details</Link>
 </section></div>;
}
