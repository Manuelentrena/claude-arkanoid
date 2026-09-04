# 01 - MVP Arkanoid

**Estado:** Approved
**Depende de:** ninguno
**Fecha:** 2026-09-04

**Objetivo:** Construir un MVP jugable de Arkanoid con pala, bola y bloques usando el spritesheet existente, con vidas, puntuacion y pantallas de victoria/derrota.

## Alcance

**Incluido:**
- Canvas HTML5 de 800x600px con loop de juego (`requestAnimationFrame`).
- Pala controlable por teclado (flechas izquierda/derecha o A/D) y por mouse (sigue posicion X del cursor sobre el canvas).
- Bola con movimiento continuo, rebote en paredes (izquierda, derecha, arriba) y en la pala.
- Usa por defecto el sprite `SPRITES.ball` (bola grande, 16x16px, sx:32 sy:32 en `spritesheet.js`).
  El spritesheet contiene una segunda bola de menor tamano (~12x12px) sin referenciar en el
  codigo; no se usa por defecto.

- Layout unico de bloques fijo: **6 filas x 8 columnas = 48 bloques**, un color por fila, en este
  orden (fila superior a inferior) y su equivalencia con las claves de `spritesheet.js`
  (los nombres de clave del codigo no coinciden con el color visual real):

  | Fila | Color visual | Clave en spritesheet.js | sy  |
  |------|---------------|--------------------------|-----|
  | 1    | orange        | `hotpink`                | 256 |
  | 2    | yellow        | `yellow`                 | 240 |
  | 3    | purple        | `magenta`                | 224 |
  | 4    | light blue    | `green`                  | 208 |
  | 5    | green         | `cyan`                   | 192 |
  | 6    | red           | `red`                    | 176 |

  `gray` **no forma parte del layout jugable** de este MVP.

- Sistema de golpes por bloque: cada bloque soporta hasta **5 impactos** antes de destruirse.
  Cada color de fila dispone de 11 frames en total dentro de su fila del spritesheet
  (mismo `sy`, columnas de `sx:32` a `sx:352`, cada una de 32x16px):

  | Frame | sx (offset desde inicio de fila) | Significado |
  |-------|-----------------------------------|-------------|
  | 0     | 32                                | Estado intacto (0 golpes) — sprite de reposo, `SPRITES.blocks[color]` |
  | 1     | 64                                | Tras golpe 1 — `HIT_FRAMES[color][0]` |
  | 2     | 96                                | Tras golpe 2 — `HIT_FRAMES[color][1]` |
  | 3     | 128                               | Tras golpe 3 — `HIT_FRAMES[color][2]` |
  | 4     | 160                               | Tras golpe 4 — `HIT_FRAMES[color][3]` |
  | 5     | 192                               | Tras golpe 5 (ultima fase de dano antes de destruccion) — `HIT_FRAMES[color][4]` |
  | 6     | 224                               | Destruccion, frame 1/5 — `EXPLOSION_FRAMES[color][0]` |
  | 7     | 256                               | Destruccion, frame 2/5 — `EXPLOSION_FRAMES[color][1]` |
  | 8     | 288                               | Destruccion, frame 3/5 — `EXPLOSION_FRAMES[color][2]` |
  | 9     | 320                               | Destruccion, frame 4/5 — `EXPLOSION_FRAMES[color][3]` |
  | 10    | 352                               | Destruccion, frame 5/5 — `EXPLOSION_FRAMES[color][4]` |

- Deteccion de colision bola-bloque:
  - Cada golpe incrementa el contador `hits` del bloque y actualiza su sprite visual al frame
    de `HIT_FRAMES[color][hits - 1]` (golpes 1 a 4). El bloque sigue vivo y colisionable.
  - Al recibir el **5º golpe** (`hits === MAX_HITS`), el bloque dispara la animacion de
    destruccion: reproduce en secuencia los 5 `EXPLOSION_FRAMES[color]` durante
    `EXPLOSION_DURATION` (150ms en total, ~30ms por frame). Mientras esta "exploding" ya no
    colisiona con la bola. Al finalizar la animacion, se marca `alive: false`, se elimina del
    layout y se suma `pointsByDestruction` al score.
