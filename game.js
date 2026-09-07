// game.js — vidas, HUD y estados de fin (game over / victoria) con reinicio.

// Constantes de layout del canvas (spec 02): franja de HUD separada del area
// jugable, que la bola nunca puede alcanzar.
const CANVAS_WIDTH = 576;
const CANVAS_HEIGHT = 640; // = HUD_HEIGHT + PLAY_AREA_HEIGHT(600)
const HUD_HEIGHT = 40;
const PLAY_AREA_TOP = 40; // = HUD_HEIGHT
const HUD_Y = 20; // centro vertical de la franja y:0 a y:40
const HUD_SCORE_X = 12; // alineado a la izquierda
const HUD_LIVES_X = 564; // alineado a la derecha (= 576 - 12)
const HUD_SOUND_X = 288; // = CANVAS_WIDTH / 2, centrado en la franja de HUD
// Rectangulo de hit-test del boton de sonido: cae entero dentro de la franja de HUD
// (y:0 a y:40) y no se solapa con el score ni con las vidas.
const SOUND_BUTTON = { x: 268, y: 4, width: 40, height: 32 };

const INITIAL_LIVES = 3;
const MAX_DELTA_TIME = 1 / 30; // limite superior de deltaTime en segundos (33ms)

let lives = INITIAL_LIVES;
// Arranca en 'ready': el juego queda congelado hasta el primer gesto del jugador, que es
// lo que desbloquea el audio del navegador (spec 04).
let status = 'ready'; // 'ready' | 'playing' | 'gameover' | 'victory'

// Punto unico de transicion a 'playing': aqui suena la intro, tanto al arrancar desde
// 'ready' como al reiniciar tras Game Over o Victoria.
function startGame() {
  status = 'playing';
  playSound( 'intro' );
}

function resetGame() {
  score = 0;
  lives = INITIAL_LIVES;
  resetPaddle();
  resetBall();
  resetBlocks();
  startGame();
}

function updateGame( deltaTime, now ) {
  if ( status !== 'playing' ) return;

  updatePaddle( deltaTime );
  const lost = updateBall( deltaTime );
  updateCollisions( now );

  if ( lost ) {
    lives -= 1;
    resetPaddle();
    if ( lives <= 0 ) {
      status = 'gameover';
      playSound( 'gameover' );
      return;
    }
  }

  if ( blocks.every( ( block ) => !block.alive ) ) {
    status = 'victory';
  }
}

function drawHUD( ctx ) {
  ctx.fillStyle = 'white';
  ctx.font = '16px monospace';
  ctx.textAlign = 'left';
  ctx.fillText( `Score: ${ score }`, HUD_SCORE_X, HUD_Y );
  ctx.textAlign = 'right';
  ctx.fillText( `Vidas: ${ lives }`, HUD_LIVES_X, HUD_Y );
  drawSoundButton( ctx );
  ctx.textAlign = 'left';
}

// Boton de sonido: glifo blanco cuando esta activo, gris y tachado cuando esta silenciado.
function drawSoundButton( ctx ) {
  const enabled = isSoundEnabled();

  ctx.textAlign = 'center';
  ctx.fillStyle = enabled ? 'white' : '#666';
  ctx.font = '16px monospace';
  ctx.fillText( '♪', HUD_SOUND_X, HUD_Y );

  if ( enabled ) return;

  ctx.strokeStyle = '#666';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo( HUD_SOUND_X - 8, HUD_Y + 4 );
  ctx.lineTo( HUD_SOUND_X + 8, HUD_Y - 12 );
  ctx.stroke();
}

function drawEndScreen( ctx ) {
  if ( status === 'playing' ) return;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect( 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT );

  let title = 'VICTORIA';
  if ( status === 'ready' ) title = 'ARKANOID';
  else if ( status === 'gameover' ) title = 'GAME OVER';

  const hint = status === 'ready'
    ? 'Pulsa ENTER o click para empezar'
    : 'Pulsa ENTER o click para reiniciar';

  ctx.textAlign = 'center';
  ctx.fillStyle = 'white';
  ctx.font = '48px monospace';
  ctx.fillText( title, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40 );

  ctx.font = '20px monospace';
  ctx.fillText( hint, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10 );
  ctx.textAlign = 'left';
}

( function setupGameInput() {
  const canvas = document.getElementById( 'gameCanvas' );

  // Desde 'ready' se arranca la partida; desde 'gameover'/'victory' se reinicia.
  function handleUserGesture() {
    if ( status === 'ready' ) startGame();
    else if ( status !== 'playing' ) resetGame();
  }

  function pointInSoundButton( x, y ) {
    return (
      x >= SOUND_BUTTON.x && x <= SOUND_BUTTON.x + SOUND_BUTTON.width &&
      y >= SOUND_BUTTON.y && y <= SOUND_BUTTON.y + SOUND_BUTTON.height
    );
  }

  window.addEventListener( 'keydown', ( e ) => {
    if ( e.key === 'Enter' ) handleUserGesture();
  } );

  canvas.addEventListener( 'click', ( e ) => {
    const rect = canvas.getBoundingClientRect();
    const x = ( e.clientX - rect.left ) * ( canvas.width / rect.width );
    const y = ( e.clientY - rect.top ) * ( canvas.height / rect.height );

    // El boton de sonido se resuelve primero: pulsarlo nunca arranca ni reinicia.
    if ( pointInSoundButton( x, y ) ) {
      toggleSound();
      return;
    }

    handleUserGesture();
  } );
} )();
