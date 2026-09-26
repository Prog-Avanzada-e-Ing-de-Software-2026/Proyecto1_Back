0El alumno deberá:

• Analizar el impacto de los pedidos de cambio (CRs) en el dominio

• Identificar nuevas entidades

• Identificar Value Objects

• Identificar cambios en agregados

• Detectar nuevas reglas de negocio

• Justificar cada decisión de modelado

&nbsp;

5.3 Historias de Usuario

Los pedidos de cambio (CRs) no incluyen historias de usuario. El alumno deberá:

• Derivar historias de usuario a partir de cada CR

• Definir criterios de aceptación

&nbsp;

| Código | Descripción |
| :---- | :---- |
| CR-001 | Validación de datos: evitar valores inválidos, mostrar errores claros, no permitir guardar datos incorrectos. |
| CR-002 | Presentación del producto: agregar concepto de presentación (ej: 1L, pack). |
| CR-003 | SuperLínea: una Línea pasa a pertenecer a una SuperLínea. |
| CR-004 | Búsqueda por Denominación, Línea, SuperLínea, admitiendo coincidencias parciales. |
| CR-005 | Denominación automática: generar Marca \+ Línea \+ Presentación, editable manualmente. Depende de CR-002. |
| CR-006 | Actualización masiva de precios, por porcentaje o monto, por línea o global. |
| CR-007 | Historial de precios: registrar precio anterior, precio nuevo, fecha y motivo. Validar precio \> 0\. |

&nbsp;

# 

## *CR-002: Presentación del producto: agregar concepto de presentación (ej: 1L, pack).*

Este pedido de cambio tiene impacto en el dominio ya que agrega un nuevo concepto: la presentación. Este concepto representa las formas en que se puede comercializar un cierto producto, por ejemplo una Coca Cola puede comercializarse en una botella de dos litros, en un pack de 6 botellas o en lata de 500ml, cada una de estas es una presentación posible y en el dominio es importante hacer la distinción. Deberá agregarse el término “Presentación” al lenguaje ubicuo, para evitar confusión y traducciones.

La Presentación será una entidad, debido a que tiene una identidad y un ciclo de vida independiente de un Producto en particular, y puede estar asociado a varios productos. Debe poder crearse, modificarse, consultarse y eliminarse una Presentaciones independientemente de Producto, por lo que estará en otro agregado, donde será la raíz. Estos comportamientos (ABMC de Presentación) deben agregarse al dominio, y se modifica el comportamiento de registrar Producto, ya que ahora debe seleccionarse una Presentación.

Esta entidad tendrá un id, denominación y una observación opcional.

Cada producto tendrá una sola presentación, por lo cual, si tenemos dos versiones del mismo producto en la vida real, por ejemplo botellas de Coca Cola de 1L y de 2,5L, serán dos productos distintos en el sistema con su propio precio, stock y sus propios movimientos. Esto se debe a que conceptualmente y en la operación del negocio no representan los mismos,y además si en una misma entidad representamos el producto en todas su versiones el atributo stock no podría por sí solo indicar cuánto se tiene de cada una. Además, en el CR-005, donde se debe generar una denominación automática, si tenemos más de una presentación no quedaría claro cual usar.

La presentación será una propiedad obligatoria del producto, ya que determina una característica de la versión comercial concreta que se registra.&nbsp;

&nbsp;

Nuevas reglas de negocio:  
\-Cada Producto debe tener asociada una, y solo una, Presentacion. Esta regla vivirá en un servicio de dominio que valida los datos necesarios del Producto antes de registrarlo. Actualmente esto corresponde a la clase ProductoIntrinsicValidationService.

\-No se podrá eliminar una Presentación que esté siendo utilizada por uno o más Productos.  Esta regla de negocio vivirá en un servicio de dominio, que contendrá la política de eliminación de presentaciones.

\-No podrá haber dos presentaciones con la misma denominación. Esta regla de negocio residirá en un servicio de dominio.

&nbsp;

&nbsp;

&nbsp;

Historias de usuario:  
HU-01: Registrar presentación

Como administrador del sistema quiero registrar una nueva Presentación para que pueda ser seleccionada al momento de registrar un Producto.

Criterios de aceptación

CA-01.1: El sistema debe permitir registrar una Presentación indicando su denominación (obligatoriamente) y, opcionalmente, una observación.

CA-01.2: El sistema debe generar un identificador único para la Presentación registrada.

