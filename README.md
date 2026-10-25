# Calculadora de recorridos y peajes — Chile

Herramienta web para planificar jornadas de fotografía inmobiliaria en Chile. Permite ordenar múltiples destinos, estimar tiempos y kilómetros, calcular costos de traslado y peajes/TAG, y comparar el resultado económico de una salida.

**Aplicación:** https://camilosilvae.github.io/calculadora-carretera/

## Qué resuelve

- Planificación de rutas con varias propiedades y paradas técnicas.
- Tres formas de terminar la jornada: volver a la base, terminar en la última parada o fijar otro destino final.
- Estimación de combustible, desgaste del vehículo, tiempo de trabajo y margen por propiedad.
- Detección de peajes y pórticos a partir de la geometría real de cada tramo.
- Aplicación de tarifas horarias 2026 cuando existe una regla verificable.
- Tratamiento específico de AVO I mediante pares de entrada/salida y su matriz tarifaria.
- Envío del recorrido resultante a Google Maps.

Cuando un cruce o tarifa no se puede determinar con suficiente seguridad, la aplicación lo muestra como pendiente y no lo suma al presupuesto.

## Datos y cálculo de peajes

El cálculo separa tres fuentes de información:

- `data/catalogo-geografico-2026.json`: carreteras, pórticos y coordenadas.
- `data/tarifas-2026.json`: tarifas TAG, grupos tarifarios y modelos de cobro.
- `data/horarios-porticos-2026.json`: reglas horarias normalizadas por pórtico y sentido.

Esta separación permite actualizar tarifas u horarios sin modificar la lógica de ruteo.

## Estructura

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

`bootstrap.js` carga los datos versionados y luego inicia `app.js`. La aplicación es estática y no requiere backend.

## Desarrollo local

Los JSON se cargan con `fetch()`, por lo que conviene servir el repositorio por HTTP:

```bash
python3 -m http.server 8000
```

Después abre `http://localhost:8000`.

## Validación

Con Node.js instalado:

```bash
npm test
npm run check
```

La validación automática de GitHub Actions comprueba la sintaxis JavaScript y casos tarifarios críticos antes de integrar cambios.

## Servicios externos

La aplicación utiliza desde el navegador:

- Leaflet y OpenStreetMap para visualización del mapa.
- Nominatim para geocodificación.
- OSRM para ruteo y optimización del orden.
- Google Maps para abrir el recorrido planificado.

## Alcance y mantenimiento

Los datos incluidos corresponden al tarifario 2026. Deben revisarse cuando el MOP o las concesionarias publiquen cambios y al comenzar un nuevo año tarifario.

Los servicios públicos de geocodificación y ruteo pueden tener límites de uso o disponibilidad. Para un despliegue de alto tráfico convendría sustituirlos por servicios con capacidad y condiciones acordes al volumen esperado.

## Privacidad

La base de salida, los destinos y los ajustes del usuario se guardan localmente en el navegador. El repositorio no contiene una dirección personal preconfigurada ni claves privadas.
