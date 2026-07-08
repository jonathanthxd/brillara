const faqs = [
  {
    q: "¿Cómo sé que BRILLARA me dará el mejor precio?",
    a: "Publicamos nuestros precios de forma transparente. Calcula tu estimación antes de contactarnos y compara con confianza.",
  },
  {
    q: "¿Necesito ir a una tienda física?",
    a: "No. Evaluamos tu material en la cita presencial que acordemos. Nos desplazamos dentro del área de Los Ángeles cuando sea necesario.",
  },
  {
    q: "¿Qué metales compran?",
    a: "Actualmente oro y plata. Próximamente diamantes y otros metales preciosos.",
  },
  {
    q: "¿El precio de la calculadora es definitivo?",
    a: "No. Es una estimación basada en el peso y kilataje que nos indicas. El valor final se confirma tras la inspección física.",
  },
  {
    q: "¿Cuánto tarda el pago?",
    a: "Si llegamos a un acuerdo durante la cita, el pago es inmediato.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="border-t border-border px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <span className="mb-3 inline-block text-xs font-medium uppercase tracking-widest text-primary">
            Preguntas Frecuentes
          </span>
          <h2 className="font-heading text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Todo lo que necesitas saber
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((f, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-heading text-lg font-semibold text-foreground">{f.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
