"use client";

import { api, ClientApiError } from "@/lib/client-api";
import { Ticket } from "@/types/ticket";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";

interface ProfileResponse {
  registered: boolean;
  name: string | null;
}

interface CreateTicketResponse {
  ticket: Ticket;
}

const MAX_PHOTOS = 4;
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

export default function NewTicketPage() {
  const router = useRouter();
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void api<ProfileResponse>("/api/profile")
      .then((profile) => {
        if (!profile.registered || !profile.name) {
          router.replace("/");
          return;
        }
        setClientName(profile.name);
      })
      .catch(() => router.replace("/"));
  }, [router]);

  function handlePhotoUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    setError("");

    if (photos.length + files.length > MAX_PHOTOS) {
      setError(`Puedes adjuntar un máximo de ${MAX_PHOTOS} fotografías.`);
      return;
    }

    const oversized = files.find((file) => file.size > MAX_PHOTO_BYTES);
    if (oversized) {
      setError(`“${oversized.name}” supera el límite de 2 MB.`);
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => setPhotos((current) => [...current, String(reader.result)]);
      reader.readAsDataURL(file);
    });

    event.target.value = "";
  }

  function removePhoto(index: number) {
    setPhotos((current) => current.filter((_, photoIndex) => photoIndex !== index));
  }

  function getLocation() {
    if (!navigator.geolocation) {
      setError("Tu navegador no permite obtener la ubicación. Puedes escribirla manualmente.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
        setError("");
      },
      () => setError("No pudimos obtener tu ubicación. Puedes escribirla manualmente."),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const { ticket } = await api<CreateTicketResponse>("/api/tickets", {
        method: "POST",
        body: JSON.stringify({ phone, city, location, description, photos }),
      });
      router.replace(`/ticket/${ticket.id}`);
    } catch (requestError) {
      if (requestError instanceof ClientApiError && requestError.status === 401) {
        router.replace("/");
        return;
      }
      setError(requestError instanceof Error ? requestError.message : "No fue posible crear el ticket.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col px-6 py-12">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8 text-center">
          <span className="mb-2 inline-block text-xs font-medium uppercase tracking-widest text-primary">Paso 1 de 2</span>
          <h1 className="font-heading text-4xl font-bold text-foreground md:text-5xl">Iniciar negociación</h1>
          <p className="mt-2 text-muted-foreground">Describe tu material y adjunta fotos para que nuestro equipo evalúe tu caso.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <h2 className="font-heading text-xl font-semibold text-foreground">Tus datos</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="client-name">Nombre</label>
                <input id="client-name" type="text" value={clientName} readOnly className="h-12 w-full rounded-xl border border-input bg-muted px-4 text-foreground opacity-70" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="phone">Teléfono *</label>
                <input id="phone" type="tel" required value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="(323) 555-0199" autoComplete="tel" className="h-12 w-full rounded-xl border border-input bg-background px-4 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="city">Ciudad *</label>
                <input id="city" type="text" required value={city} onChange={(event) => setCity(event.target.value)} placeholder="Los Ángeles" autoComplete="address-level2" className="h-12 w-full rounded-xl border border-input bg-background px-4 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="location">Ubicación aproximada</label>
                <div className="flex gap-2">
                  <input id="location" type="text" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Coordenadas o dirección" autoComplete="street-address" className="h-12 min-w-0 flex-1 rounded-xl border border-input bg-background px-4 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20" />
                  <button type="button" onClick={getLocation} aria-label="Usar mi ubicación" className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent">📍</button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <label className="font-heading text-xl font-semibold text-foreground" htmlFor="description">Descripción del material *</label>
            <textarea id="description" required rows={4} value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2_000} placeholder="Tipo de joya, peso aproximado, kilataje, condición, etc." className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20" />
            <p className="text-right text-xs text-muted-foreground">{description.length}/2000</p>
          </div>

          <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <h2 className="font-heading text-xl font-semibold text-foreground">Fotografías</h2>
            <p className="text-sm text-muted-foreground">Hasta {MAX_PHOTOS} imágenes de máximo 2 MB cada una.</p>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handlePhotoUpload} className="sr-only" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex h-12 items-center justify-center rounded-full border border-dashed border-border bg-background px-6 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary">+ Adjuntar fotos</button>
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {photos.map((photo, index) => (
                  <div key={photo} className="relative aspect-square overflow-hidden rounded-xl border border-border">
                    <Image src={photo} alt={`Vista previa ${index + 1}`} fill unoptimized sizes="(max-width: 640px) 33vw, 25vw" className="object-cover" />
                    <button type="button" onClick={() => removePhoto(index)} aria-label={`Quitar foto ${index + 1}`} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-xs text-white">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}
          <LiquidMetalButton type="submit" disabled={isSubmitting || !clientName || !phone || !city || description.trim().length < 10} size="lg" className="w-full">
            {isSubmitting ? "Creando ticket…" : "Crear ticket de negociación"}
          </LiquidMetalButton>
        </form>
      </div>
    </main>
  );
}
