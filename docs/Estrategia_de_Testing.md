# Estrategia de Testing — Proyecto1_Back

> Guía de lineamientos del equipo. Define **qué se testea, cómo se testea y en qué capa**, para el módulo de gestión de productos. Es el estándar de referencia para escribir y revisar tests: un test que no cumple estos lineamientos se corrige o se elimina.

## 1. Alcance

### 1.1. Fuera del alcance

- Los módulos de **autenticación, configuración y demás** módulos no relacionados con gestión de productos.
- Todo lo relacionado a **`ProductoOperacion`**.
- El **código sin uso detectado** (validadores y métodos que nunca se llaman, endpoints que el frontend no usa) y sin documentación, cuya utilidad y permanencia en la base de código están en duda. Esto se maneja en la sección de **deuda técnica**, principalmente en la tercera entrega del proyecto.
- Los **CRUDs simples** de persistencia (ver §4.4).
- El **frontend automatizado** (ver §5).

---

## 2. Qué se testea

### 2.1. El caso de prueba es la unidad de trabajo

El caso de prueba es la unidad de trabajo en base a la cual se lleva a cabo el testing, mediante distintas técnicas. **El testing sin su caso de prueba no se considera testing**: antes de escribir un test, existe el caso que lo justifica.

No se busca cubrir la totalidad de las funcionalidades y los escenarios posibles del sistema, lo cual generaría una gran carga de trabajo sin un aporte de valor proporcional.

### 2.2. Criterios de prioridad

Se elaboran casos de prueba para, en este orden de prioridad:

1. **Reglas de negocio y operaciones de dominio** identificadas, tanto las incorporadas por los pedidos de cambio como las ya existentes, presentes en `validators`, domain services y entidades. **Estos casos tienen prioridad para su implementación.**
2. **Funcionalidades agregadas por los CR y sus criterios de aceptación**, definidos en las historias de usuario correspondientes.
3. **Funcionalidades preexistentes ya en funcionamiento**, para las que no se cuenta con criterios de aceptación documentados. Los casos se dirigen a los aspectos de su comportamiento actual con **mayor riesgo de verse afectados por los cambios introducidos durante el proyecto**, o de mayor complejidad/criticidad para el negocio. Funcionan como **pruebas de regresión**: no se busca revalidar la totalidad del comportamiento preexistente, sino los puntos donde un cambio no detectado tendría mayor impacto, o un fallo frenaría la operación del negocio.

Con este enfoque, el esfuerzo se concentra en los **flujos de mayor riesgo** del sistema y en sus **reglas de negocio**, en lugar de perseguir una cobertura superficial y pareja de todo el sistema.

### 2.3. No se define un porcentaje mínimo de cobertura

**No definimos un porcentaje mínimo de cobertura**, considerando que un cálculo como ese estaría contabilizando código que no debe ser testeado. La definición de qué tanto testear se basa en el **valor que las pruebas aportan**, no en cumplir con un cierto porcentaje.

### 2.4. Granularidad de los casos

- La cantidad de casos elaborados para una funcionalidad depende de su **complejidad** y de su **criticidad**.
- Si bien no es una buena práctica, como compromiso costo/beneficio **se permite que un caso de prueba cubra más de un criterio de aceptación**.
- Cada regla debe cubrir sus **escenarios relevantes**, incluyendo **casos límite** e **interacciones reales entre condiciones** cuando el comportamiento depende de su combinación.
- Para las historias de usuario ya implementadas **sin criterios de aceptación documentados**, los casos se dirigen a las **reglas de negocio identificadas**, la integración exitosa de las capas y el cumplimiento de las funcionalidades.

---

## 3. Cómo se hacen los tests

### 3.1. Niveles y herramientas

| Nivel | Herramienta | Archivo | Cuándo |
|-------|-------------|---------|--------|
| **Unitario** | Jest + `@nestjs/testing` | `*.spec.ts` | Reglas de dominio aisladas, orquestación de servicios, validación declarativa de DTOs. Sin I/O. |
| **Integración** | Jest + MySQL 8 real vía **Testcontainers** | `*.int-spec.ts` | Lo que depende de la base de datos real: colación, ordenamiento, joins, `LIKE`, filtros y soft-delete. |
| **Contrato HTTP** | Jest + **Supertest** sobre la app Nest | `*.spec.ts` | Un camino de éxito y uno de fracaso por endpoint: tipos, formatos y códigos de respuesta. |
| **Manual (E2E + UI)** | — | — | Flujo completo del sistema y totalidad del frontend (ver §5). |

**Elegir el nivel correcto es parte del caso de prueba.** La regla de decisión es: *¿qué puede fallar acá que un nivel inferior no detectaría?* Si la respuesta involucra la base de datos real, el test es de integración; si es una regla pura de dominio, es unitario.

### 3.2. Reglas de implementación

1. **No mockear aquello que se quiere validar.** Un mock de repositorio no prueba que la expresión de colación distinga acentos, ni que el `ORDER BY` ordene. Si la regla vive en la DB, el test va contra la DB.
2. **Un caso de prueba = un comportamiento observable.** El título del `it(...)` describe el comportamiento verificado, no el método invocado.
3. **Estructura Given / When / Then** (o Arrange / Act / Assert). El caso Gherkin del catálogo (§6) se traduce en esa misma estructura.
4. **Un test debe poder fallar por una sola razón.** Si un `it` puede romperse por dos causas independientes, son dos casos.
5. **Cubrir el camino de error, no solo el exitoso.** Por cada regla: el escenario válido, el límite y el rechazo.
6. **Trazar el test a su caso de prueba.** El nombre del test y su ubicación deben permitir identificar qué caso del catálogo cubre.
7. **No afirmar un resultado sin haberlo ejecutado.** Un test escrito no es un test que pasa.

### 3.3. Cómo se ejecutan

| Comando | Qué corre | Notas |
|---------|-----------|-------|
| `yarn test` | Unitarios (`*.spec.ts`), excluye `*.int-spec.ts` | `jest.config.js`, con `collectCoverage: true` |
| `yarn test:integration` | Integración (`*.int-spec.ts`) | `jest.config.integration.js`; **requiere Docker** para levantar el contenedor MySQL 8 |
| `yarn test:cov` | Unitarios con cobertura | `jest --coverage` |

Dos consideraciones operativas verificadas en este repositorio:

- **`yarn test` colecta cobertura y puede enmascarar fallos.** Para correr un archivo puntual, usar el binario de Jest directamente:
  `node node_modules/jest/bin/jest.js --runTestsByPath <ruta-al-spec> --coverage=false`
- **En Windows, `yarn.cmd` / `yarn.ps1` rompen paths con caracteres no ASCII** (la ruta de este repositorio contiene `año`). Para corridas de Jest, invocar el binario directo en lugar del wrapper.

**Las de integración se saltan o fallan sin Docker; nunca pasan silenciosamente.** Un test de integración que no se pudo ejecutar no es un test aprobado.

---

## 4. Políticas por capa

Las capas se listan en **orden de prioridad** (de mayor a menor impacto y valor). Estas políticas son la **guía de nivel e implementación** para los casos de prueba, no un mandato ni un compromiso de testing.

### 4.1. Capa de dominio

- **Pruebas unitarias** para `validators` y métodos de entidad.
- **Pruebas de integración** para los servicios de dominio que dependen de la interacción con otros componentes.
- Cobertura de los **escenarios relevantes de cada regla**, incluyendo casos límite e **interacciones reales entre condiciones** cuando el comportamiento depende de su combinación, dado que este es el punto crítico donde el sistema no puede fallar.

### 4.2. Capa de aplicación — Endpoints (controllers)