CA-01.3: El sistema debe informar que la Presentación fue registrada correctamente.

CA-01.4: El sistema no debe permitir registrar una Presentación con una denominación ya usada por otra.

&nbsp;

&nbsp;

HU-02: Consultar presentaciones

Como administrador del sistema quiero consultar las Presentaciones registradas, para conocer cuáles están disponibles para asociar a los Productos.

Criterios de aceptación

CA-02.1: El sistema debe mostrar todas las Presentaciones registradas.

CA-02.2: El sistema debe mostrar, como mínimo, el identificador y la denominación de cada Presentación.

CA-02.3: El sistema debe permitir consultar la observación de una Presentación cuando esta exista.

CA-02.4: Si no existen Presentaciones registradas, el sistema debe informar dicha situación.

&nbsp;

&nbsp;

HU-03: Modificar presentación

Como administrador del sistema,

quiero modificar los datos de una Presentación existente,

para mantener actualizada la información de las Presentaciones disponibles.

Criterios de aceptación

CA-03.1: El sistema debe permitir seleccionar una Presentación existente para modificarla.

CA-03.2: El sistema debe permitir modificar la denominación y/o la observación de la Presentación.

CA-03.3: El sistema debe validar que la denominación sea obligatoria.

CA-03.4: El sistema debe informar que la Presentación fue modificada correctamente.

&nbsp;

HU-04: Eliminar presentación

&nbsp;

Como administrador del sistema,

quiero eliminar una Presentación que ya no se utilice,

para mantener actualizadas las Presentaciones disponibles.

&nbsp;

Criterios de aceptación

CA-04.1: El sistema debe permitir seleccionar una Presentación existente para eliminarla.

CA-04.2: El sistema debe solicitar confirmación antes de eliminar la Presentación.

CA-04.3: El sistema debe impedir la eliminación de una Presentación que esté asociada a uno o más Productos.

CA-04.6: El sistema debe informar que la Presentación fue eliminada correctamente.

&nbsp;

&nbsp;

Las historias de usuario Registrar Producto y Modificar Producto ya son historias existentes e implementadas. A estas historias se le deben agregar los siguientes criterios de aceptación (no necesariamente formuladas de la misma manera):

HU existente: Registrar producto

Nuevos criterios por CR-002

CA-1: Al registrar un Producto, el sistema debe permitir seleccionar una Presentación previamente registrada y activa.

CA-2: La Presentación debe ser un dato obligatorio del Producto y se debe impedir el registro de un Producto si no se selecciona una Presentación.

&nbsp;

## *CR-007 Historial de precios: registrar precio anterior, precio nuevo, fecha y motivo. Validar precio \> 0\.*

Se agrega al dominio la entidad CambioPrecio, que representa un cambio en el precio de una entidad producto particular, ya sea por cambios en el costo, margen o directamente en el precio (por línea o globalmente), brindando trazabilidad.

El CambioPrecio será una entidad ya que, al igual que con Movimiento Stock, nos interesa cual es el CambioPrecio y no solo sus valores. Tendrá las propiedades precioAnterior, precioNuevo, fecha (que incluirá la hora) y motivo que podrá ser: Actualización de Costo, Actualización de Margen, Actualización de Precio Por Línea, Actualización de Precio Global.&nbsp;

CambioPrecio se suma al agregado de Producto. Un producto puede tener 0 o más cambios de precio.

La decisión de que la propiedad Motivo tome un valor predefinido se debe a que se supone que el CambioPrecio es un efecto de otra operación, no algo que el usuario cargue directamente, por lo que sería confuso pedirle que ingrese una descripción del motivo por el que se va a cambiar el precio.

Si bien se agregará esta entidad para aportar trazabilidad, se mantendrá el atributo “precio” en Producto. Esto puede ser cuestionable desde el punto de vista del diseño, ya que es un atributo calculable y no debería persistirse, pero se decide hacerlo de todas formas pues se considera que la mejora en performance lo justifica.

Aparece un nuevo comportamiento de la entidad producto que se encontrará en el método cambiarPrecio(). Este comportamiento implica asegurar que exista un motivo, que el nuevo precio sea positivo y consistente con el anterior y crear un CambioPrecio, además de actualizar el atributo precio.

También tendremos una nueva invariante o regla de integridad del agregado: el precio anterior de un CambioPrecio debe coincidir con el precio vigente inmediatamente antes del cambio.

