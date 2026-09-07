# 02 - Pala Roja, Canvas Vertical y Bloques Ampliados

**Estado:** Implementado
**Depende de:** 01 - MVP Arkanoid
**Fecha:** 2026-09-07

**Objetivo:** Modificar el MVP de Arkanoid ya implementado (spec 01) en cuatro puntos: (1) cambiar
el sprite de la pala por la pala roja solida del spritesheet, (2) reducir el ancho del canvas
para un formato vertical mas angosto, delimitando el area jugable con un marco de bloques grises
de piedra (limite solido e irrompible contra el que rebota la bola) en los lados superior,
izquierdo y derecho, (3) aumentar el tamano visual de los 48 bloques del layout, manteniendo su
centrado horizontal y dejando un hueco suficiente para que la bola pase por encima de ellos, y
(4) sacar el HUD (score y vidas) de la trayectoria de la bola, colocandolo en una franja propia
por encima del marco gris superior.

## Alcance

**Incluido:**

- Cambiar el sprite de `SPRITES.paddle` en `spritesheet.js`: de la pala actual
  (`sx:32, sy:112, sw:162, sh:14`) a la pala roja solida (`sx:112, sy:80, sw:48, sh:12`), la
  ultima pala (mas abajo) de la segunda columna de palas del spritesheet, la unica totalmente
  roja sin bandas blancas/grises. El ancho y alto del sprite se usan nativos, sin escalar (mismo
  criterio que el spec 01 uso para la pala anterior).
- Reducir el ancho del area jugable de `800` a `576`, dandole un formato vertical mas angosto.
  Ver "Decisiones tomadas" para el porque de `576`.
- Rodear el area jugable con un marco de bloques grises de piedra (`SPRITES.blocks.gray`,
  `sx:32, sy:288, sw:32, sh:16` en `spritesheet.js`; el primer bloque gris de la ultima fila del
  spritesheet, la fila donde solo hay dos bloques grises) en los lados **superior, izquierdo y
  derecho** del area jugable. El lado **inferior sigue sin marco**, abierto a proposito, para
  conservar el efecto de que la bola "cae en soledad" cuando se pierde una vida.
- **El tamano de cada bloque gris del marco es identico al de los bloques internos que dan
  puntos** (`48x24`), para mantener la proporcion visual entre ambos tipos de bloque. El sprite
  de origen sigue siendo el mismo recorte nativo (`32x16`), solo se dibuja escalado `1.5x` al
  destino, igual que los bloques de puntos.
- **El limite de rebote de la bola coincide exactamente con la cara interior de estos bloques
  grises**, de forma que visualmente la bola rebota justo contra ellos.
- **Los bloques grises del marco son irrompibles**: no reciben dano, no tienen `hits`, no entran
  en el sistema de explosion/destruccion, no suman puntos, y no se eliminan nunca. Funcionan
  unicamente como limite solido fijo.
- **El HUD (score y vidas) vive en una franja propia, fuera del area jugable, por encima del
  marco gris superior.** No se superpone al marco ni a ningun elemento con el que la bola pueda
  interactuar; la bola nunca puede alcanzar esa zona bajo ninguna circunstancia. Esto agranda el
  alto total del canvas (ver tabla de canvas mas abajo): el area jugable en si mantiene los
  `600px` de alto ya definidos, y se le suma una franja de HUD adicional por encima.
- Score a la izquierda y vidas a la derecha de esa franja, en la misma posicion horizontal
  (izquierda/derecha) que tenian antes de este spec.
- Los limites de movimiento de la pala tambien se desplazan del borde literal del area jugable al
  borde interior del marco gris.
- Aumentar el tamano de renderizado de los 48 bloques de puntos de `32x16` a `48x24` (escala
  `1.5x`; los frames de origen en el spritesheet siguen siendo los mismos recortes de `32x16`,
  solo cambia el tamano de destino al dibujar). El layout se mantiene centrado horizontalmente,
  sin superar el area interior delimitada por el marco gris.
- Se mantiene un hueco vertical entre el marco superior y la primera fila de bloques de puntos,
  suficiente para que la bola pueda colarse por encima de los bloques y rebotar en el marco
  superior sin tocarlos.

**Explicitamente fuera de alcance (spec futuros):**

- Cambios a `BALL_SPEED`, `PADDLE_SPEED`, angulo maximo de rebote (`MAX_BOUNCE_ANGLE`) u otras
  variables de fisica: se mantienen identicas al spec 01.
