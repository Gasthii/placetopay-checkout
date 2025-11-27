# @gasthii/placetopay-checkout

SDK no oficial y tipado para integrar PlacetoPay Checkout (WebCheckout / Redirection), Gateway, Payment Links y Autopay en Node.js/Next.js (server-side). Incluye autenticacion, cliente HTTP con retries e idempotencia, servicios de sesiones/transacciones/reembolsos, collect/token, endpoints gateway (process/query/search/transaction/tokenize/otp/3ds/report/pinpad/account-validator/cashorder), payment-link, autopay, verificacion de webhooks y utilidades.

Autor: Gaston Dev - https://gastondev.xyz
Licencia: MIT

---

## Tabla de contenidos
- Requisitos
- Instalacion
- Configuracion (.env)
- Uso rapido
- Ejemplos Checkout
  - Crear sesion de pago (UY)
  - Pago parcial
  - Preautorizacion (checkin -> reauthorization -> checkout)
  - Suscripcion/token y cobro con token (collect)
  - Dispersions/modifiers/fields
  - Cancelar sesion
  - Acciones de transaccion
- Reembolso directo
- Webhook: validar firma
- Helper de resultado de sesión (paid/partial)
- Ejemplos Gateway
  - process/query/search/transaction
  - tokenize / invalidate / lookup / information
  - otp / 3ds / report / pinpad / account-validator / cashorder
- Payment Links
- Autopay
- Facturacion (import-payment-orders)
- Diagnostico autenticacion (401)
- Opciones avanzadas (idempotencia, hooks, locales)
- Buenas practicas
- Scripts utiles
- Depuracion y logging

---

## Requisitos
- Node.js >= 18 (ESM nativo).
- Credenciales PlacetoPay del ambiente correcto (ej: checkout-test.placetopay.com o gateway host correspondiente).

## Instalacion
```bash
npm install @gasthii/placetopay-checkout
# o
yarn add @gasthii/placetopay-checkout
```

## Configuracion (.env)
```env
PLACETOPAY_LOGIN=TU_LOGIN
PLACETOPAY_SECRET_KEY=TU_SECRET
PLACETOPAY_BASE_URL=https://checkout-test.placetopay.com
# Para Gateway (/gateway/*) usa el host documentado de tu ambiente (ej: https://api-co-dev.placetopay.ws)
# Si no lo defines, se usará PLACETOPAY_BASE_URL
# PLACETOPAY_GATEWAY_BASE_URL=https://api-co-dev.placetopay.ws
PUBLIC_BASE_URL=http://localhost:3000   # usado para returnUrl/cancelUrl en ejemplos
PLACETOPAY_DEFAULT_LOCALE=es_UY         # opcional
PLACETOPAY_DEBUG_AUTH=true              # opcional: loguea seed/nonce
PLACETOPAY_TIME_OFFSET_MINUTES=0        # opcional: ajustar reloj (+/- max 30)
```

---

## Uso rapido
```ts
import "dotenv/config";
import PlacetoPayClient from "@gasthii/placetopay-checkout";

async function main() {
  const client = PlacetoPayClient.fromEnv();
  const res = await client.sessions.create({
    payment: {
      reference: `ORDER_${Date.now()}`,
      description: "Pago de prueba",
      amount: { currency: "UYU", total: 1000 }
    },
    ipAddress: "127.0.0.1",
    userAgent: "Demo",
    returnUrl: "https://tu-sitio.test/return",
    expiration: new Date(Date.now() + 10 * 60_000).toISOString()
  });
  console.log(res.processUrl);
}

main();
```

---

## Ejemplos Checkout
Datos ficticios: Gaston vive en Melo, trabaja en Multimotos, email gaston@example.com.