Los términos “Cambio Precio” e “Historial de Precios” deben agregarse al lenguaje ubicuo.

Se toma una decisión de diseño relacionada a este cambio: los cambios de precios no formarán parte del DTO que se devuelve al consultar los productos, ya que con el tiempo aumentarían significativamente el tamaño de la consulta agregando información que la mayoría de las veces no será necesario. Se obtendrán a través de un endpoint separado. En el front, en la tabla donde se muestran los productos habrá un botón “Ver historial de precios” y al seleccionar el mismo se hará la solicitud al backend y se mostrarán los cambios en un modal.

Dado que el pedido de cambio no se especifica, el responsable del cambioPrecio no se guardará como dato en la entidad.

&nbsp;

Nueva regla de negocio:  
\-Todo cambio realizado al costo, margen o directamente al precio (por linea o global) de un producto debe generar un registro del cambio de precio para mantener trazabilidad.

\-Todo cambio de precio debe tener un motivo.

Estas reglas son garantizadas por el agregado producto. La última se encontrará específicamente en cambiarPrecio().

Y la invariante/regla de negocio implícita mencionada: el precio anterior de un CambioPrecio debe coincidir con el precio vigente inmediatamente antes del cambio.

&nbsp;

&nbsp;

Historias de Usuario:

Consultar Historial de Precios:  
Como administrador financiero quiero poder consultar el historial de precios de un producto para poder analizar su evolución y mantener la trazabilidad de sus cambios de precio .

Criterios de aceptación:

\-Los cambios de precios deben mostrarse en orden cronológico de más reciente a más antiguo.

\-Todos los cambios de precio deben mostrar su fecha, precio anterior, precio nuevo y motivo, obligatoriamente.

\-El historial de precios debe poder consultarse mediante paginación, utilizando inicialmente 10 cambios por página y permitiendo modificar la cantidad de cambios mostrados por página.

\-Si el producto no posee cambios de precio, el sistema debe informar que no existen registros de cambios de precio.&nbsp;

&nbsp;

Este pedido de cambio tiene impacto en las historias de usuario “Modificar Producto” y en las actualizaciones de precio del CR-006, a las que hay agregar un  criterio de aceptación.

Para “Modificar Producto” debemos agregar el CA “Al modificar el precio de un producto, se debe registrar un CambioPrecio”. Para las US del CR-006 agregamos “Al modificar el precio de un producto, se debe registrar un CambioPrecio”.

## *CR-004 Búsqueda por Denominación, Línea, SuperLínea, admitiendo coincidencias parciales.*

&nbsp;

Este pedido de cambio no implica un cambio en el dominio, no aparecen nuevas reglas de negocio, entidades ni Value Objects, sino que se trata tan sólo de una consulta.&nbsp;

Son necesarias ciertas decisiones de diseño sobre cómo se llevará a cabo la búsqueda de coincidencias parciales. En primer lugar, la búsqueda, ya sea esto una petición al back o un filtrado en el frontend, se realizará sólo cuando el usuario presione Enter, y no cada vez que agregue/quite una letra, pues esto evitará muchas consultas innecesarias, simplificará el diseño del frontend y no generará mucha fricción al usuario.

En segundo lugar, se considera que hay coincidencia parcial cuando el texto ingresado esté contenido (no necesariamente al principio) en la denominación de la entidad (producto, línea o superlinea), sin ser case sensitive (no se distingue “Harina” de “harina” o “HARINA”) pero si considerando tildes.

Además, solo se traerán entidades que estén activas (no borradas lógicamente).

La lógica/query de coincidencia parcial, que es común para las distintas entidades, se centraliza en un componente reutilizable de infraestructura/persistencia que se ubicará en Common. Los repositories expondrán un comportamiento busquedaPorCoincidenciaParcial() y en su implementación harán uso del componente descripto.&nbsp;

&nbsp;

Historias de usuario:  
Búsqueda por denominación:

Como administrador de productos quiero poder buscar un producto por su denominación para poder encontrarlo rápidamente.

Criterios de aceptación:

\-Se debe poder escribir la denominación del producto que se busca.

\-Se debe realizar la búsqueda cuando el usuario presiona Enter.

\-Se deben listar los productos cuya denominación contiene al texto escrito por el usuario, sin ser case-sensitive pero considerando tildes.

\-Se debe usar paginación, trayendo de a 10 productos.

