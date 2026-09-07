# 04 - Sonido y Boton de Audio en el HUD

**Estado:** Implementado
**Depende de:** 01 - MVP Arkanoid, 02 - Pala Roja, Canvas Vertical y Bloques Ampliados, 03 - Colisiones de Bloque Robustas
**Fecha:** 2026-09-07

**Objetivo:** Integrar los cuatro efectos de sonido ya presentes en `assets/sounds/`
(intro, game-over, ball-bounce, break-sound) y anadir en la franja de HUD un boton que
activa o silencia todo el audio, con la preferencia recordada en `localStorage`.

## Por que existe este spec

Los cinco mp3 estan en `assets/sounds/` desde el commit `f466dcf`, pero **ningun fichero
`.js` los usa**. El juego es hoy completamente mudo: no hay ni una referencia a `Audio`,
`.mp3` ni `play()` en `paddle.js`, `ball.js`, `blocks.js`, `border.js`, `collisions.js`,
`game.js`, `main.js` ni `index.html`. El spec 01 dejo el sonido explicitamente fuera de
alcance ("Sonido, power-ups, niveles, persistencia de high score, pausa: cada uno, si
llega, va en su propio spec") y los specs 02 y 03 lo mantuvieron fuera. Este es ese spec.

Ademas hay un obstaculo que obliga a tocar el ciclo de vida del juego: **los navegadores
bloquean la reproduccion de audio hasta que el usuario interactua con la pagina**. Hoy
`main.js` arranca el loop en cuanto carga el spritesheet, sin ningun gesto previo del
jugador, asi que el sonido de intro quedaria silenciado justo la primera vez que se
juega. Por eso este spec introduce un estado `'ready'` con pantalla de inicio.

## Alcance

**Incluido:**

- **Nuevo fichero `sound.js`** con toda la capa de audio, cargado en `index.html` justo
  despues de `assets/spritesheet.js`. Ningun otro fichero crea objetos `Audio`.
- **Cuatro efectos**, cada uno con un disparador exacto:

  | Sonido | Fichero | Se dispara en |
  |---|---|---|
  | intro | `assets/sounds/intro.mp3` | transicion a `'playing'` (arranque y reinicio) |
  | ball-bounce | `assets/sounds/ball-bounce.mp3` | rebote de la bola en la pala (`ball.js`) |
  | break-sound | `assets/sounds/break-sound.mp3` | un bloque alcanza `MAX_HITS` (`collisions.js`) |
  | game-over | `assets/sounds/game-over.mp3` | `status` pasa a `'gameover'` (`game.js`) |

- **Nuevo estado `'ready'`** en `game.js`. La pagina carga con el juego congelado y un
  overlay "Pulsa ENTER o click para empezar". El primer gesto del jugador desbloquea el
  audio del navegador y arranca la partida con la intro. Este estado **solo aparece al
  cargar la pagina**: tras Game Over o Victoria, el reinicio va directo a `'playing'`,
  porque el propio click o ENTER de reinicio ya es un gesto valido.
- **Boton de audio dibujado dentro del canvas**, en la franja de HUD (`y:0` a `y:40`
  segun el spec 02), centrado horizontalmente entre el Score (izquierda) y las Vidas
  (derecha). Se dibuja con `ctx.fillText` y el mismo `16px monospace` del HUD: glifo `♪`
  en blanco cuando el sonido esta activo; en gris (`#666`) y con una linea diagonal
  tachandolo cuando esta silenciado.
- **Hit-test por click** sobre el rectangulo del boton, resuelto **antes** que la logica
  de arranque y reinicio. Pulsar el boton nunca arranca ni reinicia la partida.
- **Un unico interruptor para todo el audio.** El boton no distingue entre efectos: los
  silencia todos.
- **Persistencia de la preferencia** en `localStorage`, clave `arkanoid.soundEnabled`,
  valores `'true'` / `'false'`. Clave ausente o ilegible = sonido activado (por defecto).
- **Silenciar corta el clip largo que este sonando** (intro o game-over), no solo impide
  los siguientes.

**Explicitamente fuera de alcance (specs futuros):**

- `assets/sounds/music.mp3` y la musica de fondo. Ignorada a proposito en este spec;
  cuando entre, se enchufa al mismo interruptor sin cambiar la UI.
- Sonido en la pantalla de Victoria: no existe asset para ello, la victoria queda muda.
- Sonido en el rebote contra el marco gris o contra bloques que no se destruyen.
- Control de volumen (slider), atajo de teclado para silenciar, botones separados para
  efectos y musica.
- Cambios a fisica, layout, colisiones, dano progresivo o puntuacion: identicos a los
  specs 01, 02 y 03.
- Persistencia de high score: sigue fuera de alcance, igual que en el spec 01. Este spec
  usa `localStorage` solo para la preferencia de sonido.
- Power-ups, multiples niveles, pausa.

## Modelo de datos

No hay cambios en `ball`, `paddle` ni en los objetos de `blocks`.

```js
// sound.js — configuracion estatica y estado de la capa de audio
const SOUND_STORAGE_KEY = 'arkanoid.soundEnabled';

const SOUND_DEFS = {
  intro:    { src: 'assets/sounds/intro.mp3',       volume: 0.6, pool: 1 },
  gameover: { src: 'assets/sounds/game-over.mp3',   volume: 0.6, pool: 1 },
  bounce:   { src: 'assets/sounds/ball-bounce.mp3', volume: 0.5, pool: 4 },
  break:    { src: 'assets/sounds/break-sound.mp3', volume: 0.5, pool: 4 },
};

let soundEnabled = true; // se sobrescribe al cargar la preferencia de localStorage
```

API publica de `sound.js`, en scope global como el resto del proyecto:
`playSound(name)`, `stopSound(name)`, `toggleSound()`, `isSoundEnabled()`.

```js
// game.js — estado y constantes nuevas
let status = 'ready'; // 'ready' | 'playing' | 'gameover' | 'victory'  (antes arrancaba en 'playing')

const HUD_SOUND_X = 288; // = CANVAS_WIDTH / 2, centrado en la franja de HUD
const SOUND_BUTTON = { x: 268, y: 4, width: 40, height: 32 }; // rectangulo de hit-test
```

El rectangulo `x:268` a `x:308`, `y:4` a `y:36` cae entero dentro de la franja de HUD
(`y:0` a `y:40`) y no se solapa con `HUD_SCORE_X = 12` ni con `HUD_LIVES_X = 564`.

## Reglas de audio (contrato exacto)

- **Solape.** `bounce` y `break` usan un pool de 4 elementos `Audio` recorridos en
  round-robin: dos golpes seguidos no se cortan entre si. `intro` y `gameover` usan un
  unico elemento cada uno, reiniciado con `currentTime = 0` antes de sonar.
- **Silencio.** `playSound(name)` sale sin hacer nada si `soundEnabled === false`.
  `toggleSound()`, al apagar, llama ademas a `stopSound('intro')` y
  `stopSound('gameover')` para cortar los clips largos en curso.
- **Errores.** Toda llamada a `.play()` lleva un `.catch()` vacio: un mp3 que falle o un
  bloqueo del navegador nunca rompe el loop de juego. Los accesos a `localStorage` van en
  `try/catch`, porque lanzan en modo privado de algunos navegadores.
- **Precarga.** Cada elemento `Audio` se crea con `preload = 'auto'` al cargar
  `sound.js`, para que el primer disparo de cada efecto no llegue tarde.
- **Un solo estado.** `soundEnabled` es la unica fuente de verdad. El dibujo del boton lo
  consulta via `isSoundEnabled()`; nadie mas guarda una copia.

## Plan de implementacion

1. **`sound.js` y su carga.** Crear el fichero con `SOUND_DEFS`, los pools de `Audio`,
   `playSound`, `stopSound`, `toggleSound`, `isSoundEnabled` y la lectura/escritura de
   `localStorage`. Anadir `<script src="sound.js"></script>` en `index.html` justo
   despues de `assets/spritesheet.js`. Verificable: desde la consola del navegador,
   `playSound('bounce')` suena, `toggleSound()` lo silencia, y recargar conserva el
   estado.
2. **Estado `'ready'`.** `status` arranca en `'ready'`; `updateGame` ya sale antes si
   `status !== 'playing'`, asi que el juego queda congelado sin tocar el loop. Extender
   `drawEndScreen` para pintar tambien el overlay de `'ready'` ("ARKANOID" y "Pulsa ENTER
   o click para empezar"). ENTER o click en `'ready'` pasa a `'playing'`. Verificable: al
   cargar la pagina el juego no se mueve y arranca al primer gesto.
3. **Intro.** Disparar `playSound('intro')` en la transicion a `'playing'`: tanto al
   arrancar desde `'ready'` como en `resetGame`. Verificable: suena al empezar y al
   reiniciar, y no suena al perder una vida.
4. **Rebote en la pala.** Llamar a `playSound('bounce')` en la rama de rebote de pala de
   `updateBall` (`ball.js:55-70`). Verificable: suena en cada toque de pala y en ningun
   rebote contra el marco.
5. **Rotura de bloque.** Llamar a `playSound('break')` donde `impactedBlock.hits` alcanza
   `MAX_HITS` y se marca `finalDamage` (`collisions.js:108-111`). Verificable: suena una
   vez por bloque destruido, no en los cuatro golpes previos.
6. **Game over.** Llamar a `playSound('gameover')` al fijar `status = 'gameover'`
   (`game.js:38-41`). Verificable: suena al perder la tercera vida; la victoria sigue
   muda.
7. **Boton en el HUD.** Dibujarlo en `drawHUD` segun `isSoundEnabled()`, y resolver el
   hit-test dentro del listener de click del canvas **antes** de la logica de arranque y
   reinicio, convirtiendo las coordenadas del evento con `getBoundingClientRect()`.
   Verificable: el boton alterna su aspecto, silencia el juego, y pulsarlo sobre la
   pantalla de Game Over no reinicia la partida.

## Criterios de aceptacion

- [ ] Al cargar la pagina el juego no se mueve y se ve "Pulsa ENTER o click para empezar".
- [ ] El primer ENTER o click arranca la partida y suena `intro.mp3`.
- [ ] Tras Game Over o Victoria, ENTER o click reinicia directo a jugar y vuelve a sonar
      la intro, sin pasar otra vez por la pantalla de inicio.
- [ ] `ball-bounce.mp3` suena en cada rebote contra la pala, y en ningun rebote contra el
      marco gris ni contra un bloque.
- [ ] `break-sound.mp3` suena exactamente una vez por bloque destruido.
- [ ] `game-over.mp3` suena al perder la tercera vida. La pantalla de Victoria es muda.
- [ ] El boton `♪` se ve centrado en la franja de HUD, sin solaparse con Score ni Vidas.
- [ ] Un click en el boton alterna su aspecto entre blanco (activo) y gris tachado
      (silenciado).
- [ ] Con el sonido silenciado no se oye ninguno de los cuatro efectos.
- [ ] Silenciar mientras suena la intro la corta en el acto.
- [ ] Pulsar el boton sobre la pantalla de inicio no arranca la partida; pulsarlo sobre
      Game Over o Victoria no la reinicia.
- [ ] Silenciar, recargar la pagina, y el sonido sigue silenciado. Activar, recargar, y
      sigue activo.
- [ ] Sin `localStorage` disponible (modo privado) el juego arranca con sonido activo y
      no lanza errores en consola.
- [ ] La consola no muestra errores en una partida completa.
- [ ] Fisica, colisiones, dano progresivo, score y vidas siguen identicos a los specs 01,
      02 y 03.

## Decisiones tomadas y descartadas

- **Si: un unico interruptor para todo el audio.** Un solo estado que entender, y cuando
  entre `music.mp3` se suma al mismo boton sin cambiar la UI.
- **No: dos botones separados (efectos y musica).** Demasiada superficie de UI para una
  franja de 40px de alto, y hoy la musica esta fuera de alcance.
- **No: un boton que solo controle la musica.** Hoy no haria nada visible, porque
  `music.mp3` esta fuera de alcance.
- **Si: boton dibujado dentro del canvas.** Mantiene el juego como un unico canvas,
  coherente con los specs 01, 02 y 03. Coste asumido: el hit-test se hace a mano.
- **No: un `<button>` HTML fuera del canvas.** Daria accesibilidad de teclado y de
  lectores de pantalla gratis, pero rompe la unidad visual y mete CSS nuevo en
  `index.html`.
- **Si: glifo de texto `♪`.** Cero assets nuevos y el mismo `16px monospace` que ya usa
  el HUD.
- **No: emoji 🔊 / 🔇.** Mas reconocible, pero su render varia entre sistemas operativos y
  rompe el look pixel del juego.
- **No: sprite del spritesheet.** No hay ningun icono de altavoz mapeado en
  `assets/spritesheet.js`; habria que dibujarlo.
- **Si: intro una vez por partida.** Evita repetir un clip de 67KB hasta tres veces por
  partida al perder vidas.
- **Si: pantalla "Pulsa para empezar".** Los navegadores bloquean el audio hasta que hay
  un gesto del usuario; sin ella la intro quedaria muda justo la primera vez que se
  juega, que es cuando mas importa.
- **No: diferir la intro al primer keydown sin pantalla.** Menos codigo, pero deja el
  arranque ambiguo para el jugador: el juego correria antes de que suene nada.
- **No: ignorar el bloqueo de autoplay.** Es la opcion de cero codigo, pero garantiza que
  la primera partida de cada sesion arranque muda.
- **No: estado `'ready'` tambien tras cada reinicio.** Seria mas consistente, pero
  obligaria a dos clicks para rejugar; tras Game Over ya existe un gesto del usuario que
  desbloquea el audio.
- **Si: `ball-bounce` solo en la pala.** Literal a lo pedido, y evita que el mismo clip
  suene en cada rebote de pared.
- **No: `ball-bounce` en todos los rebotes.** Saturacion sonora, sobre todo cuando la
  bola se cuela entre el marco y la ultima fila de bloques.
- **Si: `break-sound` al alcanzar `MAX_HITS`.** Sincroniza con el momento visual de la
  rotura (la fase de dano final del spec 03), no con el final de la explosion 230ms
  despues.
- **Si: persistencia en `localStorage`.** Cinco lineas, sin dependencias, y respeta la
  eleccion del jugador entre recargas. No reabre la persistencia de high score, que sigue
  fuera de alcance.
- **Si: pool de 4 elementos `Audio` para `bounce` y `break`.** Dos roturas seguidas no se
  cortan entre si.
- **No: un solo `Audio` con `currentTime = 0` para los efectos cortos.** Mas simple, pero
  corta el clip anterior en las cadenas rapidas de bloques.
- **Si: hit-test del boton antes de la logica de arranque y reinicio.** Sin ese orden,
  silenciar desde la pantalla de Game Over reiniciaria la partida al mismo tiempo.

## Riesgos identificados

| Riesgo | Mitigacion |
| --- | --- |
| `localStorage` deshabilitado (modo privado) lanza al leer o escribir | Todos los accesos en `try/catch`; fallback a la variable en memoria con el valor por defecto |
| El navegador bloquea `.play()` pese al gesto, por politicas mas agresivas | Cada `.play()` lleva `.catch()` vacio; el juego sigue funcionando, solo que mudo |
| Latencia en el primer disparo de cada mp3 | `preload = 'auto'` al crear cada `Audio` en la carga de `sound.js` |
| La intro (67KB) puede solaparse con los primeros rebotes de la partida | Aceptado; si molesta se ajusta `volume` o se corta, ambos parametros viven en `SOUND_DEFS` |
| Servir con `file://` bloquea la carga de los mp3 | Ya documentado en `CLAUDE.md`: servir el directorio con un servidor estatico |
| El nuevo estado `'ready'` toca el ciclo de vida definido en el spec 01 | Cambio contenido: `updateGame` ya sale antes si `status !== 'playing'`; solo cambian el valor inicial de `status` y los listeners de entrada |
| El rectangulo del boton se solapa con el texto del HUD si crece el Score | `HUD_SCORE_X = 12` con texto alineado a la izquierda deja 256px libres antes de `x:268` |

## Lo que **no** entra en este spec

- `music.mp3` y la musica de fondo.
- Sonido de victoria, control de volumen, atajo de teclado para silenciar.
- Sonido en rebotes contra el marco gris o contra bloques que no se destruyen.
- Botones separados para efectos y musica.
- Cambios de fisica, layout, colisiones, dano progresivo o puntuacion.
- Persistencia de high score, power-ups, multiples niveles, pausa.

Cada uno, si llega, va en su propio spec.