### Crear sesion de pago (UY)
```ts
import "dotenv/config";
import PlacetoPayClient, { buildReturnUrl } from "@gasthii/placetopay-checkout";

async function crearSesion() {
  const client = PlacetoPayClient.fromEnv();
  const reference = `ORDER_${Date.now()}`;
  const returnUrl = buildReturnUrl(process.env.PUBLIC_BASE_URL!, "/checkout/resultado", {
    ref: reference
  });

  const res = await client.sessions.create({
    locale: "es_UY",
    attemptsLimit: 3,
    paymentMethods: ["visa", "master"],
    payment: {
      reference,
      description: "Compra Multimotos",
      amount: {
        currency: "UYU",
        total: 1250,
        taxes: [{ kind: "valueAddedTax", amount: 265, base: 0 }]
      },
      items: [
        {
          sku: "MOTO-CASCO-001",
          name: "Casco integral",
          category: "physical",
          qty: 1,
          price: 1250,
          tax: 265
        }
      ],
      fields: [{ keyword: "sucursal", value: "Melo", displayOn: "payment" }]
    },
    buyer: {
      document: "4598765-4",
      documentType: "UYCI",
      name: "Gaston",
      surname: "Perez",
      email: "gaston@example.com",
      mobile: "+59898765432",
      company: "Multimotos",
      address: {
        country: "UY",
        state: "MO",
        city: "Melo",
        street: "Av. Italia 1234",
        postalCode: "37000",
        phone: "+59898765432"
      }
    },
    ipAddress: "127.0.0.1",
    userAgent: "Node Demo",
    returnUrl,
    expiration: new Date(Date.now() + 15 * 60_000).toISOString()
  });

  console.log("Process URL:", res.processUrl);
}

crearSesion();
```

### Pago parcial
```ts
await client.sessions.create({
  payment: {
    reference: `PARTIAL_${Date.now()}`,
    description: "Pago parcial Multimotos",
    amount: { currency: "USD", total: 300 },
    allowPartial: true
  },
  ipAddress: "127.0.0.1",
  userAgent: "Partial Demo",
  returnUrl: "https://tu-sitio.test/return"
});
```
**Caso mixto (ej. 30% efectivo + 70% tarjeta):**
- Crea la sesión con `allowPartial: true` y total 100.
- El usuario paga 30 con medio “efectivo”: la sesión queda `APPROVED_PARTIAL`, `paidTotal=30`, `pending=70`.
- Luego paga los 70 restantes con tarjeta en la misma sesión (mientras no expire).
- Al completar, la sesión pasa a `APPROVED`. Si expira antes, queda `PARTIAL_EXPIRED`.
Usa `summarizeSessionOutcome(info)` para saber cuánto falta (`pendingTotal`) y qué intentos se aprobaron.

#### Casos guiados para pagos mixtos (ejemplos prácticos)

**Flujo sugerido desde backend/frontend:**
1) Crea sesión con `allowPartial: true`.
2) El usuario hace primer pago (ej. efectivo $30 de $100). Estado: `APPROVED_PARTIAL`.
3) Tu backend consulta la sesión:
```ts
const info = await client.sessions.get(requestId);
const outcome = summarizeSessionOutcome(info);
if (outcome.partiallyPaid && outcome.pendingTotal > 0) {
  // Muestra en tu UI: "Faltan $70. Continúa pagando con tarjeta."
}
```
4) Redirige al mismo `processUrl` para que el usuario pague el saldo con otro medio (tarjeta).
5) Cuando `pendingTotal` sea 0 y `status === "APPROVED"`, marca la orden como pagada.

**Escenario efectivo + tarjeta con montos mínimos:**
- Almacena en tu sistema un plan de pagos (ej. mínimo $30 en efectivo).
- Permite que el primer intento sea efectivo. Si el monto aprobado es < $30, guía al usuario a pagar nuevamente efectivo hasta llegar a $30 (sigue siendo la misma sesión parcial).
- Luego sugiere tarjeta para el saldo restante; reusa el mismo `processUrl` mientras no expire.

**Recordatorios y seguridad:**
- No hay split simultáneo en un solo paso; son intentos secuenciales.
- Controla la expiración (`expiration` mínimo +5 min) y `attemptsLimit` si quieres limitar reintentos.
- Las sesiones parciales no permiten impuestos ni dispersión.

### Preautorizacion (checkin -> reauthorization -> checkout)
```ts
// Paso 1: checkin
const session = await client.sessions.create({
  type: "checkin",
  payment: { reference: `CHK_${Date.now()}`, amount: { currency: "USD", total: 100 } },
  ipAddress: "127.0.0.1",
  userAgent: "Checkin Demo",
  returnUrl: "https://tu-sitio.test/return"
});
// Abre session.processUrl, guarda internalReference de un pago aprobado.

// Paso 2: reauthorization
await client.transactions.reauthorize(/* internalReference */ 12345, {
  currency: "USD",
  total: 150
});

// Paso 3: checkout (captura o libera)
await client.transactions.checkout(12345, { currency: "USD", total: 180 });
```