\-Solo se deben mostrar productos que se encuentren activos.&nbsp;

&nbsp;

Búsqueda por línea:

Como administrador de productos quiero poder buscar productos por su línea para poder ver rápidamente todos los productos pertenecientes a una categoría.

Criterios de aceptación:

\-Se debe poder escribir la denominación de la línea que se busca.

\-Se debe realizar la búsqueda de líneas cuando el usuario presiona Enter.

\-Se deben mostrar para selección todas las líneas cuya denominación contiene al texto escrito por el usuario, sin ser case-sensitive pero considerando tildes.

\-Se deben traer los productos de la línea seleccionada usando paginación, trayendo de a 10 productos.

\-Solo se deben mostrar líneas que se encuentren activas.

&nbsp;

Búsqueda por superlínea:  
Como administrador de productos, quiero buscar productos por su SuperLínea para poder consultar rápidamente los productos pertenecientes a una categoría superior.&nbsp;

Criterios de aceptación:

\-Se debe poder escribir la denominación de la superlínea que se busca.

\-Se debe realizar la búsqueda de superlíneas cuando el usuario presiona Enter.

\-Se deben mostrar para selección todas las superlíneas cuya denominación contiene al texto escrito por el usuario, sin ser case-sensitive pero considerando tildes.

\-Se deben traer los productos de las líneas pertenecientes a la superlinea seleccionada usando paginación, trayendo de a 10 productos.

\-Solo se deben mostrar superlineas que se encuentren activas.

&nbsp;

&nbsp;

&nbsp;

## *CR-005 Denominación automática: generar Marca \+ Línea \+ Presentación, editable manualmente. Depende de CR-002.*

Este pedido de cambio implica la adición del término “Denominación automática” al lenguaje ubicuo, pero no introduce nuevas entidades ni Value Objects, sino que se trata de un nuevo comportamiento de autocompletado/recomendación a la hora de registrar un producto: el sistema sugerirá automáticamente una denominación a partir de Marca, Línea y Presentación.&nbsp;

La decisión de diseño que se toma es que esta denominación automática esté presente solo como sugerencia en el formulario del frontend, y que no sea un valor por defecto en el backend. Esto se debe a que las denominaciones de los productos son importantes para su identificación y no queremos que se guarden por defecto sin que el usuario esté al tanto de su generación.&nbsp;

Nueva regla de negocio:

\-Al seleccionar una Marca, una Línea y una Presentación durante la creación de un Producto, la denominación automática se genera concatenando dichos valores en ese orden: Marca \+ Línea \+ Presentación.&nbsp;

&nbsp;

Historias de usuario:  
Este cambio de requerimiento no implica una nueva historia de usuario, sino criterios de aceptación adicionales en la US de Registrar Producto (no necesariamente formulados de la misma manera):  
CA-1: Al seleccionar Marca, Línea y Presentación el campo de denominación se completa automaticamente con “Marca \+ Línea \+ Presentación”.

CA-2: La denominación automática debe poder editarse manualmente.

CA-3: La denominación automática no debe sobrescribir una denominación ingresada manualmente por el usuario.

&nbsp;

## *CR-006 Actualización masiva de precios, por porcentaje o monto, por línea o global.*

&nbsp;

Este pedido de cambio no introduce una entidad o Value Object ni cambios en los agregados, pero si agrega un comportamiento de dominio importante, que representa la actualización de precio que se hace simultáneamente a varios productos, generalmente en respuesta o anticipación a la inflación.

La responsabilidad de actualizar el precio y hacer cumplir las reglas de negocio corresponderá al mismo Producto, para colocar los comportamientos en las entidades y lograr un modelo rico, como indica DDD.

El precio seguirá siendo un atributo persistido

Reglas de negocio nuevas:  
\-Un precio puede actualizarse directamente mediante la aplicación de un monto fijo o de un porcentaje, ya sea para incrementarlo o disminuirlo.

\-Cuando se realiza una actualización directa del precio mediante un monto o porcentaje, el costo deberá actualizarse de forma que se mantenga la relación precio \= costo \+ margen, conservando el margen porcentual del producto.&nbsp;

&nbsp;

Historia de Usuario:

Actualización Masiva de Precios

Como administrador de productos, quiero actualizar simultáneamente los precios de todos los productos o de los productos pertenecientes a una Línea, mediante un monto o porcentaje, para modificar rápidamente sus precios.

Criterios de aceptación:

