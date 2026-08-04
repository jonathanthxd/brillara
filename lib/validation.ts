import { ApiError } from "@/lib/server/api";

const MAX_PHOTOS = 4;
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

function string(value: unknown, field: string, min: number, max: number): string {
  if (typeof value !== "string") throw new ApiError(`${field} es obligatorio.`);

  const sanitized = value.trim().replace(/\s+/g, " ");
  if (sanitized.length < min || sanitized.length > max) {
    throw new ApiError(`${field} debe tener entre ${min} y ${max} caracteres.`);
  }

  return sanitized;
}

export function validateName(value: unknown): string {
  return string(value, "El nombre", 2, 80);
}

export function validatePassword(value: unknown): string {
  return string(value, "La contraseña", 1, 256);
}

export function validateTicketInput(value: unknown) {
  if (!value || typeof value !== "object") {
    throw new ApiError("Los datos del ticket no son válidos.");
  }

  const input = value as Record<string, unknown>;
  const photos = input.photos;

  if (!Array.isArray(photos) || photos.length > MAX_PHOTOS || !photos.every((photo) => typeof photo === "string")) {
    throw new ApiError(`Puedes adjuntar hasta ${MAX_PHOTOS} fotografías.`);
  }

  for (const photo of photos) {
    if (!photo.startsWith("data:image/") || photo.length > MAX_PHOTO_BYTES * 1.4) {
      throw new ApiError("Cada fotografía debe ser una imagen de máximo 2 MB.");
    }
  }

  return {
    phone: string(input.phone, "El teléfono", 7, 32),
    city: string(input.city, "La ciudad", 2, 100),
    location: typeof input.location === "string" && input.location.trim()
      ? string(input.location, "La ubicación", 2, 180)
      : "No especificada",
    description: string(input.description, "La descripción", 10, 2_000),
    photos,
  };
}

export function validateMessage(value: unknown): string {
  return string(value, "El mensaje", 1, 1_000);
}

export function validateStatus(value: unknown): string {
  const statuses = new Set([
    "nuevo",
    "en-negociacion",
    "cita-programada",
    "compra-realizada",
    "cancelado",
    "archivado",
  ]);

  if (typeof value !== "string" || !statuses.has(value)) {
    throw new ApiError("El estado indicado no es válido.");
  }

  return value;
}
