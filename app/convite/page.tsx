"use client";
import {useEffect,useState} from "react";
export default function Invite(){const [error,setError]=useState("");useEffect(()=>{const token=location.hash.slice(1);if(!/^[a-f0-9]{64}$/.test(token)){setError("Este convite é inválido.");return}sessionStorage.setItem("crm-invite",token);location.replace("/")},[]);return <main className="auth-card"><h1>{error||"Preparando seu convite…"}</h1><a href="/">Voltar para o CRM</a></main>}
