# Diseño: cuentas, libros y prueba local

La app guarda hoy un solo documento en `localStorage` (`expenses-tracker:data:v1`) y cada pantalla lee ese documento. Hace falta que varias personas entren con Google, cada una con hasta dos libros, y que un libro se pueda compartir, sin mezclar eso con quien solo quiere probar la app en el navegador.

Proveedor elegido: Supabase para la base de datos, el acceso con Google y la sesión. El acuerdo funcional dejó el proveedor fuera; este documento lo cierra. Si el proveedor cambia, se rehacen las secciones 03 y 10.

## Términos

| Término | Aquí significa |
| --- | --- |
| Libro | Un conjunto completo de datos (categorías, movimientos, presupuestos, objetivos, recibos, cuentas, historial). Equivale al `AppData` de hoy, más nombre y miembros. |
| Hueco | Una de las dos plazas de libros de una cuenta. Cuenta un libro creado y un libro al que te unes. |
| Prueba | El documento que sigue viviendo en el navegador sin cuenta. |
| Versión | Número de un dato. Quien guarda envía la versión que vio; si ya no coincide, el guardado no sustituye el dato. |
| Sesión | La prueba de que esta petición es de una cuenta de Google concreta. Viaja en una cookie, no en `localStorage`. |
| RLS | Reglas de la base: cada fila se lee o se escribe solo si la sesión es miembro de ese libro. |

CSR, ETag, fuente de verdad y el resto de términos de sistema se usan como en el glosario de la guía de diseño frontend.

## 1. Problema y requisitos

- **Usuarios y recorridos.** Unas 10 cuentas: quien crea la app, su pareja y algunos familiares. Recorridos: probar sin cuenta; entrar con Google y caer en un libro; cambiar o crear el segundo libro; registrar y corregir datos; invitar, aceptar, salir y borrar; copiar la prueba a un libro vacío; salir de la sesión o borrar la cuenta.
- **Escala.** 2 libros por cuenta. Un libro compartido puede tener hasta unos 8 miembros. Tope de diseño: 5 000 movimientos por libro, menos de 100 categorías, objetivos, recibos y cuentas. Una vista no pide ese total: pide una página o un agregado.
- **Plataforma.** Web responsive, móvil y escritorio. Sin app nativa.
- **Tráfico.** Sobre todo lectura. Cada sección pide lo suyo al abrirla. Las escrituras son pocas al día, con ráfagas cortas al ponerse al día.
- **Tiempo real.** No. Los cambios ajenos se ven al entrar, al refrescar o al guardar.
- **Sin conexión.** La prueba local funciona sin red. Con sesión, ver y guardar exige red.
- **SEO.** No. El contenido es privado.
- **Accesibilidad e idioma.** WCAG 2.2 AA (la EAA aplica desde junio de 2025). Interfaz en español, de izquierda a derecha. Importes en EUR con formato `es-ES`. Fechas de calendario en la zona horaria del navegador.
- **Seguridad.** Datos de dinero de un hogar. El servicio puede leerlos para mostrarlos. Solo un miembro con sesión abierta lee o escribe un libro. La contraseña la guarda Google.
- **Latencia.** La estructura de la página aparece en ≤ 2,5 s (LCP). La primera página de una vista, por debajo de 1 s en una conexión normal. La respuesta a un toque, ≤ 200 ms (INP). Un guardado espera la respuesta del servidor; el objetivo es por debajo de 500 ms, y la pantalla no da el dato por guardado antes.
- **Fuera de alcance.** Roles con permisos distintos (lector, editor). Canal en vivo. Historial de versiones antiguas: solo se guarda el dato actual y quién lo escribió. Motor de sincronización y uso del libro sin red. Analítica y banner de consentimiento: no hay cookies de seguimiento, y la de sesión es necesaria para entrar. Un backoffice montado dentro de esta app, o un microfrontend de verdad (módulo remoto, shell compartido, despliegue independiente). Un registro de actividades, un DPO o un procedimiento de brecha: eso no es comportamiento de la app.

## 2. Secciones

Se desarrollan 03, 05 y 10. Ahí está el peso: el contrato de los datos, las dos copias (prueba y libro) y el acceso.

### Qué queda listo para un backoffice