- **Pruebas de integración representativas** para evaluar el funcionamiento en conjunto de las capas y el cumplimiento del contrato.
- **No se testean todos los escenarios posibles** a este nivel, pues no se pretende repetir lo que ya se prueba en la capa de dominio.
- En general, cada endpoint prueba **al menos un camino de éxito y uno de fracaso** para evaluar los tipos y formatos de las respuestas.

### 4.3. Capa de aplicación — Servicios

- **Pruebas unitarias con mocks** para probar la correcta orquestación.
- **No se pretende probar todos los métodos o flujos.** Se evitan especialmente aquellos donde no hay condiciones evaluadas (solo delegación), y se testean únicamente los que tienen **cierta lógica o decisiones** sobre la secuencia de operaciones.

### 4.4. Capa de persistencia

- **Pruebas de integración** específicamente para las consultas que tengan **cierta lógica propia** (por ejemplo, un ordenamiento o un filtro según un criterio).
- **No** para CRUDs simples.

### 4.5. DTO

- **Pruebas unitarias** para los DTO que tengan **validaciones declarativas**: se instancian con distintos tipos de valores válidos e inválidos.
- Así se evita testear cada endpoint con múltiples casos de datos inválidos.

### 4.6. Prioridad y reasignación ante restricciones

El orden en que se nombran las capas establece también la **prioridad** de su realización, considerando el impacto en el sistema y el valor que aportan. Ante restricciones de tiempo, el esfuerzo se reasigna en ese mismo orden:

- Las capas de **dominio, endpoints y servicios de aplicación** se garantizan siempre, por concentrar el riesgo de negocio real.
- La cobertura de **persistencia y DTO** puede reducirse o postergarse, dado su menor riesgo relativo (la persistencia solo aplica a consultas con lógica propia ya acotadas, y las validaciones de DTO quedan parcialmente cubiertas por el caso de contrato a nivel de endpoint).
- Si esto ocurre, se documenta explícitamente **qué pruebas quedaron pendientes y su justificación de riesgo**, en lugar de intentar cubrir todo el alcance de forma superficial.

### 4.7. Mecanismos transversales

Los mecanismos compartidos por todos los endpoints (autenticación, parsing de requests, manejo global de excepciones) se prueban **una única vez** sobre un endpoint representativo, dado que su comportamiento no depende del endpoint particular sino de un middleware/filtro común. **No se replican estos casos en cada endpoint.**

---

## 5. E2E y frontend

Para evaluar el funcionamiento del sistema en conjunto se realizan **pruebas E2E de forma manual**, dentro de las cuales queda incluida la **totalidad del testing de frontend**.

El equipo opta por resolver el testing de frontend de esta manera ya que:

- El **riesgo real** de cada pieza involucrada (reglas de negocio, paginación, filtros) ya está cubierto por tests automatizados en la capa de backend donde esa lógica efectivamente vive.
- **Automatizar el flujo completo de frontend** implica un costo de implementación y mantenimiento (entorno completo, fragilidad ante cambios de UI) que, comparado al valor que agrega a las pruebas manuales, **no se justifica** para este proyecto.

### 5.1. Cuándo una interacción se considera prueba manual

Se consideran casos de prueba **manuales** aquellas interacciones de UI que combinan datos ya validados por sus endpoints de origen **sin agregar lógica condicional propia**.

Ejemplo: la selección de una marca/línea existente al cargar un producto. Los endpoints que exponen esas listas ya están cubiertos por tests de integración de contrato, y el desplegable solo bindea esos datos, sin decisiones adicionales; por lo tanto, la interacción se verifica manualmente.

---

## 6. Catálogo de casos de prueba (Gherkin)

Se desarrollan a continuación los casos de prueba usando Gherkin. Cada caso es la unidad de trabajo a implementar según los lineamientos de §3 y §4.

### 6.1. Feature: Historial de precios de un producto

```gherkin
Feature: Historial de precios de un producto
  Como administrador financiero
  Quiero consultar el historial de precios de un producto
  Para analizar su evolución y mantener la trazabilidad de sus cambios de precio

  Background:
    Given existe un producto "Coca-Cola 1L" con un precio actual de 100
    And el producto se encuentra disponible para consultar su historial de precios

  Scenario: Registrar un cambio de precio y consultarlo en el historial — CP-01
    Given el producto tiene un precio actual de 100
    And el producto no tiene cambios de precio registrados
    When se modifica su precio a 120 mediante una operación de edición
    And se consulta el historial de precios del producto
    Then el producto debe tener un precio actual de 120
    And el historial debe contener un cambio de precio
    And el cambio debe mostrar un precio anterior de 100
    And el cambio debe mostrar un precio nuevo de 120
    And el cambio debe mostrar una fecha
    And el cambio debe mostrar el motivo "ActualizaciónDePrecioDirecta"

  Scenario: Mantener la continuidad del historial entre cambios sucesivos — CP-02
    Given el producto tiene un precio actual de 100
    When se modifica su precio a 120 mediante una operación de edición
    And posteriormente se modifica su precio a 150 mediante una operación de edición
    And se consulta el historial de precios del producto
    Then el cambio más reciente debe tener un precio anterior de 120 y un precio nuevo de 150
    And el cambio anterior debe tener un precio anterior de 100 y un precio nuevo de 120

  Scenario: Error en la continuidad del historial entre cambios sucesivos — CP-03
    Given el producto tiene un precio actual de 100
    And su CambioPrecio más reciente tiene un precioNuevo=80
    When se modifica su precio a 120 mediante una operación de edición
    Then el sistema debe informar del error en la trazabilidad de los cambios de precio

  Scenario Outline: Rechazar un cambio a un precio no válido — CP-04
    Given el producto tiene un precio actual de 100
    When se intenta modificar su precio a <precio>
    Then la modificación debe ser rechazada
    And el precio del producto debe continuar siendo 100
    And no se debe registrar un nuevo CambioPrecio

    Examples:
      | precio |
      | 0      |
      | -10    |

  Scenario Outline: Consultar el historial utilizando páginas de hasta 10 cambios — CP-05
    Given el producto posee <cantidad> cambios de precio registrados
    When se consulta la página <pagina> del historial
    Then se deben mostrar <resultado> cambios de precio
    And los cambios mostrados deben corresponder a la página solicitada
    And los cambios deben estar ordenados del más reciente al más antiguo

    Examples:
      | cantidad | pagina | resultado |
      | 5        | 1      | 5         |
      | 10       | 1      | 10        |
      | 11       | 1      | 10        |
      | 11       | 2      | 1         |
      | 20       | 1      | 10        |
      | 20       | 2      | 10        |

  Scenario: Consultar el historial de un producto sin cambios de precio — CP-06
    Given el producto no posee cambios de precio registrados
    When se consulta su historial de precios
    Then el sistema debe devolver una lista vacía
    And el sistema debe informar que no existen registros de cambios de precio

  Scenario: Rechazar un cambio de precio sin motivo — CP-07
    Given el producto tiene un precio actual de 100
    When se intenta modificar su precio a 120 sin proporcionar un motivo
    Then la operación debe ser rechazada
    And el precio del producto debe continuar siendo 100
    And no se debe registrar un CambioPrecio

  Scenario: Actualizar un producto sin enviar precio — CP-08
    Given existe un producto con precio actual 100
    And el producto no tiene cambios de precio registrados
    When se realiza un PUT del producto con el campo precio igual a 100
    Then la actualización debe realizarse correctamente
    And el precio del producto debe continuar siendo 100
    And el historial de precios del producto debe continuar vacío

  Scenario: Consultar el historial de precios de un producto inexistente — CP-09
    Given no existe un producto con ID 99999
    When se solicita el historial de precios del producto 99999
    Then el sistema debe devolver un error indicando que el producto no se encontró
    And no debe devolver un historial de precios
```

