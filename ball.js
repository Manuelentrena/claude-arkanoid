// ball.js — bola: constantes, estado, movimiento, rebotes en paredes/pala y dibujo.

const BALL_RADIUS = 8;
const BALL_SPEED = 300; // px/s, magnitud constante en todos los rebotes
const BALL_INITIAL_X = 288;
const BALL_INITIAL_Y = 592;
const BALL_INITIAL_DX = 150;
const BALL_INITIAL_DY = -260;
const MAX_BOUNCE_ANGLE = 75 * ( Math.PI / 180 ); // respecto a la vertical

const ball = {
  x: BALL_INITIAL_X,
  y: BALL_INITIAL_Y,
  dx: BALL_INITIAL_DX,
  dy: BALL_INITIAL_DY,
  radius: BALL_RADIUS,
  prevX: BALL_INITIAL_X,
  prevY: BALL_INITIAL_Y,
};

function resetBall() {
  ball.x = BALL_INITIAL_X;
  ball.y = BALL_INITIAL_Y;
  ball.dx = BALL_INITIAL_DX;
  ball.dy = BALL_INITIAL_DY;
  ball.prevX = BALL_INITIAL_X;
  ball.prevY = BALL_INITIAL_Y;
}

function updateBall( deltaTime ) {
  ball.prevX = ball.x;
  ball.prevY = ball.y;
  ball.x += ball.dx * deltaTime;
  ball.y += ball.dy * deltaTime;

  // Pared izquierda (cara interior del marco gris)
  if ( ball.x - ball.radius <= BORDER_THICKNESS ) {
    ball.dx = -ball.dx;
    ball.x = BORDER_THICKNESS + ball.radius;
  }

  // Pared derecha (cara interior del marco gris)
  if ( ball.x + ball.radius >= CANVAS_WIDTH - BORDER_THICKNESS ) {
    ball.dx = -ball.dx;
    ball.x = CANVAS_WIDTH - BORDER_THICKNESS - ball.radius;
  }

  // Pared superior (cara interior del marco gris)
  if ( ball.y - ball.radius <= PLAY_AREA_TOP + BORDER_THICKNESS ) {
    ball.dy = -ball.dy;
    ball.y = PLAY_AREA_TOP + BORDER_THICKNESS + ball.radius;
  }

  // Rebote en la pala
  if (
    ball.y + ball.radius >= PADDLE_Y &&
    ball.y + ball.radius <= PADDLE_Y + PADDLE_HEIGHT &&
    ball.x >= paddle.x - ball.radius &&
    ball.x <= paddle.x + PADDLE_WIDTH + ball.radius
  ) {
    const hitOffset = clamp(
      ( ball.x - ( paddle.x + PADDLE_WIDTH / 2 ) ) / ( PADDLE_WIDTH / 2 ),
      -1,
      1
    );
    const angle = hitOffset * MAX_BOUNCE_ANGLE;
    ball.dx = BALL_SPEED * Math.sin( angle );
    ball.dy = -BALL_SPEED * Math.cos( angle );
    ball.y = PADDLE_Y - ball.radius;
    playSound( 'bounce' );
  }

  // Bola perdida (cae bajo el canvas, marco inferior no existe) — la vida se resta en game.js
  if ( ball.y - ball.radius > CANVAS_HEIGHT ) {
    resetBall();
    return true;
  }
  return false;
}

function drawBall( ctx ) {
  drawSprite( ctx, 'ball', ball.x - ball.radius, ball.y - ball.radius, ball.radius * 2, ball.radius * 2 );
}