No se prepara un runtime de microfrontends. Con una sola persona desplegando, partir el bundle ahora añade coste de carga y de versiones sin un segundo equipo que lo justifique. Esta app tiene que poder publicarse sola.

Lo que sí se mantiene, porque es el corte barato:

- Las pantallas hablan con el contrato del apartado 03 (páginas, agregados y escrituras con versión). Un backoffice será otro cliente de esas mismas filas y de la misma cuenta de Google. No importará `features/` ni el store de esta app.
- Las rutas de esta app son las del hogar. No se añade aquí una zona `/admin`.
- El dominio sigue sin React. La sesión sigue siendo la de Supabase, en cookie, no un token guardado por una pantalla.
- Un administrador de plataforma no es un miembro de un libro. Cuando exista, su permiso será una regla nueva en la base, no un hueco de los dos libros.

Se deja para ese momento el dominio de la cookie si las dos apps comparten un sitio padre, y cualquier shell que las componga en una sola página.

| Sección | Motivo para no desarrollarla |
| --- | --- |
| 02 Arquitectura | La app sigue siendo un monolito modular. Un backoffice futuro es otra app sobre la misma base y la misma cuenta de Google, no un módulo cargado aquí. El corte que lo hace posible está en el apartado siguiente. |
| 04 Bloques | El shell, el router, los diálogos, el dominio y el i18n siguen. Los módulos nuevos y el corte con Supabase están en Arquitectura. |
| 06 UI y render | Las ocho secciones y el sistema visual no cambian de aspecto. Lo que cada una pide, y sus estados de carga y error, está en 03 y en el apartado 6. |
| 07 Red y tiempo real | No hay canal persistente. Reintentos, cancelación y conflictos son el contrato de escritura de 03. |
| 08 Rendimiento | La paginación y los agregados del apartado 03 son el límite de carga. Con páginas de 30 no hace falta virtualizar. |
| 09 Fiabilidad | Hay un solo servicio remoto. La caída de red y el dato atrasado son estados del apartado 4. |
| 11 Entrega | No cambia el despliegue de la web. El esquema se migra con las migraciones de Supabase en el mismo cambio que lo usa. |
| 12 IA | No hay funciones de IA. |

## Arquitectura

Monolito modular, el mismo corte de [ADR-0011](../adr/0011-feature-modules-and-routes.md). Cada pantalla llama a funciones con nombre propio (`listMonthTransactions`, `saveTransaction`, y más adelante las de las otras secciones). Esas funciones no saben si los datos están en el navegador o en Supabase: hay una versión para la prueba local y otra para la base.

No hay una operación genérica de leer o guardar, ni una ruta HTTP propia por cada lectura. PostgREST ya es la lectura; repetirla en Next solo duplicaría las reglas de acceso.

```
app/[lang]          páginas finas. Eligen la prueba local o Supabase
features/<sección>  vistas. Llaman a las funciones del libro, no a Supabase
lib/domain          reglas puras, sin React y sin red
lib/books           funciones de cada sección: listar y guardar
lib/session         entrar con Google, salir y borrar la cuenta
```

La dependencia baja en una dirección. `features` no importa `@supabase/supabase-js`. El dominio no importa `lib/books`. Cuando la versión de Supabase exista, una regla de ESLint mantiene esa prohibición.

### Funciones

Movimientos, ya empezadas:

```ts
listMonthTransactions(movements, { month, cursor? })
// → { items, nextCursor? }  como máximo 30, más reciente primero

saveTransaction(movements, { ...movement, expectedVersion })
// → { ok: true, movements } o { ok: false, current }
```

El resto de secciones tendrá funciones igual de concretas. El cursor es el id del último movimiento ya mostrado. Un fallo esperado se devuelve en el resultado, no como una excepción mezclada con `null`.

| Código | Cuándo |
| --- | --- |
| `conflict` | La versión que enviaste ya no es la de la fila. El valor trae la fila actual. |
| `forbidden` | La sesión no puede hacer eso. |
| `notFound` | El libro o la fila ya no está. |
| `invalid` | El dato no cumple una regla (importe, fecha, nombre). |
| `full` | Esa cuenta ya tiene dos libros. |
| `needsSession` | La prueba local no tiene esa operación (invitar, aceptar, exportar el libro de la nube). Borrar la cuenta vive en la sesión, no aquí. |
| `unavailable` | La red o Supabase no respondieron. No es un conflicto. |

