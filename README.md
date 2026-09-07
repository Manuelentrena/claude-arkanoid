# JUEGO DE ARKANOID

Clon de Arkanoid/Breakout implementado con HTML, CSS y JS puro. Sin dependencias, sin build tools.

## Como jugar

No hay build step. Sirve el directorio con un servidor estatico y abre `index.html`:

```
python3 -m http.server 8000
```

Luego visita `http://localhost:8000`. (Abrir `index.html` directo con `file://` puede fallar porque el spritesheet se carga en un canvas.)

**Controles:** mueve la pala con las flechas izquierda/derecha, A/D, o el mouse.

**Arranque:** al cargar la pagina el juego espera en la pantalla de inicio. Pulsa Enter o haz click para empezar. Ese primer gesto es tambien lo que desbloquea el audio en el navegador.

## Estado

Implementados los specs 01 a 04: pala, bola con rebote de angulo variable, 48 bloques (6 filas x 8 columnas) con daño progresivo y animacion de destruccion, puntuacion, vidas, pantallas de Game Over y Victoria con reinicio, canvas vertical con marco de piedra irrompible, colisiones robustas de un golpe por contacto, y efectos de sonido con boton de silenciado.

**Puntuacion:** cada bloque suma 1 punto al ser destruido, sin importar su color. Se muestra en el HUD (`Score`).

**Vidas:** arrancas con 3. Pierdes 1 cada vez que la bola cae por debajo de la pala; la pala y la bola vuelven a su posicion inicial. Al llegar a 0 vidas aparece la pantalla de Game Over. Se muestran en el HUD (`Vidas`).

**Bloques:** cada bloque aguanta 5 golpes (mostrando daño progresivo) antes de destruirse con una animacion de explosion.

**Reinicio:** desde Game Over o Victoria, pulsa Enter o haz click para volver a empezar (score, vidas y bloques se restauran). El reinicio va directo a jugar, sin pasar otra vez por la pantalla de inicio.

**Sonido:** suenan cuatro efectos — la intro al empezar cada partida, un rebote al tocar la pala, una rotura al destruir un bloque, y el tema de Game Over al perder la tercera vida. El boton `♪` del centro del HUD activa y silencia todo el audio; aparece gris y tachado cuando esta silenciado. La preferencia se recuerda entre sesiones.

## Estructura

- `index.html` — entrada del juego, carga los scripts.
- `paddle.js`, `ball.js`, `blocks.js`, `border.js`, `collisions.js`, `game.js`, `main.js` — logica del juego.
- `sound.js` — capa de audio: efectos, silenciado global y persistencia de la preferencia.
- `assets/spritesheet.js`, `assets/spritesheet-breakout.png` — atlas de sprites (pala, bola, bloques, animaciones de daño y explosion).
- `assets/sounds/` — efectos usados por el juego (`intro.mp3`, `ball-bounce.mp3`, `break-sound.mp3`, `game-over.mp3`) y `music.mp3`, reservado para un spec futuro.
- `specs/` — especificaciones del flujo spec-driven (`/spec`, `/spec-impl`) y su configuracion (`.spec-config.yml`).
- `skills-lock.json` — versiones ancladas de las skills `spec`/`spec-impl`.
- `CLAUDE.md` — guia del proyecto para Claude Code.