\-Se puede seleccionar una Línea de manera opcional.

\-Se puede realizar un aumento o una disminución en los precios.

\-Se debe ingresar un monto fijo o un porcentaje de aumento, pero no ambos.

\-Los costos de los productos deben actualizarse para cumplir con precio=costo+margen.

\-El monto o porcentaje debe ser mayor  a 0\.

\-Los precios finales de todos los productos deben ser mayores a 0\.

\-Se debe mostrar denominación, costo y precio de los productos actualizados (tras la actualización).

\-Si no había ningún producto para actualizar con los criterios elegidos el sistema lo debe informar.

\-Cada producto cuyo precio sea modificado debe registrar un CambioPrecio.

&nbsp;

El último de los criterios de aceptación se desprende del CR-007 y se incluye aquí pues es necesario tenerlo presente al implementar el comportamiento.

## *CR-001 Validación de datos: evitar valores inválidos, mostrar errores claros, no permitir guardar datos incorrectos.*

Este pedido de cambio no tiene impacto en el dominio, no introduce entidades ni Value Objects, sino que es más bien un aspecto de implementación, que puede en todo caso referirse a hacer cumplir reglas de negocio existentes pero no agrega nuevas.

&nbsp;

## *CR-003 SuperLínea: una Línea pasa a pertenecer a una SuperLínea.*

Este pedido de cambio introduce un concepto nuevo, la SuperLínea, que en el dominio representa una categoría de nivel superior que agrupa Líneas.

Nos encontramos con un caso similar al de Presentación, ya que una superlínea tiene identidad y ciclo de vida propios, pudiendo existir sin una Línea o Producto particular y tener múltiples Líneas asociadas, requiriendo un ABMC propio para gestionarlo. Por estos motivos, modelamos a SuperLínea como una nueva entidad.

En cuanto a los agregados, tanto la Línea como Producto y Superlínea poseen identidad y ciclo de vida independientes, y deben poder crearse, modificarse y consultarse independientemente, por lo tanto, las modelamos como parte de agregados separados, siendo cada uno la raíz del suyo.

Se agregan al dominio los comportamientos correspondientes a la gestión de SuperLínea y se modifica el comportamiento de gestión de Línea, se deberá asegurar que tenga una SuperLínea.

Nuevas reglas de negocio:

\-Una SuperLínea puede ser utilizada para agrupar múltiples Líneas. Cada Línea debe pertenecer a una única SuperLínea. Esta regla vivirá en un servicio de dominio que valida los datos necesarios de la Línea antes de registrarla.&nbsp;

\-No se podrá eliminar una Superlínea a la que pertenezcan una o más líneas.  Esta regla de negocio vivirá en un servicio de dominio, que contendrá la política de eliminación de Superlineas.

\-No podrá haber dos Superlíneas con la misma denominación, por más de que estén lógicamente eliminadas. Esta regla de negocio residirá en un servicio de dominio.

\- La denominación de una SuperLinea es obligatoria y debe tener como máximo 255 caracteres

&nbsp;

Historias de usuario:  
Las historias de usuario “Registrar Línea” y “Modificar Línea” se verán modificadas, agregándoles los siguientes criterios de aceptación:

CA-1: El sistema debe permitir seleccionar una Superlinea previamente registrada y activa.

CA-2: La Superlinea debe ser un dato obligatorio de la Linea y se debe impedir el guardado de una Linea si no se selecciona una Superlinea.

&nbsp;

Las historias de usuario que se agregan son:

HU — Registrar SuperLínea

Como administrador de productos, quiero registrar una SuperLínea, para poder agrupar Líneas relacionadas dentro de una categoría superior.

Criterios de aceptación:

\-Se debe poder ingresar la denominación de la SuperLínea y una observación.

\-La denominación debe ser obligatoria, la observación no.

\- La denominación debe tener como máximo 255 caracteres

\-El sistema debe generar un identificador para la SuperLínea.

\-El sistema debe informar que la Superlínea fue registrada correctamente.

\-El sistema no debe permitir registrar una SuperLínea cuya denominación ya esté registrada.&nbsp;&nbsp;

&nbsp;

&nbsp;

HU — Consultar SuperLíneas

Como administrador de productos, quiero consultar las SuperLíneas registradas, para conocer las categorías superiores disponibles.

Criterios:

\-Se deben mostrar todas las SuperLíneas registradas.

\-Se debe mostrar al menos su identificador y denominación.

