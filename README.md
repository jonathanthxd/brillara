# BRILLARA

Plataforma de captación y gestión de negociaciones presenciales para compra de oro, plata, joyas y diamantes en Los Ángeles.

## Inicio rápido en Codespaces

Para abrir y probar el diseño y el registro de nombre localmente, basta con:

```bash
pnpm install
pnpm dev
```

En desarrollo, si aún no existe `.env.local`, BRILLARA crea una clave de sesión temporal solo para ese Codespace y muestra el sitio con configuración visual de demostración. Verás una advertencia en la terminal, pero podrás registrar un nombre y comprobar cookies/sesiones sin bloquearte. La creación real de tickets seguirá mostrando un mensaje claro hasta que conectes Supabase.

Para probar tickets, panel administrativo y asesores contra tu base de datos real, configura el entorno una vez:

```bash
cp .env.example .env.local
openssl rand -base64 48
```

Pega el resultado de `openssl` como `SESSION_SECRET` en `.env.local`, completa las otras tres variables y ejecuta:

```bash
pnpm check:env
pnpm dev
```

`pnpm check:env` no muestra secretos: únicamente te dice qué variable falta o es inválida.

Antes de probar tickets, asesores, anuncios, referidos o partners, ejecuta estas migraciones en **Supabase → SQL Editor → New query → Run**, en este orden:

1. `supabase/migrations/20260804_secure_brillara.sql`
2. `supabase/migrations/20260805_advisor_management.sql`
3. `supabase/migrations/20260805_referral_tracking.sql`
4. `supabase/migrations/20260806_partner_operations.sql`

Si falta ese paso, el proyecto mostrará un aviso claro en desarrollo en vez de un error genérico.

## Qué cambió en esta versión

- La identificación del visitante se guarda en una cookie privada y firmada. Un navegador o ventana incógnita nueva siempre empieza en la pantalla “¿Cómo te llamas?”.
- Los tickets, teléfonos, fotos, asesores y paneles ya no se consultan desde el navegador con Supabase.
- Administración y asesores usan sesiones HTTP-only emitidas por el servidor.
- El nombre se actualiza en el navbar al instante después del registro, sin exigir recargar la página.
- El navbar ahora incluye navegación móvil, menú desplegable y selector de tema; el modo claro sigue siendo el predeterminado y el oscuro usa plata/azul.
- El panel incluye **Asesores**: crear, editar nombre/código, renovar contraseña y eliminar accesos.
- La eliminación libera los tickets del asesor y las contraseñas renovadas invalidan sus sesiones previas.
- Se eliminó la página de prueba que exponía contraseñas de asesores.
- Los ajustes y anuncios pasan a persistirse en Supabase, no en el `localStorage` del administrador.
- Se añadieron validaciones de formularios, límites de fotos, estados de carga/error, cabeceras de seguridad y SEO básico.
- Se añadió **Partners**: organizaciones, sucursales y usuarios individuales con acceso propio, sesiones HTTP-only y suspensión inmediata.
- Los asesores ahora programan visitas con partner/sucursal; solo el partner certifica el resultado presencial mediante acciones controladas.
- Las compras confirmadas se guardan de forma permanente, con pesos, pago, usuario confirmador, historial, correcciones auditadas y anulación sin borrado físico.
- Las métricas de referido usan la compra confirmada no anulada como fuente principal y mantienen compatibilidad con tickets históricos ya marcados como compra realizada.

## Antes de desplegar

1. En Supabase, abre **SQL Editor** y ejecuta estos archivos, en este orden:

   `supabase/migrations/20260804_secure_brillara.sql`

   `supabase/migrations/20260805_advisor_management.sql`

   `supabase/migrations/20260805_referral_tracking.sql`

   `supabase/migrations/20260806_partner_operations.sql`

   La primera migración activa RLS y retira el acceso directo del navegador a `tickets` y `advisors`. La segunda migra de forma segura las contraseñas antiguas de asesores y habilita su administración desde el panel. La tercera incorpora los enlaces de referido, sus métricas y la relación permanente entre cliente, referido y ticket. La cuarta agrega partners, sucursales, usuarios individuales, citas, compras y auditoría sin alterar los referidos existentes.

2. En Vercel, configura estas variables de entorno para Production, Preview y Development:

   | Variable | Uso |
   | --- | --- |
   | `SUPABASE_URL` | URL del proyecto Supabase. |
   | `SUPABASE_SERVICE_ROLE_KEY` | Clave `service_role`; solo en Vercel, nunca en código cliente. |
   | `SESSION_SECRET` | Texto aleatorio de 32+ caracteres para firmar cookies. |
   | `ADMIN_PASSWORD` | Nueva contraseña fuerte del panel de administración. |

   Usa `.env.example` como plantilla local. No copies las claves al repositorio ni a variables `NEXT_PUBLIC_*`. La clave requerida es `service_role`, no la `anon/public`.