- Marco gris en el lado inferior del area jugable: se mantiene sin marco, intencionalmente.
- Uso del bloque gris del marco como bloque jugable/rompible dentro del layout de 48 bloques.
- Power-ups, multiples niveles, sonido, persistencia de high score, pausa: igual que el spec 01.

## Posiciones y movimiento (coordenadas exactas actualizadas)

Sistema de coordenadas sin cambios: origen `(0,0)` arriba-izquierda, X crece a la derecha, Y
crece hacia abajo.

### Canvas

| Constante | Valor anterior (spec 01) | Valor nuevo | Nota |
|---|---|---|---|
| `CANVAS_WIDTH` | `800` | `576` | mas angosto, formato vertical |
| `HUD_HEIGHT` | *(no existia como franja separada)* | `40` | franja dedicada al HUD, fuera del area jugable |
| `PLAY_AREA_TOP` | `0` | `40` | `= HUD_HEIGHT`; Y donde empieza el area jugable (marco + bloques + pala + bola) |
| `PLAY_AREA_HEIGHT` | `600` | `600` | sin cambios; es la parte que antes era todo el canvas |
| `CANVAS_HEIGHT` | `600` | `640` | `= HUD_HEIGHT + PLAY_AREA_HEIGHT`; crece para poder darle al HUD una franja fuera de la trayectoria de la bola, sin reducir el area jugable que ya se habia fijado en `600px` |

Todas las coordenadas Y del area jugable (marco, pala, bola, bloques) que en la version anterior
de este spec partian desde `0` ahora parten desde `PLAY_AREA_TOP = 40`; es decir, cada valor Y de
esa version se desplaza `+40`. Las coordenadas X no cambian.

### Marco / borde (`border`)

| Constante | Valor | Nota |
|---|---|---|
| `BORDER_TILE_WIDTH` | `48` | igual a `BLOCK_WIDTH` |
| `BORDER_TILE_HEIGHT` | `24` | igual a `BLOCK_HEIGHT` |
| `BORDER_THICKNESS` | `24` | grosor del marco en los 3 lados con borde |

- **Marco superior:** franja `y:40` a `y:64` (dentro del area jugable, justo debajo de la franja
  de HUD), ancho completo (`576`). Tileado horizontal con `SPRITES.blocks.gray` a `48x24`.
  `576 / 48 = 12` tiles exactos.
- **Marco izquierdo:** franja `x:0` a `x:24`, desde `y:40` hasta `y:640` (`600px` de alto, todo
  el area jugable). Tileado vertical rotando el sprite `90°` (`24` de ancho x `48` de alto por
  tile). `600 / 48 = 12.5`: 12 tiles completos mas un ultimo tile recortado a `24px` (ver
  Riesgos).
- **Marco derecho:** simetrico, franja `x:552` a `x:576`, mismo rango Y y tileado.
- **Marco inferior:** no existe; `y:616` a `y:640` (equivalente al grosor de borde en la base del
  area jugable) queda sin dibujar, abierto.
- **Colision:** la bola rebota exactamente en `x:24`, `x:552`, `y:64` (cara interior del marco).
- Los bloques del marco no tienen `hits`, `alive`, `exploding` ni ningun campo del sistema de
  dano.

### HUD (score y vidas)

| Constante | Valor | Nota |
|---|---|---|
| `HUD_Y` | `20` | centro vertical de la franja `y:0` a `y:40` |
| `HUD_SCORE_X` | `12` | alineado a la izquierda |
| `HUD_LIVES_X` | `564` | alineado a la derecha (`= 576 - 12`) |

- El HUD se dibuja en la franja `y:0` a `y:40`, **completamente separada** del area jugable
  (que empieza en `y:40`). La bola, la pala, los bloques y el marco nunca ocupan ni cruzan esa
  franja bajo ninguna circunstancia — no hay superposicion ni riesgo de que la bola "tape" al
  HUD ni de que el HUD se confunda con parte del muro.
- Score a la izquierda, vidas a la derecha, igual que antes de este spec.
- Fondo de esa franja: color solido simple (por ejemplo el mismo fondo del canvas), sin sprites
  de bloque — es una zona de interfaz, no de juego.

### Pala (`paddle`)

