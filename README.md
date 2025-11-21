# @gastondev/placetopay-checkout

SDK **no oficial** y completamente tipado para integrar **PlacetoPay Checkout (WebCheckout / Redirection)** en proyectos **Node.js y Next.js (server-side)**.

Este proyecto nace porque actualmente no existe un cliente JS/TS mantenido por el proveedor y en la práctica los integradores terminan re-implementando el mismo stack de autenticación, requests, verificación de firma y manejo de estados.  
El objetivo es proveer una base sólida, extensible y lista para producción.

**Autor:** Gastón Dev — https://gastondev.xyz  
**Licencia:** MIT

---

## Características

### Core
- ✅ Autenticación por request (seed/nonce/tranKey).
- ✅ Cliente HTTP con timeouts, retries (backoff + jitter) y hooks.
- ✅ Tipado de dominio alineado a lo que expone la API.
- ✅ Errores diferenciados (validación / HTTP / negocio).

### Servicios
- ✅ `sessions`
  - `create()` → `/api/session`
  - `get()` → `/api/session/:requestId`
  - `cancel()` → `/api/session/:requestId/cancel`
  - `waitForFinalStatus()` → polling hasta estado final
- ✅ `transactions`
  - `action()` → `/api/transaction`
  - helpers: `checkout()`, `reauthorize()`, `reverse()`
- ✅ `refunds`
  - `refund()` → `/api/reverse`
- ✅ `webhooks`
  - `verify()` → validación de firma `sha256`

### Flujos avanzados
- ✅ Preautorización completa: `checkin → reauthorization → checkout`
- ✅ Refund total/parcial.
- ✅ Sesiones mixtas (`payments[]`) + metadatos.
- ✅ Preparado para certificación técnica.

---

## Instalación

```bash
npm install @gastondev/placetopay-checkout
# o
yarn add @gastondev/placetopay-checkout

## Diagnostico rapido de autenticacion (401)
- 100: falta UsernameToken (login/nonce/seed/tranKey).
- 101: login no existe o no corresponde al host usado.
- 102: tranKey no coincide con login/secretKey.
- 103: seed fuera de rango (tolerancia +/-5 minutos).
- Revisa que el host corresponda al ambiente de tus credenciales: `checkout-test.placetopay.com`, `checkout-test.placetopay.ec`, `checkout.test.getnet.cl`, `checkout.test.getnet.uy`.