- Sistema de puntuacion: cada bloque da 1 punto al ser destruido, da igual el tipo de bloque.
- Sistema de vidas: 3 vidas iniciales, pierde 1 vida cuando la bola cae por debajo de la pala. HUD muestra vidas restantes.
- Pantalla de Game Over cuando las vidas llegan a 0 (con opcion de reiniciar).
- Pantalla de Victoria cuando se rompen todos los bloques (con opcion de reiniciar).
- El juego arranca directo (sin pantalla de inicio previa).

**Explicitamente fuera de alcance (specs futuros):**
- Power-ups (bola multiple, pala extendida/reducida, bola lenta/rapida, etc).
- Multiples niveles / progresion de niveles.
- Sonido (`assets/sounds/ball-bounce.mp3`, `break-sound.mp3` no se integran en este MVP).
- Persistencia de high score (localStorage u otro medio).
- Pantalla de inicio / menu principal.
- Sistema de puntuacion complejo (puntos distintos por color).
- Pausa del juego.
- Bloque `gray` / variante de piedra.

## Posiciones y movimiento (coordenadas exactas)

Sistema de coordenadas: origen `(0,0)` en la esquina superior izquierda del canvas, eje X crece
hacia la derecha, eje Y crece hacia abajo. Canvas: `800 x 600`.

### Pala (`paddle`)

| Constante | Valor | Nota |
|---|---|---|
| `PADDLE_WIDTH` | `162` | ancho nativo de `SPRITES.paddle` (`sw:162`), sin escalar |
| `PADDLE_HEIGHT` | `14` | alto nativo de `SPRITES.paddle` (`sh:14`), sin escalar |
| `PADDLE_Y` | `560` | fijo durante toda la partida; deja `600 - 560 - 14 = 26px` de margen respecto al borde inferior |
| `PADDLE_MIN_X` | `0` | limite izquierdo del clamp |
| `PADDLE_MAX_X` | `638` | `= 800 - PADDLE_WIDTH`; limite derecho del clamp |
| `PADDLE_INITIAL_X` | `319` | `= (800 - PADDLE_WIDTH) / 2`; centrada horizontalmente al iniciar/reiniciar |
| `PADDLE_SPEED` | `480` px/s | velocidad de desplazamiento por teclado (flechas / A-D) |

- **Posicion inicial (arranque o reinicio):** `paddle.x = 319`, `paddle.y = 560` (fijo, nunca cambia).
- **Movimiento por teclado:** cada frame, `paddle.x += direction * PADDLE_SPEED * deltaTime`
  (`direction` es `-1` al mantener izquierda/A, `+1` al mantener derecha/D, `0` sin tecla),
  luego `paddle.x = clamp(paddle.x, PADDLE_MIN_X, PADDLE_MAX_X)`.
- **Movimiento por mouse:** `paddle.x = clamp(mouseX - PADDLE_WIDTH / 2, PADDLE_MIN_X, PADDLE_MAX_X)`,
  donde `mouseX` es la posicion X del cursor relativa al canvas. Mouse y teclado escriben sobre
  la misma `paddle.x`; el ultimo input recibido en el frame gana (no hay prioridad especial).
- **Eje Y:** la pala **nunca se mueve verticalmente**; `paddle.y` es constante `560` durante toda
  la partida.

### Bola (`ball`)

| Constante | Valor | Nota |
|---|---|---|
| `BALL_RADIUS` | `8` | mitad de `SPRITES.ball` (`sw:16, sh:16`) |
| `BALL_SPEED` | `300` px/s | magnitud de velocidad, constante; se preserva en todos los rebotes (solo cambia direccion) |
| `BALL_INITIAL_X` | `400` | `= 800 / 2`; centro horizontal del canvas |
| `BALL_INITIAL_Y` | `552` | `= PADDLE_Y - BALL_RADIUS`; apoyada justo sobre el borde superior de la pala en su posicion inicial |
| `BALL_INITIAL_DX` | `150` | componente horizontal inicial (hacia la derecha) |
| `BALL_INITIAL_DY` | `-260` | componente vertical inicial (hacia arriba); angulo ≈60° sobre la horizontal, magnitud ≈300 |

- **Posicion inicial (arranque, reinicio, o tras perder una bola):**
  `ball.x = 400`, `ball.y = 552`, `ball.dx = 150`, `ball.dy = -260`.
- **Movimiento por frame:** `ball.x += ball.dx * deltaTime`, `ball.y += ball.dy * deltaTime`.
- **Rebote pared izquierda:** si `ball.x - BALL_RADIUS <= 0` → `ball.dx = -ball.dx`,
  clamp `ball.x = BALL_RADIUS`.