| Constante | Valor anterior (spec 01) | Valor nuevo | Nota |
|---|---|---|---|
| `PADDLE_WIDTH` | `162` | `48` | ancho nativo de la pala roja (`sw:48`), sin escalar |
| `PADDLE_HEIGHT` | `14` | `12` | alto nativo de la pala roja (`sh:12`), sin escalar |
| `PADDLE_Y` | `560` | `600` | `= 560 + PLAY_AREA_TOP(40)`; misma posicion relativa al fondo del area jugable que antes |
| `PADDLE_MIN_X` | `0` | `24` | `= BORDER_THICKNESS` |
| `PADDLE_MAX_X` | `638` | `504` | `= 576 - 24 - 48` |
| `PADDLE_INITIAL_X` | `319` | `264` | `= (576 - PADDLE_WIDTH) / 2`; centrada horizontalmente |
| `PADDLE_SPEED` | `480` px/s | `480` px/s | sin cambios |

- **Sprite:** `SPRITES.paddle` pasa a apuntar a `sx:112, sy:80, sw:48, sh:12`.
- **Posicion inicial (arranque o reinicio):** `paddle.x = 264`, `paddle.y = 600`.
- **Movimiento:** misma logica del spec 01, `clamp` con `PADDLE_MIN_X = 24` y
  `PADDLE_MAX_X = 504`.

### Bola (`ball`)

| Constante | Valor anterior (spec 01) | Valor nuevo | Nota |
|---|---|---|---|
| `BALL_RADIUS` | `8` | `8` | sin cambios |
| `BALL_SPEED` | `300` px/s | `300` px/s | sin cambios |
| `BALL_INITIAL_X` | `400` | `288` | `= 576 / 2` |
| `BALL_INITIAL_Y` | `552` | `592` | `= 552 + PLAY_AREA_TOP(40)`; misma posicion relativa (apoyada sobre la pala) |
| `BALL_INITIAL_DX` | `150` | `150` | sin cambios |
| `BALL_INITIAL_DY` | `-260` | `-260` | sin cambios |

- **Posicion inicial:** `ball.x = 288`, `ball.y = 592`, `ball.dx = 150`, `ball.dy = -260`.
- **Rebote pared izquierda:** si `ball.x - BALL_RADIUS <= 24` → `ball.dx = -ball.dx`, clamp
  `ball.x = 32`.
- **Rebote pared derecha:** si `ball.x + BALL_RADIUS >= 552` → `ball.dx = -ball.dx`, clamp
  `ball.x = 544`.
- **Rebote pared superior:** si `ball.y - BALL_RADIUS <= 64` (`= PLAY_AREA_TOP + BORDER_THICKNESS`,
  antes `0`) → `ball.dy = -ball.dy`, clamp `ball.y = 72` (`= 64 + 8`).
- **Rebote en la pala:** misma formula del spec 01, con `PADDLE_WIDTH = 48`.
- **Bola perdida:** si `ball.y - BALL_RADIUS > 640` (`= CANVAS_HEIGHT`, antes `600`) → resta 1
  vida y resetea `ball`/`paddle` a sus posiciones iniciales. El marco inferior sigue sin existir.
- **Rebote en bloque:** sin cambios de logica; solo cambian las dimensiones de cada bloque.

### Bloques de puntos (`blocks`)

| Constante | Valor anterior (spec 01) | Valor nuevo | Nota |
|---|---|---|---|
| `BLOCK_WIDTH` | `32` | `48` | igual al tamano del bloque gris del marco |
| `BLOCK_HEIGHT` | `16` | `24` | igual al tamano del bloque gris del marco |
| `BLOCKS_COLS` | `8` | `8` | sin cambios |
| `BLOCKS_ROWS` | `6` | `6` | sin cambios |
| `BLOCKS_TOTAL_WIDTH` | `256` | `384` | `= BLOCKS_COLS * BLOCK_WIDTH` |
| `BLOCKS_TOTAL_HEIGHT` | `96` | `144` | `= BLOCKS_ROWS * BLOCK_HEIGHT` |
| `BLOCKS_START_X` | *(centrado, no explicito)* | `96` | `= (576 - 384) / 2`; deja `72px` de margen a cada lado |
| `BLOCKS_START_Y` | *(no explicito)* | `112` | `= 72 + PLAY_AREA_TOP(40)`; deja `48px` de hueco entre el marco interior superior (`y:64`) y la primera fila |

- Cada bloque de puntos usa el mismo frame de origen (`32x16` nativo) escalado a `48x24`.
- Area total de bloques de puntos: `x:96` a `x:480`, `y:112` a `y:256`; queda comoda dentro del
  area interior jugable (`x:24` a `x:552`, `y:64` a `y:640`).