### 6.2. Feature: Gestión de marca

```gherkin
Feature: Gestión de marca
  Background:
    Given existe una marca "Coca-Cola"
    And existen los usuarios y permisos necesarios para gestionar marcas

  Scenario: Crear una marca con una denominación única y longitud válida — CP-10
    Given no hay marca registrada con denominación "Pepsi"
    When se registra una marca con denominación "Pepsi"
    Then la marca debe registrarse correctamente
    And debe quedar disponible para futuras consultas

  Scenario: Registrar una marca con una denominación ya utilizada — CP-11
    Given existe una marca con denominación "Coca-Cola"
    When se intenta registrar otra marca con denominación "Coca-Cola"
    Then la operación debe ser rechazada
    And no se debe crear una nueva marca

  Scenario: Registrar una marca con una denominación demasiado larga — CP-12
    When se registra una marca cuya denominación supera los 255 caracteres
    Then la operación debe ser rechazada
    And no se debe crear la marca

  Scenario: Buscar todas las marcas — CP-13
    Given existen las marcas "Coca-Cola", "Coca-Cola Zero" y "Pepsi"
    When se buscan marcas sin especificar una denominación
    Then deben devolverse "Coca-Cola", "Coca-Cola Zero" y "Pepsi"

  Scenario: Consultar una marca existente por su identificador — CP-14
    Given existe una marca con ID 1
    When se solicita la marca con ID 1
    Then el sistema debe devolver la marca correspondiente

  Scenario: Actualizar una marca existente con datos válidos — CP-15
    Given existe una marca con ID 1 y denominación "Coca Cola"
    And no existe una marca con denominación "Coca Cola"
    When se actualiza la marca 1 con denominación "Coca Cola Company"
    Then la marca debe actualizarse correctamente
    And su denominación debe ser "Coca Cola Company"

  Scenario: Rechazar eliminación de marca utilizada por productos activos — CP-16
    Given existe una marca asociada a al menos un producto activo
    When se solicita eliminar la marca
    Then la política de eliminación debe rechazar la operación

  Scenario: Eliminar una marca que no tiene productos activos — CP-17
    Given existe una marca con productos asociados, todos ellos inactivos
    When se solicita eliminar la marca
    Then la marca debe eliminarse correctamente
    And no debe aparecer entre las marcas activas
```

### 6.3. Feature: Registrar producto

```gherkin
Feature: Registrar producto
  Como administrador de productos
  Quiero registrar un producto
  Para administrar su información de catálogo e inventario

  Background:
    Given existe una marca activa "Coca-Cola"
    And existe una línea activa "Gaseosas"
    And existe una presentación activa "Botella 1 L"

  Scenario: Registrar un producto con todos sus datos válidos — CP-18
    Given no existe un producto con denominación "Coca-Cola Gaseosas Botella 1 L"
    When se registra un producto con los siguientes datos:
      | denominación                   | costo | margen | stockActual | stockMínimo | marca     | línea    | presentación |
      | Coca-Cola Gaseosas Botella 1 L | 100   | 20     | 10          | 5           | Coca-Cola | Gaseosas | Botella 1 L  |
    Then el producto debe registrarse correctamente
    And debe generarse un identificador para el producto
    And el producto debe quedar disponible para futuras consultas

  Scenario Outline: Rechazar el registro cuando falta un dato obligatorio — CP-19
    Given se completaron correctamente los demás datos del producto
    When se intenta registrar el producto sin indicar <campo>
    Then la operación debe ser rechazada
    And se debe informar claramente que <campo> es obligatorio
    And no se debe guardar el producto

    Examples:
      | campo        |
      | costo        |
      | margen       |
      | stockActual  |
      | stockMínimo  |
      | marca        |
      | línea        |
      | presentación |
      | denominación |

  Scenario Outline: Rechazar valores numéricos inválidos al registrar — CP-20
    Given no existe otro producto con la denominación ingresada
    When se intenta registrar un producto con <campo> igual a <valor>
    Then la operación debe ser rechazada
    And se debe informar claramente que el valor de <campo> es inválido
    And no se debe guardar el producto

    Examples:
      | campo       | valor |
      | costo       | -1    |
      | margen      | 0     |
      | margen      | -1    |
      | stockActual | 0     |
      | stockActual | -1    |
      | stockMínimo | 0     |
      | stockMínimo | -1    |

  Scenario: Aceptar costo igual a cero al registrar — CP-21
    Given no existe otro producto con la denominación ingresada
    When se registra un producto con costo igual a 0 y los demás datos válidos
    Then el producto debe registrarse correctamente

  Scenario: Rechazar una denominación duplicada al registrar — CP-22
    Given existe un producto con denominación "Coca-Cola Gaseosas Botella 1 L"
    When se intenta registrar otro producto con la misma denominación
    Then la operación debe ser rechazada
    And se debe informar claramente que la denominación ya está en uso
    And no se debe crear un nuevo producto

  Scenario Outline: Validar el límite de 200 caracteres de la denominación — CP-23
    Given no existe otro producto con la denominación ingresada
    When se intenta registrar un producto cuya denominación tiene <cantidad> caracteres
    Then el registro <resultado>

    Examples:
      | cantidad | resultado         |
      | 200      | debe ser aceptado |
      | 201      | debe ser rechazado |

  Scenario: Seleccionar referencias previamente registradas — CP-24
    When el administrador completa el formulario de registro
    Then debe poder seleccionar la marca "Coca-Cola"
    And debe poder seleccionar la línea "Gaseosas"
    And debe poder seleccionar la presentación "Botella 1 L"

  Scenario: Rechazar el registro con una presentación que no está activa — CP-25
    Given existe una presentación inactiva "Botella 2 L"
    When se intenta registrar un producto asociado a la presentación "Botella 2 L"
    Then la operación debe ser rechazada
    And no se debe guardar el producto

  Scenario: Generar automáticamente la denominación — CP-26
    When el administrador selecciona la marca "Coca-Cola"
    And selecciona la línea "Gaseosas"
    And selecciona la presentación "Botella 1 L"
    Then el campo denominación debe completarse con "Coca-Cola Gaseosas Botella 1 L"

  Scenario: Editar manualmente la denominación sugerida — CP-27
    Given el sistema sugirió la denominación "Coca-Cola Gaseosas Botella 1 L"
    When el administrador la cambia por "Coca-Cola Original 1 L"
    Then el campo denominación debe conservar "Coca-Cola Original 1 L"
    And el producto debe poder registrarse con esa denominación si los demás datos son válidos

  Scenario: No sobrescribir una denominación ingresada manualmente — CP-28
    Given el administrador ingresó manualmente "Coca-Cola Original 1 L" como denominación
    When selecciona o modifica la marca, la línea o la presentación
    Then el sistema no debe sobrescribir la denominación ingresada manualmente
```

### 6.4. Feature: Modificar producto