### Suscripcion (tokenizacion) y cobro con token (collect)
```ts
// Sesion con subscribe
const subSession = await client.sessions.create({
  payment: {
    reference: `SUB_${Date.now()}`,
    description: "Suscripcion Multimotos",
    amount: { currency: "USD", total: 50 },
    subscribe: true
  },
  ipAddress: "127.0.0.1",
  userAgent: "Sub Demo",
  returnUrl: "https://tu-sitio.test/return"
});
// El token se obtiene consultando la sesion luego del flujo (subscription.instrument).

// Cobro con token
await client.gateway.collect({
  payment: {
    reference: `COLLECT_${Date.now()}`,
    description: "Cobro token Multimotos",
    amount: { currency: "USD", total: 75 }
  },
  instrument: { token: { token: "TOKEN_OBTENIDO" } },
  payer: {
    name: "Gaston",
    surname: "Perez",
    email: "gaston@example.com",
    document: "45987654",
    documentType: "CI"
  },
  ipAddress: "127.0.0.1",
  userAgent: "Collect Demo",
  returnUrl: "https://tu-sitio.test/return",
  expiration: new Date(Date.now() + 10 * 60_000).toISOString()
});
```

### Dispersions, modifiers y fields
```ts
payment: {
  reference: `DSP_${Date.now()}`,
  description: "Dispersado",
  amount: { currency: "USD", total: 1000 },
  dispersion: [
    { agreement: "1299", agreementType: "MERCHANT", amount: { currency: "USD", total: 700 } },
    { agreementType: "AIRLINE", amount: { currency: "USD", total: 300 } }
  ],
  modifiers: [{ type: "FEDERAL_GOVERNMENT", code: 17934, additional: { invoice: "123456789" } }],
  fields: [{ keyword: "cmsOrderId", value: "ABC-123", displayOn: "payment" }]
}
```

### Cancelar sesion
```ts
await client.sessions.cancel(requestId);
```

### Acciones de transaccion
```ts
await client.transactions.reverse(internalReference);
await client.transactions.reauthorize(internalReference, { currency: "USD", total: 150 });
await client.transactions.checkout(internalReference, { currency: "USD", total: 200 });
```

### Reembolso directo
```ts
await client.refunds.refund({
  internalReference: 12345,
  amount: { currency: "USD", total: 50 }
});
```

### Webhook: validar firma
```ts
import WebhookVerifier from "@gasthii/placetopay-checkout/dist/services/webhookVerifier"; // o client.webhooks

const verifier = new WebhookVerifier(process.env.PLACETOPAY_SECRET_KEY!);
const isValid = verifier.verifySignature({
  requestId: 1234,
  reference: "TEST_1234",
  status: { status: "APPROVED", date: "2025-01-01T12:00:00-05:00", reason: "00", message: "OK" },
  signature: "sha256:..."
});
```

### Helper de resultado de sesión (paid/partial)
```ts
import { summarizeSessionOutcome } from "@gasthii/placetopay-checkout";

const info = await client.sessions.get(requestId);
const outcome = summarizeSessionOutcome(info);
// outcome.paid, outcome.partiallyPaid, outcome.expiredPartial, paidTotal, pendingTotal, attempts[]
if (outcome.paid) {
  // marcar orden como pagada
}
```

---

## Ejemplos Gateway

### process / query / search / transaction
```ts
await client.gateway.process({
  payment: { reference: `GW_${Date.now()}`, amount: { currency: "USD", total: 20 } },
  instrument: { card: { number: "4110760000000081", expiration: "12/30", cvv: "123" } },
  payer: { name: "Gaston", surname: "Perez", email: "gaston@example.com", document: "45987654", documentType: "CI" },
  ipAddress: "127.0.0.1",
  userAgent: "Gateway Demo"
});

await client.gateway.query({ reference: "GW_123" });
await client.gateway.search({ filters: { reference: "GW_" } });
await client.gateway.transaction({ action: "reverse", internalReference: 12345, amount: { currency: "USD", total: 10 } });
```

