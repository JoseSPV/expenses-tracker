# Guía de uso de Joenance

Joenance te ayuda a registrar tus gastos e ingresos del día a día, controlar presupuestos mensuales, ahorrar para objetivos y seguir tu patrimonio.

## Antes de empezar

- **Tus datos se guardan solo en este navegador.** No hay cuenta ni servidor. Si borras los datos del sitio o cambias de navegador o dispositivo, no los verás.
- **La primera vez** la app carga datos de demostración (seis meses de ejemplo) para que veas cómo funciona. Si ya usabas la versión anterior de la app, tus gastos, categorías y presupuestos se importan automáticamente en su lugar.
- **Empezar de cero:** abre **Gestionar datos** (icono de base de datos, arriba a la derecha) y pulsa **Borrar todos los movimientos**. Se conservan categorías, presupuestos, objetivos, recibos y cuentas; bórralos o edítalos desde su sección si no los quieres.

## La barra superior

| Elemento | Para qué sirve |
| --- | --- |
| Selector de mes (‹ Noviembre de 2026 ›) | Cambia el mes que ves en **Resumen**, **Movimientos** y **Presupuestos**. No permite ir a meses futuros. |
| Gestionar datos | Cargar datos de demostración (sustituye todo) o borrar todos los movimientos. Ambas acciones piden confirmación. |
| Cambiar tema | Alterna entre modo claro y oscuro. La elección se recuerda. |
| Añadir movimiento | Registra un gasto o un ingreso desde cualquier sección. |

En el móvil, el menú de secciones está abajo y el botón **+** sustituye a **Añadir movimiento**.

## Registrar un movimiento

1. Pulsa **Añadir movimiento**.
2. Escribe el **Importe (€)**, siempre en positivo.
3. Elige la **Categoría**. Que sea gasto o ingreso lo decide la categoría: «Supermercado» es un gasto y «Salario» un ingreso.
4. Ajusta la **Fecha** si no es hoy y añade una **Nota** opcional.
5. Pulsa **Añadir movimiento**.

Si la categoría tiene presupuesto, verás debajo **Presupuesto mensual: {gastado} de {límite}**, que ya incluye el importe que estás escribiendo. La barra se pone naranja a partir del 80 % y roja si te pasas. Es solo un aviso: siempre puedes guardar.

**Editar o eliminar:** en **Movimientos**, pulsa sobre el movimiento. Para eliminar, pulsa **Eliminar** y después **Confirmar eliminación**.

## Resumen

La vista general del mes seleccionado:

- **Ingresos**, **Gastos**, **Flujo neto** y **Tasa de ahorro** (qué parte de tus ingresos conservas).
- **A dónde va tu dinero**: gasto por categoría.
- **Ingresos y gastos**: comparativa de los últimos seis meses.
- Resumen de **Presupuestos**, **Próximos recibos** y **Objetivos de ahorro**. **Ver todo** lleva a cada sección.

## Movimientos

- Lista de los movimientos del mes, agrupados por día.
- Filtra por texto (nota o categoría), por tipo (gastos o ingresos) y por categoría. Arriba verás cuántos hay, las entradas, las salidas y el neto de lo filtrado.
- **Exportar CSV** descarga `gastos-AAAA-MM.csv` con el total gastado por categoría en el mes y un total general. Incluye **todos** los gastos del mes, sin aplicar los filtros. El archivo usa `;` como separador y coma decimal, así que se abre bien en Excel en español.

## Presupuestos

Un límite mensual por categoría de gasto, el mismo todos los meses.

- **Añadir presupuesto**: elige la categoría y el **Límite mensual (€)**. Para cambiarlo o quitarlo, pulsa **Editar** en su fila.
- Cada barra muestra lo gastado frente al límite: verde por debajo del 80 %, naranja del 80 % al 100 % y roja por encima del 100 %.
- La marca vertical es el **Ritmo esperado**: dónde deberías estar según el día del mes. Si la barra la sobrepasa, vas más rápido de lo previsto.
- **Puedes gastar al día** reparte lo que te queda entre los días que faltan del mes.
- **Gastos sin presupuesto** muestra lo gastado en categorías sin límite.

## Objetivos

Huchas para metas concretas: un viaje, un fondo de emergencia, la entrada de una casa.

- **Nuevo objetivo**: nombre, **Objetivo (€)**, lo que ya tienes ahorrado y la **Fecha objetivo**.
- **Añadir dinero** suma una aportación. Usa un importe negativo para retirar.
- Cada tarjeta te dice cuánto ahorrar al mes para llegar a tiempo. **Necesario al mes**, arriba, suma lo de todos los objetivos.
- Las aportaciones solo cambian el objetivo: no crean movimientos ni cuentan como gasto.

## Recibos

Gastos fijos (alquiler, suscripciones, seguros) e ingresos recurrentes (nómina).

- **Añadir recurrente**: nombre, importe, categoría, **Frecuencia** (semanal, mensual o anual) y **Próxima fecha**.
- **Marcar pagado** (o **Marcar cobrado** para ingresos) registra el movimiento y adelanta la próxima fecha según la frecuencia.
- Arriba verás tus **Gastos fijos al mes** (los anuales y semanales convertidos a mensuales), tus **Ingresos recurrentes**, qué parte de tus ingresos ya está comprometida y lo que vence en los próximos 30 días.

## Patrimonio

Lo que tienes menos lo que debes.

- Añade **Activos** (cuentas, inversiones, vivienda, coche) y **Pasivos** (préstamos, tarjetas) con su **Saldo actual (€)**. Pulsa una cuenta para actualizar su saldo.
- Cada cambio guarda una foto del mes en curso, que forma la gráfica de **Evolución**. Actualiza los saldos una vez al mes para que la gráfica sea útil.
- **Ratio deuda/activos**: cuanto más bajo, mejor.

## Calculadoras

Herramientas rápidas que no guardan nada:

- **Interés compuesto**: cuánto crece una inversión con aportaciones mensuales.
- **Cuota de préstamo**: cuota mensual, intereses totales y total pagado.
- **Fondo de emergencia**: cuánto deberías tener ahorrado. Los gastos mensuales vienen precargados con tu media de los últimos 3 meses. Se recomienda cubrir de 3 a 6 meses.

## Categorías

- **Nueva categoría**: nombre, tipo (**Gasto** o **Ingreso**) y color. No puede haber dos categorías con el mismo nombre.
- Pulsa una categoría para cambiar su nombre o color. Los movimientos la siguen, así que renombrar no pierde nada.
- El tipo no se puede cambiar si la categoría ya tiene movimientos o recibos.
- **Eliminar**: si la categoría está en uso, elige en **Mover a** otra categoría del mismo tipo; sus movimientos y recibos se mueven allí y su presupuesto se elimina. Si no hay otra categoría del mismo tipo, crea una primero.

## Preguntas frecuentes

**¿Puedo usarla en el móvil y en el ordenador a la vez?**
No. Cada navegador tiene sus propios datos.

**¿Cómo hago una copia de seguridad?**
De momento no hay copia de seguridad completa. **Exportar CSV** da el resumen de gastos de un mes, no todos los datos.

**He borrado algo por error.**
Las eliminaciones no se pueden deshacer. Por eso todas piden una segunda confirmación.

**¿Qué pasó con mis datos de la versión anterior?**
Se importaron la primera vez que abriste esta versión. Los datos originales siguen guardados en el navegador sin cambios.
