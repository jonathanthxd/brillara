"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TestPage() {
  const [advisors, setAdvisors] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAdvisors() {
      const { data, error } = await supabase.from("advisors").select("*");
      if (error) {
        setError(error.message);
      } else {
        setAdvisors(data || []);
      }
      setLoading(false);
    }
    fetchAdvisors();
  }, []);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <h1 className="font-heading text-3xl font-bold">Test Supabase</h1>
      {loading && <p className="mt-4">Cargando...</p>}
      {error && <p className="mt-4 text-destructive">Error: {error}</p>}
      {!loading && !error && (
        <div className="mt-4 space-y-2">
          <p>Asesores encontrados: {advisors.length}</p>
          {advisors.map((a) => (
            <p key={a.id} className="text-sm">
              {a.code} — {a.name} — {a.password}
            </p>
          ))}
        </div>
      )}
    </main>
  );
}
