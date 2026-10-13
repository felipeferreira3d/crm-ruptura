"use client";
import {createClient,SupabaseClient} from "@supabase/supabase-js";
let client:SupabaseClient|undefined;
export function auth(){if(!client){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;if(!url||!key)throw Error("Supabase ainda não configurado.");client=createClient(url,key)}return client}
export async function apiFetch(path:string,options:RequestInit={}){const {data}=await auth().auth.getSession();const headers=new Headers(options.headers);if(data.session)headers.set("Authorization","Bearer "+data.session.access_token);const ws=sessionStorage.getItem("crm-workspace");if(ws)headers.set("x-workspace-id",ws);return fetch(path,{...options,headers,cache:"no-store"})}
export async function api(path:string,options:RequestInit={}){const r=await apiFetch(path,options);const data=await r.json();if(!r.ok)throw Error(data.error||"Não foi possível concluir.");return data}
export const post=(path:string,value:unknown)=>api(path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(value)});
