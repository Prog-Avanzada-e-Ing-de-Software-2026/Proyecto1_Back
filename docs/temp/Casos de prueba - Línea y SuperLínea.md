# Casos de prueba: Línea y SuperLínea

## Feature: Gestión de Línea

Como administrador de productos, quiero gestionar Líneas asociadas a una SuperLínea para organizar los Productos dentro de categorías válidas.

### Background

**Given** que existe un usuario autorizado para gestionar productos

**And** que las entidades indicadas como activas no están eliminadas lógicamente

### Scenario: Registrar una Línea con una única SuperLínea activa — LIN-CP-01

**Given** que existe la SuperLínea activa "Bebidas"

**And** que no existe otra Línea denominada "Sin Alcohol"

**When** se registra la Línea "Sin Alcohol" seleccionando la SuperLínea "Bebidas"

**Then** se debe crear la Línea con un identificador único

**And** la Línea debe quedar asociada solamente a la SuperLínea "Bebidas"

### Scenario Outline: Rechazar el registro sin una SuperLínea activa válida — LIN-CP-02

**Given** que se completaron los demás datos válidos de una Línea

**When** se intenta registrar la Línea con `<condicion_superlinea>`

**Then** el registro debe ser rechazado

**And** no se debe persistir la Línea

**Examples:**

| condicion_superlinea                                      |
|-----------------------------------------------------------|
| el identificador omitido                                  |
| un identificador nulo                                     |
| el identificador de una SuperLínea inexistente            |
| el identificador de una SuperLínea eliminada lógicamente  |

### Scenario Outline: Validar la denominación al registrar una Línea — LIN-CP-03

**Given** que existe una SuperLínea activa seleccionada

**When** se intenta registrar una Línea con `<denominacion>`

**Then** el registro debe producir `<resultado>`

**Examples:**

| denominacion                                                      | resultado                                       |
|-------------------------------------------------------------------|-------------------------------------------------|
| una cadena vacía                                                  | rechazo por denominación obligatoria            |
| una cadena de 255 caracteres                                      | aceptación respecto del límite de longitud      |
| una cadena de 256 caracteres                                      | rechazo por superar el máximo de 255 caracteres |
| la denominación de otra Línea activa                              | rechazo por falta de unicidad                   |
| `maquinas`, cuando existe otra Línea activa denominada `Máquinas` | rechazo por falta de unicidad                   |
| la denominación de otra Línea eliminada lógicamente               | rechazo por falta de unicidad                   |

### Scenario: Modificar una Línea y reasignarla a otra SuperLínea activa — LIN-CP-04

**Given** que la Línea "Sin Alcohol" pertenece a la SuperLínea activa "Bebidas"

**And** que existe la SuperLínea activa "Hogar"

**When** se modifica la Línea seleccionando la SuperLínea "Hogar"

**Then** la modificación debe realizarse correctamente

**And** la Línea debe quedar asociada solamente a la SuperLínea "Hogar"

### Scenario: Conservar la asociación al modificar otros datos de una Línea — LIN-CP-05

**Given** que la Línea "Sin Alcohol" pertenece a la SuperLínea activa "Bebidas"

**When** se modifica únicamente la observación de la Línea

**Then** la Línea debe conservar su asociación con "Bebidas"

**And** debe continuar teniendo una única SuperLínea

### Scenario Outline: Rechazar una reasignación inválida al modificar una Línea — LIN-CP-06

**Given** que existe una Línea asociada a una SuperLínea activa

**When** se intenta reasignarla a `<condicion_superlinea>`

**Then** la modificación debe ser rechazada

**And** se debe conservar la asociación anterior

**Examples:**

| condicion_superlinea                                     |
|----------------------------------------------------------|
| un identificador nulo                                    |
| el identificador de una SuperLínea inexistente           | 
| el identificador de una SuperLínea eliminada lógicamente |

### Scenario Outline: Validar la denominación al modificar una Línea — LIN-CP-07

**Given** que existe una Línea asociada a una SuperLínea activa

**When** se intenta modificar su denominación con `<denominacion>`

**Then** la modificación debe producir `<resultado>`

**Examples:**

| denominacion                                                      | resultado                                       |
|-------------------------------------------------------------------|-------------------------------------------------|
| una cadena vacía                                                  | rechazo por denominación obligatoria            |
| una cadena de 255 caracteres                                      | aceptación respecto del límite de longitud      |
| una cadena de 256 caracteres                                      | rechazo por superar el máximo de 255 caracteres |
| la denominación de otra Línea activa                              | rechazo por falta de unicidad                   |
| `maquinas`, cuando existe otra Línea activa denominada `Máquinas` | rechazo por falta de unicidad                   |
| la denominación de otra Línea eliminada lógicamente               | rechazo por falta de unicidad                   |
| la denominación actual de la misma Línea                          | aceptación sin conflicto consigo misma          |

### Scenario: Consultar el detalle de una Línea con su SuperLínea — LIN-CP-08