3. Cambia la contraseña anterior de administración. Estaba expuesta dentro del código previo y debe considerarse comprometida.

4. Despliega y comprueba el flujo de verificación de abajo.

## Flujo de identidad y privacidad

Al registrar el nombre, BRILLARA crea una sesión firmada en una cookie `HttpOnly`. Esa sesión guarda la relación del navegador con sus tickets. Por eso:

- el mismo dispositivo puede volver y ver sus tickets;
- una ventana de incógnito o un navegador nuevo debe indicar su nombre;
- un visitante no puede consultar tickets de otros navegadores cambiando el nombre;
- los tickets anteriores a este cambio no se asocian automáticamente a una sesión segura. El equipo puede atenderlos desde administración y los nuevos tickets ya quedan protegidos.

## Verificación manual después del despliegue

1. Abre `https://www.brillara.gold/` en una ventana incógnita: debe aparecer el formulario de nombre.
2. Indica un nombre y crea un ticket. Debe abrirse el detalle y aparecer en `/tickets`.
3. Abre otra ventana incógnita: no debe aparecer el nombre ni el ticket anterior.
4. Inicia sesión en `/admin/login`, verifica que el ticket aparezca, responde y cambia el estado.
5. En `/asesor/login`, comprueba que un asesor solo ve tickets nuevos o asignados a él.
6. En `/admin/asesores`, crea un asesor de prueba (por ejemplo, código `prueba01` y una contraseña con letras y números). Cierra el panel administrativo y entra en `/asesor/login` con esas credenciales. Debe abrir su panel de tickets.
7. Edita el código o renueva la contraseña desde `/admin/asesores`; comprueba que el asesor puede entrar con el nuevo acceso. Si renuevas la contraseña, su sesión anterior se invalida.
8. Elimina el asesor de prueba y confirma que ya no puede entrar; los tickets que tenía asignados deben quedar disponibles para el equipo.
9. En Supabase, confirma que las tablas `tickets` y `advisors` no admiten consultas con el rol `anon`.
10. Consulta `GUIA_DE_PRUEBAS_PARTNERS.md` para crear el primer partner y validar el flujo presencial completo.

## Enlaces de referido

Cada asesor recibe un código público permanente al crearse. Por ejemplo, un asesor creado con el código `10001` comparte:

```text
https://www.brillara.gold/r/10001
```

El enlace oficial usa `/r/` porque llega al servidor desde el primer instante. También se acepta el formato anterior `https://www.brillara.gold/#10001` y `?ref=10001`, pero el primero es el recomendado.

- La primera referencia válida queda asociada al navegador durante 90 días y no puede ser reemplazada por otro enlace posterior.
- Al registrar su nombre, el cliente queda visible como un registro conseguido por ese asesor.
- Al abrir un ticket, el origen queda guardado de forma permanente y el ticket se asigna automáticamente al asesor que lo refirió.
- El panel del asesor muestra visitas únicas, registrados, tickets y compras realizadas. Una compra nueva se acredita cuando el partner la confirma; las compras históricas conservan el conteo por su estado anterior.
- La atribución conserva el código y nombre históricos incluso si después se edita el código de acceso del asesor.

Consulta `GUIA_DE_PRUEBAS_REFERIDOS.md` para hacer la prueba completa antes de usarlo con publicistas reales.

La migración genera hashes de las contraseñas de asesores y verifica sus credenciales únicamente dentro de la base de datos. Tras convertir credenciales antiguas, borra el valor en texto plano de cada registro; si un asesor no recuerda su clave, simplemente restablécela desde el panel.

## Desarrollo

```bash
cp .env.example .env.local
pnpm check:env
pnpm install
pnpm lint
pnpm build
pnpm dev
```

Las fotos continúan usando la columna existente de imágenes codificadas para preservar la compatibilidad con los tickets actuales. El formulario limita cada imagen a 2 MB y cuatro adjuntos. La siguiente mejora de infraestructura recomendada es moverlas a un bucket privado de Supabase Storage y guardar URLs firmadas.

## Panel de partners

El administrador crea primero el partner, luego al menos una sucursal y finalmente un usuario individual desde `/admin/partners`. Ese usuario entra en `/partner/login` con su código y contraseña personales. No existe una contraseña compartida para toda la joyería.

Un asesor programa la visita desde el detalle de su ticket. El partner únicamente puede ver tickets asignados a su organización y, si su usuario está ligado a una sucursal, solo a esa sucursal. Desde el ticket puede confirmar una compra, registrar un resultado no concretado o enviar un problema a revisión; no tiene un selector libre de estados.

La confirmación de compra se ejecuta como una función atómica de PostgreSQL: valida el usuario, la asignación y la cita; crea una sola compra por ticket; completa la cita; cierra el ticket; registra el evento; y preserva la atribución de referido. Las anulaciones no eliminan registros y excluyen la conversión de los reportes. Consulta `GUIA_DE_PRUEBAS_PARTNERS.md` antes de ponerlo en producción.