```gherkin
Feature: Modificar producto
  Como administrador de productos
  Quiero modificar un producto
  Para mantener actualizada su información

  Background:
    Given existe un producto "Coca-Cola Gaseosas Botella 1 L"
    And el producto tiene costo 100, margen 20, stockActual 10 y stockMínimo 5
    And el producto está asociado a una marca, una línea y una presentación registradas

  Scenario: Modificar un producto con datos válidos sin cambiar su precio — CP-29
    Given el producto tiene un precio actual de 120
    And no posee cambios de precio registrados
    When se modifica su denominación a "Coca-Cola Original Botella 1 L"
    Then la actualización debe realizarse correctamente
    And el precio debe continuar siendo 120
    And no se debe registrar un CambioPrecio

  Scenario Outline: Rechazar una actualización cuando falta un dato obligatorio — CP-30
    Given se mantienen correctamente los demás datos del producto
    When se intenta actualizar el producto sin indicar <campo>
    Then la operación debe ser rechazada
    And se debe informar claramente que <campo> es obligatorio
    And el producto debe conservar sus datos anteriores

    Examples:
      | campo        |
      | costo        |
      | margen       |
      | stockActual  |
      | stockMínimo  |
      | marca        |
      | línea        |
      | presentación |
      | denominación |

  Scenario Outline: Rechazar valores numéricos inválidos al actualizar — CP-31
    When se intenta actualizar el producto con <campo> igual a <valor>
    Then la operación debe ser rechazada
    And se debe informar claramente que el valor de <campo> es inválido
    And el producto debe conservar sus datos anteriores

    Examples:
      | campo       | valor |
      | costo       | -1    |
      | margen      | 0     |
      | margen      | -1    |
      | stockActual | 0     |
      | stockActual | -1    |
      | stockMínimo | 0     |
      | stockMínimo | -1    |

  Scenario Outline: Validar el límite de la denominación al actualizar — CP-32
    Given la nueva denominación no pertenece a otro producto
    When se actualiza la denominación con un texto de <cantidad> caracteres
    Then la actualización <resultado>

    Examples:
      | cantidad | resultado         |
      | 200      | debe ser aceptada |
      | 201      | debe ser rechazada |

  Scenario: Rechazar una denominación perteneciente a otro producto — CP-33
    Given existe otro producto con denominación "Pepsi Gaseosas Botella 1 L"
    When se intenta asignar esa denominación al producto
    Then la operación debe ser rechazada
    And ambos productos deben conservar sus denominaciones anteriores

  Scenario: Registrar el historial al modificar el precio — CP-34
    Given el producto tiene un precio actual de 120
    And no tiene cambios de precio registrados
    When se modifica su precio a 150 mediante una operación de edición
    Then el precio actual del producto debe ser 150
    And se debe registrar un CambioPrecio con precioAnterior 120
    And el CambioPrecio debe tener precioNuevo 150
    And el CambioPrecio debe tener una fecha
    And el CambioPrecio debe tener el motivo correspondiente a la actualización directa

  Scenario Outline: Rechazar un nuevo precio no positivo — CP-35
    Given el producto tiene un precio actual de 120
    And no tiene cambios de precio registrados
    When se intenta modificar su precio a <precio>
    Then la actualización debe ser rechazada
    And el precio debe continuar siendo 120
    And no se debe registrar un CambioPrecio

    Examples:
      | precio |
      | 0      |
      | -10    |

  Scenario: Rechazar un cambio de precio sin motivo — CP-36
    Given el producto tiene un precio actual de 120
    When se intenta modificar su precio a 150 sin proporcionar un motivo
    Then la actualización debe ser rechazada
    And el precio debe continuar siendo 120
    And no se debe registrar un CambioPrecio

  Scenario: Mantener la continuidad entre cambios de precio sucesivos — CP-37
    Given el producto tiene un precio actual de 100
    When se modifica su precio a 120
    And posteriormente se modifica su precio a 150
    Then el cambio más reciente debe tener precioAnterior 120 y precioNuevo 150
    And el cambio anterior debe tener precioAnterior 100 y precioNuevo 120

  Scenario: Rechazar una actualización de un producto inexistente — CP-38
    Given no existe un producto con ID 99999
    When se intenta actualizar el producto 99999 con datos válidos
    Then la operación debe ser rechazada
    And se debe informar claramente que el producto no existe
```

### 6.5. Feature: Actualización masiva de precios de productos

```gherkin
Feature: Actualización masiva de precios de productos
  Como administrador de productos
  Quiero actualizar simultáneamente los precios
  Para modificar rápidamente los productos de una línea o todo el catálogo

  Background:
    Given existen productos activos con precio, costo y margen válidos

  Scenario Outline: Actualizar precios globalmente mediante un único ajuste — CP-39
    When se solicita <operación> globalmente los precios mediante <tipo> con valor <valor>
    Then deben actualizarse todos los productos alcanzados
    And sus costos deben actualizarse conservando el margen porcentual de cada producto
    And debe mantenerse la relación entre precio, costo y margen
    And cada producto modificado debe registrar un CambioPrecio con motivo de actualización global

    Examples:
      | operación | tipo       | valor |
      | aumentar  | monto fijo | 20    |
      | disminuir | monto fijo | 20    |
      | aumentar  | porcentaje | 10    |
      | disminuir | porcentaje | 10    |

  Scenario Outline: Actualizar precios de una línea mediante un único ajuste — CP-40
    Given existe la línea "Gaseosas" con productos asociados
    And existen productos pertenecientes a otras líneas
    When se solicita <operación> los precios de la línea "Gaseosas" mediante <tipo> con valor <valor>
    Then solo deben actualizarse los productos de la línea "Gaseosas"
    And los productos de otras líneas deben conservar sus valores
    And los costos actualizados deben conservar el margen porcentual de cada producto
    And cada producto modificado debe registrar un CambioPrecio con motivo de actualización por línea

    Examples:
      | operación | tipo       | valor |
      | aumentar  | monto fijo | 20    |
      | disminuir | monto fijo | 20    |
      | aumentar  | porcentaje | 10    |
      | disminuir | porcentaje | 10    |

  Scenario: Rechazar una actualización con monto y porcentaje simultáneamente — CP-41
    When se solicita una actualización con monto fijo 20 y porcentaje 10
    Then la operación debe ser rechazada
    And ningún producto debe modificar su precio ni su costo
    And no se debe registrar ningún CambioPrecio

  Scenario: Rechazar una actualización sin monto ni porcentaje — CP-42
    When se solicita una actualización sin indicar monto fijo ni porcentaje
    Then la operación debe ser rechazada
    And ningún producto debe modificar su precio ni su costo
    And no se debe registrar ningún CambioPrecio

  Scenario Outline: Rechazar un valor de ajuste no positivo — CP-43
    When se solicita una actualización mediante <tipo> con valor <valor>
    Then la operación debe ser rechazada
    And ningún producto debe modificar su precio ni su costo
    And no se debe registrar ningún CambioPrecio

    Examples:
      | tipo       | valor |
      | monto fijo | 0     |
      | monto fijo | -10   |
      | porcentaje | 0     |
      | porcentaje | -10   |

  Scenario: Rechazar una disminución que produzca algún precio no positivo — CP-44
    Given existe un producto alcanzado cuyo precio es 50
    When se solicita disminuir los precios mediante un monto fijo de 50
    Then la operación debe ser rechazada
    And ningún producto alcanzado debe quedar parcialmente actualizado
    And no se debe registrar ningún CambioPrecio por la operación rechazada

  Scenario: Informar que no existen productos para actualizar — CP-45
    Given existe una línea activa "Sin productos"
    And la línea no posee productos para actualizar
    When se solicita aumentar sus precios un 10 por ciento
    Then el sistema debe informar que no existen productos que cumplan los criterios
    And no se debe registrar ningún CambioPrecio

  Scenario: Mostrar el resultado de la actualización masiva — CP-46
    Given existen productos que cumplen los criterios seleccionados
    When se ejecuta correctamente una actualización masiva
    Then el resultado debe mostrar la denominación, el costo y el precio de los productos actualizados
```

### 6.6. Feature: Gestión de Línea