La validación de lo que escribe la persona sigue en el formulario, con las funciones que ya existen (`parseMoney`, fechas). La validación de una fila que llega de Supabase ocurre al traducirla al tipo del dominio.

### Dónde viven los datos

**Navegador.** Las mismas funciones recorren el documento de siempre. Paginan en memoria y los totales siguen saliendo de `lib/domain`.

**Supabase.** Las mismas funciones, por debajo, piden la página o el guardado a la base y traducen la fila. La vista no ve nombres de columna ni errores de Postgres. Copiar la prueba, aceptar una invitación, borrar un libro y borrar la cuenta son una función en la base llamada con la sesión de la persona. La clave de servicio no entra en Next ni en el navegador.

### Sesión

`lib/session` entra con Google, sale y borra la cuenta. Solo hay Supabase para eso. La cookie se renueva en el `proxy` que ya elige el idioma; no hay un segundo middleware.

El layout elige de dónde salen los datos: con sesión, Supabase; sin sesión, el navegador. Una vista llama a `listMonthTransactions` al entrar y a `saveTransaction` al guardar. No construye clientes.

### Qué no se hace

- Un repositorio por tabla. Serían ocho módulos finos con la misma paginación copiada.
- Una capa intermedia entre la vista y estas funciones.
- Rutas `app/api` que reenvíen cada lectura. El acceso lo aplica la base.
- Tipos de Supabase usados en las vistas.

## 3. Modelo de datos y contrato

### Entidades

Identificadores UUID, generados en el cliente al crear.

| Entidad | La posee | Campos que usa la pantalla |
| --- | --- | --- |
| Cuenta | Servidor (Supabase Auth) | id, nombre de Google, email |
| Libro | Servidor | id, nombre, creador |
| Miembro | Servidor | libro, cuenta, si es el creador |
| Invitación | Servidor | id, libro, email, caduca a los 7 días, estado |
| Categoría, movimiento, objetivo, recibo, cuenta patrimonial, foto de patrimonio | Servidor, dentro del libro | Los mismos campos que hoy, más `version` y el id de quien lo guardó |
| Presupuesto | Servidor | Un límite por categoría del libro, con `version` y autor |

La prueba no tiene estas filas. Sigue siendo el documento de la versión 1 en el navegador.

`updatedBy` se resuelve al nombre de Google para mostrarlo. En la lista de miembros también se ve el email.

### Lectura

Cada vista pide solo lo que pinta. Se descarta cargar el libro entero: una sección no debería esperar a movimientos que no va a mostrar, y el resumen no necesita las filas para enseñar un total. A cambio, los totales del resumen, los presupuestos y la calculadora salen de agregados en el servidor. La prueba sin cuenta sigue leyendo su documento local, que ya está en el navegador; ahí las listas largas se pintan con la misma paginación para que la pantalla coincida.

No hay eventos en tiempo real.

Toda lista usa cursor. La página trae como máximo 30 elementos y un `nextCursor`. Si no hay más, el cursor viene vacío. Cambiar el mes, la búsqueda o el filtro vuelve a la primera página. El cursor vive en memoria: al refrescar se empieza por el principio. Orden de los movimientos: fecha descendente y, a igualdad, el id.

| Vista | Qué pide | Qué no pide |
| --- | --- | --- |
| Resumen | Totales del mes, tendencia de 6 meses, gasto por categoría del mes, hasta 3 objetivos, recibos a 30 días, patrimonio neto | Las filas de movimientos |
| Movimientos | Una página del mes, con búsqueda, tipo y categoría. Las categorías del filtro, también por páginas | Meses que no están en pantalla |
| Presupuestos | Categorías de gasto, límites y el gastado del mes por categoría | Los movimientos de ese gasto |
| Objetivos | Una página de objetivos | El resto del libro |
| Recibos | Una página de recibos y el ingreso mensual comprometido | Movimientos ya pagados |
| Patrimonio | Una página de cuentas y una página del historial | Otra cosa |
| Calculadoras | Gasto medio de los últimos 3 meses cerrados, o el mes actual si esos están a cero | El historial de movimientos |
| Categorías | Una página de categorías con el recuento del mes y el recuento fuera de ese mes | Los movimientos que alimentan el recuento |
| Miembros | Una página de miembros e invitaciones pendientes | Los datos económicos |

