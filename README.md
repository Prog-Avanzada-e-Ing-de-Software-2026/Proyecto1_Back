# Distribuidora BV - Sistema de Gestión

Backend para el sistema de gestión integral de una distribuidora. Construido con NestJS, TypeScript y MySQL, siguiendo una arquitectura modular con patrones de diseño orientados al dominio.Stack tecnológico

- **Framework**: NestJS 11
- **Lenguaje**: TypeScript 5.7
- **Runtime**: Node.js 24
- **Package manager**: Yarn 4
- **Base de datos**: MySQL 8 + TypeORM 0.3
- **Autenticación**: JWT + bcrypt
- **Documentación API**: Swagger / OpenAPI
- **Procesamiento de archivos**: Multer, Sharp, Tesseract.js (OCR), XLSX
- **Generación de PDFs**: PDFKit, PDFMake
- **Email**: Nodemailer
- **Testing**: Jest + ts-jest + Testcontainers (integración)
- **Linting/Formato**: ESLint + Prettier
- **Infraestructura**: Docker + Docker Compose
- **Despliegue**: Heroku (backend + frontend), Aiven (MySQL)
- **Control de versiones**: Git + GitHub

---

## Estructura del proyecto

```
Proyecto1_Back/
├── src/
│   ├── main.ts                        # Bootstrap de la aplicación
│   ├── app.module.ts                  # Módulo raíz
│   ├── index.ts                       # Exportación central de entidades
│   ├── migrations/                    # Migraciones de base de datos
│   └── modules/
│       ├── gestion-usuario/           # Usuarios, autenticación, roles
│       │   ├── auth/                  #   JWT, login, Google auth
│       │   ├── usuario/               #   Entidad y operaciones de usuario
│       │   └── rol/                   #   Roles y permisos
│       ├── gestion-productos/         # Catálogo, stock, precios
│       │   ├── marca/                 #   Marcas de productos
│       │   ├── linea/                 #   Líneas de productos
│       │   ├── superlinea/            #   SuperLíneas (agrupa líneas)
│       │   ├── presentacion/          #   Presentaciones (1L, pack, etc.)
│       │   ├── producto/              #   Productos y stock
│       │   └── producto-operacion/    #   Operaciones sobre productos
│       ├── gestion-documentos/        # Documentos y búsquedas
│       ├── gestion-sistema/           # Configuración y auditoría
│       │   ├── configuracion-sistema/ #   Parámetros del sistema
│       │   └── auditoria/             #   Logs de auditoría
│       ├── organizacion/              # Clientes, proveedores, empresa, personal
│       ├── gutil/                     # Utilidades: provincias, localidades, IVA
│       └── common/                    # Filtros, pipes, decoradores, seeds
├── test/
│   ├── config/
│   │   ├── without-testcontainers.json  # Manifiesto tests unitarios
│   │   └── with-testcontainers.json     # Manifiesto tests integración
│   └── integration/                   # Setup Testcontainers MySQL
├── tessdata/                          # Datos de entrenamiento OCR
├── assets/                            # Recursos estáticos
├── fuentes/                           # Fuentes tipográficas
├── orm.config.ts                      # Configuración DataSource TypeORM
├── docker-compose.yml                 # Servicios Docker (MySQL + phpMyAdmin)
├── Dockerfile                         # Build para despliegue
├── Procfile                           # Procfile para Heroku
├── jest.config.js                     # Configuración Jest
├── .env                               # Variables de entorno
└── tsconfig.json                      # Configuración TypeScript
```

### Estructura interna de cada módulo

Cada módulo sigue una arquitectura en capas:

```
modulo/
├── domain/
│   ├── entities/        # Entidades TypeORM y entidades de dominio
│   └── services/        # Servicios y reglas de negocio del dominio
├── application/
│   ├── controllers/     # Controladores HTTP (transporte)
│   └── services/        # Casos de uso y orquestación
├── infraestructure/     # Repositorios y adaptadores de persistencia
├── dto/                 # Data Transfer Objects (validación en el boundary)
└── *.module.ts          # Definición del módulo NestJS (wiring de dependencias)
```

---

## Módulos

