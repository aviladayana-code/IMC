# Kinemetrix — Evaluación Antropométrica e IMC

Aplicación web profesional para evaluación antropométrica con énfasis en el cálculo, clasificación e interpretación del **Índice de Masa Corporal (IMC)** según criterios de la Organización Mundial de la Salud (OMS).

## Tabla de contenidos

- [Descripción](#descripción)
- [Características](#características)
- [Tecnologías](#tecnologías)
- [Arquitectura](#arquitectura)
- [Instalación](#instalación)
- [Uso](#uso)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Consideraciones científicas](#consideraciones-científicas)
- [Roadmap](#roadmap)
- [Licencia](#licencia)

## Descripción

**Kinemetrix** es una herramienta digital dirigida a profesionales de las ciencias del movimiento humano, educación física, entrenamiento deportivo y salud. Permite registrar datos antropométricos, calcular automáticamente el IMC (Índice de Quetelet), interpretar los resultados según los criterios OMS para adultos y población pediátrica, y generar informes técnicos exportables en PDF.

La aplicación utiliza terminología técnica adecuada y criterios antropométricos reconocidos, diferenciando claramente entre IMC, composición corporal, porcentaje de grasa corporal, masa muscular y distribución de grasa corporal.

## Características

### Gestión de evaluados
- Registro de evaluados con nombre, identificación, sexo biológico y contexto deportivo
- Búsqueda por nombre o identificación
- Edición y eliminación (con confirmación) de registros
- Historial longitudinal de evaluaciones por sujeto

### Evaluación antropométrica
- Captura de peso corporal (kg) y estatura (cm) con validación de rangos fisiológicos
- Micro-steppers para ajuste fino de mediciones
- Cálculo automático del IMC en tiempo real con desarrollo matemático visible
- Clasificación OMS con gauge visual segmentado por categorías
- Detección automática de menores de 20 años (protocolo pediátrico / Z-score)
- Context tags para condiciones de medición (ayuno, post-entreno, euhidratado, etc.)
- Observaciones clínicas y notas profesionales

### Clasificación OMS (adultos ≥ 20 años)

| Categoría | Rango (kg/m²) | Color |
|-----------|---------------|-------|
| Bajo peso | < 18.5 | Azul |
| Peso normal | 18.5 – 24.9 | Verde |
| Sobrepeso | 25.0 – 29.9 | Ámbar |
| Obesidad Grado I | 30.0 – 34.9 | Naranja |
| Obesidad Grado II | 35.0 – 39.9 | Rojo |
| Obesidad Grado III | ≥ 40.0 | Rojo oscuro |

Para menores de 20 años, los criterios adultos no aplican directamente. La aplicación indica que se requiere interpretación por IMC para la edad (Z-score OMS) según referencias por sexo.

### Panel de resultados (Dashboard)
- Indicadores clave: evaluados registrados, evaluaciones totales, IMC promedio, distribución principal
- Gráfico de distribución por clasificación OMS
- Listado de evaluaciones recientes
- Accesos rápidos a operaciones frecuentes

### Historial longitudinal
- Gráfico de evolución del IMC con zonas OMS de referencia
- Comparación entre evaluaciones (variación de peso, variación de IMC, periodo entre mediciones, tasa de cambio)
- Tabla expandible con detalle de cada evaluación

### Informe PDF profesional
- Documento A4 con encabezado de marca
- Datos personales del evaluado
- Mediciones antropométricas y cálculo matemático
- Resultado destacado del IMC con clasificación OMS
- Interpretación técnica con aclaración fisiológica obligatoria
- Gráfico de evolución embebido (cuando existan evaluaciones previas)
- Espacio para recomendaciones profesionales
- Bloque de firma del profesional evaluador y del evaluado
- Paginación y footer con disclaimer científico

### Seguridad y autenticación
- Autenticación con NextAuth.js (credentials provider)
- Contraseñas hasheadas con bcrypt
- Protección de rutas API
- Sesiones JWT con expiración configurable

## Tecnologías

- **Framework**: Next.js 16 (App Router)
- **Lenguaje**: TypeScript 5
- **Base de datos**: Prisma ORM + SQLite
- **Autenticación**: NextAuth.js v4
- **Estado**: TanStack Query (servidor) + Zustand (cliente)
- **UI**: Tailwind CSS 4 + shadcn/ui (estilo New York)
- **Gráficos**: Recharts
- **PDF**: jsPDF
- **Iconografía**: Lucide React
- **Runtime**: Bun

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    Cliente (Navegador)                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  App Shell (sidebar + header + main + footer)         │  │
│  │  ├── LoginView                                        │  │
│  │  ├── DashboardView                                    │  │
│  │  ├── NewEvaluationView                                │  │
│  │  ├── SubjectsView                                     │  │
│  │  ├── HistoryView                                      │  │
│  │  └── ReportView                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│         │ TanStack Query  │  Zustand store                   │
└─────────┼─────────────────┼──────────────────────────────────┘
          │ fetch           │
┌─────────▼─────────────────▼──────────────────────────────────┐
│              API Routes (Next.js Route Handlers)             │
│  /api/auth/[...nextauth]   /api/auth/register                │
│  /api/subjects             /api/subjects/[id]                │
│  /api/subjects/[id]/evaluations                             │
│  /api/evaluations/[id]                                      │
└─────────┬────────────────────────────────────────────────────┘
          │ Prisma Client
┌─────────▼────────────────────────────────────────────────────┐
│              SQLite (db/custom.db)                           │
│  User · Subject · Evaluation                                │
└─────────────────────────────────────────────────────────────┘
```

La arquitectura está diseñada para permitir incorporar posteriormente otros módulos de evaluación antropométrica (pliegues cutáneos, bioimpedancia, DEXA) y composición corporal sin alterar la estructura base.

## Instalación

### Requisitos previos

- Node.js 18+ o Bun 1.0+
- npm, pnpm o bun

### Pasos

1. **Clonar el repositorio**

   ```bash
   git clone https://github.com/aviladayana-code/IMC.git
   cd IMC
   ```

2. **Instalar dependencias**

   ```bash
   # Con bun (recomendado)
   bun install

   # O con npm
   npm install
   ```

3. **Configurar variables de entorno**

   ```bash
   cp .env.example .env
   ```

   Edita `.env` con la ruta a tu base de datos SQLite:

   ```env
   DATABASE_URL=file:./db/custom.db
   ```

4. **Inicializar la base de datos**

   ```bash
   # Generar el cliente Prisma
   bun run db:generate

   # Crear las tablas
   bun run db:push
   ```

5. **Crear usuario semilla (opcional)**

   ```bash
   bun run scripts/seed.ts
   ```

   Esto crea una cuenta demo:
   - Email: `demo@kinemetrix.app`
   - Contraseña: `demo1234`

6. **Iniciar el servidor de desarrollo**

   ```bash
   bun run dev
   # o
   npm run dev
   ```

7. **Abrir la aplicación**

   Visita `http://localhost:3000` en tu navegador.

## Uso

### Acceso inicial

1. Inicia sesión con la cuenta demo o regístrate via `/api/auth/register`.
2. Crea tu primer evaluado desde **Nueva Evaluación → Crear nuevo**.
3. Captura peso y estatura; el IMC se calculará automáticamente.
4. Guarda la evaluación; se redirigirá al historial del evaluado.
5. Genera el informe PDF desde **Informe PDF**.

### Flujo profesional típico

1. **Dashboard**: revisa el estado general del sistema.
2. **Nueva Evaluación**: registra mediciones de un evaluado (existente o nuevo).
3. **Evaluados**: busca, edita o elimina sujetos.
4. **Historial**: revisa la evolución longitudinal y compara evaluaciones.
5. **Informe PDF**: documenta la evaluación con firma profesional.

## Estructura del proyecto

```
.
├── prisma/
│   └── schema.prisma              # Esquema de base de datos (User, Subject, Evaluation)
├── public/
│   └── logo.svg                   # Logo Kinemetrix
├── scripts/
│   └── seed.ts                    # Script de inicialización de datos demo
├── src/
│   ├── app/
│   │   ├── api/                   # Route Handlers (auth, subjects, evaluations)
│   │   ├── globals.css            # Estilos globales + tema teal-petróleo
│   │   ├── layout.tsx             # Layout raíz con providers
│   │   └── page.tsx               # Entry point (single-page app con vistas)
│   ├── components/
│   │   ├── app/
│   │   │   └── app-shell.tsx      # Shell principal (sidebar + header + footer)
│   │   ├── bmi/
│   │   │   ├── bmi-evolution-chart.tsx       # Chart Recharts (UI)
│   │   │   ├── bmi-evolution-chart-pdf.tsx   # Chart SVG plano para PDF
│   │   │   └── bmi-gauge.tsx                 # Gauge visual del IMC
│   │   ├── providers/
│   │   │   └── providers.tsx      # QueryClient + SessionProvider
│   │   ├── ui/                    # shadcn/ui components
│   │   └── views/                 # Vistas principales
│   │       ├── login-view.tsx
│   │       ├── dashboard-view.tsx
│   │       ├── new-evaluation-view.tsx
│   │       ├── subjects-view.tsx
│   │       ├── history-view.tsx
│   │       └── report-view.tsx
│   ├── hooks/
│   │   ├── use-anthropometry.ts   # Hooks TanStack Query (subjects, evaluations)
│   │   ├── use-toast.ts
│   │   └── use-mobile.ts
│   ├── lib/
│   │   ├── auth.ts                # Configuración NextAuth
│   │   ├── bmi.ts                 # Motor de cálculo y clasificación OMS
│   │   ├── db.ts                  # Cliente Prisma
│   │   ├── session.ts             # Helper getCurrentUser
│   │   └── utils.ts               # Utilidades (cn, etc.)
│   └── store/
│       └── app-store.ts           # Zustand store (vista + sujeto seleccionado)
├── .env.example                   # Template de variables de entorno
├── .gitignore
├── components.json                # Configuración shadcn/ui
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

## Consideraciones científicas

### Sobre el IMC

El **Índice de Masa Corporal** (IMC), también conocido como **Índice de Quetelet**, evalúa la proporción entre la masa corporal total y la estatura al cuadrado:

```
IMC = Peso (kg) / [Estatura (m)]²
```

### Limitaciones

El IMC es un indicador de relación entre peso y estatura, **no una medición directa de grasa corporal**. No discrimina:

- Masa magra esquelética de masa adiposa visceral
- Porcentaje de grasa corporal
- Masa muscular
- Distribución de grasa corporal

En personas físicamente activas o deportistas con elevada masa muscular, valores elevados de IMC pueden reflejar hipertrofia muscular y densidad ósea adaptativa, **no necesariamente exceso de adiposidad**.

### Diferenciación conceptual

| Indicador | Qué mide | Técnica |
|-----------|----------|---------|
| IMC | Relación masa/estatura | Antropometría básica |
| Composición corporal | Masa grasa vs. magra | Pliegues, BIA, DEXA |
| % grasa corporal | Proporción de grasa | Pliegues, BIA, DEXA |
| Masa muscular | Cantidad de tejido muscular | RM, BIA, DEXA |
| Distribución de grasa | Localización adiposa | CC, RM, DEXA |

**El IMC no debe utilizarse como único criterio para determinar el estado de salud o la composición corporal.**

## Roadmap

- [ ] Módulo de pliegues cutáneos (ISAK)
- [ ] Cálculo de % grasa corporal (ecuaciones de Siri, Brozek, Durnin-Womersley)
- [ ] Módulo de bioimpedancia (BIA)
- [ ] Somatotipo (Heath-Carter)
- [ ] Mediciones de circunferencias (cintura, cadera, brazo, muslo)
- [ ] Índices derivados (cintura/estatura, cintura/cadera)
- [ ] Exportación CSV/Excel de evaluaciones
- [ ] Modo oscuro
- [ ] Internacionalización (i18n: ES/EN/PT)
- [ ] App móvil (React Native)

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

**Kinemetrix** · Plataforma de Evaluación Antropométrica e IMC · Ciencias del Movimiento Humano
