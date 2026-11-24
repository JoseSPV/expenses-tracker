# Spec: Cartera de inversiones

Decisión de arquitectura en [ADR-0015](../adr/0015-investment-portfolio.md).

## Objetivo

Ver, por libro, los valores en cartera con sus operaciones (compras, ventas, dividendos), la ganancia latente de lo que sigue abierto y lo ya realizado en el año: dividendos netos y plusvalías de ventas.

La cartera es del libro, no de la cuenta. Cualquier miembro del libro la ve y la edita. Cada fila guarda quién la escribió.

Éxito: dar de alta un valor, registrar compras, ventas y dividendos, y leer sin cálculos a mano:

1. Posiciones abiertas con coste, valor y ganancia latente.
2. Historial de un valor.
3. Lo realizado en un año, con la plusvalía calculada por FIFO.

## Decisiones cerradas

| Tema | Decisión |
| --- | --- |
| Precio actual | Manual por valor, con su fecha. Sin API de cotizaciones. |
| Coste de una venta | FIFO por valor, como en el IRPF. |
| Vista del año | Solo lo realizado: dividendos y plusvalías o minusvalías de ventas. |
| Divisas | Cualquier divisa ISO 4217. Cada operación guarda los importes originales, el tipo de cambio de su día y su equivalente en EUR fijado al guardar. |
| Equivalente en EUR | Se propone con el tipo de cambio y se puede corregir para que cuadre con el extracto. Una vez guardado, es la cifra fiscal; no se recalcula. |
| Comisión | En todas las operaciones. En EUR o en la divisa del valor, según el extracto. |
| Dividendos | Bruto, retención en origen, retención en España y comisión. El neto se calcula. |
| Patrimonio | El valor de la cartera suma como activo calculado. |
| Propiedad | Del libro. Visible y editable por sus miembros. |
| Alcance | Prueba local completa. Supabase definido aquí; se crea cuando existan libros y miembros. |

## Modelo

Tipos en `lib/domain/types.ts`. Cada operación guarda dos cosas:

- **Original:** importes en la divisa del valor, tal como salen en el extracto.
- **`eur`:** su equivalente en EUR, fijado al guardar. Es la cifra que usan los cálculos y la fiscalidad.

`eurRate` = EUR por 1 unidad de la divisa del valor (`1` si es EUR). La retención en España se anota solo en EUR, porque así la practica el bróker español.

```ts
interface Fee { amount: number; currency: string } // "EUR" o la divisa del valor

interface Instrument {
  id: string;
  ticker: string;            // único en el libro, sin distinguir mayúsculas
  name: string;
  currency: string;          // "EUR", "USD"…
  price?: { value: number; eurRate: number; date: ISODate };
  version?: number;
}

interface TradeBase { id: string; instrumentId: string; date: ISODate; eurRate: number;
  fee: Fee; note: string; version?: number }

type InvestmentTransaction =
  | (TradeBase & { type: "buy" | "sell"; quantity: number; unitPrice: number;
      eur: { gross: number; fee: number } })
  | (TradeBase & { type: "dividend"; gross: number; withholdingOrigin: number;
      eur: { gross: number; withholdingOrigin: number; withholdingSpain: number; fee: number } });
```

### Equivalente en EUR

- El formulario propone `eur.gross = quantity × unitPrice × eurRate` (en un dividendo, `gross × eurRate`), lo mismo para la retención en origen, y la comisión convertida si no viene en EUR. Todo redondeado al céntimo.
- Cambiar un importe original o el tipo de cambio vuelve a proponer las cifras en EUR. La persona puede sobrescribirlas antes de guardar.
- Lo guardado es la verdad. Abrir la operación para editarla enseña las cifras guardadas y solo las recalcula si se toca un importe original o el tipo.
- Si la divisa es EUR, el tipo queda oculto a 1 y las cifras en EUR son las originales.

`AppData` pasa a `version: 2` con `instruments` e `investmentTransactions`. La migración v1 → v2 añade los dos arrays vacíos y no toca lo demás.

## Reglas (`lib/domain/portfolio.ts`, puras)

Todas las reglas usan las cifras `eur` guardadas, nunca `eurRate` × original.

- **Lote.** Cada compra crea un lote. Coste de adquisición = `eur.gross + eur.fee`.
- **Venta FIFO.** La venta consume los lotes más antiguos primero, en orden de fecha y, si hay empate, de id. Valor de transmisión = `eur.gross − eur.fee`. Plusvalía = transmisión − coste de los lotes consumidos. Un lote consumido a medias reparte su coste proporcionalmente.
- **Venta imposible.** Vender más de lo que hay en esa fecha es `invalid`. También lo es editar o borrar una compra si deja una venta posterior sin acciones.
- **Posición.** Acciones vivas, coste vivo en EUR y coste medio = coste / acciones. Valor = acciones × `price.value` × `price.eurRate`. Ganancia latente = valor − coste.
- **Sin precio.** Se muestran «sin precio», el valor y la latente vacíos, y en los totales cuenta a coste, marcado como tal.
- **Dividendo.** Neto en EUR = `eur.gross − eur.withholdingOrigin − eur.withholdingSpain − eur.fee`.
- **Valor de mercado.** Es lo único que usa un tipo de cambio vivo: el de `price.eurRate`.
- **Año.** Ventas y dividendos con fecha en ese año natural. Total realizado = plusvalías − minusvalías + dividendos netos.
- **Redondeo.** Al céntimo, en EUR, por operación, antes de sumar.
- **Cantidades.** Decimales permitidos (fondos, fracciones). Todo importe es ≥ 0; las cantidades y precios, > 0.