| Módulo               | Descripción                                                  |
| -------------------- | ------------------------------------------------------------ |
| `gestion-usuario`    | Usuarios, autenticación JWT, roles y permisos                |
| `gestion-productos`  | Marcas, líneas, superlíneas, presentaciones, productos, stock, precios e historial |
| `gestion-documentos` | Gestión documental y búsquedas                               |
| `gestion-sistema`    | Configuración del sistema y auditoría                        |
| `organizacion`       | Clientes, proveedores, empresa, personal, puntos de venta    |
| `gutil`              | Provincias, localidades, condiciones de IVA, domicilios      |
| `common`             | Seeds, filtros globales, pipes, decoradores, excepciones     |

---

## Configuración

### Variables de entorno (`.env`)

```env
DB_HOST=localhost
DB_PORT=3310
DB_USERNAME=admin
DB_PASSWORD=admin
DB_DATABASE=proyecto

PORT=3000
DB_TYPE=mysql
JWT_SECRET=<secret>
JWT_EXPIRATION_ACCESS=60s
JWT_EXPIRATION_REFRESH=7d
```

> **Nota**: Las credenciales y variables de entorno sensibles no deben almacenarse en el código fuente.

---

## Guía de inicio rápido

### Paso 1: Prerequisitos

Antes de comenzar, asegurate de tener instalado:

- **Node.js 24** o superior ([descargar](https://nodejs.org/))
- **Yarn 4** (habilitar con `corepack enable`)
- **Docker** y Docker Compose ([instalar Docker Desktop](https://www.docker.com/products/docker-desktop/))
- **Git** ([descargar](https://git-scm.com/))

Verificar las versiones:

```bash
node --version    # v24.x.x o superior
yarn --version    # 4.x.x
docker --version  # Docker version 20.x.x o superior
```

### Paso 2: Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd Proyecto1_Back
```

### Paso 3: Instalar dependencias

```bash
yarn install
```

Esto instalará todas las dependencias del proyecto definidas en `package.json`.

### Paso 4: Configurar variables de entorno

Crear un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```env
# Base de datos
DB_HOST=localhost
DB_PORT=3310
DB_USERNAME=admin
DB_PASSWORD=admin
DB_DATABASE=proyecto

# Servidor
PORT=3000
DB_TYPE=mysql

# Autenticación JWT
JWT_SECRET=mi-clave-secreta-cambiar-en-produccion
JWT_EXPIRATION_ACCESS=60s
JWT_EXPIRATION_REFRESH=7d
```

> **Importante**: 
>
> - El archivo `.env` ya está en `.gitignore`, no lo subas al repositorio
> - En producción, usá una clave JWT segura y única
> - Los valores de arriba son para desarrollo local

### Paso 5: Levantar la base de datos con Docker

```bash
docker-compose up -d
```

Esto levanta dos servicios:

| Servicio       | URL                   | Usuario | Password |
| -------------- | --------------------- | ------- | -------- |
| **MySQL**      | `localhost:3310`      | admin   | admin    |
| **phpMyAdmin** | http://localhost:8081 | admin   | admin    |

Verificar que los contenedores están corriendo:

```bash
docker-compose ps
```

Deberías ver ambos servicios con estado `Up`.

Para acceder a phpMyAdmin y verificar la base de datos:

```
http://localhost:8081
```

Ingresá con usuario `admin` y contraseña `admin`. Deberías ver la base de datos `proyecto` (vacía inicialmente).

### Paso 6: Ejecutar migraciones de base de datos

Las migraciones crean el esquema de la base de datos (tablas, relaciones, índices):

```bash
yarn migration:run
```

Si el comando es exitoso, verás en la consola las migraciones ejecutándose. Volvé a phpMyAdmin y deberías ver las tablas creadas.

**Comandos útiles de migraciones:**

```bash
# Ver el estado de las migraciones
yarn typeorm migration:show -d orm.config.ts

# Revertir la última migración
yarn migration:revert

# Generar una nueva migración (solo si modificaste entidades)
yarn migration:generate -d orm.config.ts src/migrations/NombreMigracion
```

### Paso 7: Levantar el servidor

**Modo desarrollo (con hot-reload):**

```bash
yarn start:dev
```

El servidor se iniciará y quedará escuchando cambios. Cada vez que modifiques código, se reiniciará automáticamente.

**Modo producción:**

```bash
# Compilar TypeScript a JavaScript
yarn build

# Iniciar el servidor compilado
yarn start:prod
```

### Paso 8: Verificar que todo funciona

Abrí el navegador en:

```
http://localhost:3000/api
```

Deberías ver la documentación **Swagger** de la API con todos los endpoints disponibles.

**Test rápido con curl:**

```bash
# Verificar que el servidor responde
curl http://localhost:3000/api
```

### Paso 9: Ejecutar tests (opcional)

**Tests unitarios:**

```bash
yarn test
```

**Tests de integración (requiere Docker corriendo):**

```bash
yarn test:integration
```

**Cobertura de tests:**

```bash
yarn test:cov
```

Los reportes de cobertura se generan en la carpeta `coverage/`.

---

## Troubleshooting

### Error: "Cannot find module"

```bash
# Limpiar e reinstalar dependencias
rm -rf node_modules
yarn install
```

### Error de conexión a la base de datos

1. Verificar que Docker está corriendo: `docker-compose ps`
2. Verificar que el puerto 3310 no esté ocupado
3. Verificar las credenciales en `.env`
4. Reiniciar los contenedores: `docker-compose down && docker-compose up -d`

### Error: "Port 3000 already in use"

Cambiar el `PORT` en el archivo `.env` a otro valor (ej: 3001).

### Las migraciones fallan

```bash
# Revertir todas las migraciones
yarn migration:revert

# Volver a ejecutar
yarn migration:run
```

Si el problema persiste, podés dropear la base de datos y recrearla desde phpMyAdmin.

---

## Instalación y producción

### Build para producción

```bash
yarn build
```

El código compilado queda en la carpeta `dist/`.

### Ejecutar en producción

```bash
yarn start:prod
```

### Docker (build de imagen)

```bash
# Build de la imagen
docker build -t proyecto1-back .

# Correr el contenedor
docker run -p 3000:3000 --env-file .env proyecto1-back
```

---

## Scripts disponibles

```bash
# Desarrollo
yarn start                # Iniciar en modo normal
yarn start:dev            # Iniciar con watch mode
yarn build                # Compilar TypeScript

# Testing
yarn test                 # Tests unitarios (sin Testcontainers)
yarn test:integration     # Tests de integración (requiere Docker)
yarn test:e2e             # Tests end-to-end
yarn test:cov             # Cobertura de tests

# Base de datos
yarn migration:generate   # Generar migración
yarn migration:run        # Ejecutar migraciones
yarn migration:revert     # Revertir última migración

# Calidad de código
yarn lint                 # Analizar y corregir linting
yarn format               # Formatear código con Prettier
```

### Estrategia de testing

El proyecto utiliza dos manifiestos de test que controlan qué specs se ejecutan:

- **`yarn test`**: ejecuta pruebas unitarias definidas en `test/config/without-testcontainers.json`. No requiere Docker.
- **`yarn test:integration`**: ejecuta pruebas de integración definidas en `test/config/with-testcontainers.json`. Cada spec levanta su propio contenedor MySQL 8 vía Testcontainers. Requiere Docker corriendo.

---

## Documentación API

Una vez levantada la aplicación, la documentación Swagger está disponible en:

```
http://localhost:3000/api
```

Todos los endpoints tienen el prefijo `/api`.

---

## Despliegue

| Componente    | Servicio      |
| ------------- | ------------- |
| Backend       | Heroku        |
| Frontend      | Heroku        |
| Base de datos | Aiven (MySQL) |

El despliegue se realiza automáticamente mediante un pipeline de GitHub Actions al integrar cambios en la rama principal. Las migraciones de base de datos se ejecutan automáticamente con cada despliegue del backend.

---

## Convenciones de código

- **Módulos y archivos**: kebab-case (`gestion-usuario`, `producto.service.ts`)
- **Clases y entidades**: PascalCase (`Producto`, `Linea`, `SuperLinea`)
- **Tablas en BD**: snake_case (`producto`, `linea`, `super_linea`)
- **DTOs**: validados con `class-validator`, con whitelist estricto
- **Excepciones**: manejadas por filtro global (`GlobalExceptionFilter`)
- **Dominio**: las reglas de negocio viven en `domain/`; los controladores solo contienen lógica de transporte
- **Persistencia**: el acceso a TypeORM se mantiene en `infraestructure/`; el dominio y la aplicación dependen de contratos de repositorio
- **Migraciones**: la sincronización automática está deshabilitada; los cambios de esquema requieren migraciones TypeORM
