import { supabase } from "@/lib/supabase";

export interface Advisor {
  id: string;
  code: string;
  name: string;
  password: string;
}

export async function getAdvisorByCode(code: string): Promise<Advisor | null> {
  const { data, error } = await supabase
    .from("advisors")
    .select("*")
    .eq("code", code)
    .single();
  
  if (error || !data) return null;
  return data as Advisor;
}

export async function loginAdvisor(code: string, password: string): Promise<Advisor | null> {
  const advisor = await getAdvisorByCode(code);
  if (!advisor) return null;
  if (advisor.password !== password) return null;
  
  localStorage.setItem("brillara_advisor", JSON.stringify({
    id: advisor.id,
    code: advisor.code,
    name: advisor.name,
  }));
  
  return advisor;
}

export function getCurrentAdvisor(): { id: string; code: string; name: string } | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("brillara_advisor");
  return raw ? JSON.parse(raw) : null;
}

export function logoutAdvisor(): void {
  localStorage.removeItem("brillara_advisor");
}

export function isAdvisorLoggedIn(): boolean {
  return getCurrentAdvisor() !== null;
}