Un agregado que falla no bloquea otra vista. El resumen puede estar en error y Movimientos cargarse igual.

### Escritura

Cada guardado es una fila.

- Crear: el id lo pone el cliente. Repetir la misma petición no crea un duplicado.
- Cambiar: el cuerpo lleva `expectedVersion`. Si coincide, la versión sube uno y responde la fila nueva. Si no, responde `409` con la fila actual y no escribe. Repetir un cambio ya aplicado vuelve a dar `409`, así que un reintento automático no es seguro: lo ve la persona y lo rehace.
- Borrar: lleva `expectedVersion`. Si la fila ya no está, la respuesta es éxito. Así el reintento no asusta con un error falso.

Errores de dominio, distintos del fallo de red:

| Código | Cuándo | Qué ve la persona |
| --- | --- | --- |
| `conflict` | La versión ya no es la que vio | El dato actual, con quién lo guardó. El diálogo sigue abierto. |
| `forbidden` | La sesión no es miembro, o no es el creador | Aviso de que no puede hacer eso |
| `not_found` | El libro o el dato ya no está | Sale de ese libro según la regla de abajo |
| `invalid` | Nombre vacío, importe imposible, fecha imposible | El formulario no se cierra |
| `full` | Aceptar o crear pasaría de dos libros | La invitación o el alta siguen a la vista |

La copia de la prueba, borrar un libro, aceptar una invitación y borrar la cuenta son una sola operación de servidor: entra todo o no entra nada. Si la copia falla, el libro sigue vacío y el navegador no cambia.

### Reglas que no caben en una fila

- Máximo dos membresías por cuenta. Lo comprueba la operación de crear y la de aceptar.
- Solo el creador invita, cancela, quita, renombra y borra el libro.
- El creador no se va del libro. Para dejar de compartir, quita miembros o borra el libro.
- Aceptar exige email igual al de la cuenta de Google, invitación pendiente y no caducada.
- Borrar el libro borra sus filas y cancela sus invitaciones.
- Borrar la cuenta borra el perfil (nombre y email), los libros creados y las membresías aceptadas. En un libro ajeno, las filas que escribiste se quedan: son el registro del hogar. Tu nombre deja de mostrarse en ellas.
- Una invitación se borra al aceptarla, rechazarla, cancelarla o caducar. El email invitado no se conserva.

### Contrato tipado

Tipos de TypeScript generados desde el esquema, en el mismo repositorio. Se descarta un contrato OpenAPI o GraphQL: solo hay este cliente.

### Compatibilidad

La prueba sigue en la versión 1 del documento local. El libro de servidor es otro esquema. La copia traduce un documento local completo a filas; es la única operación que manda el conjunto, y solo al copiar. No hay que leer un libro de servidor con el código viejo: una pestaña abierta durante un despliegue vuelve a pedir la página al refrescar.

## 4. Datos y estado

| Estado | Dónde vive | Cuánto dura | Fuente de verdad |
| --- | --- | --- | --- |
| Página o agregado de la vista abierta | Memoria, solo ese resultado | Hasta el siguiente carga o guardado con éxito de esa vista | La base |
| Lista de libros | Memoria | Hasta el siguiente carga del control | La base |
| Id del libro abierto | La ruta `/{lang}/books/{bookId}/…` | Mientras esa URL siga abierta | La URL |
| Último libro visitado | Columna de la cuenta | Para la próxima entrada sin id en la ruta | La base |
| Prueba | `localStorage`, la clave de hoy | Hasta que el navegador la borre | El navegador, solo sin sesión |
| Tema | `localStorage`, como ahora | El dispositivo | El navegador |
| Mes visible | Memoria | Hasta cambiar de libro o de sección | Ninguna: al abrir un libro el mes es el actual |
| Diálogo, formulario, aviso | Memoria | Hasta cerrar | Ninguna |
| Sesión | Cookie `HttpOnly` | La que renueva Supabase | Supabase Auth |

