// paddle.js — pala: constantes, estado, input (teclado + mouse) y dibujo.

const PADDLE_WIDTH = 48;
const PADDLE_HEIGHT = 12;
const PADDLE_Y = 600;
const PADDLE_MIN_X = 24; // = BORDER_THICKNESS
const PADDLE_MAX_X = 576 - 24 - PADDLE_WIDTH; // 504
const PADDLE_INITIAL_X = ( 576 - PADDLE_WIDTH ) / 2; // 264
const PADDLE_SPEED = 480; // px/s

const paddle = {
  x: PADDLE_INITIAL_X,
  y: PADDLE_Y,
  width: PADDLE_WIDTH,
  height: PADDLE_HEIGHT,
  speed: PADDLE_SPEED,
};

let paddleLeftHeld = false;
let paddleRightHeld = false;

function clamp( value, min, max ) {
  return Math.min( Math.max( value, min ), max );
}

function resetPaddle() {
  paddle.x = PADDLE_INITIAL_X;
}

function updatePaddle( deltaTime ) {
  const direction = ( paddleRightHeld ? 1 : 0 ) - ( paddleLeftHeld ? 1 : 0 );
  if ( direction !== 0 ) {
    paddle.x = clamp( paddle.x + direction * PADDLE_SPEED * deltaTime, PADDLE_MIN_X, PADDLE_MAX_X );
  }
}

function drawPaddle( ctx ) {
  drawSprite( ctx, 'paddle', paddle.x, paddle.y, paddle.width, paddle.height );
}

( function setupPaddleInput() {
  const canvas = document.getElementById( 'gameCanvas' );

  window.addEventListener( 'keydown', ( e ) => {
    if ( e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' ) paddleLeftHeld = true;
    if ( e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' ) paddleRightHeld = true;
  } );

  window.addEventListener( 'keyup', ( e ) => {
    if ( e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' ) paddleLeftHeld = false;
    if ( e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' ) paddleRightHeld = false;
  } );

  canvas.addEventListener( 'mousemove', ( e ) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    paddle.x = clamp( mouseX - PADDLE_WIDTH / 2, PADDLE_MIN_X, PADDLE_MAX_X );
  } );
} )();
