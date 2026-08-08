# Calculadora de recorridos y peajes — Chile

Aplicación web estática para planificar recorridos multiparada, estimar costos de traslado y calcular peajes/pórticos TAG con datos tarifarios 2026 incorporados.

## Funciones principales

- Agrega propiedades y paradas técnicas.
- Permite volver a la base, terminar en la última parada o fijar otro destino final.
- Calcula ruta, distancia y tiempos estimados.
- Estima combustible, desgaste, tiempo de trabajo y rentabilidad de la jornada.
- Detecta pórticos/peajes a partir del catálogo geográfico incorporado.
- Aplica tarifas TAG 2026 incluidas en la aplicación.
- Trata AVO I mediante su modelo de entrada/salida y matriz tarifaria.
- Permite abrir el recorrido resultante en Google Maps.
- Guarda configuración y datos de uso localmente en el navegador mediante `localStorage`.

## Abrir la aplicación

La aplicación principal está en [`index.html`](./index.html). No requiere instalación ni servidor propio para su lógica principal.

Para probarla localmente, puedes abrir `index.html` directamente en un navegador moderno. Si el navegador restringe alguna petición de red desde archivos locales, sirve la carpeta con un servidor HTTP local, por ejemplo:

```bash
python3 -m http.server 8000
```

Luego abre `http://localhost:8000`.

## Publicar con GitHub Pages

1. Crea un repositorio nuevo en GitHub.
2. Sube el contenido de esta carpeta a la rama `main`.
3. En el repositorio, abre **Settings → Pages**.
4. En **Build and deployment**, selecciona **Deploy from a branch**.
5. Selecciona la rama `main` y la carpeta `/ (root)`.
6. Guarda los cambios.

GitHub Pages publicará automáticamente `index.html` como página principal.

## Herramienta de mantenimiento

En [`tools/actualizador_mop_v9_tarifas.html`](./tools/actualizador_mop_v9_tarifas.html) se incluye el actualizador MOP/GPS/tarifas v9. Es una herramienta separada de la calculadora principal y no es necesaria para que `index.html` funcione.

## Servicios externos utilizados

La aplicación utiliza servicios públicos externos desde el navegador, entre ellos:

- OpenStreetMap / Leaflet para visualización cartográfica.
- Nominatim para búsqueda/geocodificación.
- OSRM para cálculo y optimización de rutas.
- Google Maps para abrir el recorrido generado.
- CDN públicos para Leaflet, JSZip y tipografías.

Estos servicios pueden aplicar límites de uso, políticas de disponibilidad o cambios propios. Para uso público de alto tráfico conviene reemplazar los endpoints de demostración/públicos por servicios con capacidad y condiciones adecuadas.

## Datos tarifarios

El archivo principal contiene un catálogo geográfico y un paquete tarifario 2026 incorporados. Las tarifas y reglas pueden quedar desactualizadas al cambiar el año o cuando una concesionaria/MOP publique modificaciones.

Los registros sin vinculación suficientemente segura se tratan de forma conservadora y no deben asumirse automáticamente como cobros confirmados.

## Privacidad

La base y los destinos introducidos por el usuario se guardan en el almacenamiento local del navegador. Este repositorio no incluye una dirección de base personal preconfigurada ni claves privadas.

## Estructura

```text
.
├── index.html
├── tools/
│   └── actualizador_mop_v9_tarifas.html
├── README.md
├── .gitignore
└── .nojekyll
```

## Licencia

Este repositorio no incluye una licencia de código abierto por defecto. Si deseas permitir reutilización, modificación o distribución por terceros, añade explícitamente la licencia que prefieras antes de publicarlo.
