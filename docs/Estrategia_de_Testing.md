# Estrategia de Testing — Proyecto1\_Back

> Guía de lineamientos del equipo. Define **qué se testea, cómo se testea y en qué capa**, para el módulo de gestión de productos. Es el estándar de referencia para escribir y revisar tests: un test que no cumple estos lineamientos se corrige o se elimina.

## 1\. Alcance

### 1.1. Fuera del alcance

- Los módulos de **autenticación, configuración y demás** módulos no relacionados con gestión de productos.
- Todo lo relacionado a **`ProductoOperacion`**.
- El **código sin uso detectado** (validadores y métodos que nunca se llaman, endpoints que el frontend no usa) y sin documentación, cuya utilidad y permanencia en la base de código están en duda. Esto se maneja en la sección de **deuda técnica**, principalmente en la tercera entrega del proyecto.
- Los **CRUDs simples** de persistencia (ver §4.4).
- El **frontend automatizado** (ver §5).

---

## 2\. Qué se testea

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

## 3\. Cómo se hacen los tests

### 3.1. Niveles y herramientas

| Nivel | Herramienta | Archivo | Cuándo |
| :---- | :---- | :---- | :---- |
| **Unitario** | Jest \+ `@nestjs/testing` | `*.spec.ts` | Reglas de dominio aisladas, orquestación de servicios, validación declarativa de DTOs. Sin I/O. |
| **Integración** | Jest \+ MySQL 8 real vía **Testcontainers** | `*.int-spec.ts` | Lo que depende de la base de datos real: colación, ordenamiento, joins, `LIKE`, filtros y soft-delete. |
| **Contrato HTTP** | Jest \+ **Supertest** sobre la app Nest, con servicios reemplazados | `*.spec.ts` | Tipos, formatos, validación y códigos de respuesta, sin infraestructura real. |
| **Manual (E2E \+ UI)** | — | — | Flujo completo del sistema y totalidad del frontend (ver §5). |

**Elegir el nivel correcto es parte del caso de prueba.** La regla de decisión es: *¿qué puede fallar acá que un nivel inferior no detectaría?* Si la respuesta involucra la base de datos real, el test es de integración; si es una regla pura de dominio, es unitario.

### 3.2. Reglas de implementación

1. **No mockear aquello que se quiere validar.** Un mock de repositorio no prueba que la expresión de colación distinga acentos, ni que el `ORDER BY` ordene. Si la regla vive en la DB, el test va contra la DB.
2. **Un caso de prueba \= un comportamiento observable.** El título del `it(...)` describe el comportamiento verificado, no el método invocado.
3. **Estructura Given / When / Then** (o Arrange / Act / Assert). El caso de prueba documentado se traduce en esa misma estructura.
4. **Un test debe poder fallar por una sola razón.** Si un `it` puede romperse por dos causas independientes, son dos casos.
5. **Cubrir el camino de error, no solo el exitoso.** Por cada regla: el escenario válido, el límite y el rechazo.
6. **Trazar el test a su caso de prueba.** El nombre del test y su ubicación deben permitir identificar qué caso del catálogo cubre.
7. **No afirmar un resultado sin haberlo ejecutado.** Un test escrito no es un test que pasa.

### 3.3. Cómo se ejecutan

| Comando | Qué corre | Notas |
| :---- | :---- | :---- |
| `yarn test` | Unitarios (`*.spec.ts`), excluye `*.int-spec.ts` | `jest.config.js`, con `collectCoverage: true` |
| `yarn test:integration` | Integración (`*.int-spec.ts`) | `jest.config.integration.js`; **requiere Docker** para levantar el contenedor MySQL 8 |
| `yarn test:cov` | Unitarios con cobertura | `jest --coverage` |

Dos consideraciones operativas verificadas en este repositorio:

- **`yarn test` colecta cobertura y puede enmascarar fallos.** Para correr un archivo puntual, usar el binario de Jest directamente: `node node_modules/jest/bin/jest.js --runTestsByPath <ruta-al-spec> --coverage=false`
- **En Windows, `yarn.cmd` / `yarn.ps1` rompen paths con caracteres no ASCII** (la ruta de este repositorio contiene `año`). Para corridas de Jest, invocar el binario directo en lugar del wrapper.

**Las de integración se saltan o fallan sin Docker; nunca pasan silenciosamente.** Un test de integración que no se pudo ejecutar no es un test aprobado.

### 3.4. Del caso de prueba al archivo: ejemplos verificados

Estos recortes de los PR #46 y #48 son referencias de diseño, no bloques para copiar completos. La clasificación actual es inequívoca: **todo test que levante o use MySQL/Testcontainers debe llamarse `*.int-spec.ts` y ejecutarse con `yarn test:integration`**. `*.spec.ts` queda reservado para unitarios y contratos HTTP sin infraestructura real.

#### Regla pura sin I/O: escapar metacaracteres de `LIKE`

**Fuente exacta:** `src/modules/common/query-builders/query-builder-helpers.spec.ts` (`7fd3bd0`, PR #48, CP-74).

```ts
it('CP-74 - Escapa el comodín % para que el término se busque literal', () => {
  const { query, andWhere } = createMockQueryBuilder();

  QueryBuilderHelper.applyPartialCoincidence(
    query,
    'producto',
    'denominacion',
    '%',
  );

  expect(andWhere).toHaveBeenCalledWith(
    "LOWER(producto.denominacion) COLLATE utf8mb4_bin LIKE CONCAT('%', LOWER(:termino), '%') COLLATE utf8mb4_bin",
    { termino: '\\%' },
  );
});
```

- **Comportamiento:** verifica que `%` llegue escapado como dato literal y no altere el patrón SQL.
- **Nivel y estructura:** unitario, porque prueba una transformación síncrona sin ejecutar SQL. Arrange crea el query builder mínimo; Act invoca el helper; Assert inspecciona el fragmento y su parámetro.
- **Dependencias y observables:** solo `andWhere` está reemplazado porque TypeORM no es el objeto de prueba. La assertion observa la colaboración relevante —SQL parametrizado y valor escapado—, no detalles ajenos.

#### Servicio de aplicación: delegar y mapear el resultado

**Fuente exacta:** `src/modules/gestion-productos/superlinea/application/services/superlinea.service.spec.ts` (`e31e2ed`, PR #48, CP-87).

```ts
repository.busquedaPorCoincidenciaParcial.mockResolvedValue([
  entity({ id: 1, denominacion: 'Almacén', observacion: 'Productos varios' }),
]);

const result = await service.busquedaPorCoincidenciaParcial('almacen');

expect(result).toEqual([
  { codigo: 1, nombre: 'Almacén', descripcion: 'Productos varios' },
]);
expect(repository.busquedaPorCoincidenciaParcial).toHaveBeenCalledWith('almacen');
```

- **Comportamiento:** comprueba que el servicio delegue el término y traduzca entidades al contrato de selección.
- **Nivel y estructura:** unitario de aplicación; Arrange configura el resultado del repositorio, Act ejecuta el caso de uso y Assert verifica resultado y colaboración.
- **Dependencias y observables:** el repositorio está mockeado porque aquí se prueba la orquestación, no MySQL. Se observan el DTO devuelto y el argumento delegado; no se afirma el SQL ni el orden interno de llamadas.

#### Persistencia real: semántica de colación de MySQL

**Fuente exacta:** `src/modules/gestion-productos/producto/infraestructure/repositories/producto.persistence-adapters.int-spec.ts` (`e31e2ed`, PR #48, CP-71).

```ts
const superLineaId = await createSuperLinea('Almacen');
const lineaId = await createLinea('Almacen linea', superLineaId);
await createProducto('harína premium', lineaId);
await createProducto('Harina integral', lineaId);

const result = await adapter.busquedaPorCoincidenciaParcial('harina');

expect(result.total).toBe(1);
expect(result.data.map((producto) => producto.denominacion)).toEqual([
  'Harina integral',
]);
```

- **Comportamiento:** demuestra que la búsqueda ignora mayúsculas, pero distingue acentos.
- **Nivel y estructura:** integración, porque la colación es semántica propia de MySQL. Given persiste ambas variantes; When consulta mediante el adapter; Then verifica el conjunto exacto.
- **Dependencias y observables:** MySQL 8, TypeORM, migraciones y adapter son reales; el harness compartido crea el `DataSource` y limpia tablas entre casos. Las assertions observan total y denominaciones recuperadas. Este archivo usa el sufijo y runner actuales: `*.int-spec.ts` con `yarn test:integration`.

#### Contrato HTTP sin infraestructura: rechazo antes de delegar

**Fuente exacta:** `src/modules/gestion-productos/producto/application/controllers/producto.controller.spec.ts` (`e31e2ed`, PR #48, CP-78).

```ts
await request(app.getHttpServer())
  .get('/api/producto/search-by-denominacion')
  .query({ denominacion: 'harina', skip: 0, take: 0 })
  .expect(400);

expect(service.busquedaPorCoincidenciaParcial).not.toHaveBeenCalled();
```

- **Comportamiento:** un parámetro de paginación fuera de rango produce `400` y detiene el caso de uso.
- **Nivel y estructura:** contrato HTTP en `*.spec.ts`; Arrange levanta una app Nest mínima con `ValidationPipe` y servicio reemplazado, Act envía la request y Assert verifica respuesta y ausencia de delegación.
- **Dependencias y observables:** Supertest, controller y validación son reales; servicio y autenticación están reemplazados porque no son el objeto de prueba. Se observan el código HTTP y que no exista el efecto posterior.

#### Antecedente histórico del PR #46

El PR #46 aporta reglas de dominio valiosas en `producto.entity.spec.ts` (`a2ac348`, por ejemplo CP-04), pero sus integraciones `producto.integracion.spec.ts` (`a2ac348`) y `marca.http.spec.ts` (`afcceab`) levantan MySQL/Testcontainers bajo nombres `*.spec.ts`. Esos nombres se conservan al citar su origen, **pero no son una plantilla vigente**: un equivalente nuevo debe usar `*.int-spec.ts` y `yarn test:integration`. Tampoco debe copiarse el uso histórico de `as any`; se prefieren contratos tipados y dobles mínimos.

### 3.5. Plantilla adaptable

Adaptar nombres, tipos, datos y assertions al CP. No copiar dependencias ni expectativas que el comportamiento no necesite.

```ts
describe('UseCase - comportamiento observable', () => { // Adaptar al caso de uso.
  const dependency = { execute: jest.fn() }; // Reemplazar solo si no es objeto de prueba.
  const subject = new UseCase(dependency);

  beforeEach(() => jest.clearAllMocks());

  it('CP-XX - devuelve el resultado y produce el efecto esperado', async () => {
    // Arrange: preparar únicamente el estado y los dobles necesarios.
    dependency.execute.mockResolvedValue({ id: 7 });

    // Act: ejecutar una sola acción observable.
    const result = await subject.run({ value: 'valid' });

    // Assert: adaptar al contrato; no copiar estas expectativas mecánicamente.
    expect(result).toEqual({ id: 7 });
    expect(dependency.execute).toHaveBeenCalledWith({ value: 'valid' });
    expect(dependency.execute).toHaveBeenCalledTimes(1); // O usar `.not` para ausencia de efecto.
  });
});
```

### 3.6. Procedimiento operativo para agentes

1. Identificar el comportamiento observable y su `CP-XX`.
2. Elegir el nivel más bajo que pueda detectar el riesgo: regla pura, orquestación, contrato HTTP o persistencia real.
3. Mantener reales las dependencias que definen la semántica; reemplazar solo las externas al objeto de prueba.
4. Elegir sufijo y runner: `*.spec.ts` con `yarn test` sin infraestructura; `*.int-spec.ts` con `yarn test:integration` si interviene MySQL/Testcontainers.
5. Implementar Given/When/Then o Arrange/Act/Assert con assertions de resultado y de efecto —o ausencia de efecto— relevantes.
6. Ejecutar el archivo con el runner correspondiente y reportar comando, resultado y cualquier limitación; nunca declarar éxito sin ejecución.

---

## 4\. Políticas por capa

Las capas se listan en **orden de prioridad** (de mayor a menor impacto y valor). Estas políticas son la **guía de nivel e implementación** para los casos de prueba, no un mandato ni un compromiso de testing.

### 4.1. Capa de dominio

- **Pruebas unitarias** para `validators` y métodos de entidad.
- **Pruebas de integración** para los servicios de dominio que dependen de la interacción con otros componentes.
- Cobertura de los **escenarios relevantes de cada regla**, incluyendo casos límite e **interacciones reales entre condiciones** cuando el comportamiento depende de su combinación, dado que este es el punto crítico donde el sistema no puede fallar.

### 4.2. Capa de aplicación — Endpoints (controllers)

- **Pruebas de contrato HTTP representativas**, con la aplicación Nest mínima y sin infraestructura real, para evaluar routing, validación, transformación y respuestas públicas.
- **No se testean todos los escenarios posibles** a este nivel, pues no se pretende repetir lo que ya se prueba en la capa de dominio.
- En general, cada endpoint prueba **al menos un camino de éxito y uno de fracaso** para evaluar los tipos y formatos de las respuestas.
- Si el caso también necesita MySQL/Testcontainers, deja de ser un `*.spec.ts`: se separa o se clasifica como integración `*.int-spec.ts` y se ejecuta con `yarn test:integration`.

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

- Las capas de **dominio, contratos HTTP y servicios de aplicación** se garantizan siempre, por concentrar el riesgo de negocio real.
- La cobertura de **persistencia y DTO** puede reducirse o postergarse, dado su menor riesgo relativo (la persistencia solo aplica a consultas con lógica propia ya acotadas, y las validaciones de DTO quedan parcialmente cubiertas por el caso de contrato a nivel de endpoint).
- Si esto ocurre, se documenta explícitamente **qué pruebas quedaron pendientes y su justificación de riesgo**, en lugar de intentar cubrir todo el alcance de forma superficial.

### 4.7. Mecanismos transversales

Los mecanismos compartidos por todos los endpoints (autenticación, parsing de requests, manejo global de excepciones) se prueban **una única vez** sobre un endpoint representativo, dado que su comportamiento no depende del endpoint particular sino de un middleware/filtro común. **No se replican estos casos en cada endpoint.**

---

## 5\. E2E y frontend

Para evaluar el funcionamiento del sistema en conjunto se realizan **pruebas E2E de forma manual**, dentro de las cuales queda incluida la **totalidad del testing de frontend**.

El equipo opta por resolver el testing de frontend de esta manera ya que:

- El **riesgo real** de cada pieza involucrada (reglas de negocio, paginación, filtros) ya está cubierto por tests automatizados en la capa de backend donde esa lógica efectivamente vive.
- **Automatizar el flujo completo de frontend** implica un costo de implementación y mantenimiento (entorno completo, fragilidad ante cambios de UI) que, comparado al valor que agrega a las pruebas manuales, **no se justifica** para este proyecto.

### 5.1. Cuándo una interacción se considera prueba manual

Se consideran casos de prueba **manuales** aquellas interacciones de UI que combinan datos ya validados por sus endpoints de origen **sin agregar lógica condicional propia**.

Ejemplo: la selección de una marca/línea existente al cargar un producto. Los endpoints que exponen esas listas ya están cubiertos por tests de contrato HTTP, mientras la semántica de persistencia se cubre por separado en `*.int-spec.ts`; el desplegable solo bindea esos datos, sin decisiones adicionales, por lo que la interacción se verifica manualmente.

---

&nbsp;