\-El sistema debe permitir consultar la observación de una Superlínea cuando ésta exista.

\-Si no existen Superlíneas registradas, el sistema debe informar dicha situación.

&nbsp;

HU — Modificar SuperLínea

Como administrador de productos, quiero modificar una SuperLínea, para mantener actualizada su información.

Criterios:

Se debe poder seleccionar una SuperLínea existente.

Se debe poder modificar su denominación.

La denominación debe continuar siendo obligatoria.

La denominación debe continuar respetando el máximo de 255 caracteres

&nbsp;

HU — Eliminar SuperLínea

Como administrador de productos, quiero eliminar una SuperLínea que ya no sea necesaria,

para mantener actualizadas las categorías disponibles.

&nbsp;

Criterios:

Se debe poder seleccionar una SuperLínea existente.

Se debe solicitar confirmación antes de eliminarla.

No se debe permitir eliminar una SuperLínea que tenga Líneas asociadas.

&nbsp;

&nbsp;

&nbsp;

&nbsp;

Las historias de usuario a las que, como se mencionó a lo largo de esta sección, se les deben agregar criterios de aceptación, quedan definidas de la siguiente forma.

&nbsp;

Registrar Producto

Como administrador de productos, quiero registrar un Producto, para poder administrar su información de catálogo e inventario.

* El costo es obligatorio y debe ser mayor o igual a 0\.  
* El margen es obligatorio y debe ser mayor a 0\.  
* El stockActual es obligatorio y debe ser mayor a 0\.&nbsp;  
* El stockMinimo es obligatorio y debe ser mayor a 0\.&nbsp;  
* La marca es obligatoria.  
* La línea es obligatoria.  
* La  presentación es obligatoria.  
* Se deben poder seleccionar marcas, líneas y presentaciones previamente registradas.  
* La denominación es obligatoria.  
* La denominación debe ser única.  
* La denominación debe tener como máximo 200 caracteres.  
* Al seleccionar Marca, Línea y Presentación el campo de denominación se debe completar automaticamente con “Marca \+ Línea \+ Presentación”.  
* &nbsp;La denominación automática debe poder editarse manualmente.  
* La denominación automática no debe sobrescribir una denominación ingresada manualmente por el usuario.

&nbsp;

&nbsp;

Modificar Producto

Como administrador de productos, quiero modificar un Producto, para mantener actualizada su información.

* El costo es obligatorio y debe ser mayor o igual a 0\.  
* El margen es obligatorio y debe ser mayor a 0\.  
* El stockActual es obligatorio y debe ser mayor a 0\.&nbsp;  
* El stockMinimo es obligatorio y debe ser mayor a 0\.&nbsp;  
* La marca es obligatoria.  
* La línea es obligatoria.  
* La  presentación es obligatoria.  
* Se deben poder seleccionar marcas, líneas y presentaciones previamente registradas.  
* La denominación es obligatoria.  
* La denominación debe ser única.  
* La denominación debe tener como máximo 200 caracteres.  
* Al modificar el precio de un producto, se debe registrar un Cambio de Precio.

&nbsp;

&nbsp;

Registrar Línea:

&nbsp;Como administrador de productos, quiero registrar una Línea, para poder agrupar Productos relacionados dentro de una categoría.

* El sistema debe permitir seleccionar una Superlinea previamente registrada y activa.  
* La SuperLínea es obligatoria y no se debe permitir registrar una Línea sin una SuperLínea asociada. .  
* La denominación es obligatoria y debe ser única.  
* La denominación debe tener como máximo 255 caracteres

&nbsp;

&nbsp;

&nbsp;

Modificar Línea:

&nbsp;Como administrador de productos, quiero modificar una Línea, para mantener actualizada su información.

* El sistema debe permitir seleccionar una Superlinea previamente registrada y activa.  
* La SuperLínea es obligatoria y no se debe permitir registrar una Línea sin una SuperLínea asociada. .  
* La denominación es obligatoria y debe ser única.  
* La denominación debe tener como máximo 255 caracteres.

&nbsp;

&nbsp;

&nbsp;

A partir de los cambios introducidos en el dominio por los pedidos de cambio, y considerando a Marca y Línea como entidades independientes de Producto, el modelo de dominio resultante, que contempla únicamente los conceptos y sus relaciones (sin incluir datos ni comportamientos), queda representado de la siguiente manera:&nbsp;

