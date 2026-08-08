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

## Publicación

El repositorio está preparado para publicarse con **GitHub Pages** desde la rama `main` y la carpeta `/ (root)`.

`index.html` funciona como un cargador ligero. Descarga los bloques de `payload/`, reconstruye la versión completa de la aplicación en el navegador y la ejecuta sin servidor ni backend propio.

## Estructura técnica

```text
.
├── index.html
├── payload/
│   ├── part01.txt
│   ├── ...
│   └── part18.txt
├── README.md
└── .nojekyll
```

La división en bloques conserva íntegro el HTML original, incluido el catálogo geográfico y las tarifas incorporadas, evitando modificar la lógica de la aplicación.

## Servicios externos utilizados

La aplicación utiliza servicios públicos externos desde el navegador, entre ellos:

- OpenStreetMap / Leaflet para visualización cartográfica.
- Nominatim para búsqueda y geocodificación.
- OSRM para cálculo y optimización de rutas.
- Google Maps para abrir el recorrido generado.
- CDN públicos para Leaflet, JSZip, tipografías y Pako.

Estos servicios pueden aplicar límites de uso, políticas de disponibilidad o cambios propios. Para un uso público de alto tráfico conviene revisar sus condiciones y, si es necesario, reemplazar los endpoints públicos por servicios con capacidad adecuada.

## Datos tarifarios

La versión publicada contiene un catálogo geográfico y un paquete tarifario 2026 incorporados. Las tarifas y reglas deben revisarse cuando cambie el año o cuando el MOP o una concesionaria publique modificaciones.

Los registros sin una vinculación suficientemente segura se tratan de forma conservadora y no deben asumirse automáticamente como cobros confirmados.

## Privacidad

La base y los destinos introducidos por cada usuario se guardan localmente en su navegador. El repositorio no contiene una dirección de base personal preconfigurada, contraseñas ni claves API privadas.

## GitHub Pages

Para activar la web:

1. Abre **Settings → Pages** en este repositorio.
2. En **Build and deployment**, elige **Deploy from a branch**.
3. Selecciona `main` y `/ (root)`.
4. Pulsa **Save**.

La dirección esperada será:

`https://camilosilvae.github.io/calculadora-carretera/`

## Licencia

Este repositorio no incluye una licencia de código abierto por defecto. Si deseas permitir reutilización, modificación o distribución por terceros, añade explícitamente la licencia que prefieras.