Fuera de reglas, pero visible en la interfaz: la app no aplica la regla de los dos meses de las minusvalías ni compensa las retenciones en origen. No es un borrador de la declaración.

## Pantallas

Ruta `/[lang]/investments`, entrada «Inversiones» en el menú, sin selector de mes.

**Pestaña Cartera** (`?view=portfolio`, por defecto)

- Tarjetas: valor actual, coste invertido, ganancia latente (€ y %), dividendos netos del año en curso.
- Tabla de posiciones abiertas: ticker y nombre, acciones, coste medio, precio con su fecha, valor, latente (€ y %), peso. Cada fila abre el detalle.
- `DonutChart` de reparto por valor.
- Posiciones cerradas plegadas, con su resultado realizado total.

**Pestaña Año** (`?view=year&year=2026`, por defecto el año actual)

- Tarjetas: plusvalías, minusvalías, dividendos netos (con bruto y retenciones debajo), total realizado.
- `BarChart` mensual: dividendos netos y resultado de ventas.
- Tabla de ventas: fecha, valor, acciones, valor de transmisión, coste de adquisición FIFO (con las fechas de los lotes), resultado. Todo en EUR, y el importe original con su divisa al lado.
- Dividendos agrupados por valor.

**Detalle** (`/[lang]/investments/[instrumentId]`)

- Cabecera: posición, coste medio, precio y su fecha (editable), latente, realizado y dividendos totales.
- Tabla de operaciones paginada (30), más recientes primero, con filtro por tipo. El tipo va en texto, no solo por color. Cada fila enseña el importe original, el tipo de cambio y el EUR.
- Acciones: nueva operación, editar o borrar con versión. Borrar el valor pide confirmación y borra sus operaciones.

**Diálogos:** alta y edición de un valor y de una operación. El formulario cambia sus campos según el tipo y tiene dos bloques: importes originales (con la comisión y su divisa) y el equivalente en EUR propuesto y editable.

**Patrimonio:** una fila «Cartera de inversiones», sin editar, con enlace a la sección. Entra en el total de activos y en la foto del mes; guardar una operación o un precio también actualiza esa foto.

Estados: el esqueleto hasta hidratar y los vacíos «Sin valores» y «Sin operaciones este año». Los conflictos de versión siguen el diseño de libros.

## Estructura

```
app/[lang]/investments/page.tsx                 página fina; lee view y year
app/[lang]/investments/[instrumentId]/page.tsx  página fina
features/investments/                           vistas, tablas, diálogos
lib/domain/portfolio.ts (+ .test.ts)            FIFO, posiciones, año
lib/books/investments.ts (+ .test.ts)           listar y guardar con versión
lib/store/                                      v2, migración, acciones, seed demo
components/layout/navigation.ts                 entrada del menú
i18n/dictionaries/es.json                       textos
```

Antes de escribir las páginas, revisar en `node_modules/next/dist/docs` cómo se leen `params` y `searchParams` en esta versión.

## Supabase (cuando existan libros y miembros)

- Tablas `instruments` e `investment_transactions` con `book_id`, `version`, `updated_by` y `updated_at`. Las operaciones usan columnas de compra o venta y de dividendo, con un `check` por tipo.
- RLS: lectura y escritura solo si `auth.uid()` es miembro de `book_id`. Las operaciones heredan el libro de su valor.
- Sin agregados en servidor: la vista pide los valores y las operaciones del libro y calcula en el cliente con `lib/domain/portfolio.ts`. El motivo está en el ADR-0015.

## Pruebas

- `node --test` sobre `lib/domain/portfolio.test.ts` y `lib/books/investments.test.ts`, añadidos al script `test`.
- Casos FIFO: venta parcial de un lote, venta que cruza lotes, venta en USD con tipos de cambio distintos de compra y venta, comisión en EUR sobre un valor en USD, cifra EUR corregida a mano que manda sobre el tipo, venta que excede, borrar una compra que deja una venta huérfana, posición sin precio, año sin operaciones.
- `npm run lint` y `npm run build` en verde. Revisión en el navegador de las tres pantallas y de Patrimonio.

## Límites

- Siempre: FIFO, EUR al mostrar, versión por fila, dominio sin React.
- Preguntar antes: API de cotizaciones, nuevas dependencias, agregados en servidor.
- Nunca: inventar un precio, contar una posición sin precio como si tuviera valor de mercado, presentar el año como cálculo fiscal oficial.

## Fuera de alcance

- Splits y contrasplits. Registrarlos como una venta y una compra rompe la antigüedad FIFO; se añadirá un tipo propio cuando haga falta.
- Dividendos en acciones (scrip) y derechos de suscripción.
- Obtener el tipo de cambio de una fuente externa. Se anota a mano.
