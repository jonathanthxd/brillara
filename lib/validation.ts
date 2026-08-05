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

export function validateAdvisorName(value: unknown): string {
  return string(value, "El nombre del asesor", 2, 80);
}

export function validateAdvisorCode(value: unknown): string {
  const code = string(value, "El código del asesor", 3, 32);
  if (!/^[A-Za-z0-9_-]+$/.test(code)) {
    throw new ApiError("El código solo puede incluir letras, números, guiones y guiones bajos.");
  }
  return code;
}

export function validateAdvisorPassword(value: unknown, required = true): string | null {
  if ((value === undefined || value === null || value === "") && !required) return null;
  const password = string(value, "La contraseña", 8, 256);
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new ApiError("La contraseña del asesor debe incluir letras y números.");
  }
  return password;
}

export function validatePartnerName(value: unknown): string {
  return string(value, "El nombre del partner", 2, 120);
}

export function validatePartnerType(value: unknown): string {
  return string(value, "El tipo de partner", 2, 60);
}

export function validatePartnerCode(value: unknown): string {
  const code = string(value, "El código del usuario partner", 3, 64);
  if (!/^[A-Za-z0-9_-]+$/.test(code)) {
    throw new ApiError("El código solo puede incluir letras, números, guiones y guiones bajos.");
  }
  return code;
}

export function validatePartnerPassword(value: unknown, required = true): string | null {
  if ((value === undefined || value === null || value === "") && !required) return null;
  const password = string(value, "La contraseña del usuario partner", 8, 256);
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new ApiError("La contraseña del usuario partner debe incluir letras y números.");
  }
  return password;
}

export function validateOptionalText(value: unknown, field: string, max: number): string | null {
  if (value === undefined || value === null || value === "") return null;
  return string(value, field, 1, max);
}

export function validateOptionalPhone(value: unknown): string | null {
  const phone = validateOptionalText(value, "El teléfono", 32);
  if (phone && !/^[+()\d\s.-]{7,32}$/.test(phone)) {
    throw new ApiError("El teléfono no tiene un formato válido.");
  }
  return phone;
}

export function validateOptionalEmail(value: unknown): string | null {
  const email = validateOptionalText(value, "El correo electrónico", 160);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError("El correo electrónico no tiene un formato válido.");
  }
  return email?.toLowerCase() ?? null;
}

export function validatePartnerRole(value: unknown): "owner" | "manager" | "buyer" {
  if (value === "owner" || value === "manager" || value === "buyer") return value;
  throw new ApiError("El rol del usuario partner no es válido.");
}

export function validatePartnerId(value: unknown, field = "El partner"): string {
  const id = string(value, field, 8, 100);
  if (!/^[A-Za-z0-9-]+$/.test(id)) throw new ApiError(`${field} no es válido.`);
  return id;
}

export function validatePartnerLocationInput(value: unknown) {
  if (!value || typeof value !== "object") throw new ApiError("Los datos de la sucursal no son válidos.");
  const input = value as Record<string, unknown>;
  const timezone = input.timezone === undefined || input.timezone === null || input.timezone === ""
    ? "America/Los_Angeles"
    : string(input.timezone, "La zona horaria", 3, 80);
  try {
    Intl.DateTimeFormat("en-US", { timeZone: timezone });
  } catch {
    throw new ApiError("La zona horaria no es válida.");
  }
  return {
    name: string(input.name, "El nombre de la sucursal", 2, 120),
    address: validateOptionalText(input.address, "La dirección", 180),
    city: validateOptionalText(input.city, "La ciudad", 100),
    timezone,
    active: typeof input.active === "boolean" ? input.active : true,
  };
}

export function validatePartnerInput(value: unknown) {
  if (!value || typeof value !== "object") throw new ApiError("Los datos del partner no son válidos.");
  const input = value as Record<string, unknown>;
  return {
    name: validatePartnerName(input.name),
    type: validatePartnerType(input.type),
    phone: validateOptionalPhone(input.phone),
    email: validateOptionalEmail(input.email),
    active: typeof input.active === "boolean" ? input.active : true,
  };
}

export function validatePartnerUserInput(value: unknown, passwordRequired = true) {
  if (!value || typeof value !== "object") throw new ApiError("Los datos del usuario partner no son válidos.");
  const input = value as Record<string, unknown>;
  const locationId = input.locationId === undefined || input.locationId === null || input.locationId === ""
    ? null
    : validatePartnerId(input.locationId, "La sucursal");
  return {
    name: string(input.name, "El nombre del usuario partner", 2, 80),
    code: validatePartnerCode(input.code),
    password: validatePartnerPassword(input.password, passwordRequired),
    role: validatePartnerRole(input.role),
    locationId,
    active: typeof input.active === "boolean" ? input.active : true,
  };
}

export function validateScheduledAt(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) throw new ApiError("La fecha y hora de la cita son obligatorias.");
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new ApiError("La fecha y hora de la cita no son válidas.");
  if (date.getTime() < Date.now() - 1000 * 60 * 60 * 24 * 31) {
    throw new ApiError("La cita no puede programarse más de 31 días en el pasado.");
  }
  return date.toISOString();
}

export function validateAppointmentInput(value: unknown) {
  if (!value || typeof value !== "object") throw new ApiError("Los datos de la cita no son válidos.");
  const input = value as Record<string, unknown>;
  return {
    partnerId: validatePartnerId(input.partnerId),
    locationId: validatePartnerId(input.locationId, "La sucursal"),
    scheduledAt: validateScheduledAt(input.scheduledAt),
    notes: validateOptionalText(input.notes, "Las notas", 1_000),
  };
}

