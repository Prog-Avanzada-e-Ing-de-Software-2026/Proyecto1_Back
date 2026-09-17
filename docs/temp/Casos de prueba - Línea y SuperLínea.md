## ***Feature: Gestión de Línea***

Como administrador de productos, quiero gestionar Líneas asociadas a una SuperLínea para organizar los Productos dentro de categorías válidas.

### **Background**

**Given** que existe un usuario autorizado para gestionar productos

**And** que las entidades indicadas como activas no están eliminadas lógicamente

### **Scenario: Registrar una Línea con una única SuperLínea activa — CP-47**


**Given** qué existe la SuperLínea activa "Bebidas"

**And** que no existe otra Línea denominada "Sin Alcohol"

**When** se registra la Línea "Sin Alcohol" seleccionando la SuperLínea "Bebidas"

**Then** se debe crear la Línea con un identificador único

**And** la Línea debe quedar asociada solamente a la SuperLínea "Bebidas"

### **Scenario Outline: Rechazar el registro sin una SuperLínea activa válida — CP-48**


**Given** que se completaron los demás datos válidos de una Línea

**When** se intenta registrar la Línea con `<condicion_superlinea>`

**Then** el registro debe ser rechazado

**And** no se debe persistir la Línea

**Examples:**

| condicion\_superlinea                                                    |
|:-------------------------------------------------------------------------|
| el campo `superLineaId` omitido en la solicitud                          |
| el campo `superLineaId` con valor `null`                                 |
| un `superLineaId` que no corresponde a una SuperLínea registrada         |
| un `superLineaId` correspondiente a una SuperLínea eliminada lógicamente |


### **Scenario Outline: Validar la denominación al registrar una Línea — CP-49**


**Given** que existe una SuperLínea activa seleccionada

**When** se intenta registrar una Línea con `<denominacion>`

**Then** el registro debe producir `<resultado>`

**Examples:**

| denominación                         | resultado                                       |
|:-------------------------------------|:------------------------------------------------|
| una cadena vacía                     | rechazo por denominación obligatoria            |
| una cadena de 255 caracteres         | aceptación respecto del límite de longitud      |
| una cadena de 256 caracteres         | rechazo por superar el máximo de 255 caracteres |
| la denominación de otra Línea activa | rechazo por falta de unicidad                   |


### **Scenario: Modificar una Línea y reasignarla a otra SuperLínea activa — CP-50**


**Given** que la Línea "Sin Alcohol" pertenece a la SuperLínea activa "Bebidas"

**And** que existe la SuperLínea activa "Hogar"

**When** se modifica la Línea seleccionando la SuperLínea "Hogar"

**Then** la modificación debe realizarse correctamente

**And** la Línea debe quedar asociada solamente a la SuperLínea "Hogar"

### **Scenario: Conservar la asociación al modificar otros datos de una Línea — CP-51**


**Given** que la Línea "Sin Alcohol" pertenece a la SuperLínea activa "Bebidas"

**When** se modifica únicamente la observación de la Línea

**Then** la Línea debe conservar su asociación con "Bebidas"

**And** debe continuar teniendo una única SuperLínea

### **Scenario Outline: Rechazar una reasignación inválida al modificar una Línea — CP-52**


**Given** que existe una Línea asociada a una SuperLínea activa

**When** se intenta reasignarla a `<condicion_superlinea>`

**Then** la modificación debe ser rechazada

**And** se debe conservar la asociación anterior

**Examples:**

| condicion\_superlinea                                                    |
|:-------------------------------------------------------------------------|
| el campo `superLineaId` con valor `null`                                 |
| un `superLineaId` que no corresponde a una SuperLínea registrada         |
| un `superLineaId` correspondiente a una SuperLínea eliminada lógicamente |


### **Scenario Outline: Validar la denominación al modificar una Línea — CP-53**


**Given** que existe una Línea asociada a una SuperLínea activa

**When** se intenta modificar su denominación con `<denominacion>`

**Then** la modificación debe producir `<resultado>`

**Examples:**

| denominación                                                      | resultado                                       |
|:------------------------------------------------------------------|:------------------------------------------------|
| una cadena vacía                                                  | rechazo por denominación obligatoria            |
| una cadena de 255 caracteres                                      | aceptación respecto del límite de longitud      |
| una cadena de 256 caracteres                                      | rechazo por superar el máximo de 255 caracteres |
| la denominación de otra Línea activa                              | rechazo por falta de unicidad                   |
| `maquinas`, cuando existe otra Línea activa denominada `Máquinas` | rechazo por falta de unicidad                   |
| la denominación de otra Línea eliminada lógicamente               | rechazo por falta de unicidad                   |
| la denominación actual de la misma Línea                          | aceptación sin conflicto consigo misma          |