Hay dos fuentes de verdad y no se sincronizan. Con sesión, cada pantalla lee la página o el agregado que pidió. Sin sesión, leen la prueba. Salir de la sesión vuelve a la prueba de ese navegador. Copiar crea filas nuevas y deja la prueba como estaba.

Se descarta actualizar la pantalla antes de que el servidor confirme. En un importe, un éxito optimista enseñaría un número que el `409` tendría que deshacer. El botón espera la respuesta.

Caché: la página en memoria puede estar atrasada respecto a la pareja. No se revalida en segundo plano para disimularlo. Al entrar en la vista, al recuperar el foco de la pestaña y al guardar algo de esa vista, se vuelve a pedir esa página. Si esa petición falla, se conserva lo ya mostrado y se avisa de que no se ha podido actualizar.

Dos pestañas de la nube no se avisan entre sí. Cada una tiene su libro en la URL. Escribir en las dos el mismo dato lo resuelve la versión. El evento `storage` actual se queda para la prueba, donde las pestañas del mismo navegador siguen compartiendo el documento local.

El estado derivado de una página (un semáforo a partir de un gastado que ya vino calculado, un gráfico a partir de la tendencia) se calcula en el cliente y no se guarda. Los recorridos que hoy miran todos los movimientos (`lib/domain`) siguen sirviendo para la prueba local. Con sesión, ese total lo devuelve el servidor.

Normalización: la base guarda filas. El cliente no reconstruye un `AppData` del libro. Se queda con la página o el agregado de la vista abierta.

## 5. Seguridad y privacidad

- **Acceso.** Google mediante OAuth con PKCE, gestionado por Supabase Auth. No hay contraseñas propias ni passkeys en esta versión.
- **Cookie.** La sesión va en cookies `HttpOnly`, `Secure` y `SameSite=Lax`, a través del cliente de servidor de Supabase. El token no se guarda en `localStorage`: cualquier script de la página podría leerlo.
- **CSRF.** `SameSite=Lax` evita que otro sitio dispare la sesión en una navegación cruzada. Las escrituras salen del cliente de Supabase en el origen de la app.
- **XSS.** Los nombres, notas e emails se pintan como texto. La única inyección de HTML sigue siendo el script fijo del tema, una constante del repositorio. No se adopta Trusted Types en esta versión: el control es no interpretar HTML de los datos.
- **Permisos en pantalla.** Quien no creó el libro no ve invitar, quitar, renombrar ni borrar. La base lo rechaza igual si la petición se fuerza. El tope de dos libros también lo rechaza la base.
- **RLS.** Una fila de un libro solo es visible o editable si existe una membresía de `auth.uid()` en ese libro. Invitar y borrar miembros exige además ser el creador. Aceptar, copiar la prueba, borrar un libro y borrar la cuenta pasan por una función que aplica las reglas de varios registros a la vez. La clave de servicio no llega al navegador; en el cliente solo está la clave anónima.
- **Secretos y registros.** No se escribe en los logs el cuerpo de un libro, un email o una nota. No hay analítica ni scripts de terceros en la página. El redirect de Google es la navegación de acceso, no un script embebido.
- **Iframe.** `frame-ancestors 'none'`: esta app no se carga dentro de otra página.
- **Subidas.** No hay ficheros.
- **Dependencias.** Se añaden los dos paquetes de Supabase, fijados en el lockfile. No se añade otro proveedor de identidad.
- **PII.** Se guardan el nombre y el email de Google, y el texto que la persona escriba en las notas. Eso no sale a un servicio de errores de terceros en esta versión.

### Datos personales

Esto no es un dictamen. Es lo que la app tiene que hacer para que una familia en España pueda ver, llevarse y borrar sus datos. El proyecto de Supabase se crea en la UE.