![][image1]&nbsp;

### **Cambios principales en el dominio**

**CR-002 — Presentación**

* Se agrega la entidad **Presentación**.  
* Pasa a ser **raíz de un agregado independiente**.  
* Tiene ABM propio.  
* `Producto` pasa a tener **una Presentación obligatoria**.  
* Una misma Presentación puede ser utilizada por varios Productos.  
* Las distintas versiones comerciales (por ejemplo, Coca-Cola 1 L y 2,5 L) se representan como **Productos diferentes**.

**CR-003 — SuperLínea**

* Se agrega la entidad **SuperLínea**.  
* Es raíz de su propio agregado.  
* `Línea` sigue siendo raíz de su propio agregado.  
* Cada Línea pasa a tener **una única SuperLínea obligatoria**.  
* Una SuperLínea puede tener muchas Líneas.

**CR-007 — Historial de precios**

* Se agrega la entidad **CambioPrecio**.  
* `CambioPrecio` pasa a formar parte del agregado `Producto`.  
* Un Producto puede tener *0.. cambios de precio*\*.  
* `Producto` incorpora el comportamiento `cambiarPrecio()`.  
* Cada cambio registra precio anterior, precio nuevo, fecha y motivo.  
* Se mantiene `precio` directamente en Producto.  
* Se agrega la invariante de que el precio anterior debe corresponder al precio vigente inmediatamente antes del cambio.

**CR-005 — Denominación automática**

* No agrega entidades ni modifica agregados.  
* `Registrar Producto` incorpora una sugerencia automática de denominación basada en **Marca \+ Línea \+ Presentación**.  
* Es un comportamiento de interfaz/aplicación, no una nueva regla de negocio del dominio.

**CR-006 — Actualización masiva**

* No agrega entidades ni agregados.  
* Se incorpora el comportamiento de actualizar masivamente precios por monto o porcentaje, globalmente o por Línea.  
* Cada `Producto` sigue siendo responsable de modificar su propio precio mediante su comportamiento.  
* La capa de aplicación coordina la actualización de múltiples Productos.  
* Debe mantenerse la regla existente `precio = costo + margen`.

&nbsp;

&nbsp;

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;┌──────────────┐

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│  SuperLínea  │

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│   \<\<AR\>\>     │

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└──────┬───────┘

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│ 1

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│ 0..\*

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;┌──────▼───────┐

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│    Línea     │

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│   \<\<AR\>\>     │

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└──────┬───────┘

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│ 0..\*

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;┌──────▼─────────────────┐

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│        Producto        │

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│        \<\<AR\>\>          │

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│                        │

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│ \- precio               │

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│ \- costo                │

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│ \- margen               │

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└───┬────────┬──────┬────┘

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│        │      │

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│        │      │ 1

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│        │      ▼

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│        │  ┌───────────────┐

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│        │  │ Presentación  │

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│        │  │    \<\<AR\>\>     │

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│        │  └───────────────┘

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│        │

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│        │ 0..\*

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│        ▼

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│   ┌───────────────┐

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│   │ CambioPrecio  │

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│   │   \<\<Entity\>\>  │

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│   └───────────────┘

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│ 1

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Marca

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\<\<AR\>\>

Falta movimientoStock

&nbsp;

&nbsp;

&nbsp;

