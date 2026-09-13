# Estrategia de Testing — Proyecto1_Back

> Política de testing del equipo. Define el alcance, las políticas por capa, las prioridades y cómo se decide cuánto testear. Aplica a todos los cambios del proyecto.

---

## 1. Alcance

El testing se dirige a las funcionalidades del módulo **gestión de productos**, que son el núcleo del sistema y donde se concentran los esfuerzos del proyecto.

Quedan **fuera de alcance**:

- Los módulos de autenticación, configuración y demás módulos no relacionados con gestión de productos.
- El código sin uso detectado (validadores y métodos que nunca se llaman, endpoints que el frontend no consume) y sin documentación. Su utilidad y permanencia en la base de código están en duda y se tratan en la sección de **deuda técnica**, principalmente en la tercera entrega del proyecto. En particular, **todo lo relacionado con `ProductoOperacion`** entra en esta clasificación y queda excluido del testing.

## 2. Enfoque: cobertura por valor, no por porcentaje

No se define un **porcentaje mínimo de cobertura**, porque un cálculo así contabilizaría código que no debe testearse. La decisión de cuánto testear se basa en el **valor que aportan las pruebas**, no en cumplir con un porcentaje.

## 3. Políticas por capa

Las capas se listan en **orden de prioridad** (de mayor a menor impacto y valor).

### 3.1. Capa de dominio

- **Pruebas unitarias** para `validators` y métodos de entidad.
- **Pruebas de integración** para los servicios de dominio que dependen de la interacción con otros componentes.
- Cobertura de los escenarios relevantes de cada regla, incluyendo casos límite e interacciones reales entre condiciones cuando el comportamiento depende de su combinación.
- Objetivo: asegurar las reglas de negocio y los comportamientos de dominio, que son los puntos críticos donde el sistema no puede fallar.

### 3.2. Capa de aplicación — Endpoints (controllers)

- **Pruebas de integración** representativas para evaluar el funcionamiento en conjunto de las capas y el cumplimiento del contrato.
- No se testean todos los escenarios posibles, pues no se pretende repetir lo que ya se prueba en la capa de dominio.
- En general, cada endpoint prueba **un camino de éxito y uno de fracaso** para evaluar los tipos y formatos de las respuestas.

### 3.3. Capa de aplicación — Servicios

- **Pruebas unitarias con mocks** para probar la correcta orquestación.
- No se pretende probar todos los métodos o flujos. Se evitan especialmente aquellos donde no hay condiciones evaluadas (solo delegación), y se testean únicamente los que tienen cierta lógica o decisiones sobre la secuencia de operaciones.

### 3.4. Capa de persistencia

- **Pruebas de integración** específicamente para las consultas que tengan cierta lógica propia (por ejemplo, un ordenamiento o un filtro según un criterio).
- **No** para CRUDs simples.

### 3.5. DTO

- **Pruebas unitarias** para los DTO que tengan validaciones declarativas: se instancian con distintos tipos de valores válidos e inválidos.
- Así se evita testear cada endpoint con múltiples casos de datos inválidos.

## 4. Prioridad y reasignación ante restricciones

El orden en que se nombran las capas establece también la **prioridad** de su realización, considerando el impacto en el sistema y el valor que aportan. Ante restricciones de tiempo, el esfuerzo se reasigna en ese mismo orden:

- Las capas de **dominio, endpoints y servicios de aplicación** se garantizan siempre, por concentrar el riesgo de negocio real.
- La cobertura de **persistencia y DTO** puede reducirse o postergarse, dado su menor riesgo relativo (la persistencia solo aplica a consultas con lógica propia ya acotadas, y las validaciones de DTO quedan parcialmente cubiertas por el caso de contrato a nivel de endpoint).
- Si esto ocurre, se documenta explícitamente **qué pruebas quedaron pendientes y su justificación de riesgo**, en lugar de intentar cubrir todo el alcance de forma superficial.

## 5. Pruebas E2E

Se realizan de forma **manual**. El riesgo real de cada pieza involucrada (reglas de negocio, paginación, filtros) ya está cubierto por tests automatizados en la capa donde esa lógica vive. Automatizar el flujo completo únicamente para verificar la integración de piezas ya testeadas por separado implica un costo de mantenimiento (entorno completo, fragilidad ante cambios de UI) que no se justifica; además, algunos aspectos evaluados en este nivel son cualitativos (claridad de mensajes, fluidez de la interacción).