```gherkin
Feature: Gestión de Línea
  Como administrador de productos
  Quiero gestionar Líneas asociadas a una SuperLínea
  Para organizar los Productos dentro de categorías válidas

  Background:
    Given que existe un usuario autorizado para gestionar productos
    And que las entidades indicadas como activas no están eliminadas lógicamente

  Scenario: Registrar una Línea con una única SuperLínea activa — CP-47
    Given que existe la SuperLínea activa "Bebidas"
    And que no existe otra Línea denominada "Sin Alcohol"
    When se registra la Línea "Sin Alcohol" seleccionando la SuperLínea "Bebidas"
    Then se debe crear la Línea con un identificador único
    And la Línea debe quedar asociada solamente a la SuperLínea "Bebidas"

  Scenario Outline: Rechazar el registro sin una SuperLínea activa válida — CP-48
    Given que se completaron los demás datos válidos de una Línea
    When se intenta registrar la Línea con <condicion_superlinea>
    Then el registro debe ser rechazado
    And no se debe persistir la Línea

    Examples:
      | condicion_superlinea                                     |
      | el identificador omitido                                 |
      | un identificador nulo                                    |
      | el identificador de una SuperLínea inexistente           |
      | el identificador de una SuperLínea eliminada lógicamente |

  Scenario Outline: Validar la denominación al registrar una Línea — CP-49
    Given que existe una SuperLínea activa seleccionada
    When se intenta registrar una Línea con <denominacion>
    Then el registro debe producir <resultado>

    Examples:
      | denominacion                                                  | resultado                                       |
      | una cadena vacía                                              | rechazo por denominación obligatoria            |
      | una cadena de 255 caracteres                                  | aceptación respecto del límite de longitud      |
      | una cadena de 256 caracteres                                  | rechazo por superar el máximo de 255 caracteres |
      | la denominación de otra Línea activa                          | rechazo por falta de unicidad                   |
      | maquinas, cuando existe otra Línea activa denominada Máquinas | rechazo por falta de unicidad                   |
      | la denominación de otra Línea eliminada lógicamente           | rechazo por falta de unicidad                   |

  Scenario: Modificar una Línea y reasignarla a otra SuperLínea activa — CP-50
    Given que la Línea "Sin Alcohol" pertenece a la SuperLínea activa "Bebidas"
    And que existe la SuperLínea activa "Hogar"
    When se modifica la Línea seleccionando la SuperLínea "Hogar"
    Then la modificación debe realizarse correctamente
    And la Línea debe quedar asociada solamente a la SuperLínea "Hogar"

  Scenario: Conservar la asociación al modificar otros datos de una Línea — CP-51
    Given que la Línea "Sin Alcohol" pertenece a la SuperLínea activa "Bebidas"
    When se modifica únicamente la observación de la Línea
    Then la Línea debe conservar su asociación con "Bebidas"
    And debe continuar teniendo una única SuperLínea

  Scenario Outline: Rechazar una reasignación inválida al modificar una Línea — CP-52
    Given que existe una Línea asociada a una SuperLínea activa
    When se intenta reasignarla a <condicion_superlinea>
    Then la modificación debe ser rechazada
    And se debe conservar la asociación anterior

    Examples:
      | condicion_superlinea                                     |
      | un identificador nulo                                    |
      | el identificador de una SuperLínea inexistente           |
      | el identificador de una SuperLínea eliminada lógicamente |

  Scenario Outline: Validar la denominación al modificar una Línea — CP-53
    Given que existe una Línea asociada a una SuperLínea activa
    When se intenta modificar su denominación con <denominacion>
    Then la modificación debe producir <resultado>

    Examples:
      | denominacion                                                  | resultado                                       |
      | una cadena vacía                                              | rechazo por denominación obligatoria            |
      | una cadena de 255 caracteres                                  | aceptación respecto del límite de longitud      |
      | una cadena de 256 caracteres                                  | rechazo por superar el máximo de 255 caracteres |
      | la denominación de otra Línea activa                          | rechazo por falta de unicidad                   |
      | maquinas, cuando existe otra Línea activa denominada Máquinas | rechazo por falta de unicidad                   |
      | la denominación de otra Línea eliminada lógicamente           | rechazo por falta de unicidad                   |
      | la denominación actual de la misma Línea                      | aceptación sin conflicto consigo misma          |

  Scenario: Consultar el detalle de una Línea con su SuperLínea — CP-54
    Given que existe la Línea activa "Sin Alcohol" asociada a "Bebidas"
    When se consulta el detalle de la Línea
    Then se deben informar, como mínimo, el identificador y la denominación de la Línea
    And se deben informar el identificador y la denominación de su SuperLínea

  Scenario: Eliminar una Línea sin Productos activos asociados — CP-55
    Given que existe una Línea activa sin Productos activos asociados
    When se solicita eliminarla con un usuario responsable válido
    Then la Línea debe quedar eliminada lógicamente
    And la respuesta debe tener código HTTP 200

  Scenario: Impedir la eliminación de una Línea con Productos activos — CP-56
    Given que existe una Línea activa con al menos un Producto activo asociado
    When se solicita eliminar la Línea
    Then la eliminación debe ser rechazada
    And la Línea debe continuar activa
```

### 6.7. Feature: Gestión de SuperLínea

```gherkin
Feature: Gestión de SuperLínea
  Como administrador de productos
  Quiero gestionar SuperLíneas
  Para agrupar Líneas relacionadas dentro de categorías superiores

  Background:
    Given que existe un usuario autorizado para gestionar productos
    And que las entidades indicadas como activas no están eliminadas lógicamente

  Scenario: Registrar una SuperLínea válida — CP-57
    Given que no existe una SuperLínea denominada "Bebidas"
    When se registra "Bebidas" con una observación opcional
    Then se debe crear una SuperLínea con un identificador único
    And la respuesta debe tener código HTTP 201

  Scenario Outline: Validar la denominación al registrar una SuperLínea — CP-58
    When se intenta registrar una SuperLínea con <denominacion>
    Then el registro debe producir <resultado>

    Examples:
      | denominacion                 | resultado                                       |
      | una cadena vacía             | rechazo por denominación obligatoria            |
      | una cadena de 255 caracteres | aceptación respecto del límite de longitud      |
      | una cadena de 256 caracteres | rechazo por superar el máximo de 255 caracteres |

  Scenario Outline: Rechazar una denominación de SuperLínea ya reservada — CP-59
    Given que existe <registro_previo> con la denominación <denominacion_existente>
    When se intenta registrar otra SuperLínea con la denominación <denominacion_nueva>
    Then el registro debe ser rechazado por falta de unicidad

    Examples:
      | registro_previo                      | denominacion_existente | denominacion_nueva |
      | una SuperLínea activa                | Máquinas               | maquinas           |
      | una SuperLínea activa                | Máquinas               | MÁQUINAS           |
      | una SuperLínea eliminada lógicamente | Máquinas               | Maquinas           |

  Scenario: Consultar SuperLíneas registradas — CP-60
    Given que existen SuperLíneas activas con y sin observación
    When se consultan las SuperLíneas registradas
    Then se deben mostrar todas las SuperLíneas activas
    And se debe informar, como mínimo, el identificador y la denominación de cada una
    And se debe poder consultar la observación cuando exista

  Scenario: Consultar SuperLíneas cuando no existen registros activos — CP-61
    Given que no existen SuperLíneas activas
    When se consultan las SuperLíneas registradas
    Then la respuesta debe contener una colección vacía
    And el total debe ser 0
    And la respuesta debe tener código HTTP 200

  Scenario: Modificar una SuperLínea existente — CP-62
    Given que existe la SuperLínea activa "Bebidas"
    When se modifica su denominación a "Bebidas Sin Alcohol" y su observación
    Then la información debe quedar actualizada
    And la SuperLínea debe conservar su identificador
    And la respuesta debe tener código HTTP 200

  Scenario Outline: Rechazar una denominación inválida al modificar una SuperLínea — CP-63
    Given que existe una SuperLínea activa
    When se intenta modificar su denominación con <denominacion>
    Then la modificación debe producir <resultado>

    Examples:
      | denominacion                                                       | resultado                                       |
      | una cadena vacía                                                   | rechazo por denominación obligatoria            |
      | una cadena de 255 caracteres                                       | aceptación respecto del límite de longitud      |
      | una cadena de 256 caracteres                                       | rechazo por superar el máximo de 255 caracteres |
      | la denominación de otra SuperLínea activa                          | rechazo por falta de unicidad                   |
      | maquinas, cuando existe otra SuperLínea activa denominada Máquinas | rechazo por falta de unicidad                   |
      | la denominación de otra SuperLínea eliminada lógicamente           | rechazo por falta de unicidad                   |
      | la denominación actual de la misma SuperLínea                      | aceptación sin conflicto consigo misma          |

  Scenario Outline: Eliminar una SuperLínea sin Líneas activas asociadas — CP-64
    Given que existe una SuperLínea activa
    And que <condicion_lineas>
    When se solicita eliminarla con un usuario responsable válido
    Then la SuperLínea debe quedar eliminada lógicamente
    And la respuesta debe tener código HTTP 200

    Examples:
      | condicion_lineas                                    |
      | no tiene Líneas asociadas                           |
      | solo tiene Líneas eliminadas lógicamente asociadas  |

  Scenario: Impedir la eliminación de una SuperLínea con Líneas activas asociadas — CP-65
    Given que existe una SuperLínea activa con al menos una Línea activa asociada
    When se solicita eliminar la SuperLínea
    Then la eliminación debe ser rechazada
    And la SuperLínea debe continuar activa

  Scenario: Consultar el detalle de una SuperLínea eliminada — CP-66
    Given que una SuperLínea fue eliminada lógicamente
    When se consulta su detalle por identificador
    Then la respuesta debe tener código HTTP 404
```

