# Prueba rápida: enlaces de referido BRILLARA

## Antes de empezar

1. En **Supabase → SQL Editor**, ejecuta las tres migraciones en este orden:

   1. `20260804_secure_brillara.sql`
   2. `20260805_advisor_management.sql`
   3. `20260805_referral_tracking.sql`

2. Despliega la versión nueva de la página o ejecútala localmente con las variables de Supabase configuradas.

3. Entra como administrador en `/admin/asesores` y crea un asesor de prueba:

   - Nombre: `Prueba Referidos`
   - Código de acceso: `10001`
   - Contraseña: una temporal con letras y números.

4. En su tarjeta aparecerá el enlace `https://www.brillara.gold/r/10001`. Cópialo.

## Prueba completa

1. Abre una ventana incógnita y pega el enlace del asesor.

2. Debes llegar a la pantalla inicial para escribir el nombre. Escribe, por ejemplo, `Cliente de prueba` y continúa.

3. Completa un ticket de negociación con teléfono, ciudad y una descripción de al menos 10 caracteres.

4. Inicia sesión en otra ventana como el asesor de prueba en `/asesor/login`.

   - El ticket debe aparecer directamente en **Mis tickets**.
   - En la parte superior, el panel debe mostrar: 1 visita única, 1 registrado y 1 ticket creado.
   - En **Personas conseguidas** debe aparecer `Cliente de prueba`.

5. Cambia el estado del ticket a **Compra realizada**. El contador de compras realizadas debe subir a 1.

6. Entra como administrador en `/admin/asesores`.

   - La tarjeta del asesor debe mostrar los mismos cuatro contadores.
   - En `/admin/tickets`, el ticket debe decir quién lo refirió.

## Comprobaciones importantes

- Abre otro enlace de asesor distinto desde el mismo incógnito: el primer referido debe conservar el crédito. Usa otro incógnito para simular otra persona.
- Prueba `https://www.brillara.gold/#10001`: también debe funcionar. Para publicaciones reales, comparte siempre `/r/10001`.
- Edita el código de acceso del asesor en administración: su enlace anterior debe seguir apareciendo y funcionando, porque el enlace de referido es permanente.
- Si los contadores no cargan, revisa que la tercera migración se haya ejecutado en el mismo proyecto de Supabase conectado al sitio.

## Sobre comisiones

Esta implementación deja una cadena de atribución clara: visita → nombre → ticket → compra realizada. No calcula automáticamente una comisión en dólares porque todavía falta definir el porcentaje para compras de 11 a 99 gramos. Así se evita pagar o mostrar una cifra incorrecta; cuando esa regla esté cerrada, el registro de venta puede usar esta atribución sin perder ningún referido previo.