- El hueco de `48px` entre el marco superior y la primera fila sigue dando espacio de sobra
  (`3x` el diametro de la bola) para que la bola cruce por encima de los bloques.

## Modelo de datos

```js
gameState = {
  // ... status, score, lives, pointsByDestruction: sin cambios
  paddle: { x: 264, y: 600, width: 48, height: 12, speed: 480 },
  ball: { x: 288, y: 592, dx: 150, dy: -260, radius: 8 },
  blocks: [ /* misma forma que en spec 01, ahora con width: 48, height: 24 */ ],
}

// Nuevas constantes de layout (no forman parte de gameState, son configuracion estatica):
CANVAS_WIDTH = 576
CANVAS_HEIGHT = 640          // HUD_HEIGHT(40) + PLAY_AREA_HEIGHT(600)
HUD_HEIGHT = 40
PLAY_AREA_TOP = 40
BORDER_THICKNESS = 24
BORDER_TILE_WIDTH = 48
BORDER_TILE_HEIGHT = 24
HUD_Y = 20
HUD_SCORE_X = 12
HUD_LIVES_X = 564
```

El marco gris **no** se representa dentro del array `blocks` (esos son solo los 48 bloques de
puntos). Se dibuja aparte, como capa estatica de fondo del area jugable. El HUD se dibuja en su
propia franja, tambien fuera de `blocks`.

## Plan de implementacion

1. **Canvas y franja de HUD (`index.html`, `game.js`).** Cambiar el `<canvas>` a `576x640`.
   Reservar la franja `y:0` a `y:40` para el HUD, sin dibujar ahi ningun elemento de juego.
   Verificable: existe una banda superior limpia, separada visualmente del area jugable.
2. **Marco (`border.js`).** Dibujar `SPRITES.blocks.gray` a `48x24`, tileado en los bordes
   superior (`y:40-64`), izquierdo y derecho (`x:0-24` / `x:552-576`, ambos desde `y:40` hasta
   `y:640`, rotados `90°`), sin nada en el borde inferior. Verificable: marco gris visible en 3
   lados del area jugable, empezando justo debajo de la franja de HUD.
3. **Pala roja (`spritesheet.js`, `paddle.js`).** Actualizar `SPRITES.paddle` a
   `sx:112, sy:80, sw:48, sh:12`, y `PADDLE_WIDTH/HEIGHT/Y/MIN_X/MAX_X/INITIAL_X` segun la tabla.
   Verificable: pala roja centrada en `x:264, y:600`, se mueve solo dentro de `x:[24, 504]`.
4. **Bola contra el marco interior (`ball.js`).** Actualizar `BALL_INITIAL_X/Y` y las tres
   condiciones de rebote (usando `PLAY_AREA_TOP + BORDER_THICKNESS = 64` arriba, `24`/`552` en
   los lados) y la condicion de bola perdida (`> 640`). Verificable: la bola rebota justo contra
   el marco, nunca invade la franja de HUD.
5. **Bloques de puntos mas grandes (`blocks.js`).** Cambiar `BLOCK_WIDTH/HEIGHT` a `48x24` y
   `BLOCKS_START_X/Y` a `96/112`. Verificable: bloques mas grandes, centrados, con hueco visible
   antes de la primera fila.
6. **HUD (`game.js`).** Dibujar score en `(HUD_SCORE_X, HUD_Y)` y vidas en
   `(HUD_LIVES_X, HUD_Y)`, dentro de la franja reservada. Verificable: ambos marcadores se leen
   claros, fuera de cualquier zona por la que pase la bola.
7. **Verificacion integral.** Partida completa: arranque, golpes, bola perdida, game over,
   victoria, reinicio — confirmando que la bola jamas entra en la franja de HUD, que el marco
   nunca recibe dano, y que ninguna mecanica del spec 01 se rompio.

## Criterios de aceptacion

- [ ] El canvas mide `576x640` (`576` de ancho, `640` de alto: `40` de HUD + `600` de area
      jugable).
- [ ] El score y las vidas se ven en una franja propia (`y:0` a `y:40`), separada del area
      jugable, en la que la bola nunca puede entrar.
- [ ] Se ve un marco de bloques grises (`48x24`, mismo tamano que los bloques de puntos) en los
      lados superior, izquierdo y derecho del area jugable, empezando en `y:40`.