### **Scenario: Consultar una Línea — CP-54**


**Given** que existe la Línea activa "Sin Alcohol" asociada a "Bebidas"

**When** se consulta el detalle de la Línea

**Then** se deben informar, como mínimo, el identificador y la denominación de la Línea

**And** se deben informar el identificador y la denominación de su SuperLínea



### **Scenario: Eliminar una Línea sin Productos activos asociados — CP–55**


**Given** que existe una Línea activa sin Productos activos asociados

**When** se solicita eliminarla con un usuario responsable válido

**Then** la Línea debe quedar eliminada lógicamente

**And** la respuesta debe tener código HTTP 200

### **Scenario: Impedir la eliminación de una Línea con Productos activos — CP-56**


**Given** que existe una Línea activa con al menos un Producto activo asociado

**When** se solicita eliminar la Línea

**Then** la eliminación debe ser rechazada

**And** la Línea debe continuar activa

## ***Feature: Gestión de SuperLínea***

Como administrador de productos, quiero gestionar SuperLíneas para agrupar Líneas relacionadas dentro de categorías superiores.

### **Background**


**Given** que existe un usuario autorizado para gestionar productos

**And** que las entidades indicadas como activas no están eliminadas lógicamente

### **Scenario: Registrar una SuperLínea válida — CP-57**


**Given** que no existe una SuperLínea denominada "Bebidas"

**When** se registra "Bebidas" con una observación opcional

**Then** se debe crear una SuperLínea con un identificador único

**And** la respuesta debe tener código HTTP 201

### **Scenario Outline: Validar la denominación al registrar una SuperLínea — CP-58**


**When** se intenta registrar una SuperLínea con `<denominacion>`

**Then** el registro debe producir `<resultado>`

**Examples:**

| denominacion                 | resultado                                       |
|:-----------------------------|:------------------------------------------------|
| una cadena vacía             | rechazo por denominación obligatoria            |
| una cadena de 255 caracteres | aceptación respecto del límite de longitud      |
| una cadena de 256 caracteres | rechazo por superar el máximo de 255 caracteres |





### **Scenario Outline: Rechazar una denominación de SuperLínea ya reservada — CP-59**


**Given** que existe `<registro_previo>` con la denominación `<denominacion_existente>`

**When** se intenta registrar otra SuperLínea con la denominación `<denominacion_nueva>`

**Then** el registro debe ser rechazado por falta de unicidad

**Examples:**

| registro\_previo                     | denominacion\_existente | denominacion\_nueva |
|:-------------------------------------|:------------------------|:--------------------|
| una SuperLínea activa                | Máquinas                | maquinas            |
| una SuperLínea activa                | Máquinas                | MÁQUINAS            |
| una SuperLínea eliminada lógicamente | Máquinas                | Maquinas            |


### **Scenario: Consultar SuperLíneas registradas — CP-60**


**Given** que existen SuperLíneas activas con y sin observación

**When** se consultan las SuperLíneas registradas

**Then** se deben mostrar todas las SuperLíneas activas

**And** se debe informar, como mínimo, el identificador y la denominación de cada una

**And** se debe poder consultar la observación cuando exista

### **Scenario: Consultar SuperLíneas cuando no existen registros activos — CP-61**

**Given** que no existen SuperLíneas activas

**When** se consultan las SuperLíneas registradas

**Then** la respuesta debe contener una colección vacía

**And** el total debe ser 0

**And** la respuesta debe tener código HTTP 200

### **Scenario: Modificar una SuperLínea existente — CP-62**


**Given** que existe la SuperLínea activa "Bebidas"

**When** se modifica su denominación a "Bebidas Sin Alcohol" y su observación

**Then** la información debe quedar actualizada

**And** la SuperLínea debe conservar su identificador

**And** la respuesta debe tener código HTTP 200


### **Scenario Outline: Rechazar una denominación inválida al modificar una SuperLínea — CP-63**


**Given** que existe una SuperLínea activa

**When** se intenta modificar su denominación con `<denominacion>`

**Then** la modificación debe producir `<resultado>`

**Examples:**

| denominacion                                                           | resultado                                       |
|:-----------------------------------------------------------------------|:------------------------------------------------|
| una cadena vacía                                                       | rechazo por denominación obligatoria            |
| una cadena de 255 caracteres                                           | aceptación respecto del límite de longitud      |
| una cadena de 256 caracteres                                           | rechazo por superar el máximo de 255 caracteres |
| la denominación de otra SuperLínea activa                              | rechazo por falta de unicidad                   |
| `maquinas`, cuando existe otra SuperLínea activa denominada `Máquinas` | rechazo por falta de unicidad                   |
| la denominación de otra SuperLínea eliminada lógicamente               | rechazo por falta de unicidad                   |
| la denominación actual de la misma SuperLínea                          | aceptación sin conflicto consigo misma          |


