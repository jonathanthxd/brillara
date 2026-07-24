import { supabase } from "@/lib/supabase";

export interface TicketData {
  ticket_number: string;
  client_name: string;
  phone: string;
  city: string;
  location: string;
  description: string;
  photos: string[];
  status?: string;
  advisor_id?: string | null;
  messages?: any[];
}

export async function createTicket(data: TicketData) {
  const { data: result, error } = await supabase
    .from("tickets")
    .insert([data])
    .select()
    .single();
  
  if (error) throw error;
  return result;
}

export async function getAllTickets() {
  const { data, error } = await supabase
    .from("tickets")
    .select("*, advisors(code, name)")
    .order("created_at", { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function getTicketById(id: string) {
  const { data, error } = await supabase
    .from("tickets")
    .select("*, advisors(code, name)")
    .eq("id", id)
    .single();
  
  if (error) return null;
  return data;
}

export async function getTicketsByAdvisor(advisorId: string) {
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("advisor_id", advisorId)
    .order("created_at", { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function updateTicketStatus(id: string, status: string) {
  const { data, error } = await supabase
    .from("tickets")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function assignTicketToAdvisor(id: string, advisorId: string) {
  const { data, error } = await supabase
    .from("tickets")
    .update({ advisor_id: advisorId, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function addMessageToTicket(id: string, message: any) {
  const ticket = await getTicketById(id);
  if (!ticket) return null;
  
  const messages = [...(ticket.messages || []), message];
  
  const { data, error } = await supabase
    .from("tickets")
    .update({ messages, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