- **Rebote pared derecha:** si `ball.x + BALL_RADIUS >= 800` → `ball.dx = -ball.dx`,
  clamp `ball.x = 800 - BALL_RADIUS`.
- **Rebote pared superior:** si `ball.y - BALL_RADIUS <= 0` → `ball.dy = -ball.dy`,
  clamp `ball.y = BALL_RADIUS`.
- **Rebote en la pala:** ocurre cuando `ball.y + BALL_RADIUS >= PADDLE_Y` (560) **y**
  `ball.y + BALL_RADIUS <= PADDLE_Y + PADDLE_HEIGHT` (574) **y**
  `ball.x >= paddle.x - BALL_RADIUS` **y** `ball.x <= paddle.x + PADDLE_WIDTH + BALL_RADIUS`
  (AABB de la pala expandido por el radio de la bola). Al rebotar:
  - `hitOffset = (ball.x - (paddle.x + PADDLE_WIDTH / 2)) / (PADDLE_WIDTH / 2)`, clamped a `[-1, 1]`
    (`-1` = extremo izquierdo de la pala, `0` = centro, `1` = extremo derecho).
  - Nuevo angulo de salida: `angle = hitOffset * MAX_BOUNCE_ANGLE`, con `MAX_BOUNCE_ANGLE = 75°`
    respecto a la vertical.
  - `ball.dx = BALL_SPEED * sin(angle)`, `ball.dy = -BALL_SPEED * cos(angle)` (siempre hacia
    arriba tras rebotar en la pala; magnitud se mantiene en `BALL_SPEED = 300`).
  - Clamp `ball.y = PADDLE_Y - BALL_RADIUS` para evitar que la bola quede incrustada en la pala.
- **Bola perdida (cae bajo el canvas):** cuando `ball.y - BALL_RADIUS > 600` (bola completamente
  fuera del canvas por abajo) → restar 1 vida y resetear `ball` a su posicion/velocidad inicial
  (`x:400, y:552, dx:150, dy:-260`); tambien resetear `paddle.x = 319`.
- **Rebote en bloque:** al detectar colision AABB con un bloque vivo, invertir el componente de
  velocidad correspondiente al eje de impacto (`dy` si el impacto es por arriba/abajo del bloque,
  `dx` si es por izquierda/derecha), preservando `BALL_SPEED` como magnitud total.

## Modelo de datos

No se introduce persistencia ni estructuras guardadas en disco/localStorage. El estado vive en memoria durante la ejecucion, en `game.js`:

```js
gameState = {
  status: 'playing' | 'gameover' | 'victory',
  score: number,
  lives: number,
  pointsByDestruction: 1,   // constante: puntos que otorga cualquier bloque al ser destruido
  paddle: { x: 319, y: 560, width: 162, height: 14, speed: 480 },
  ball: { x: 400, y: 552, dx: 150, dy: -260, radius: 8 },
  blocks: [
    {
      x, y, width: 32, height: 16,
      color,              // clave interna de spritesheet.js: 'hotpink' | 'yellow' | 'magenta' | 'green' | 'cyan' | 'red'
      hits,               // 0 a MAX_HITS (5); determina el HIT_FRAMES a dibujar
      alive,              // false una vez terminada la animacion de destruccion
      exploding,          // true mientras se reproduce EXPLOSION_FRAMES
      explosionFrame,      // indice 0-4 dentro de EXPLOSION_FRAMES[color]
      explosionStartTime,  // timestamp para calcular el frame segun EXPLOSION_DURATION
    }
  ]
}
```

## Plan de implementacion