### **Scenario Outline: Eliminar una SuperLínea sin Líneas activas asociadas — CP-64**


**Given** que existe una SuperLínea activa

**And** que `<condicion_lineas>`

**When** se solicita eliminarla con un usuario responsable válido

**Then** la SuperLínea debe quedar eliminada lógicamente

**And** la respuesta debe tener código HTTP 200

**Examples:**

| condicion\_lineas                                  |
|:---------------------------------------------------|
| no tiene Líneas asociadas                          |
| solo tiene Líneas eliminadas lógicamente asociadas |


### **Scenario: Impedir la eliminación de una SuperLínea con Líneas activas asociadas — CP-65**


**Given** que existe una SuperLínea activa con al menos una Línea activa asociada

**When** se solicita eliminar la SuperLínea

**Then** la eliminación debe ser rechazada

**And** la SuperLínea debe continuar activa

### **Scenario: Consultar el detalle de una SuperLínea eliminada — CP-66**


**Given** que una SuperLínea fue eliminada lógicamente

**When** se consulta su detalle por identificador

**Then** la respuesta debe tener código HTTP 404




| 47 | Registrar Línea       | CR-003 CA-1 y CA-2; una Línea pertenece a una única SuperLínea activa                            |  | Integración               |
|:---|:----------------------|:-------------------------------------------------------------------------------------------------|:-|:--------------------------|
| 48 | Registrar Línea       | CR-003 CA-1 y CA-2; asociación obligatoria con SuperLínea activa                                 |  | Unitario \+ Integración   |
| 49 | Registrar Línea       | Denominación obligatoria, reservada incluso tras soft-delete y de hasta 255 caracteres           |  | Unitario \+ Integración   |
| 50 | Modificar Línea       | Selección de SuperLínea activa; asociación única                                                 |  | Integración               |
| 51 | Modificar Línea       | Regresión: conservación de la asociación cuando no se modifica                                   |  | Integración               |
| 52 | Modificar Línea       | CR-003 CA-1 y CA-2; rechazo de asociación inexistente, eliminada o nula                          |  | Unitario \+ Integración   |
| 53 | Modificar Línea       | Denominación obligatoria, reservada tras soft-delete, sin conflicto consigo misma y de hasta 255 |  | Unitario \+ Integración   |
| 54 | Consultar Línea       | Regresión: detalle de Línea con asociación reducida de SuperLínea                                |  | Integración               |
| 55 | Eliminar Línea        | Regresión: eliminación lógica sin Productos activos y respuesta HTTP 200                         |  | Integración               |
| 56 | Eliminar Línea        | Regresión: impedir eliminación con Productos activos                                             |  | Integración               |
| 57 | Registrar SuperLínea  | Denominación obligatoria, observación opcional, identificador y respuesta HTTP 201               |  | Integración \+ E2E/manual |
| 58 | Registrar SuperLínea  | Denominación obligatoria y de hasta 255 caracteres                                               |  | Unitario                  |
| 59 | Registrar SuperLínea  | Unicidad sin distinguir mayúsculas, minúsculas o tildes, incluso frente a registros eliminados   |  | Integración               |
| 60 | Consultar SuperLíneas | Listado activo; identificador, denominación y observación                                        |  | Integración \+ E2E/manual |
| 61 | Consultar SuperLíneas | Colección vacía, total 0 y respuesta HTTP 200                                                    |  | Integración \+ E2E/manual |
| 62 | Modificar SuperLínea  | Modificación persistida, conservación del identificador y respuesta HTTP 200                     |  | Integración \+ E2E/manual |
| 63 | Modificar SuperLínea  | Denominación obligatoria, reservada tras soft-delete, sin conflicto consigo misma y de hasta 255 |  | Unitario \+ Integración   |
| 64 | Eliminar SuperLínea   | Eliminación sin Líneas activas, incluso si existen Líneas eliminadas; respuesta HTTP 200         |  | Integración               |
| 65 | Eliminar SuperLínea   | RN: impedir eliminación si existe al menos una Línea activa asociada                             |  | Integración \+ E2E/manual |
| 66 | Consultar SuperLínea  | Detalle por identificador de una SuperLínea eliminada; respuesta HTTP 404                        |  | Integración               |
