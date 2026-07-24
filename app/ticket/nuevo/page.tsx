"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createTicket } from "@/services/supabase-tickets";

export default function NewTicketPage() {
  const router = useRouter();
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("brillara_name");
    if (saved) setClientName(saved);
  }, []);

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function getLocation() {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
      },
      () => {
        alert("No se pudo obtener tu ubicación. Puedes escribirla manualmente.");
      }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone || !city || !description) return;
    
    setIsSubmitting(true);
    
    const ticketNumber = "TKT-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    
    try {
      const ticket = await createTicket({
        ticket_number: ticketNumber,
        client_name: clientName,
        phone,
        city,
        location: location || "No especificada",
        description,
        photos,
        status: "nuevo",
        advisor_id: null,
        messages: [],
      });
      
      router.push(`/ticket/${ticket.id}`);
    } catch (err) {
      alert("Error al crear el ticket. Intenta de nuevo.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col px-6 py-12">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8 text-center">
          <span className="mb-2 inline-block text-xs font-medium uppercase tracking-widest text-primary">
            Paso 1 de 2
          </span>
          <h1 className="font-heading text-4xl font-bold text-foreground md:text-5xl">
            Iniciar Negociación
          </h1>
          <p className="mt-2 text-muted-foreground">
            Describe tu material y adjunta fotos para que nuestro equipo evalúe tu caso.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-heading text-xl font-semibold text-foreground">Tus datos</h2>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Nombre</label>
                <input type="text" value={clientName} readOnly className="h-12 w-full rounded-xl border border-input bg-muted px-4 text-foreground opacity-70" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Teléfono *</label>
                <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(323) 555-0199" className="h-12 w-full rounded-xl border border-input bg-background px-4 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Ciudad *</label>
                <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} placeholder="Los Ángeles" className="h-12 w-full rounded-xl border border-input bg-background px-4 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Ubicación aproximada</label>
                <div className="flex gap-2">
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Coordenadas o dirección" className="h-12 flex-1 rounded-xl border border-input bg-background px-4 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20" />
                  <button type="button" onClick={getLocation} className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent">📍</button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-heading text-xl font-semibold text-foreground">Descripción del material *</h2>
            <textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe lo que deseas vender: tipo de joya, peso aproximado, kilataje, condición, etc." className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-heading text-xl font-semibold text-foreground">Fotografías</h2>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex h-12 items-center justify-center rounded-full border border-dashed border-border bg-background px-6 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary">+ Adjuntar fotos</button>

            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {photos.map((photo, i) => (
                  <div key={i} className="relative aspect-square overflow-hidden rounded-xl border border-border">
                    <img src={photo} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                    <button type="button" onClick={() => removePhoto(i)} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-xs text-white">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={isSubmitting || !phone || !city || !description} className="inline-flex h-14 w-full items-center justify-center rounded-full bg-primary px-10 text-base font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
            {isSubmitting ? "Creando ticket..." : "Crear Ticket de Negociación"}
          </button>
        </form>
      </div>
    </main>
  );
}