1. **Estructura base y canvas.** Crear `index.html` que carga `assets/spritesheet.js` y los nuevos archivos JS, define `<canvas>` de 800x600, e invoca `loadSpritesheet` seguido del arranque del loop. Verificable: la pagina carga sin errores de consola y muestra un canvas vacio.
2. **Pala (`paddle.js`).** Dibujar la pala en `PADDLE_INITIAL_X=319, PADDLE_Y=560` usando el sprite correspondiente, moverla con teclado (flechas/A-D, `PADDLE_SPEED=480px/s`) y con mouse (formula de clamp en la seccion "Posiciones y movimiento"). Verificable: la pala se mueve con teclado y mouse sin salirse de `[0, 638]` en X, y su Y nunca cambia.
3. **Bola (`ball.js`).** Dibujar la bola en `BALL_INITIAL_X=400, BALL_INITIAL_Y=552`, moverla cada frame segun `dx/dy`, rebotar contra paredes izquierda/derecha/arriba y contra la pala con angulo variable (formulas en "Posiciones y movimiento"). Si `ball.y - radius > 600`, resetear posicion/velocidad (sin restar vida todavia, eso lo hace `game.js` en el paso 6). Verificable: la bola rebota visualmente de forma correcta en paredes y pala, y su velocidad mantiene siempre magnitud `300px/s`.
4. **Bloques (`blocks.js`).** Generar el layout fijo (**6x8 = 48 bloques**, un color por fila segun la tabla del Alcance, sin incluir `gray`) usando `drawSprite`/`drawFrame`, con estructura de datos por bloque (posicion, color, `hits: 0`, vivo/muerto). Verificable: los 48 bloques se dibujan en pantalla con los colores correctos.
5. **Colisiones bola-bloque + dano + explosion (`collisions.js`).** Detectar colision AABB entre bola y cada bloque vivo no-exploding; al impactar, invertir el componente de velocidad correspondiente e incrementar `hits`. Si `hits < MAX_HITS`, actualizar el sprite del bloque a `HIT_FRAMES[color][hits - 1]` (bloque sigue vivo). Si `hits === MAX_HITS`, marcar el bloque `exploding: true` y reproducir en secuencia los 5 `EXPLOSION_FRAMES[color]` durante `EXPLOSION_DURATION`; al terminar, marcarlo `alive: false`, quitarlo del layout y sumar `pointsByDestruction` (1) al score. Verificable: golpear un bloque 5 veces lo va danando visualmente frame a frame, y en el 5º impacto lo destruye con la animacion, sumando 1 punto visible en HUD.
6. **Vidas, HUD y estados de fin (`game.js`).** Integrar HUD (score y vidas) en el canvas. Al detectar bola perdida (`ball.y - radius > 600`), restar 1 vida y resetear `ball` y `paddle` a sus posiciones iniciales exactas (seccion "Posiciones y movimiento"); en 0 vidas pasar a `gameover`. Al no quedar bloques vivos, pasar a `victory`. Renderizar pantallas de Game Over/Victoria con boton o tecla para reiniciar (recarga el `gameState` completo, incluyendo `paddle`/`ball` a sus valores iniciales). Verificable: perder las 3 vidas muestra Game Over; romper los 48 bloques muestra Victoria; reiniciar vuelve al estado inicial jugable con score 0 puntos, pala/bola en sus coordenadas iniciales y los bloques otra vez visibles.
7. **Loop principal (`main.js`).** Orquestar `requestAnimationFrame`, actualizar estado segun `gameState.status`, y renderizar todo en orden (fondo, bloques, pala, bola, HUD, pantallas de fin). Verificable: partida completa jugable de principio a fin (arranque -> romper bloques o perder vidas -> pantalla final -> reinicio).

## Criterios de aceptacion

- [ ] `index.html` carga el juego sin errores de consola, sirviendo el directorio con un servidor estatico.
- [ ] La pala arranca en `x:319, y:560`, se mueve con teclado (flechas o A/D) y con mouse, sin salir de `x: [0, 638]`, y su `y` nunca cambia.
- [ ] La bola arranca en `x:400, y:552` con velocidad `dx:150, dy:-260` (magnitud 300px/s).
- [ ] La bola rebota correctamente en paredes izquierda (`x<=8`), derecha (`x>=792`) y superior (`y<=8`), preservando magnitud de velocidad 300px/s.
- [ ] La bola rebota en la pala con angulo variable segun el punto de impacto (formula de `hitOffset`).
- [ ] Se renderizan **48 bloques (6 filas x 8 columnas)** con los 6 colores visuales de la tabla del Alcance, un color por fila.
- [ ] Cada golpe a un bloque (golpes 1 a 4) actualiza su sprite visual de dano (`HIT_FRAMES`) sin destruirlo.
- [ ] Al recibir el **5º golpe**, el bloque reproduce la animacion de destruccion de **5 frames** (`EXPLOSION_FRAMES`) y luego desaparece.
- [ ] El score en el HUD aumenta 1 punto cada vez que se destruye un bloque, independientemente de su color.
- [ ] Perder una bola (`ball.y - radius > 600`) resta 1 vida, visible en el HUD, y resetea pala/bola a sus coordenadas iniciales.
- [ ] Al llegar a 0 vidas se muestra la pantalla de Game Over con opcion de reiniciar.
- [ ] Al romper todos los bloques se muestra la pantalla de Victoria con opcion de reiniciar.
- [ ] Reiniciar desde Game Over o Victoria vuelve el juego a su estado inicial jugable (pala/bola en coordenadas iniciales, score 0, 48 bloques restaurados).