- **Aviso.** Una página en español, enlazada desde Perfil. Dice qué se guarda, que Google identifica la cuenta, que los datos están en Supabase en la UE, que quien está en un libro ve ese libro, cómo exportar y cómo borrar la cuenta. La cookie de sesión se menciona ahí. No hay banner de consentimiento.
- **Exportar.** Desde la sesión, por cada libro que puedes abrir, una descarga con las filas de ese libro en JSON. El CSV mensual de gastos sigue siendo el resumen de siempre, no el sustituto de esta copia.
- **Borrar.** La cuenta se borra con la confirmación ya prevista. Desaparece el perfil, los libros que creaste y tu acceso. Lo que escribiste en un libro de otra persona permanece, sin tu nombre.
- **Invitaciones.** El email de alguien que todavía no ha aceptado solo vive mientras la invitación está pendiente, como máximo 7 días.
- **Corregir.** Lo que ya se puede editar o borrar dentro del libro cubre la rectificación. No hay un formulario aparte.

## 6. Estados y accesibilidad

Ninguna vista de la nube se queda en blanco. Cada una tiene carga, error, vacío y dato, y el shell dice siempre si hay sesión.

**Sin sesión.** Perfil, en el grupo Cuenta del menú, dice que no has entrado. Ahí está «Tus libros», que empieza el acceso con Google. Las ocho secciones siguen enseñando la prueba de ese navegador. La cabecera no lleva la sesión ni la gestión de datos.

**Con sesión.** Las ocho secciones se abren igual, vacías. No se enseña la prueba ni un error por no tener libros. Lo anotado con la sesión no se mezcla con la prueba. Hasta que la cuenta lo guarde, ese documento vive en este navegador, en otra clave.

**Importar la prueba.** Si la cuenta está vacía y la prueba de este navegador tiene algo escrito por la persona, un aviso encima de las secciones ofrece copiarla («Importar» o «Ahora no»). Descartado, no vuelve a salir con esa cuenta. En Datos la opción sigue mientras la cuenta esté vacía. Se copia la prueba entera, ejemplos incluidos, en una sola escritura (`importTrialData`); la prueba no cambia. Los ejemplos sin tocar no cuentan como datos propios: tienen ids fijos, y lo creado a mano lleva un UUID o una versión mayor que 1. Con libros en Supabase, la misma operación será la función de servidor de la copia.

**Cada vista con libro.** El esqueleto es de esa vista, no de las demás. Si la petición falla, se muestra el error y un reintento; si ya había una página, se conserva y el aviso dice que no se pudo actualizar. El vacío es el de esa lista (sin movimientos este mes, sin objetivos, sin categorías), no un fallo. Guardar, borrar o aceptar dejan el control en espera hasta la respuesta. Un error de red no se presenta como un conflicto de versión.

La prueba local conserva, además, el esqueleto hasta hidratar y el aviso de «no se ha guardado».

| Recorrido | Cargando | Éxito | Error | Vacío | Atrasado | Sin red | Sin permiso | Esperando guardado |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Prueba, sin sesión | Esqueleto hasta hidratar | Las secciones de hoy. Perfil tiene el aviso y «Tus libros» | El botón de acceso se puede reintentar | La prueba vacía, con su texto | — | La prueba sigue; el acceso dice que hace falta red | Si se cancela Google, se sigue en la prueba | El botón espera la vuelta de Google |
| Entrar con Google | Botón en espera | Las ocho secciones, vacías, sin la prueba | Se puede reintentar el acceso | Sin movimientos ni categorías: el vacío de cada sección | — | El acceso no arranca y lo dice | Cuenta de Google cancelada: se vuelve a la prueba | El botón no se confirma antes de la vuelta |
| Cada sección con libro | Esqueleto de esa vista | La primera página o el agregado | Error con reintento; las otras secciones no se bloquean | El texto de vacío de esa lista, y un botón de cargar más solo si hay cursor | Página ya vista más aviso de que no se pudo refrescar | Igual que el error de red | Libro ajeno o sesión caducada: fuera de ese libro | El diálogo espera; no pinta el dato nuevo |
| Sin libros | — | Las secciones siguen abiertas y vacías | No es un error y no hay reintento | El vacío de cada sección | — | No se inventan datos | — | — |
| Control de libros | Lista en espera | Nombres, el abierto marcado | No se cambia de libro | El mismo estado vacío | — | No cambia de libro | — | Crear espera el id nuevo y luego abre esa ruta |
| Invitaciones al entrar | — | Aceptar abre el libro; rechazar la quita | Se puede reintentar | Sin invitaciones: no se muestra | — | No se acepta a ciegas | Email distinto: no aparece | Aceptar espera |
| Miembros | — | Nombre, email y acciones del creador | La acción se avisa y la lista no miente | Solo el creador | La lista es la del último carga | La acción no sigue | Quien se unió no ve las acciones de creador | La fila no desaparece hasta la respuesta |
| Copiar la prueba | — | Las filas del libro pasan a ser la prueba; el navegador se queda | El libro sigue vacío y lo dice | Sin prueba, o libro con cualquier dato: la acción no está | — | No copia | Solo en un libro que creaste | Espera a la operación completa |
| Salir o borrar la cuenta | — | Salir muestra la prueba. Borrar deja sin libros propios | Se puede reintentar; la confirmación sigue abierta | — | — | No borra la cuenta | — | Confirmación y espera |
| Conflicto al guardar | — | — | `409`: se ve el dato del servidor y quién lo guardó | — | El formulario tenía una versión vieja | Si la red falla, no es un conflicto: se dice que no se guardó | — | Hasta la respuesta |