[image1]: <data:image/png;base64,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Nz4iSqxIg14p0Ak+Xm8hOIxc7s6A8XzlXmZaMeiVTq9TolCgrenGR0SJFcugJ3vDcIgXAW6nnXay471797b1cr4aQphfX+jwcX3IYU0crsTzSHcq6KKESsegVzq9TolCgbamGx8RJVYsgx7g8C76k8NrRKCTvvAELtTw6/Vh2mIceuihgf7r/LsrUWkY9Eqn1ylRKNDWdOMjosSKbdCj6sKgVzq9TolCgbamGx8RJRaDHkWCQa90ep0ShQJtTTc+IkosBj2KBINe6fQ6JQoF2ppufESUWKkJenJnCRR0ruyT6SgUDga90ul1ShQKtDXd+IgosVIZ9FB8haZT+TDolU6vU6JQoK3pxkdEiZW6oNetWzf7v3SUjDt2yL12UcQbb7xhOnfubKeho2d0tizuu+8+22HzAw88YK/4xX104d133zWbbrqpfQzuiOHDvWjXW289W9epUye7/DRh0CudXqdEoUBb042PiCpHf0Y1Pb+SuqD397//3f5/5pln2umbb7656d69eyDoffHFF27cLwJdsPh3oLj77rvNmDFjas2PYAdLliypVecvLw0Y9Eqn1ylRKNDWdOOj5NN/5witoF8LNYxeoZqeX0ld0LvpppvsHrw11ljDTscwpqEOBbC3D/34yV4/2Qu4YMECOy597Q0aNMjdh1budYtQB82bNzfNmjWz96HFPOedd56dDrfeequdt9A9ZqsRg17p9DolCgXamm58lHz67xwhBr0S6RW66qqrBsb1/Eoqg57cNxf3icX/CGKNGzd2QQ+GDBnipknB4VeQoOfD+Prrrx+Y5hsxYkRgWSgSCtOAQa90ep0ShQJtTTc+Sj79dy6Hl156yTzzzDN6ssagVyJ/ZeIwpJq0vM9r6oLe2LFj7bl0GN5www3d+vKD3sYbb2yHW7VqZT766CN3n11/j16LFi3csgH1uG1aPjfeeKOtb9++vQ2XeA0Y5x49agi9TolCgbamGx8ln/47l8P48ePNI488oidrDHolkhWJwR133DFf0NtQPcSXuqD34IMP2nEMS4GVVlrJDcthWNxTF9q1a2fH/aCHEOiTZUl469Klix2fOnWqGxann356YN40YNArnV6nRKFAW9ONj5JP/53LgUEvGrIiX3zxRfu/N8mNZ8tH2dIn+Egr9UEPoQ78oCf30N1ss81M//793bzfffedrc8X9GQ+nPt3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fv75Z3PMMce4x7/zzjvuMRMmTDCtWrVKekhi0COiNGPQI0oqUyDode/e3ey7775uug9Br3///m4cQe+II46ww3j8Tz/95OqEetqkCT3o6fUVBv2cRET1xKBHlFSmQNC7+eabTZs2bdx0mYZDussLenfffbermz17thk7dmzSQwaDHhFVlP48p9Szer0Q0XKYXNC78MIL7aeoZlINDHfq1Ml89dVXpn379oFz9AoFvZdfftk+Dsu78847TePGjc2oUaOSHjIiDXo4bO6H5XLRz0lEyaE/zynFoEfUUNkPzjm40KJjx47mhx9+sP/7Ro4caadhr5yYNWuWDSPil19+MYMHD3bj2Ou3xx57mB122MEsXLjQTtPPmzChB7311lvPPPDAA3ZdnXjiiebWW29167Nc9HMSUXLoz3NKMegRNZThnTHqI/Sgt+aaa7qgFxb9nESUHPrzXIrXXnvNfPLJJ3pyEjDoETWUYdCrj7CD3gOZmuXbQ+L77befueqqq+x6k25upLRo0cKt0xVWWMGsv/76rq5Xr16ubsUVVww8LrccIkoo9+Eug3//+98MekRpYRj06iPsoBfYo+cHPfRJuHTpUrceN910U9ttTW6dmldeecUOz5kzx44DOrped9113WMWL15sVl999VBfPxGFC5/lN998M/ADDj/2cMqN2HHHHV3dCSec4KavvPLKZrvttrPTDznkEDfPOefUfP3ff//9bhq6w5I+UtHp/cSJE10dliH0j1CER/Hcc88F6vAdBPPnzw9Mf+GFF9xjfDNmzAjMd/bZZ0sVgx5VRKBBJq3IBz1s+nlZgiVf0MOXI+r23ntvV/BFK+fvoc4n43gsusfxH6efr4JlaIaIGgyfbQl6EsRuuOEGG+Jgn332MQcccEDu28DYOxddcMEFdhjz4OI44e/R++CDD+xFcwIXgiHsAYIejhoIPDfO0YaVVlrJfPnll3YY/as2a9bMLhPBE/N98803tu7oo482nTt3do+X87Z//PFHOy4h0Ifp/h5Hbz4GPaoINMLEMtyjFwv5gh6+PDM13+956ToZP/fcc82nn34aqAP1lJXAoEdUJHyGJeipz7X7//XXX7fBDeXRRx81q666qq1D0POPDPhBDz8K//CHP7jHoWBZCFYIeuhJQSAQPvTQQ3YY8/iPOfLII81mm21m/vnPf5p27dq5x4iPP/7Y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>