// ball.js — bola: constantes, estado, movimiento, rebotes en paredes/pala y dibujo.

const BALL_RADIUS = 8;
const BALL_SPEED = 300; // px/s, magnitud constante en todos los rebotes
const BALL_INITIAL_X = 400;
const BALL_INITIAL_Y = 552;
const BALL_INITIAL_DX = 150;
const BALL_INITIAL_DY = -260;
const MAX_BOUNCE_ANGLE = 75 * ( Math.PI / 180 ); // respecto a la vertical

const ball = {
  x: BALL_INITIAL_X,
  y: BALL_INITIAL_Y,
  dx: BALL_INITIAL_DX,
  dy: BALL_INITIAL_DY,
  radius: BALL_RADIUS,
};

function resetBall() {
  ball.x = BALL_INITIAL_X;
  ball.y = BALL_INITIAL_Y;
  ball.dx = BALL_INITIAL_DX;
  ball.dy = BALL_INITIAL_DY;
}

function updateBall( deltaTime ) {
  ball.x += ball.dx * deltaTime;
  ball.y += ball.dy * deltaTime;

  // Pared izquierda
  if ( ball.x - ball.radius <= 0 ) {
    ball.dx = -ball.dx;
    ball.x = ball.radius;
  }

  // Pared derecha
  if ( ball.x + ball.radius >= 800 ) {
    ball.dx = -ball.dx;
    ball.x = 800 - ball.radius;
  }

  // Pared superior
  if ( ball.y - ball.radius <= 0 ) {
    ball.dy = -ball.dy;
    ball.y = ball.radius;
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
  }

  // Bola perdida (cae bajo el canvas) — la vida se resta en game.js (Paso 6)
  if ( ball.y - ball.radius > 600 ) {
    resetBall();
    return true;
  }
  return false;
}

function drawBall( ctx ) {
  drawSprite( ctx, 'ball', ball.x - ball.radius, ball.y - ball.radius, ball.radius * 2, ball.radius * 2 );
}