**Given** que existe la Línea activa "Sin Alcohol" asociada a "Bebidas"

**When** se consulta el detalle de la Línea

**Then** se deben informar, como mínimo, el identificador y la denominación de la Línea

**And** se deben informar el identificador y la denominación de su SuperLínea

### Scenario: Eliminar una Línea sin Productos activos asociados — LIN-CP-09

**Given** que existe una Línea activa sin Productos activos asociados

**When** se solicita eliminarla con un usuario responsable válido

**Then** la Línea debe quedar eliminada lógicamente

**And** la respuesta debe tener código HTTP 200

### Scenario: Impedir la eliminación de una Línea con Productos activos — LIN-CP-10

**Given** que existe una Línea activa con al menos un Producto activo asociado

**When** se solicita eliminar la Línea

**Then** la eliminación debe ser rechazada

**And** la Línea debe continuar activa

## Feature: Gestión de SuperLínea

Como administrador de productos, quiero gestionar SuperLíneas para agrupar Líneas relacionadas dentro de categorías superiores.

### Background

**Given** que existe un usuario autorizado para gestionar productos

**And** que las entidades indicadas como activas no están eliminadas lógicamente

### Scenario: Registrar una SuperLínea válida — SL-CP-01

**Given** que no existe una SuperLínea denominada "Bebidas"

**When** se registra "Bebidas" con una observación opcional

**Then** se debe crear una SuperLínea con un identificador único

**And** la respuesta debe tener código HTTP 201

### Scenario Outline: Validar la denominación al registrar una SuperLínea — SL-CP-02

**When** se intenta registrar una SuperLínea con `<denominacion>`

**Then** el registro debe producir `<resultado>`

**Examples:**

| denominacion                 | resultado                                       |
|------------------------------|-------------------------------------------------|
| una cadena vacía             | rechazo por denominación obligatoria            |
| una cadena de 255 caracteres | aceptación respecto del límite de longitud      |
| una cadena de 256 caracteres | rechazo por superar el máximo de 255 caracteres |

### Scenario Outline: Rechazar una denominación de SuperLínea ya reservada — SL-CP-03

**Given** que existe `<registro_previo>` con la denominación `<denominacion_existente>`

**When** se intenta registrar otra SuperLínea con la denominación `<denominacion_nueva>`

**Then** el registro debe ser rechazado por falta de unicidad

**Examples:**

| registro_previo                      | denominacion_existente | denominacion_nueva |
|--------------------------------------|------------------------|--------------------|
| una SuperLínea activa                | Máquinas               | maquinas           |
| una SuperLínea activa                | Máquinas               | MÁQUINAS           |
| una SuperLínea eliminada lógicamente | Máquinas               | Maquinas           |

### Scenario: Consultar SuperLíneas registradas — SL-CP-04

**Given** que existen SuperLíneas activas con y sin observación

**When** se consultan las SuperLíneas registradas

**Then** se deben mostrar todas las SuperLíneas activas

**And** se debe informar, como mínimo, el identificador y la denominación de cada una

**And** se debe poder consultar la observación cuando exista

### Scenario: Consultar SuperLíneas cuando no existen registros activos — SL-CP-05

**Given** que no existen SuperLíneas activas

**When** se consultan las SuperLíneas registradas

**Then** la respuesta debe contener una colección vacía

**And** el total debe ser 0

**And** la respuesta debe tener código HTTP 200

### Scenario: Modificar una SuperLínea existente — SL-CP-06

**Given** que existe la SuperLínea activa "Bebidas"

**When** se modifica su denominación a "Bebidas Sin Alcohol" y su observación

**Then** la información debe quedar actualizada

**And** la SuperLínea debe conservar su identificador

**And** la respuesta debe tener código HTTP 200

### Scenario Outline: Rechazar una denominación inválida al modificar una SuperLínea — SL-CP-07

**Given** que existe una SuperLínea activa

**When** se intenta modificar su denominación con `<denominacion>`

**Then** la modificación debe producir `<resultado>`

**Examples:**

| denominacion                                                           | resultado                                       |
|------------------------------------------------------------------------|-------------------------------------------------|
| una cadena vacía                                                       | rechazo por denominación obligatoria            |
| una cadena de 255 caracteres                                           | aceptación respecto del límite de longitud      |
| una cadena de 256 caracteres                                           | rechazo por superar el máximo de 255 caracteres |
| la denominación de otra SuperLínea activa                              | rechazo por falta de unicidad                   |
| `maquinas`, cuando existe otra SuperLínea activa denominada `Máquinas` | rechazo por falta de unicidad                   |
| la denominación de otra SuperLínea eliminada lógicamente               | rechazo por falta de unicidad                   |
| la denominación actual de la misma SuperLínea                          | aceptación sin conflicto consigo misma          |

### Scenario Outline: Eliminar una SuperLínea sin Líneas activas asociadas — SL-CP-08

**Given** que existe una SuperLínea activa

