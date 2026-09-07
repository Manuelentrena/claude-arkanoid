# 03 - Colisiones de Bloque Robustas

**Estado:** Aprovado
**Depende de:** 01 - MVP Arkanoid, 02 - Pala Roja, Canvas Vertical y Bloques Ampliados
**Fecha:** 2026-09-07

**Objetivo:** Garantizar que cada contacto de la bola con un bloque cuente exactamente un golpe,
corrigiendo la deteccion del eje de impacto, la falta de separacion posicional, el sesgo de
seleccion entre bloques solapados y el `deltaTime` sin limite, y haciendo visible la quinta fase
de dano antes de la explosion.

## Por que existe este spec

Durante el playtest se observo que algunos bloques se destruyen "antes de los 5 golpes". El
conteo de golpes es correcto en numero pero incorrecto en semantica: `updateCollisions`
(`collisions.js:41-55`) incrementa `block.hits` en **cada frame en que la bola solapa el
bloque**, no una vez por contacto. `resolveBallBlockBounce` (`collisions.js:16-24`) invierte
`dx` o `dy` pero **nunca reposiciona la bola fuera del bloque**, asi que cualquier contacto que
dure varios frames cuenta varios golpes.

El caso reproducible: `BLOCK_GAP = 4` y `BALL_RADIUS = 8` (diametro `16`). Cuando el centro de la
bola entra en el hueco de 4px entre dos columnas, solapa ambos bloques de forma continua. Ahi
`overlapX` es pequeno y `overlapY` grande, asi que el heuristico invierte `dx` cada frame: la
bola vibra en el hueco sin avance neto en X mientras sube. A 300px/s y 60fps recorre los 24px de
alto del bloque en ~5 frames = 5 golpes en ~83ms. El `break` de `collisions.js:54` hace que los
cinco caigan en el mismo bloque (el de indice mas bajo del array). El jugador ve un solo contacto
y un bloque que estalla.