## 6. Mecanismos transversales

Los mecanismos compartidos por todos los endpoints (autenticación, parsing de requests, manejo global de excepciones) se prueban **una única vez** sobre un endpoint representativo, dado que su comportamiento no depende del endpoint particular sino de un middleware/filtro común. No se replican estos casos en cada endpoint.

## 7. Casos de prueba y criterios de aceptación

- Se elaboran casos de prueba que cubren los distintos criterios de aceptación de las historias de usuario, con el objetivo de cubrirlos todos.
- Como compromiso costo/beneficio, se permite que **un caso de prueba cubra más de un criterio** de aceptación.
- La cantidad de casos elaborados para una funcionalidad depende de su complejidad y criticidad.
- Así como los criterios de aceptación aluden a niveles diferentes de la aplicación, un caso de prueba puede implementarse mediante testing unitario de dominio, pruebas de integración de endpoints, pruebas manuales, etc., o una combinación de ellos, según se amerite.
- Para las historias de usuario ya implementadas **no se dispone de los criterios de aceptación**, por lo que sus casos de prueba se dirigen a las **reglas de negocio identificadas**, la integración exitosa de las capas y el cumplimiento de las funcionalidades.

## 8. Aclaración: cuándo una interacción se considera prueba manual

Se consideran casos de prueba **manuales** aquellas interacciones de UI que combinan datos ya validados por sus endpoints de origen sin agregar lógica condicional propia.

Ejemplo: la selección de una marca/línea existente al cargar un producto. Los endpoints que exponen esas listas ya están cubiertos por tests de integración de contrato, y el desplegable solo bindea esos datos, sin decisiones adicionales; por lo tanto, la interacción se verifica manualmente.

---

## 9. Aplicación a CR-004 (búsqueda por coincidencia parcial)

### Artefactos de prueba por capa

| Capa | Artefactos | Tipo |
|------|-----------|------|
| Dominio | *CR-004 no agrega entidades ni `validators` de dominio* | — |
| Endpoints | `producto.controller.spec.ts`, `linea.controller.spec.ts`, `superlinea.controller.spec.ts` | Integración — un camino de éxito y uno de fracaso por endpoint |
| Servicios | `producto.service.spec.ts`, `linea.service.spec.ts`, `superlinea.service.spec.ts` | Unitarias con mocks — solo métodos con lógica/decisiones |
| Persistencia | `producto.persistence-adapters.int-spec.ts`, `linea.persistence-adapter.int-spec.ts`, `superlinea.persistence-adapter.int-spec.ts`, `add-superlinea-to-linea.int-spec.ts` | Integración real contra MySQL 8 (Testcontainers) |
| DTO | `select-linea.dto.spec.ts`, `search-producto-superlinea.dto.spec.ts` | Unitarias de validación declarativa |

### Persistencia: por qué integración real y no mocks

Las consultas de CR-004 tienen lógica propia: el `LIKE` case-insensitive pero **acento-sensible**, el cortocircuito de término vacío y el join `producto → linea → superLinea` con filtro de soft-delete en las tres tablas. Por eso se prueban contra una **base MySQL 8 real levantada con Testcontainers**, no con repositorios mockeados. Esto valida lo que un mock no puede: que la expresión de colación realmente distinga acentos (`"harina"` matchea `"Harina integral"` y excluye `"harína"`).

El entorno del contenedor es efímero y reproducible: `test/integration/global-setup.ts` levanta un `mysql:8.0`, corre las migraciones y expone la conexión; las specs construyen su `DataSource` sobre esa conexión.

### Evidencia

- `corepack yarn test` (unitarias): **25 suites verdes / 83 tests verdes**. Las suites fallidas restantes son **preexistentes y ajenas a CR-004** (por ejemplo `marca.*` y módulos fuera de alcance).
- `corepack yarn test:integration`: **4 suites verdes / 23 tests verdes**.
- `corepack yarn build`: exit 0.

### Pruebas diferidas y justificación de riesgo

- **`SelectSuperLineaDto`**: no se le escribió unit spec propio por ser idéntico a `SelectLineaDto` (misma validación declarativa simple). El endpoint `/superlinea/select` queda cubierto por un camino de éxito y uno de fracaso. Riesgo: **bajo** (validación trivial y contrato cubierto a nivel de endpoint).
- **Módulos fuera de alcance** (auth, configuración, `ProductoOperacion`) y código en deuda técnica: no testeados por decisión de alcance.
