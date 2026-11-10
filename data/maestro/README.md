# Maestro de pórticos, peajes y horarios 2026

Archivo maestro esperado:

`data/maestro/peajes_2026_maestro.xlsx`

Este libro concentra la información editable que antes estaba repartida entre catálogos, tarifas y reglas horarias.

## Estructura

- **Resumen**: cobertura por carretera, pórticos, GPS, tarifas y horarios.
- **Diccionario**: significado de columnas y reglas de edición.
- **Una hoja por carretera**: código, nombre, sentido, GPS, tarifas baja/media/alta y horarios por tipo de día.
- **AVO I - Pórticos**: puntos físicos y sentido Norte/Sur.
- **AVO I - Matriz**: pares oficiales entrada → salida con distancia y tarifas.

## Columnas editables

Las columnas marcadas en amarillo en el libro corresponden principalmente a:

- latitud y longitud;
- estado y revisión GPS;
- tarifa baja / media / alta;
- código tarifario oficial;
- horarios laboral, sábado, domingo y festivo.

Los identificadores técnicos (`route_id`, `point_id`, grupos) deben conservarse salvo una migración controlada.

## Tarifas

La presentación humana usa tres niveles cuando corresponde:

- **Baja**: normalmente TBFP, NORMAL, ÚNICA o PÓRTICO.
- **Media**: normalmente TBP o PUNTA.
- **Alta**: normalmente TS o SATURACIÓN.

La columna **Otras tarifas** conserva tipos oficiales que no encajan en esa clasificación para evitar pérdida de información.

## Horarios

Los rangos se escriben como:

`07:30-09:30/17:30-19:30`

Cada pórtico puede tener reglas distintas para:

- laboral;
- sábado;
- domingo;
- festivo.

No se debe asumir un horario común para toda una autopista.

## AVO I

AVO I es una carretera/ruta independiente y su modelo especial aplica **solo** a AVO I.

- La clasificación **Sentido AVO** (Norte / Sur / ambos) existe únicamente en la hoja de pórticos AVO I.
- La matriz entrada → salida, sus distancias oficiales, tarifas y horarios son exclusivas de AVO I.
- Ninguna hoja de otra carretera debe incluir columnas, reglas, sentidos ni tarifas propias de AVO I.
- Las demás carreteras conservan únicamente su propio modelo de cobro, GPS, tarifas y horarios.

AVO I no se cobra como una tarifa plana por pórtico. El monto se mantiene en la hoja **AVO I - Matriz**, según el par entrada → salida y la distancia oficial.

## Fuente de verdad

El objetivo es que este libro sea el maestro humano de mantenimiento. Los JSON de producción deben regenerarse y validarse desde el maestro antes de publicar cambios, evitando editar varias fuentes en paralelo.