- [ ] No hay marco gris en el borde inferior del area jugable.
- [ ] La bola rebota exactamente en la cara interior del marco gris (`x:24/552`, `y:64`).
- [ ] Los bloques grises del marco nunca reciben dano, nunca se destruyen y nunca suman puntos.
- [ ] La pala usa el sprite rojo solido (`48x12`), arranca en `x:264, y:600`, se mueve solo
      dentro de `x:[24, 504]`.
- [ ] La bola arranca en `x:288, y:592` con `dx:150, dy:-260`, y se pierde una vida cuando
      `ball.y - radius > 640`.
- [ ] Los 48 bloques de puntos se dibujan a `48x24px`, centrados en `x:96` a `x:480`,
      `y:112` a `y:256`.
- [ ] Hay al menos `48px` de espacio libre entre el marco superior y la primera fila de bloques
      de puntos.
- [ ] El resto de mecanicas del spec 01 siguen funcionando sin cambios de comportamiento.

## Decisiones tomadas y descartadas

- **`576` de ancho.** Multiplo exacto de `32` (sprite nativo) y de `48` (sprite ya escalado,
  `12` tiles exactos en el marco superior). Notablemente mas angosto que los `800px` originales.
- **El canvas crece de `600` a `640` de alto**, revisando la decision original de "dejar el alto
  igual". Esta aclaracion (HUD fuera de la trayectoria de la bola, no superpuesto al marco) no es
  compatible con mantener el area jugable y el HUD dentro de los mismos `600px` sin que se
  pisen. Se opto por preservar el area jugable tal cual se habia definido (`600px`, marco y
  bloques sin recortar) y sumarle una franja de `40px` dedicada solo al HUD, en vez de reducir el
  area jugable para hacerle hueco al HUD dentro de los `600px` originales.
- **`HUD_HEIGHT = 40`.** Suficiente para que el texto de score/vidas se lea con comodidad con
  algo de margen, sin ser una franja desproporcionadamente grande comparada con el resto del
  canvas.
- **Tamano del bloque gris del marco = tamano del bloque de puntos (`48x24`)**, con grosor de
  marco uniforme de `24px` en los 3 lados (rotando el sprite `90°` en los lados izquierdo y
  derecho). Da la sensacion pedida de que la bola rebota directamente contra estos bloques.
- **El marco sigue sin lado inferior**, para conservar el efecto de "soledad" cuando la bola cae
  y se pierde una vida.
- **Los bloques grises del marco se excluyen por completo del sistema de `hits`/explosion**, para
  garantizar que sean irrompibles.
- **Se asume score a la izquierda y vidas a la derecha**, igual que en la version anterior de
  este spec, ya que el spec 01 no especifica coordenadas de HUD. Si estaban al reves, es un
  cambio de una linea (`HUD_SCORE_X` ↔ `HUD_LIVES_X`).
- **Pala nueva a tamano nativo del sprite (`48x12`), sin reescalar; bloques escalados `1.5x`
  (`32x16` → `48x24`).** Sin cambios respecto a versiones anteriores de este spec.
- **Sin cambios en `PADDLE_SPEED`, `BALL_SPEED` ni el angulo de rebote.**

## Riesgos identificados

- **El grosor de marco fijo (`24px`) no divide exacto los `600px` de alto del area jugable**
  (`600 / 48 = 12.5`), por lo que el ultimo tile vertical de cada lado del marco queda
  parcialmente recortado (`24px` en vez de `48px`). No bloqueante, pero puede notarse una costura
  cerca de la esquina inferior de los lados del marco.
- **La pala pasa de `162px` a `48px` de ancho (~3.4 veces mas angosta)** sin cambios en
  `BALL_SPEED` ni `PADDLE_SPEED`. Candidato claro para ajuste de balance despues de probar.
- **El canvas crece a `640px` de alto**, un `6.7%` mas que los `600px` originales del spec 01.
  Si el objetivo era mantener el alto total del canvas estrictamente en `600px` incluyendo el
  HUD, esta version no lo cumple — se prioriza que el HUD quede totalmente fuera de la
  trayectoria de la bola, como se pidio explicitamente, sobre mantener el numero exacto de
  `600px` totales.
- **Se asume score-izquierda/vidas-derecha**, sin confirmar contra la implementacion real.
- **Las coordenadas exactas de `SPRITES.paddle` (pala roja) y `SPRITES.blocks.gray`** fueron
  medidas desde la imagen de referencia del spritesheet (contrastadas contra `SPRITES.ball`, que
  coincide exacta). Se recomienda confirmarlas contra el `spritesheet.js` real al implementar.