function validateNonNegativeNumber(value: unknown, field: string, maximum: number): number {
  const parsed = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > maximum) {
    throw new ApiError(`${field} no es válido.`);
  }
  return Math.round(parsed * 10000) / 10000;
}

export function validatePurchaseInput(value: unknown) {
  if (!value || typeof value !== "object") throw new ApiError("Los datos de la compra no son válidos.");
  const input = value as Record<string, unknown>;
  const grossWeightGrams = validateNonNegativeNumber(input.grossWeightGrams, "El peso bruto", 1_000_000);
  const netWeightGrams = validateNonNegativeNumber(input.netWeightGrams, "El peso neto", 1_000_000);
  const pricePerGram = validateNonNegativeNumber(input.pricePerGram, "El precio por gramo", 1_000_000);
  const totalPaid = validateNonNegativeNumber(input.totalPaid, "El total pagado", 100_000_000);
  if (grossWeightGrams <= 0 || netWeightGrams <= 0) throw new ApiError("Los pesos deben ser mayores que cero.");
  if (netWeightGrams > grossWeightGrams) throw new ApiError("El peso neto no puede ser mayor que el peso bruto.");
  const calculatedTotal = Math.round(netWeightGrams * pricePerGram * 100) / 100;
  const difference = Math.abs(totalPaid - calculatedTotal);
  const totalExplanation = validateOptionalText(input.totalExplanation, "La explicación de la diferencia", 500);
  if (difference > 0.01 && !totalExplanation) {
    throw new ApiError("Explica por qué el total pagado difiere del cálculo de peso neto por precio por gramo.");
  }
  const paymentMethod = input.paymentMethod;
  if (paymentMethod !== "cash" && paymentMethod !== "check" && paymentMethod !== "zelle" && paymentMethod !== "venmo" && paymentMethod !== "bank_transfer" && paymentMethod !== "other") {
    throw new ApiError("El método de pago no es válido.");
  }
  const receiptUrl = validateOptionalText(input.receiptUrl, "El comprobante", 2_800_000);
  if (receiptUrl && !receiptUrl.startsWith("https://") && !receiptUrl.startsWith("data:image/")) {
    throw new ApiError("El comprobante debe ser una URL segura o una imagen.");
  }
  return {
    metal: string(input.metal, "El tipo de metal", 2, 80),
    purity: string(input.purity, "La pureza o kilataje", 1, 60),
    grossWeightGrams,
    netWeightGrams,
    pricePerGram,
    calculatedTotal,
    totalPaid,
    totalExplanation,
    paymentMethod,
    paymentReference: validateOptionalText(input.paymentReference, "La referencia de pago", 160),
    employeeName: validateOptionalText(input.employeeName, "El nombre del empleado", 80),
    notes: validateOptionalText(input.notes, "Las observaciones", 2_000),
    receiptUrl,
    confirmedAt: input.confirmedAt ? validateScheduledAt(input.confirmedAt) : new Date().toISOString(),
  };
}

export function validatePartnerOutcome(value: unknown): "no_show" | "rejected_offer" | "not_authentic" | "purity_mismatch" | "price_disagreement" | "return_later" | "rescheduled" | "requirements_not_met" | "duplicate_ticket" | "other" {
  const outcomes = new Set(["no_show", "rejected_offer", "not_authentic", "purity_mismatch", "price_disagreement", "return_later", "rescheduled", "requirements_not_met", "duplicate_ticket", "other"]);
  if (typeof value !== "string" || !outcomes.has(value)) throw new ApiError("El resultado indicado no es válido.");
  return value as "no_show" | "rejected_offer" | "not_authentic" | "purity_mismatch" | "price_disagreement" | "return_later" | "rescheduled" | "requirements_not_met" | "duplicate_ticket" | "other";
}

export function validateOutcomeInput(value: unknown) {
  if (!value || typeof value !== "object") throw new ApiError("Los datos del resultado no son válidos.");
  const input = value as Record<string, unknown>;
  const outcome = validatePartnerOutcome(input.outcome);
  return {
    outcome,
    notes: validateOptionalText(input.notes, "Las notas", 1_000),
    rescheduledAt: outcome === "rescheduled" ? validateScheduledAt(input.rescheduledAt) : null,
  };
}

export function validateProblemInput(value: unknown) {
  if (!value || typeof value !== "object") throw new ApiError("Los datos del problema no son válidos.");
  const input = value as Record<string, unknown>;
  return {
    category: string(input.category, "El tipo de problema", 2, 80),
    notes: string(input.notes, "La explicación del problema", 5, 1_000),
  };
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
    "pendiente-confirmacion",
    "compra-realizada",
    "no-concretado",
    "en-revision",
    "cancelado",
    "archivado",
  ]);

  if (typeof value !== "string" || !statuses.has(value)) {
    throw new ApiError("El estado indicado no es válido.");
  }

  return value;
}

export function validateAdvisorTicketStatus(value: unknown): "nuevo" | "en-negociacion" | "cancelado" {
  const status = validateStatus(value);
  if (status === "nuevo" || status === "en-negociacion" || status === "cancelado") return status;
  throw new ApiError("El asesor no puede confirmar compras ni modificar el resultado presencial.", 403);
}

export function validateAdminManualStatus(value: unknown): string {
  const status = validateStatus(value);
  if (status === "compra-realizada") {
    throw new ApiError("Una compra solo puede confirmarse desde el panel del partner.", 403);
  }
  return status;
}
