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

const INITIAL_LIVES = 3;
const MAX_DELTA_TIME = 1 / 30; // limite superior de deltaTime en segundos (33ms)

let lives = INITIAL_LIVES;
let status = 'playing'; // 'playing' | 'gameover' | 'victory'

function resetGame() {
  score = 0;
  lives = INITIAL_LIVES;
  status = 'playing';
  resetPaddle();
  resetBall();
  resetBlocks();
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
  ctx.textAlign = 'left';
}

function drawEndScreen( ctx ) {
  if ( status === 'playing' ) return;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect( 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT );

  ctx.textAlign = 'center';
  ctx.fillStyle = 'white';
  ctx.font = '48px monospace';
  ctx.fillText( status === 'gameover' ? 'GAME OVER' : 'VICTORIA', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40 );

  ctx.font = '20px monospace';
  ctx.fillText( 'Pulsa ENTER o click para reiniciar', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10 );
  ctx.textAlign = 'left';
}

( function setupRestartInput() {
  const canvas = document.getElementById( 'gameCanvas' );

  window.addEventListener( 'keydown', ( e ) => {
    if ( e.key === 'Enter' && status !== 'playing' ) resetGame();
  } );

  canvas.addEventListener( 'click', () => {
    if ( status !== 'playing' ) resetGame();
  } );
} )();
