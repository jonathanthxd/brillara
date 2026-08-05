# Guía de pruebas: panel de partners BRILLARA

Esta guía valida el flujo completo sin romper el sistema de referidos existente.

## 1. Preparación

1. En **Supabase → SQL Editor**, ejecuta estos archivos en este orden exacto:

   1. `supabase/migrations/20260804_secure_brillara.sql`
   2. `supabase/migrations/20260805_advisor_management.sql`
   3. `supabase/migrations/20260805_referral_tracking.sql`
   4. `supabase/migrations/20260806_partner_operations.sql`
   5. `supabase/migrations/20260807_fix_schedule_partner_appointment.sql`

2. Configura `.env.local` o Vercel con las variables existentes:

   | Variable | Uso |
   | --- | --- |
   | `SUPABASE_URL` | URL del proyecto de Supabase. |
   | `SUPABASE_SERVICE_ROLE_KEY` | Solo servidor; nunca `NEXT_PUBLIC_*`. |
   | `SESSION_SECRET` | 32+ caracteres aleatorios. |
   | `ADMIN_PASSWORD` | Acceso administrativo. |

   No se agregaron variables de entorno nuevas.

3. Ejecuta `pnpm check:env`, `pnpm dev`, abre dos navegadores o usa una ventana normal y una incógnita.

## 2. Crear el primer partner

1. Inicia sesión en `/admin/login`.
2. Abre **Partners** desde el panel o entra a `/admin/partners`.
3. Crea el partner:

   - Nombre: `Stevan Gold Jewelry`
   - Tipo: `Joyería`
   - Teléfono/correo: opcionales.

4. Selecciónalo y crea una sucursal:

   - Nombre: `Downtown Los Angeles`
   - Ciudad: `Los Angeles`
   - Zona horaria: `America/Los_Angeles`.

5. Crea un usuario individual:

   - Nombre: `Comprador de prueba`
   - Código: `stevan-buyer-01`
   - Contraseña: mínimo 8 caracteres, con letra y número.
   - Rol: `Comprador`.
   - Sucursal: `Downtown Los Angeles`.

La contraseña se convierte en hash dentro de Supabase y no puede recuperarse después. Para restablecerla, edita el usuario y escribe una nueva.

## 3. Flujo de referido y cita

1. En `/admin/asesores`, crea un asesor de prueba con código `10001` y contraseña temporal.
2. Abre `https://www.brillara.gold/r/10001` en incógnito.
3. Registra el nombre `Cliente Partner de prueba` y crea un ticket con teléfono, ciudad y descripción.
4. En otra sesión, entra a `/asesor/login` con el asesor `10001`.

   - El ticket debe estar asignado al asesor.
   - Sus métricas deben mostrar una visita, un registrado y un ticket.

5. Abre el ticket del asesor. Ya no debe existir una acción para marcar libremente `Compra realizada`.
6. En **Programar visita presencial**, selecciona `Stevan Gold Jewelry`, su sucursal, fecha/hora y notas. Guarda.

   - El ticket queda como `Cita programada`.
   - El ticket guarda partner y sucursal.
   - El ticket aparece automáticamente para el partner.

## 4. Compra confirmada

1. Entra a `/partner/login` con `stevan-buyer-01`.
2. Verifica que el dashboard solo muestra tickets de la sucursal asignada.
3. Abre el ticket usando la cita o la búsqueda por número, nombre o teléfono.
4. Elige **Confirmar compra** e indica, por ejemplo:

   - Metal: `Oro`
   - Pureza: `14K`
   - Peso bruto: `12`
   - Peso neto: `10`
   - Precio por gramo: `50`
   - Total pagado: `500`
   - Método de pago: `Efectivo`.

5. Confirma la compra y verifica:

   - Existe un registro en `purchases` y uno inicial en `purchase_items`.
   - La cita queda `completada`.
   - El ticket queda `compra-realizada` con `closed_at`.
   - Se registra `purchase_confirmed` en `partner_ticket_events` con el usuario partner.
   - El ticket sale de **Tickets activos** del asesor y aparece en su historial.
   - El contador de compra del asesor/publicista referido sube **una sola vez**.
   - En `/admin/partners`, la compra muestra partner, sucursal, usuario confirmador y referido.

6. Intenta confirmar nuevamente la compra desde la misma URL o con dos pestañas. Debe fallar: solo se permite una compra por ticket.

## 5. Resultados sin compra y problemas

Con tickets nuevos y citas activas, prueba cada caso:

| Acción | Resultado esperado |
| --- | --- |
| `El cliente no asistió` | Cita `no-asistio`; ticket vuelve a `en-negociacion` para seguimiento del asesor. |
| `El cliente rechazó la oferta` o no hubo acuerdo | Ticket sigue en `en-negociacion`. |
| `Metal no auténtico`, pureza distinta o no cumple requisitos | Ticket queda `no-concretado` y se cierra. |
| `Cita reprogramada` + nueva fecha | La cita anterior se conserva como `reprogramada`, se crea una nueva y el ticket permanece `cita-programada`. |
| `Ticket duplicado` u `Otro motivo` | El ticket queda `en-revision`. |
| `Reportar problema` | El ticket queda `en-revision` y el evento conserva categoría y explicación. |

## 6. Seguridad, suspensión y auditoría

1. Desde `/admin/partners`, suspende el usuario partner. Con la sesión abierta, intenta cargar `/partner` o un ticket: el servidor debe rechazarlo y pedir iniciar sesión de nuevo.
2. Reactiva el usuario y comprueba que puede iniciar sesión otra vez.
3. Crea un segundo partner/sucursal/usuario y programa una cita allí. Intenta abrir su ticket con el primer usuario: debe responder `Ticket no encontrado` o acceso denegado; el filtro se aplica en el servidor, no solo en la interfaz.
4. En **Compras recientes**, usa **Corregir**. Debe conservar un registro en `purchase_corrections` y crear un evento `purchase_corrected`.
5. Usa **Anular** con un motivo. Debe conservar la fila de compra con `voided_at` y `void_reason`, mover el ticket a `en-revision`, y excluir esa compra del contador de referidos.

## 7. Comprobaciones técnicas antes de desplegar

```bash
pnpm lint
pnpm build
```

El proyecto no agrega dependencias. El limitador de intentos de login de partner es un guardia en memoria por instancia; para un despliegue con varias instancias, se recomienda reemplazarlo por un rate limiter compartido de la plataforma. Los comprobantes aceptan una URL segura o imagen codificada, pero para producción conviene moverlos a Supabase Storage privado con URLs firmadas.
