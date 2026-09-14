# Price Change History Specification

## Purpose

Define how `Producto` records `CambioPrecio` entries, how every price mutation must flow through `cambiarPrecio()`, and how the history endpoint exposes them.

## Requirements

### Requirement: Persist a price change per mutation

The system MUST record a `CambioPrecio` with `precioAnterior`, `precioNuevo`, `fecha` (including time), and `motivo` every time a product price actually changes, MUST NOT record an entry when the requested price equals the current price, and MUST mutate `Producto.precio` through `cambiarPrecio(precioNuevo, motivo)` only.

#### Scenario: Route a margin-preserving bulk adjustment

- GIVEN a `Producto` with a margin and a current price
- WHEN a bulk price adjustment (global or per line) applies a margin-preserving adjustment
- THEN the system MUST recalculate the derived cost
- AND MUST record a `CambioPrecio` whose `precioAnterior` equals the previous price, `precioNuevo` equals the adjusted price, `fecha` is set to the current date and time, and `motivo` is the supplied reason
- AND MUST update `Producto.precio` to the adjusted price

#### Scenario: Route a direct PUT price change

- GIVEN an authorized user sends a product update that includes `precio` differing from the current price
- WHEN the update is persisted
- THEN the system MUST record a `CambioPrecio` with `motivo = ActualizacionDePrecioDirecta` before saving
- AND MUST NOT apply the raw DTO price over the recorded change
- AND MUST NOT recalculate the cost

#### Scenario: Skip a no-op direct price change

- GIVEN an authorized user sends a product update that includes `precio` equal to the current price
- WHEN the update is persisted
- THEN the system MUST NOT record a `CambioPrecio`
- AND MUST NOT mutate `Producto.precio`

#### Scenario: Route a bulk adjustment with a line scope

- GIVEN a bulk price adjustment targets a specific line
- WHEN the adjustment is applied to each product
- THEN the system MUST record each `CambioPrecio` with `motivo = ActualizacionDePrecioPorLinea`

#### Scenario: Route a bulk adjustment without a line scope

- GIVEN a bulk price adjustment has no line target
- WHEN the adjustment is applied to each product
- THEN the system MUST record each `CambioPrecio` with `motivo = ActualizacionDePrecioGlobal`

### Requirement: Enforce `cambiarPrecio` invariants

The system MUST reject a price change when the requested price is not a finite positive number or when `motivo` is missing, MUST set `precioAnterior` to the current `Producto.precio`, and MUST prove continuity with the last recorded change before persisting.

#### Scenario: Reject a non-positive price

- GIVEN a `Producto`
- WHEN `cambiarPrecio` is called with a price that is zero, negative, or not finite
- THEN the system MUST throw an error
- AND MUST NOT add a `CambioPrecio` or change the price

#### Scenario: Reject a missing motive

- GIVEN a `Producto`
- WHEN `cambiarPrecio` is called without a `motivo`
- THEN the system MUST throw an error
- AND MUST NOT add a `CambioPrecio` or change the price

#### Scenario: Use the current price as previous price

- GIVEN a `Producto` with an existing price
- WHEN `cambiarPrecio` succeeds
- THEN the new `CambioPrecio` MUST have `precioAnterior` equal to the price that was current before the call

#### Scenario: Prove continuity with the last change

- GIVEN a `Producto` with a recorded `CambioPrecio`
- WHEN `cambiarPrecio` is called and the last change's `precioNuevo` does not match the current price
- THEN the system MUST throw an error
- AND MUST NOT persist the new change

### Requirement: Load the price history on write feeders

The system MUST load `cambiosPrecio` whenever a fetched `Producto` can feed a price write, and MUST NOT alter the pagination or payload of read-only and search queries.

#### Scenario: Load history for a direct update

- GIVEN a product is fetched by `findOne`
- WHEN a PUT update changes its price
- THEN the entity MUST have its `cambiosPrecio` collection loaded so continuity can be proven

#### Scenario: Load history for a bulk adjustment

- GIVEN a bulk adjustment fetches products with `incluirCambiosPrecio`
- WHEN each product price changes
- THEN each entity MUST have its `cambiosPrecio` collection loaded

#### Scenario: Keep search pagination unchanged

- GIVEN a paginated product search without `incluirCambiosPrecio`
- WHEN the query completes
- THEN the system MUST NOT join `cambiosPrecio`
- AND MUST return the same paged product set as before the change

### Requirement: Expose a paginated price history

The system MUST expose `GET /producto/:id/historial-precios` accepting a pagination query, MUST return `CambioPrecioDto` entries (`fecha`, `precioAnterior`, `precioNuevo`, `motivo`) in reverse chronological order, and MUST return an empty array when no changes exist.

#### Scenario: Query the history in reverse chronological order

- GIVEN a product with several recorded `CambioPrecio` entries
- WHEN an authorized user requests `historial-precios` with a page
- THEN the system MUST return the entries ordered by `fecha` descending (ties broken by `id` descending)

#### Scenario: Page the history

- GIVEN a product with more recorded changes than the page size
- WHEN an authorized user requests `historial-precios` with `skip` and `take`
- THEN the system MUST return only the requested page

#### Scenario: Return an empty history

- GIVEN a product with no recorded `CambioPrecio` entries
- WHEN an authorized user requests `historial-precios`
- THEN the system MUST return an empty array

#### Scenario: Reject an unknown product

- GIVEN a product that does not exist or is logically deleted
- WHEN an authorized user requests `historial-precios`
- THEN the system MUST return a not-found error

### Requirement: Keep product DTO responses unchanged

The system MUST NOT add `cambiosPrecio` to any existing product DTO; `ProductoMapper` SHALL remain behaviorally unchanged unless a separate approved change modifies it.