El spec 01:214 ya anticipo el riesgo ("colision AABB simple entre bola circular y bloques
rectangulares puede sentirse imprecisa en los bordes/esquinas"). Este spec lo cierra con una
invariante explicita en vez de un ajuste fino sin contrato.

## Alcance

**Incluido:**

- **Invariante central: un golpe por contacto.** Un bloque no puede volver a recibir un golpe
  hasta que la bola haya dejado de solaparlo. Se implementa con dos mecanismos combinados:
  separacion posicional tras el rebote, y un flag de contacto por bloque.
- **Separacion posicional tras el rebote.** Tras invertir el componente de velocidad, la bola se
  reposiciona justo fuera de la cara impactada del bloque. Mismo criterio que el spec 01 ya
  aplica a la pala (`ball.y = PADDLE_Y - BALL_RADIUS`, spec 01:133, literalmente "para evitar que
  la bola quede incrustada en la pala") y a las paredes. Este spec extiende esa misma garantia a
  los bloques, que la tenian omitida.
- **Flag de contacto por bloque.** Al registrar un golpe, el bloque queda marcado como "en
  contacto". Mientras lo este, no acumula mas golpes. El flag se limpia en el primer frame en que
  la bola ya no solapa ese bloque.
- **Eje de impacto deducido de la posicion previa de la bola.** Se guarda la posicion de la bola
  antes de integrar el movimiento del frame. Si la bola estaba fuera del bloque en el eje X,
  se invierte `dx`; si estaba fuera en el eje Y, se invierte `dy`; si estaba fuera en ambos
  (entrada por esquina), se invierten los dos. Sustituye al heuristico de solape minimo, que
  trata la bola como cuadrado, ignora la direccion de la velocidad y en esquinas puede invertir
  el eje que no separa.
- **Seleccion del bloque impactado por mayor penetracion.** Se mantiene el maximo de un golpe por
  frame, pero el bloque elegido entre todos los solapados es aquel con el que la bola solapa mas
  profundo, no el primero del array. Elimina el sesgo actual hacia la columna izquierda.
- **Cap de `deltaTime`.** Se introduce `MAX_DELTA_TIME = 1/30` (33ms). Evita que un cambio de
  pestana o un pico de lag mueva la bola 30+px en un frame, penetrando hondo en un bloque (alto
  `24`) o atravesandolo sin colisionar.
- **Fase de dano final visible.** Al recibir el quinto golpe, el bloque muestra
  `HIT_FRAMES[color][4]` durante `FINAL_DAMAGE_DURATION` (80ms) y **despues** dispara la
  animacion de explosion. Cumple la tabla del spec 01:45, que define ese frame como "ultima fase
  de dano antes de destruccion" y que hoy nunca llega a dibujarse.
- **Solidez por estado del bloque.** Durante los 80ms de dano final el bloque **sigue siendo
  solido**: la bola rebota contra el, pero ya no le acumula golpes. Durante los 150ms de
  `EXPLOSION_DURATION` el bloque **no colisiona**, sin cambios respecto al spec 01:58.
- **Ratificacion del hueco de 4px entre bloques.** `BLOCK_GAP = 4`, `BLOCK_GRID_WIDTH = 412`,
  `BLOCK_GRID_START_X = 82`, `BLOCK_GRID_START_Y = 112`. Area de la rejilla: `x:82` a `x:494`,
  `y:112` a `y:276`, comodamente dentro del area interior jugable (`x:24` a `x:552`, `y:64` a
  `y:640`). Esto **corrige explicitamente la tabla del spec 02:167-178**, que especificaba
  rejilla contigua sin hueco (`BLOCKS_START_X = 96`, `BLOCKS_TOTAL_WIDTH = 384`). El codigo
  actual ya usa estos valores; este spec los convierte en decision deliberada en vez de
  desviacion silenciosa.

**Explicitamente fuera de alcance (specs futuros):**

- Colision con barrido continuo completa (swept AABB / CCD). El cap de `deltaTime` mas la
  separacion posicional cubren el caso real; el barrido continuo es otro nivel de complejidad.
- Cambios a `BALL_SPEED`, `PADDLE_SPEED`, `MAX_BOUNCE_ANGLE` o `MAX_HITS`: identicos a los
  specs 01 y 02.
- Rediseno del layout de la rejilla (numero de filas/columnas, tamano de bloque, colores).
- Colision bola-marco gris: sigue resuelta por los clamps de `ball.js` segun el spec 02:103.
- Multiples bolas simultaneas.
- Sonido, power-ups, multiples niveles, persistencia de high score, pausa: igual que specs 01 y 02.

## Modelo de datos

Se anaden tres campos al objeto bloque y dos al objeto bola. No hay persistencia nueva.

```js
// blocks.js — cada bloque del array `blocks`
{
  x, y, width: 48, height: 24,
  color,                    // clave interna de spritesheet.js
  hits,                     // 0 a MAX_HITS (5)
  alive,                    // false una vez terminada la explosion
  exploding,                // true mientras se reproduce EXPLOSION_FRAMES (no colisiona)
  explosionFrame,           // indice 0-4 dentro de EXPLOSION_FRAMES[color]
  explosionStartTime,       // timestamp de inicio de la explosion

  // NUEVO en este spec:
  inContact,                // true mientras la bola siga solapando este bloque tras un golpe
  finalDamage,              // true durante la fase de dano final (HIT_FRAMES[4] visible, sigue solido)
  finalDamageStartTime,     // timestamp de inicio de la fase de dano final
}

// ball.js — objeto `ball`
{
  x, y, dx, dy, radius: 8,

  // NUEVO en este spec:
  prevX,                    // x de la bola antes de integrar el movimiento de este frame
  prevY,                    // y de la bola antes de integrar el movimiento de este frame
}
```

Constantes nuevas:

| Constante | Valor | Archivo | Nota |
|---|---|---|---|
| `MAX_DELTA_TIME` | `1 / 30` | `game.js` | limite superior de `deltaTime` en segundos (33ms) |
| `FINAL_DAMAGE_DURATION` | `80` | `collisions.js` | ms que `HIT_FRAMES[color][4]` permanece visible antes de la explosion |

## Reglas de colision (contrato exacto)

Sea `r = BALL_RADIUS` (8) y el rectangulo expandido de un bloque
`E = [block.x - r, block.x + block.width + r] x [block.y - r, block.y + block.height + r]`.

- **Deteccion:** se mantiene `ballIntersectsBlock` (test circulo-rectangulo, `collisions.js:8-14`).
  Es mas preciso que un AABB puro y ya existe.
- **Candidatos a colision en un frame:** todos los bloques con `alive === true` y
  `exploding === false`. Los bloques en `finalDamage` **si** son candidatos (siguen siendo
  solidos); los bloques en `exploding` no.
- **Eleccion del bloque impactado:** entre los candidatos que solapan, el de mayor penetracion,
  definida como `min(overlapX, overlapY)` sobre `E`. Maximo un bloque impactado por frame.
- **Eje de impacto:**
  - `estabaFueraEnX = ball.prevX < E.xMin || ball.prevX > E.xMax`
  - `estabaFueraEnY = ball.prevY < E.yMin || ball.prevY > E.yMax`
  - solo `estabaFueraEnX` -> invertir `dx`
  - solo `estabaFueraEnY` -> invertir `dy`
  - ambos (entrada por esquina) -> invertir `dx` y `dy`
  - ninguno (la bola ya estaba dentro: solo alcanzable con `deltaTime` extremo) -> fallback al
    heuristico de solape minimo actual, invirtiendo el eje de menor solape.
- **Separacion posicional,** aplicada tras invertir (el signo de la velocidad ya apunta hacia
  fuera):
  - si se invirtio `dx`: `ball.x = ball.dx > 0 ? E.xMax : E.xMin`
  - si se invirtio `dy`: `ball.y = ball.dy > 0 ? E.yMax : E.yMin`
- **Conteo del golpe:** `block.hits += 1` solo si `block.inContact === false` **y**
  `block.finalDamage === false`. Tras incrementar, `block.inContact = true`.
  El rebote se aplica siempre, independientemente de si el golpe se contabiliza.
- **Limpieza del flag:** al inicio de cada frame, todo bloque con `inContact === true` que ya no
  solape la bola pasa a `inContact = false`.
- **Ciclo de vida del bloque:** `hits` llega a `MAX_HITS` (5) -> `finalDamage = true`,
  `finalDamageStartTime = now` (solido, `HIT_FRAMES[4]` visible) -> pasados
  `FINAL_DAMAGE_DURATION` (80ms) -> `exploding = true`, `explosionStartTime = now` (deja de
  colisionar) -> pasados `EXPLOSION_DURATION` (150ms) -> `alive = false` y `score += 1`.

`drawBlocks` (`blocks.js:45-54`) no necesita cambios: `getBlockHitFrame(color, 5)` ya devuelve
`HIT_FRAMES[color][4]`, y basta con que `exploding` siga en `false` durante la fase de dano final
para que se dibuje.

## Plan de implementacion

1. **Cap de `deltaTime`.** Anadir `MAX_DELTA_TIME = 1 / 30` en `game.js` junto a `INITIAL_LIVES`,
   y aplicarlo en `main.js:10`: `const deltaTime = Math.min((now - lastTime) / 1000, MAX_DELTA_TIME)`.
   Verificable: dejar la pestana en segundo plano 10s y volver; la bola no salta al otro extremo
   del canvas ni se pierde una vida por el salto.
2. **Posicion previa de la bola.** En `ball.js`, anadir `prevX`/`prevY` al objeto `ball`,
   asignarlos al principio de `updateBall` antes de integrar el movimiento, e inicializarlos en
   `resetBall`. Verificable: el juego se comporta exactamente igual que antes (paso preparatorio,
   sin cambio funcional).
3. **Campos nuevos del bloque.** En `blocks.js`, anadir `inContact: false`, `finalDamage: false`,
   `finalDamageStartTime: 0` a los objetos creados en `createBlocks`. Verificable: el juego se
   comporta igual que antes.
4. **Fase de dano final visible.** En `collisions.js`, anadir `FINAL_DAMAGE_DURATION = 80`; al
   alcanzar `MAX_HITS` marcar `finalDamage` en vez de `exploding`, y en el bucle de animaciones
   promover `finalDamage` a `exploding` pasados los 80ms. Excluir de la deteccion solo los
   bloques `exploding`. Verificable: al quinto golpe se ve el quinto frame de dano un instante
   antes de la explosion, y durante ese instante la bola rebota contra el bloque.
5. **Eje de impacto y separacion posicional.** Reescribir `resolveBallBlockBounce` segun la
   seccion "Reglas de colision". Verificable: la bola nunca queda visualmente dentro de un
   bloque, y los rebotes en esquina la alejan del bloque en vez de meterla mas.
6. **Un golpe por contacto.** Anadir la limpieza de `inContact` al inicio de `updateCollisions` y
   la condicion de conteo. Verificable: instrumentar temporalmente con `console.log` los cambios
   de `hits`; ningun bloque sube mas de un punto por contacto.
7. **Seleccion por mayor penetracion.** Sustituir el `break` sobre el primer bloque solapado por
   la busqueda del candidato de mayor penetracion. Verificable: dirigir la bola al hueco entre
   dos columnas; los golpes ya no caen sistematicamente en el bloque de la izquierda.

## Criterios de aceptacion

- [ ] Ningun bloque incrementa `hits` mas de una vez por contacto de la bola (verificable
      instrumentando `blocks` desde la consola del navegador).
- [ ] Ningun bloque se destruye con menos de 5 contactos separados de la bola.
- [ ] Se ven en pantalla las 5 fases de dano (`HIT_FRAMES[color][0]` a `[4]`) antes de la
      explosion de un bloque.
- [ ] Tras el quinto golpe el bloque muestra `HIT_FRAMES[color][4]` durante 80ms, luego reproduce
      los 5 `EXPLOSION_FRAMES` durante 150ms, luego desaparece y suma 1 punto al HUD.
- [ ] Durante los 80ms de dano final la bola rebota contra el bloque y no le suma golpes.
- [ ] Durante los 150ms de explosion la bola atraviesa el bloque sin rebotar (sin cambios
      respecto al spec 01).
- [ ] Tras cualquier rebote contra un bloque, el centro de la bola queda fuera del rectangulo del
      bloque expandido por `BALL_RADIUS`.
- [ ] Con la bola entrando en el hueco de 4px entre dos columnas, no se registra mas de un golpe
      por frame y ninguno de los dos bloques se destruye en esa unica pasada.
- [ ] Dejar la pestana en segundo plano 10 segundos y volver no destruye ningun bloque ni resta
      vidas.
- [ ] `deltaTime` nunca supera `1/30` segundos.
- [ ] La bola sigue rebotando en el marco gris (`x:24`, `x:552`, `y:64`) y en la pala con
      magnitud constante de 300px/s (sin regresion respecto a los specs 01 y 02).
- [ ] La rejilla sigue ocupando `x:82` a `x:494`, `y:112` a `y:276`, con hueco de 4px entre
      bloques.
- [ ] Destruir los 48 bloques sigue mostrando la pantalla de Victoria; perder 3 vidas sigue
      mostrando Game Over.

## Decisiones tomadas y descartadas

- **Si: mantener `BLOCK_GAP = 4`.** El hueco ya esta validado visualmente en el juego actual. Este
  spec corrige la tabla del spec 02:167-178 en vez de revertir el codigo, y asume que la
  invariante de un golpe por contacto es lo que vuelve el hueco inofensivo.
- **No: restaurar la rejilla contigua del spec 02.** Habria eliminado la trampa de raiz, pero
  cambia el aspecto del layout ya aceptado. El arreglo correcto es la fisica, no el espaciado.
- **No: aumentar el hueco por encima del diametro de la bola (>16px).** Cambia el layout y el
  balance del juego por completo.
- **Si: separacion posicional mas flag de contacto (los dos).** La separacion arregla la fisica;
  el flag cubre el residuo de solape simultaneo con dos bloques en esquinas y huecos. Cinturon y
  tirantes en un sistema donde el sintoma es dificil de reproducir a mano.
- **No: solo cooldown temporal de invulnerabilidad por bloque.** Tapa el conteo sin sacar la bola
  del bloque; la bola seguiria pudiendo quedar incrustada.
- **Si: eje de impacto por posicion previa de la bola.** Determinista y siempre separa, porque
  usa por donde entro la bola en vez de una aproximacion geometrica de la posicion final.
- **No: mantener el heuristico de solape minimo.** Es exactamente el que falla en esquinas y en
  el hueco entre columnas, tratando una bola circular como un cuadrado e ignorando la velocidad.
- **Si: un golpe por frame como maximo, al bloque de mayor penetracion.** Conserva el ritmo de
  juego actual y elimina el sesgo hacia el bloque de indice mas bajo del array.
- **No: golpear todos los bloques solapados en el mismo frame.** Seria mas correcto fisicamente
  pero acelera la destruccion en el hueco de 4px, justo el sintoma que este spec arregla.
- **Si: hacer visible `HIT_FRAMES[color][4]` durante 80ms.** El spec 01:45 ya lo define como una
  fase de dano; el arte existe y hoy no se ve nunca.
- **No: aceptar 4 fases de dano y ajustar el spec 01.** Perderia feedback visual que ya esta
  dibujado en el spritesheet sin coste.
- **Si: bloque solido durante el dano final, atravesable durante la explosion.** Mantiene el
  spec 01:58 sin cambios y evita que la bola cruce libre a la fila de detras justo al empezar la
  fase de dano final.
- **Si: cap de `deltaTime` a `1/30`.** A 300px/s limita el salto por frame a 10px, muy por debajo
  del alto del bloque (24). Por debajo de 30fps el juego va a camara lenta en vez de romperse.
- **No: dejar `deltaTime` sin limite.** La invariante de un golpe por contacto arreglaria el
  conteo, pero el tunneling (atravesar un bloque sin tocarlo) seguiria siendo posible.
- **No: colision con barrido continuo (CCD).** Complejidad muy superior para un caso que el cap
  de `deltaTime` mas la separacion posicional ya cubren.

## Riesgos identificados

| Riesgo | Mitigacion |
| --- | --- |
| Los 80ms de dano final alargan cada destruccion y pueden sentirse lentos acumulados sobre 48 bloques | `FINAL_DAMAGE_DURATION` es una constante en un solo sitio (`collisions.js`); se ajusta tras playtest sin tocar logica |
| El cap de `deltaTime` hace que el juego vaya a camara lenta en equipos que no sostienen 30fps | Aceptado a proposito: preferible a que la bola atraviese bloques. Solo afecta por debajo de 30fps |
| La separacion posicional usa el rectangulo expandido por el radio mientras la deteccion usa un test circular, asi que en esquinas separa un poco de mas | Desviacion maxima de ~2px, imperceptible a 300px/s |
| `inContact` podria quedarse activo si un bloque cambia de estado mientras la bola lo solapa | El flag se reinicia en `createBlocks` y se recalcula cada frame contra el solape real, no contra un temporizador |
| El fallback de eje (bola ya dentro del bloque) reintroduce el heuristico defectuoso | Solo alcanzable con `deltaTime` extremo, que el cap de `1/30` ya acota |

## Lo que **no** entra en este spec

- Colision con barrido continuo (swept AABB / CCD).
- Cambios a `BALL_SPEED`, `PADDLE_SPEED`, `MAX_BOUNCE_ANGLE` o `MAX_HITS`.
- Rediseno del layout de la rejilla de bloques.
- Multiples bolas simultaneas.
- Sonido, power-ups, niveles, persistencia de high score, pausa.

Cada uno, si llega, va en su propio spec.