### tokenize / information / lookup / invalidate
```ts
await client.gateway.tokenize({ instrument: { card: { number: "4110760000000081", expiration: "12/30", cvv: "123" } }, payer: { name: "Gaston" } });
await client.gateway.instrumentInformation({
  payment: { reference: "INFO_1", amount: { currency: "USD", total: 10 } },
  instrument: { card: { number: "4111111111111111" } },
  ipAddress: "127.0.0.1",
  userAgent: "Info Demo"
});
await client.gateway.lookupToken({ instrument: { token: { token: "TOKEN", subtoken: "SUB" } } });
await client.gateway.invalidateInstrument({ instrument: { token: { token: "TOKEN" } } });
```

### otp / 3ds / report / pinpad / account-validator / cashorder
```ts
await client.gateway.otp({ internalReference: 12345, otp: "123456" });
await client.gateway.threeDS({ internalReference: 12345, pares: "pares-or-cres" });
await client.gateway.report({ internalReference: 12345 });
await client.gateway.pinpad({ provider: "TEST" });
await client.gateway.accountValidator({
  instrument: { card: { number: "4111111111111111" } },
  payment: { reference: "VAL_1", amount: { currency: "USD", total: 1 } },
  ipAddress: "127.0.0.1",
  userAgent: "Validator Demo"
});
await client.gateway.cashOrder({
  payment: { reference: "CASH_1", amount: { currency: "USD", total: 100 } },
  payer: { name: "Gaston", surname: "Perez", email: "gaston@example.com" }
});
```

---

## Payment Links
```ts
// Crear link
const link = await client.paymentLinks.create({
  name: "Prueba",
  reference: "#5321",
  description: "Pago por infraccion",
  amount: { currency: "COP", total: 100000, taxes: [ { base: 80000, kind: "valueAddedTax", amount: 20000 } ] },
  expirationDate: "2024-08-12 08:10:50",
  paymentExpiration: 15
});

// Consultar link
const info = await client.paymentLinks.get(link.id!);

// Deshabilitar link
await client.paymentLinks.disable(link.id!);
```

## Autopay
```ts
// Crear autopay (retorna processUrl para que el tarjetahabiente autorice)
const auto = await client.autopay.create({
  subscription: {
    reference: "RF-12345",
    description: "Plan mensual",
    recurring: {
      type: "TOTAL_BALANCE",
      periodicity: "M",
      interval: 1,
      maxPeriods: 8,
      nextPayment: "2025-06-03",
      startDate: "2025-06-03",
      dueDate: "2026-02-03"
    }
  },
  dueDay: "25",
  additional: { customerAccountNumber: "1232312323" },
  expiration: "2025-12-15T00:00:00-05:00",
  returnUrl: "https://dnetix.co/p2p/client",
  locale: "es_ES"
});

await client.autopay.update({ subscription: { reference: "RF-12345", description: "Plan actualizado" } });
await client.autopay.cancel(123);
await client.autopay.search({ status: "ACTIVE" });
await client.autopay.transactions(123);
```

## Facturacion (import-payment-orders)
Genera archivos de facturación/recaudo en formato Asobancaria 2001 según la doc (placetopay-docs/gateway/import-payment-orders.mdx).

```ts
import { buildBillingFile, buildCollectionFile } from "@gasthii/placetopay-checkout";

// Archivo de facturación (cargue de facturas)
const billingTxt = buildBillingFile({
  header: {
    nitEmpresaRecaudadora: "1234567890",
    fechaArchivo: "20250101",
    horaArchivo: "1530",
    modificador: "A"
  },
  batches: [
    {
      header: {
        codigoServicio: "1234567890123", // EAN13 o NIT
        numeroLote: 1,
        descripcionServicio: "SERVICIO"
      },
      details: [
        {
          referenciaPrincipal: "123456789012345678901234567890123456789012345678",
          valorPrincipal: 1500.25,
          fechaVencimiento: "20250131",
          fechaCorte: "20250205",
          incrementoDiario: 0.015, // <1 porcentual, >=1 fijo
          incrementoTipo: 0
        }
      ]
    }
  ]
});

// Archivo de recaudo (salida)
const collectionTxt = buildCollectionFile({
  header: {
    nitEmpresaFacturadora: "1234567890",
    fechaRecaudo: "20250101",
    codigoEntidadRecaudadora: "123",
    numeroCuenta: "12345678901234567",
    fechaArchivo: "20250101",
    horaArchivo: "1530",
    modificador: "A"
  },
  batches: [
    {
      header: { codigoServicio: "1234567890123", numeroLote: 1 },
      details: [
        {
          referenciaPrincipal: "123456789012345678901234567890123456789012345678",
          valorRecaudado: 1500.25,
          procedenciaPago: "01",
          medioPago: "11"
        }
      ]
    }
  ]
});
```

