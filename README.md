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

La aplicación debe quedar publicada como un `index.html` directo. El repositorio incluye el flujo manual **Reconstruir aplicación**, que recompone el HTML original a partir del respaldo en `payload/` y lo confirma en la rama `main`.

Para reconstruirlo desde GitHub:

1. Abre la pestaña **Actions**.
2. Selecciona **Reconstruir aplicación**.
3. Pulsa **Run workflow** y vuelve a pulsar **Run workflow** para confirmar.
4. Espera a que el flujo termine con marca verde.

GitHub Pages debe estar configurado con **Deploy from a branch → main → /(root)**.

## Servicios externos utilizados

La aplicación utiliza servicios públicos externos desde el navegador, entre ellos OpenStreetMap/Leaflet, Nominatim, OSRM, Google Maps y CDN públicos para librerías y tipografías.

## Datos tarifarios

El HTML original contiene el catálogo geográfico y el paquete tarifario 2026 incorporados. Las tarifas y reglas deben revisarse cuando cambie el año o cuando MOP/concesionarias publiquen modificaciones.

## Privacidad

La base y destinos introducidos por el usuario se guardan localmente en el navegador mediante `localStorage`. El repositorio no incluye una dirección de base personal preconfigurada ni claves privadas.