---

## 7. Trazabilidad: caso de prueba, regla y técnica

Índice de referencia entre cada caso de prueba y la regla o criterio de aceptación que verifica, junto con el **nivel y técnica con el que debe implementarse** según §3 y §4.

| Nro CP | HU / Caso de uso | Regla / criterio verificado | Nivel y técnica |
|--------|------------------|-----------------------------|-----------------|
| 01 | Modificar Producto, Consultar historial de precios. | CA: Al modificar el precio de un producto, se debe registrar un CambioPrecio. <br> CA: Todos los cambios de precio deben mostrar su fecha, precio anterior, precio nuevo y motivo, obligatoriamente. | Integración + E2E/Manual |
| 02 | Modificar Producto, Consultar historial de precios. | Invariante del agregado: el precio anterior de un CambioPrecio debe coincidir con el precio vigente inmediatamente antes del cambio. | Integración + E2E/Manual |
| 03 | Modificar Producto, Consultar historial de precios. | Invariante del agregado: el precio anterior de un CambioPrecio debe coincidir con el precio vigente inmediatamente antes del cambio. | Unitario |
| 04 | Modificar Producto | RN: El precio de un producto debe ser mayor a 0. | Unitario |
| 05 | Consultar historial de precios. | CA: Se deben traer inicialmente los últimos 10 cambios de precio, pudiendo ver los anteriores en grupos de a 10. <br> CA: Los cambios de precios deben mostrarse en orden cronológico de más reciente a más antiguo. | Integración + E2E (manual) |
| 06 | Consultar historial de precios. | CA: Si el producto no posee cambios de precio, el sistema debe informar que no existen registros de cambios de precio. | Integración + E2E (manual) |
| 07 | Modificar Producto, Actualización de Precio Masiva | RN: Todo cambio de precio debe tener un motivo. | Unitario |
| 08 | Modificar Producto | CA: Al modificar el precio de un producto, se debe registrar un CambioPrecio. | Integración |
| 09 | Consultar historial de precios. | Comportamiento de error esperado. | Integración |
| 10 | Registrar Marca | RN: La denominación de marca debe ser única. <br> RN: La denominación de marca debe ser de menos de 255 caracteres. | Integración + E2E |
| 11 | Registrar Marca | RN: La denominación de marca debe ser única. | Integración + E2E |
| 12 | Registrar Marca | RN: La denominación de marca debe ser de menos de 255 caracteres. | Integración |
| 13 | Consultar marcas | Búsqueda exitosa. | Integración + E2E |
| 14 | Consultar marcas | Búsqueda exitosa. | Integración |
| 15 | Modificar marca | Actualización exitosa. | Integración + E2E |
| 16 | Eliminar marca | RN: No se puede eliminar una marca si tiene productos activos. | Unitario + Integración |
| 17 | Eliminar Marca | RN: No se puede eliminar una marca si tiene productos activos. | Integración + E2E |
| 18 | Registrar Producto | Registro exitoso de un producto cuando todos sus datos son válidos. | Integración + E2E/Manual |
| 19 | Registrar Producto | Los campos costo, margen, stockActual, stockMínimo, marca, línea, presentación y denominación son obligatorios. Los datos inválidos no deben guardarse y el sistema debe informar el error claramente. | Unitario + Integración |
| 20 | Registrar Producto | El costo debe ser mayor o igual a 0. El margen, el stockActual y el stockMínimo deben ser mayores a 0. | Unitario + Integración |
| 21 | Registrar Producto | El costo igual a 0 es un valor válido. | Unitario + Integración |
| 22 | Registrar Producto | La denominación del producto debe ser única. | Integración |
| 23 | Registrar Producto | La denominación debe tener como máximo 200 caracteres. | Unitario + Integración |
| 24 | Registrar Producto | Se deben poder seleccionar marcas, líneas y presentaciones previamente registradas. | Integración + E2E/Manual |
| 25 | Registrar Producto | La presentación seleccionada debe encontrarse activa. | Integración |
| 26 | Registrar Producto | Al seleccionar Marca, Línea y Presentación, la denominación automática debe generarse concatenando esos valores en ese orden. | E2E/Manual |
| 27 | Registrar Producto | La denominación generada automáticamente debe poder editarse manualmente. | E2E/Manual |
| 28 | Registrar Producto | La denominación automática no debe sobrescribir una denominación ingresada manualmente. | E2E/Manual |
| 29 | Modificar Producto | Actualización exitosa de los datos de un producto. Si el precio no cambia, no debe registrarse un CambioPrecio. | Integración + E2E/Manual |
| 30 | Modificar Producto | Los campos costo, margen, stockActual, stockMínimo, marca, línea, presentación y denominación continúan siendo obligatorios al modificar el producto. | Unitario + Integración |
| 31 | Modificar Producto | El costo debe ser mayor o igual a 0. El margen, el stockActual y el stockMínimo deben ser mayores a 0. | Unitario + Integración |
| 32 | Modificar Producto | La denominación modificada debe tener como máximo 200 caracteres. | Unitario + Integración |
| 33 | Modificar Producto | La denominación modificada no puede pertenecer a otro producto. | Integración |
| 34 | Modificar Producto, Consultar historial de precios | Al modificar el precio de un producto, se debe registrar un CambioPrecio con precio anterior, precio nuevo, fecha y motivo. | Integración + E2E/Manual |
| 35 | Modificar Producto | El precio de un producto debe ser mayor a 0. Si el nuevo precio es inválido, el producto y su historial deben permanecer sin cambios. | Unitario |
| 36 | Modificar Producto | Todo cambio de precio debe tener un motivo. | Unitario |
| 37 | Modificar Producto, Consultar historial de precios | El precio anterior de cada CambioPrecio debe coincidir con el precio vigente inmediatamente antes del cambio. | Unitario + Integración |
| 38 | Modificar Producto | Comportamiento de error esperado al intentar modificar un producto inexistente. | Integración |
| 39 | Actualización de Precio Masiva | Se deben poder aumentar o disminuir globalmente los precios mediante un monto o porcentaje, actualizando el costo para conservar el margen y registrando un CambioPrecio por producto. | Unitario + Integración + E2E/Manual |
| 40 | Actualización de Precio Masiva | Se deben poder aumentar o disminuir los precios de una Línea mediante un monto o porcentaje, sin modificar productos de otras líneas, conservando el margen y registrando un CambioPrecio por producto. | Unitario + Integración + E2E/Manual |
| 41 | Actualización de Precio Masiva | Se debe ingresar un monto fijo o un porcentaje, pero no ambos. | Unitario + Integración |
| 42 | Actualización de Precio Masiva | Se debe ingresar obligatoriamente un monto fijo o un porcentaje. | Unitario + Integración |
| 43 | Actualización de Precio Masiva | El monto o porcentaje utilizado para la actualización debe ser mayor a 0. | Unitario |
| 44 | Actualización de Precio Masiva | Los precios finales de todos los productos deben ser mayores a 0. Una operación inválida no debe dejar productos parcialmente actualizados ni registrar cambios de precio. | Unitario + Integración |
| 45 | Actualización de Precio Masiva | Si no existen productos que cumplan los criterios elegidos, el sistema debe informar la situación y no registrar cambios de precio. | Integración + E2E/Manual |
| 46 | Actualización de Precio Masiva | El resultado debe mostrar la denominación, el costo y el precio de los productos actualizados. | Integración + E2E/Manual |
| 47 | Registrar Línea | CR-003 CA-1 y CA-2; una Línea pertenece a una única SuperLínea activa | Integración |
| 48 | Registrar Línea | CR-003 CA-1 y CA-2; asociación obligatoria con SuperLínea activa | Unitario + Integración |
| 49 | Registrar Línea | Denominación obligatoria, reservada incluso tras soft-delete y de hasta 255 caracteres | Unitario + Integración |
| 50 | Modificar Línea | Selección de SuperLínea activa; asociación única | Integración |
| 51 | Modificar Línea | Regresión: conservación de la asociación cuando no se modifica | Integración |
| 52 | Modificar Línea | CR-003 CA-1 y CA-2; rechazo de asociación inexistente, eliminada o nula | Unitario + Integración |
| 53 | Modificar Línea | Denominación obligatoria, reservada tras soft-delete, sin conflicto consigo misma y de hasta 255 | Unitario + Integración |
| 54 | Consultar Línea | Regresión: detalle de Línea con asociación reducida de SuperLínea | Integración |
| 55 | Eliminar Línea | Regresión: eliminación lógica sin Productos activos y respuesta HTTP 200 | Integración |
| 56 | Eliminar Línea | Regresión: impedir eliminación con Productos activos | Integración |
| 57 | Registrar SuperLínea | Denominación obligatoria, observación opcional, identificador y respuesta HTTP 201 | Integración + E2E/manual |
| 58 | Registrar SuperLínea | Denominación obligatoria y de hasta 255 caracteres | Unitario |
| 59 | Registrar SuperLínea | Unicidad sin distinguir mayúsculas, minúsculas o tildes, incluso frente a registros eliminados | Integración |
| 60 | Consultar SuperLíneas | Listado activo; identificador, denominación y observación | Integración + E2E/manual |
| 61 | Consultar SuperLíneas | Colección vacía, total 0 y respuesta HTTP 200 | Integración + E2E/manual |
| 62 | Modificar SuperLínea | Modificación persistida, conservación del identificador y respuesta HTTP 200 | Integración + E2E/manual |
| 63 | Modificar SuperLínea | Denominación obligatoria, reservada tras soft-delete, sin conflicto consigo misma y de hasta 255 | Unitario + Integración |
| 64 | Eliminar SuperLínea | Eliminación sin Líneas activas, incluso si existen Líneas eliminadas; respuesta HTTP 200 | Integración |
| 65 | Eliminar SuperLínea | RN: impedir eliminación si existe al menos una Línea activa asociada | Integración + E2E/manual |
| 66 | Consultar SuperLínea | Detalle por identificador de una SuperLínea eliminada; respuesta HTTP 404 | Integración |