Validaciones:
- Líneas de longitud fija (220 para facturación, 162 para recaudo).
- Fechas AAAAMMDD, horas HHMM.
- Montos con 2 o 4 decimales según campo.
- Campos “no usados” se rellenan con ceros/espacios como en la doc.

---

## Depuracion y logging
Activa `logger`, `debugAuth` y hooks para ver requests/responses y errores enriquecidos:

```ts
const logger = {
  debug: (...a) => console.debug(...a),
  info: (...a) => console.info(...a),
  error: (...a) => console.error(...a)
};

const client = new PlacetoPayClient({
  login: process.env.PLACETOPAY_LOGIN!,
  secretKey: process.env.PLACETOPAY_SECRET_KEY!,
  baseUrl: process.env.PLACETOPAY_BASE_URL!, // checkout host
  gatewayBaseUrl: process.env.PLACETOPAY_GATEWAY_BASE_URL, // opcional para /gateway/*
  logger,
  debugAuth: true, // logs de seed/nonce
  onRequest: ({ url, body, headers, attempt }) =>
    console.log("[P2P][req]", attempt, url, { auth: (body as any)?.auth, headers }),
  onResponse: ({ url, status, body, rawBody, attempt }) =>
    console.log("[P2P][res]", attempt, url, status, body, rawBody?.slice(0, 200))
});
```

- Errores HTTP loguean `url`, `status`, `attempt`, `body/rawBody` y, si vienen, `requestId`/`reference`.
- `PLACETOPAY_DEBUG_AUTH=true` (en env) habilita logs de auth (seed/nonce).
- Usa `PLACETOPAY_GATEWAY_BASE_URL` si tu host de gateway es distinto al de checkout.

---

## Diagnostico rapido de autenticacion (401)
- 100: falta UsernameToken (login/nonce/seed/tranKey).
- 101: login no existe o no corresponde al host usado.
- 102: tranKey no coincide con login/secretKey.
- 103: seed fuera de rango (+/-5 minutos).
- Revisa host segun ambiente: checkout-test.placetopay.com, checkout-test.placetopay.ec, checkout.test.getnet.cl, checkout.test.getnet.uy, etc.
- Ajusta reloj del host o usa PLACETOPAY_TIME_OFFSET_MINUTES (max +/-30).

---

## Opciones avanzadas (PlacetoPayConfig)
- defaultLocale, returnUrlBase, cancelUrlBase.
- timeoutMs (default 15000 ms).
- retryPolicy (backoff con jitter por defecto).
- logger (debug/info/error opcionales).
- onRequest, onResponse (hooks de diagnostico).
- extraHeaders.
- idempotencyHeader (default: Idempotency-Key) y puedes pasar `options.idempotencyKey` a `carrier.post` via servicios gateway si necesitas clave por request.
- timeProvider (para tests: clock fijo u offset).

---

## Buenas practicas
- No expongas login/secret en frontend; solo usa backend. Lightbox se inicializa con el processUrl obtenido en backend.
- Usa https en returnUrl/cancelUrl y valida CSP si embebes lightbox (https://checkout.placetopay.com/lightbox.min.js, segun instancia).
- Para AVS de prueba usa ZIP 55555.
- Para 3DS y escenarios aprob/rechazo usa los BIN de prueba del ambiente test.
- Loguea requestId y reference; correlaciona con notificaciones.
- Verifica siempre la firma de webhooks (sha256).

---

## Scripts utiles
- `npm run build` (tsup)
- `npm test` (vitest)
- `npx tsx examples/node-basic.ts` (crear sesion de ejemplo)
- `npx tsx examples/next-webhook.ts` (utilidad basica de webhook para Next)
