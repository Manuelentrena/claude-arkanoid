// collisions.js — colision bola-bloque, dano progresivo, explosion y score.

const POINTS_BY_DESTRUCTION = 1;
const EXPLOSION_FRAME_DURATION = EXPLOSION_DURATION / 5; // 30ms por frame

let score = 0;

function ballIntersectsBlock( b, block ) {
  const closestX = clamp( b.x, block.x, block.x + block.width );
  const closestY = clamp( b.y, block.y, block.y + block.height );
  const dx = b.x - closestX;
  const dy = b.y - closestY;
  return ( dx * dx + dy * dy ) <= b.radius * b.radius;
}

function resolveBallBlockBounce( block ) {
  const overlapX = ( ball.radius + block.width / 2 ) - Math.abs( ball.x - ( block.x + block.width / 2 ) );
  const overlapY = ( ball.radius + block.height / 2 ) - Math.abs( ball.y - ( block.y + block.height / 2 ) );
  if ( overlapX < overlapY ) {
    ball.dx = -ball.dx;
  } else {
    ball.dy = -ball.dy;
  }
}

function updateCollisions( now ) {
  // Avanza animaciones de destruccion en curso.
  for ( const block of blocks ) {
    if ( !block.alive || !block.exploding ) continue;
    const elapsed = now - block.explosionStartTime;
    if ( elapsed >= EXPLOSION_DURATION ) {
      block.alive = false;
      block.exploding = false;
      score += POINTS_BY_DESTRUCTION;
    } else {
      block.explosionFrame = Math.min( 4, Math.floor( elapsed / EXPLOSION_FRAME_DURATION ) );
    }
  }

  // Detecta un nuevo impacto (uno por frame como maximo).
  for ( const block of blocks ) {
    if ( !block.alive || block.exploding ) continue;
    if ( !ballIntersectsBlock( ball, block ) ) continue;

    resolveBallBlockBounce( block );
    block.hits += 1;

    if ( block.hits >= MAX_HITS ) {
      block.exploding = true;
      block.explosionFrame = 0;
      block.explosionStartTime = now;
    }

    break;
  }
}