---

## 8. Ejemplo: del caso de prueba a la implementación

Un caso del catálogo (§6) se implementa **en cada nivel que le corresponda** según §3 y §4, y no se repite un nivel en el que no aporta.

La convención de trazabilidad es **el número de caso al inicio del título del `it(...)`**. Eso permite ir del test al caso y del caso al test sin herramientas intermedias:

```ts
it('CP-04 - Intentar cambiar el precio a %s (no positivo)', (precioInvalido) => { /* ... */ });
```

Los ejemplos que siguen salen de tests ya presentes en el repositorio.

### 8.1. Regla de dominio pura → test unitario

**Caso de prueba (CP-04)**

```gherkin
Scenario Outline: Rechazar un cambio a un precio no válido — CP-04
  Given el producto tiene un precio actual de 100
  When se intenta modificar su precio a <precio>
  Then la modificación debe ser rechazada
  And el precio del producto debe continuar siendo 100
  And no se debe registrar un nuevo CambioPrecio

  Examples:
    | precio |
    | 0      |
    | -10    |
```

**Implementación** — `src/modules/gestion-productos/producto/domain/entities/producto.entity.spec.ts`

```ts
it.each([0, -10])(
  'CP-04 - Intentar cambiar el precio a %s (no positivo)',
  (precioInvalido) => {
    const producto = new Producto();
    producto.precio = 100;

    expect(() =>
      producto.cambiarPrecio(
        precioInvalido,
        MotivoCambioPrecio.ActualizacionDePrecioDirecta,
      ),
    ).toThrow('El nuevo precio debe ser mayor que 0.');
    expect(producto.precio).toBe(100);
    expect(producto.cambiosPrecio ?? []).toHaveLength(0);
  },
);
```

**Por qué unitario.** La regla vive en un método de entidad, sin I/O ni base de datos. Se instancia la entidad y se ejerce la regla. Los tres `Then` del caso se verifican en el mismo test: el rechazo, el precio intacto y la ausencia de `CambioPrecio` registrado.

### 8.2. Regla con estado persistido → test de integración

**Caso de prueba (CP-02)**

```gherkin
Scenario: Mantener la continuidad del historial entre cambios sucesivos — CP-02
  Given el producto tiene un precio actual de 100
  When se modifica su precio a 120 mediante una operación de edición
  And posteriormente se modifica su precio a 150 mediante una operación de edición
  And se consulta el historial de precios del producto
  Then el cambio más reciente debe tener un precio anterior de 120 y un precio nuevo de 150
  And el cambio anterior debe tener un precio anterior de 100 y un precio nuevo de 120
```

**Implementación** — `src/modules/gestion-productos/producto/application/producto.integracion.spec.ts`