**And** que `<condicion_lineas>`

**When** se solicita eliminarla con un usuario responsable válido

**Then** la SuperLínea debe quedar eliminada lógicamente

**And** la respuesta debe tener código HTTP 200

**Examples:**

| condicion_lineas                                   |
|----------------------------------------------------|
| no tiene Líneas asociadas                          |
| solo tiene Líneas eliminadas lógicamente asociadas |

### Scenario: Impedir la eliminación de una SuperLínea con Líneas activas asociadas — SL-CP-09

**Given** que existe una SuperLínea activa con al menos una Línea activa asociada

**When** se solicita eliminar la SuperLínea

**Then** la eliminación debe ser rechazada

**And** la SuperLínea debe continuar activa

### Scenario: Consultar el detalle de una SuperLínea eliminada — SL-CP-10

**Given** que una SuperLínea fue eliminada lógicamente

**When** se consulta su detalle por identificador

**Then** la respuesta debe tener código HTTP 404

## Trazabilidad de Gestión de Línea

| ID        | HU/Caso de uso             | CA/RN cubierta                                                                                   | Estado    | Tipo de prueba         |
|-----------|----------------------------|--------------------------------------------------------------------------------------------------|-----------|------------------------|
| LIN-CP-01 | Registrar Línea            | CR-003 CA-1 y CA-2; una Línea pertenece a una única SuperLínea activa                            | Pendiente | Integración            |
| LIN-CP-02 | Registrar Línea            | CR-003 CA-1 y CA-2; asociación obligatoria con SuperLínea activa                                 | Pendiente | Unitario + Integración |
| LIN-CP-03 | Registrar Línea            | Denominación obligatoria, reservada incluso tras soft-delete y de hasta 255 caracteres           | Pendiente | Unitario + Integración |
| LIN-CP-04 | Modificar Línea            | Selección de SuperLínea activa; asociación única                                                 | Pendiente | Integración            |
| LIN-CP-05 | Modificar Línea            | Regresión: conservación de la asociación cuando no se modifica                                   | Pendiente | Integración            |
| LIN-CP-06 | Modificar Línea            | CR-003 CA-1 y CA-2; rechazo de asociación inexistente, eliminada o nula                          | Pendiente | Unitario + Integración |
| LIN-CP-07 | Modificar Línea            | Denominación obligatoria, reservada tras soft-delete, sin conflicto consigo misma y de hasta 255 | Pendiente | Unitario + Integración |
| LIN-CP-08 | Consultar Línea            | Regresión: detalle de Línea con asociación reducida de SuperLínea                                | Pendiente | Integración            |
| LIN-CP-09 | Eliminar Línea             | Regresión: eliminación lógica sin Productos activos y respuesta HTTP 200                         | Pendiente | Integración            |
| LIN-CP-10 | Eliminar Línea             | Regresión: impedir eliminación con Productos activos                                             | Pendiente | Integración            |

## Trazabilidad de Gestión de SuperLínea

| ID       | HU/Caso de uso                  | CA/RN cubierta                                                                                   | Estado    | Tipo de prueba           |
|----------|---------------------------------|--------------------------------------------------------------------------------------------------|-----------|--------------------------|
| SL-CP-01 | Registrar SuperLínea            | Denominación obligatoria, observación opcional, identificador y respuesta HTTP 201               | Pendiente | Integración + E2E/manual |
| SL-CP-02 | Registrar SuperLínea            | Denominación obligatoria y de hasta 255 caracteres                                               | Pendiente | Unitario                 |
| SL-CP-03 | Registrar SuperLínea            | Unicidad sin distinguir mayúsculas, minúsculas o tildes, incluso frente a registros eliminados   | Pendiente | Integración              |
| SL-CP-04 | Consultar SuperLíneas           | Listado activo; identificador, denominación y observación                                        | Pendiente | Integración + E2E/manual |
| SL-CP-05 | Consultar SuperLíneas           | Colección vacía, total 0 y respuesta HTTP 200                                                    | Pendiente | Integración + E2E/manual |
| SL-CP-06 | Modificar SuperLínea            | Modificación persistida, conservación del identificador y respuesta HTTP 200                     | Pendiente | Integración + E2E/manual |
| SL-CP-07 | Modificar SuperLínea            | Denominación obligatoria, reservada tras soft-delete, sin conflicto consigo misma y de hasta 255 | Pendiente | Unitario + Integración   |
| SL-CP-08 | Eliminar SuperLínea             | Eliminación sin Líneas activas, incluso si existen Líneas eliminadas; respuesta HTTP 200         | Pendiente | Integración              |
| SL-CP-09 | Eliminar SuperLínea             | RN: impedir eliminación si existe al menos una Línea activa asociada                             | Pendiente | Integración + E2E/manual |
| SL-CP-10 | Consultar SuperLínea            | Detalle por identificador de una SuperLínea eliminada; respuesta HTTP 404                        | Pendiente | Integración              |
