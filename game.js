// game.js — vidas, HUD y estados de fin (game over / victoria) con reinicio.

const INITIAL_LIVES = 3;

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
  ctx.fillText( `Score: ${ score }`, 10, 20 );
  ctx.fillText( `Vidas: ${ lives }`, 700, 20 );
}

function drawEndScreen( ctx ) {
  if ( status === 'playing' ) return;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect( 0, 0, 800, 600 );

  ctx.textAlign = 'center';
  ctx.fillStyle = 'white';
  ctx.font = '48px monospace';
  ctx.fillText( status === 'gameover' ? 'GAME OVER' : 'VICTORIA', 400, 280 );

  ctx.font = '20px monospace';
  ctx.fillText( 'Pulsa ENTER o click para reiniciar', 400, 330 );
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