```ts
it('CP-02 - Mantener la continuidad del historial entre cambios sucesivos', async () => {
  const { producto, linea, marca, usuario } = await crearProducto(dataSource, 'cp02');

  await repository.update(producto.id, { precio: 120 } as any, linea, marca, usuario);
  await repository.update(producto.id, { precio: 150 } as any, linea, marca, usuario);

  const historial = await service.getHistorialPrecios(producto.id, { skip: 0, take: 10 });

  expect(historial).toHaveLength(2);
  expect(historial[0].precioAnterior).toBe(120);
  expect(historial[0].precioNuevo).toBe(150);
  expect(historial[0].motivo).toBe(MotivoCambioPrecio.ActualizacionDePrecioDirecta);
  expect(historial[1].precioAnterior).toBe(100);
  expect(historial[1].precioNuevo).toBe(120);
  expect(historial[1].motivo).toBe(MotivoCambioPrecio.ActualizacionDePrecioDirecta);
});
```

**Por qué integración.** Lo que se valida es que el `precioAnterior` registrado coincida con el precio vigente **en el momento del cambio**, y que al leer el historial el orden sea el correcto. Eso depende del estado persistido y del ordenamiento de la consulta: un repositorio mockeado devolvería el orden que decida el mock, no el que produce la base. Por eso va contra MySQL real.

### 8.3. Contrato de endpoints → test HTTP end-to-end

**Caso de prueba (CP-01)**

```gherkin
Scenario: Registrar un cambio de precio y consultarlo en el historial — CP-01
  Given el producto tiene un precio actual de 100
  And el producto no tiene cambios de precio registrados
  When se modifica su precio a 120 mediante una operación de edición
  And se consulta el historial de precios del producto
  Then el producto debe tener un precio actual de 120
  And el historial debe contener un cambio de precio
  And el cambio debe mostrar un precio anterior de 100
  And el cambio debe mostrar un precio nuevo de 120
  And el cambio debe mostrar una fecha
  And el cambio debe mostrar el motivo "ActualizaciónDePrecioDirecta"
```

**Implementación** — `src/modules/gestion-productos/producto/application/producto.http.spec.ts`

```ts
it('CP-01 - Cambiar el precio, persistir el cambio y consultar el historial', async () => {
  const { linea, marca, usuario, producto } = await crearProducto(dataSource, 'cp01');

  await request(app.getHttpServer())
    .put(`/producto/${producto.id}`)
    .send({ denominacion: 'coca-cola 1l cp01', usuarioUpdatedId: usuario.id, precio: 120 })
    .expect(200);

  const productoDto = await request(app.getHttpServer())
    .get(`/producto/${producto.id}`)
    .expect(200);
  expect(productoDto.body.precio).toBe(120);

  const historial = await request(app.getHttpServer())
    .get(`/producto/${producto.id}/historial-precios`)
    .query({ skip: 0, take: 10 })
    .expect(200);

  expect(historial.body).toHaveLength(1);
  expect(historial.body[0].precioAnterior).toBe(100);
  expect(historial.body[0].precioNuevo).toBe(120);
  expect(historial.body[0].motivo).toBe(MotivoCambioPrecio.ActualizacionDePrecioDirecta);
  expect(new Date(historial.body[0].fecha).getTime()).toBeGreaterThan(0);
});
```

**Por qué HTTP.** El caso encadena **dos endpoints** ("modificar" y "consultar el historial"), y afirma sobre el contrato: los códigos de respuesta y la forma del body. Ningún nivel inferior cubre eso.

### 8.4. Escenarios tabulados: `Examples` → `it.each`

La tabla `Examples` de un `Scenario Outline` se traduce directo en la tabla del `it.each`: un escenario tabulado es **un test parametrizado**, no N tests copiados. Así cada fila del caso queda como un caso de ejecución identificable.

**Caso de prueba (CP-05)**

```gherkin
Scenario Outline: Consultar el historial utilizando páginas de hasta 10 cambios — CP-05
  Given el producto posee <cantidad> cambios de precio registrados
  When se consulta la página <pagina> del historial
  Then se deben mostrar <resultado> cambios de precio
  And los cambios mostrados deben corresponder a la página solicitada
  And los cambios deben estar ordenados del más reciente al más antiguo

  Examples:
    | cantidad | pagina | resultado |
    | 5        | 1      | 5         |
    | 10       | 1      | 10        |
    | 11       | 1      | 10        |
    | 11       | 2      | 1         |
    | 20       | 1      | 10        |
    | 20       | 2      | 10        |
```

**Implementación** — `src/modules/gestion-productos/producto/application/producto.http.spec.ts`

```ts
it.each([
  [5, 1, 5],
  [10, 1, 10],
  [11, 1, 10],
  [11, 2, 1],
  [20, 1, 10],
  [20, 2, 10],
])(
  'CP-05 - Consultar el historial paginado (cantidad=%s, pagina=%s, resultado=%s)',
  async (cantidad, pagina, resultado) => {
    const { producto, cambios } = await sembrarProductoConHistorial(
      dataSource,
      `cp05-${cantidad}-${pagina}`,
      cantidad,
    );

    const res = await request(app.getHttpServer())
      .get(`/producto/${producto.id}/historial-precios`)
      .query({ skip: (pagina - 1) * 10, take: 10 })
      .expect(200);

    const esperados = cambios
      .slice()
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
      .map((cambio) => Number(cambio.precioNuevo));
    const paginaEsperada = esperados.slice(
      (pagina - 1) * 10,
      (pagina - 1) * 10 + resultado,
    );

    expect(res.body).toHaveLength(resultado);
    expect(res.body.map((cambio: any) => cambio.precioNuevo)).toEqual(paginaEsperada);
  },
);
```

### 8.5. Una misma regla en dos niveles

El CP-16 (no eliminar una marca con productos activos) se implementa dos veces, y **no es repetición**: cada nivel cubre un riesgo distinto del mismo caso.

**Unitario** — prueba la decisión de la política aislada. `src/modules/gestion-productos/marca/domain/services/politica-eliminacion-marca.service.spec.ts`

```ts
it('CP-16 - Rechazar la eliminación cuando la marca tiene productos activos', async () => {
  const existsProductosActivosByMarca = jest.fn().mockResolvedValue(true);
  const productoRepository = {
    existsProductosActivosByMarca,
  } as unknown as IProductoRepository;

  const politica = new PoliticaEliminacionMarca(productoRepository);

  await expect(politica.tieneProductosActivosParaMarca(1)).resolves.toBe(true);
  expect(existsProductosActivosByMarca).toHaveBeenCalledWith(1);
});
```

**Integración** — prueba que esa decisión, con los repositorios reales, efectivamente rechaza la operación y deja la marca intacta. `src/modules/gestion-productos/marca/application/marca.integracion.spec.ts`

```ts
it('CP-16 - Rechazar la eliminación de una marca con productos activos', async () => {
  const { marca, usuario } = await sembrarMarcaConProductoActivo(dataSource, 'cp16');

  await expect(service.remove(marca.id, usuario.id)).rejects.toThrow(
    'No se puede eliminar la marca porque está asociada a productos activos.',
  );

  await expect(service.findEntityById(marca.id)).resolves.toBeDefined();

  const resultado = await service.findBy('cp16', 0, 10);
  expect(resultado.data).toHaveLength(1);
  expect(resultado.data[0].denominacion).toBe('M-cp16');
});
```

El unitario verifica **la consulta correcta y el booleano**; la integración verifica **el rechazo y el efecto sobre los datos**. Ninguno de los dos reemplaza al otro.

> **Nota de nomenclatura.** Los archivos de ejemplo usan los sufijos `.integracion.spec.ts` y `.http.spec.ts`. El §3.1 establece `*.int-spec.ts` como el sufijo de los tests de integración, y son esos —y solo esos— los que corre `yarn test:integration`. Los sufijos usados por los tests nuevos todavía no están alineados con ese estándar; es una discrepancia pendiente de resolver (ver §3.3).
