# Calculadora de recorridos y peajes — Chile

Aplicación web estática para planificar recorridos multiparada, estimar costos de traslado y calcular peajes/pórticos TAG con datos tarifarios 2026.

## Arquitectura

La aplicación sigue siendo 100 % compatible con GitHub Pages y no necesita backend, pero ya no está concentrada en un único HTML.

```text
.
├── index.html
├── css/
│   └── app.css
├── js/
│   ├── bootstrap.js
│   └── app.js
├── data/
│   ├── catalogo-geografico-2026.json
│   ├── tarifas-2026.json
│   └── horarios-porticos-2026.json
├── tests/
│   └── horarios.test.mjs
├── package.json
└── .github/workflows/validate.yml
```

### Flujo de carga

1. `index.html` contiene solamente la estructura de la interfaz.
2. `css/app.css` contiene todos los estilos propios.
3. `js/bootstrap.js` carga los JSON 2026.
4. Después inicia `js/app.js`, que contiene el coordinador principal de rutas, costos, mapa, peajes y UI.
5. GitHub Actions valida la sintaxis JavaScript y casos tarifarios críticos en cada cambio de `main`.

## Datos

- `catalogo-geografico-2026.json`: carreteras, pórticos y coordenadas.
- `tarifas-2026.json`: tarifas TAG y modelos de cobro.
- `horarios-porticos-2026.json`: reglas horarias normalizadas por carretera, pórtico y sentido.

Separar los datos del código permite corregir tarifas u horarios sin reescribir el HTML completo.

## Pruebas

Con Node.js instalado:

```bash
npm test
```

Para validar además la sintaxis de los archivos JavaScript:

```bash
npm run check
```

Entre los casos protegidos hay pruebas para PA26 de Autopista Central, P10 de Vespucio Norte y P0 de Costanera Norte.

## Ejecutar localmente

Como los datos ahora se cargan mediante `fetch()`, conviene servir la carpeta por HTTP en vez de abrir `index.html` con `file://`.

```bash
python3 -m http.server 8000
```

Luego abre `http://localhost:8000`.

## GitHub Pages

La publicación continúa desde la rama `main` y la carpeta raíz. `index.html` sigue siendo la entrada principal.

## Servicios externos

La aplicación usa servicios públicos desde el navegador:

- OpenStreetMap / Leaflet para el mapa.
- Nominatim para búsqueda/geocodificación.
- OSRM para cálculo de rutas.
- Google Maps para abrir el recorrido generado.

## Tarifas

Los datos incluidos corresponden al paquete 2026 del proyecto. Las tarifas, horarios y reglas deben revisarse cuando MOP o las concesionarias publiquen modificaciones o al cambiar de año.

## Privacidad

La base y los destinos del usuario se guardan localmente en el navegador. El repositorio no contiene una dirección personal preconfigurada ni claves privadas.