## Decisiones tomadas y descartadas

- **Controles: teclado y mouse ambos.** Da flexibilidad al jugador sin costo extra de implementacion.
- **Un solo nivel fijo, no multiples niveles.** Reduce alcance del MVP; niveles adicionales quedan para spec futuro.
- **3 vidas en vez de partida a una vida.** Estandar del genero, mejor experiencia de juego que game-over instantaneo.
- **Sin power-ups en el MVP.** Evita expandir el alcance a sistema de drops/efectos temporales; se definira en spec propio.
- **Puntuacion fija (1 punto por bloque).** Evita expandir el alcance a un sistema de puntuacion por color; se definira en spec propio si se desea.
- **Bloques con 5 golpes de resistencia, no un solo impacto.** El spritesheet tiene 5 frames de dano progresivo por color ya dibujados especificamente para esto; usarlos da mucho mas feedback visual y profundidad que un bloque de un solo golpe, sin costo extra de arte.
- **`gray` fuera del layout jugable.** No tiene fila asignada en el diseno de 6 colores del MVP; queda disponible en el spritesheet para un spec futuro.
- **Coordenadas y velocidades fijas y explicitas** (pala, bola, paredes) en vez de valores relativos/porcentuales. Elimina ambiguedad de implementacion; si se decide cambiar el tamano del canvas en el futuro, estos valores se recalculan en un spec de ajuste.
- **`BALL_SPEED` constante en magnitud (300px/s)** en todos los rebotes, incluida la pala. Evita que el juego se acelere o desacelere de forma impredecible; solo cambia la direccion, nunca la rapidez.
- **Sin sonido en el MVP**, aunque los assets `ball-bounce.mp3` y `break-sound.mp3` ya existen. Se integran en spec futuro para mantener el MVP enfocado en la mecanica central.
- **Sin pantalla de inicio.** El juego arranca directo al cargar, reduciendo estados a manejar en el MVP.
- **Sin persistencia de high score.** Fuera de alcance; ya se anticipa como posible spec futuro (mencionado en `CLAUDE.md` como `02-...`).
- **Animacion de dano y destruccion incluidas.** Los datos `HIT_FRAMES`/`EXPLOSION_FRAMES`/`EXPLOSION_DURATION` ya existen en `spritesheet.js` especificamente para esto, bajo costo de implementacion y mejoran sensiblemente el feedback visual.
- **Varios archivos JS separados** (`paddle.js`, `ball.js`, `blocks.js`, `collisions.js`, `game.js`, `main.js`) en vez de un unico `game.js`. Mejor organizacion por responsabilidad, sin necesidad de build step (se cargan via `<script>` tags en orden en `index.html`).
- **Canvas de 800x600px.** Tamano estandar para juegos arcade tipo Breakout, buen balance entre area de juego y visibilidad de sprites.
- **Angulo de rebote variable en la pala.** Replica la fisica clasica de Arkanoid y da control real al jugador sobre la trayectoria, en vez de un rebote tipo espejo que se siente plano.

## Riesgos identificados

- **Colision AABB simple entre bola circular y bloques rectangulares** puede sentirse imprecisa en los bordes/esquinas de los bloques; si se nota mal en playtesting, puede requerir ajuste fino de la deteccion (no bloqueante para el MVP).
- **Carga asincrona del spritesheet** (`loadSpritesheet(cb)`) debe completarse antes de iniciar el loop de render; si se omite el callback, los sprites no se dibujaran a tiempo.
- **5 golpes por bloque en un MVP** puede sentirse lento/repetitivo en playtesting frente al genero clasico (donde suele ser 1 golpe = 1 bloque); si se nota, ajustar `MAX_HITS` es un cambio de una sola constante, no bloqueante para el MVP.
- **Valores de velocidad y angulo elegidos arbitrariamente** (`BALL_SPEED=300`, `PADDLE_SPEED=480`, `MAX_BOUNCE_ANGLE=75°`) son un punto de partida razonable pero no estan validados por playtesting; es esperable ajustarlos tras probar el juego.