Si el libro de la URL ya no está, se abre el otro que quede. Si no queda ninguno, la ruta pasa al control de crear.

No hay guardado optimista. “Esperando” es el estado pendiente: el control está ocupado y el dato anterior sigue en pantalla.

### Accesibilidad

- **Teclado.** El control de libros, las invitaciones, los miembros y salir o borrar la cuenta son botones y enlaces reales, en el mismo orden que el foco. No hay acciones solo de ratón.
- **Foco.** Al cambiar de sección o de libro, el foco va al `h1` de la página. Los diálogos siguen abriéndose con `showModal()` y `data-autofocus`. La confirmación de borrar, salir del libro y borrar la cuenta es un diálogo.
- **Regiones vivas.** El aviso existente (`role="status"`, `aria-live="polite"`) anuncia guardado, conflicto, fallo de red y “este libro ya no está”. Un gasto de la pareja no se anuncia solo: aparece al recargar, que es el acuerdo.
- **Movimiento reducido.** La entrada con fundido de hoy debe respetar `prefers-reduced-motion`. Ahora no lo hace; entra en este cambio.
- **Contraste y tamaño.** Se mantienen los tokens actuales (texto secundario, éxito y aviso en claro) y los objetivos de al menos 44 px. El control de libros y las filas de miembros usan esa altura. El nombre de quien guardó un dato no va solo en un color.

## 7. Trade-offs

Las tres decisiones que aguantan el resto:

1. **Cada vista pide una página o un agregado, no el libro.** Una sección abre rápido y no arrastra filas que no pinta. A cambio, el resumen y los presupuestos dependen de totales calculados en el servidor, y la prueba local sigue otro camino: el documento entero, paginado solo al pintarlo.
2. **La prueba y el libro no se sincronizan.** Se puede probar sin cuenta y la copia es explícita. A cambio, el mismo navegador puede enseñar dos economías distintas, y hace falta no pintar la prueba mientras hay sesión.
3. **La base aplica el acceso y el tope de dos libros.** La interfaz esconde lo que no toca, pero no es la barrera. A cambio, aceptar, copiar y borrar viven en funciones de servidor, no en una cadena de peticiones del navegador.

El mayor riesgo es una regla RLS que deje leer un libro ajeno, o una sesión que enseñe la prueba como si fuera el libro. Se detecta antes de ampliar el alcance: dos cuentas de prueba, una pide el id del libro de la otra y recibe cero filas; y, con sesión, la pantalla no muestra un movimiento que solo está en `localStorage`. El segundo aviso temprano es un guardado concurrente del mismo movimiento: el segundo recibe `409` y la cifra que se queda es la primera.

**Primero.** Sesión de Google, el aviso de «no has entrado», el estado sin libros y una página de movimientos con versión de punta a punta.

**Después.** El agregado de cada sección, invitaciones y la copia.

**Más tarde.** Roles, canal en vivo, historial de cambios, libro usable sin red.

A diez veces el tamaño, la página de 30 y los agregados siguen valiendo. A diez veces las cuentas, el acceso y el tope siguen igual. El canal en vivo solo haría falta si editar a la vez pasara de ser la excepción.
