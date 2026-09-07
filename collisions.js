// collisions.js — colision bola-bloque, dano progresivo, explosion y score.

const POINTS_BY_DESTRUCTION = 1;
const EXPLOSION_FRAME_DURATION = EXPLOSION_DURATION / 5; // 30ms por frame
const FINAL_DAMAGE_DURATION = 80; // ms que HIT_FRAMES[color][4] permanece visible antes de la explosion

let score = 0;

function ballIntersectsBlock( b, block ) {
  const closestX = clamp( b.x, block.x, block.x + block.width );
  const closestY = clamp( b.y, block.y, block.y + block.height );
  const dx = b.x - closestX;
  const dy = b.y - closestY;
  return ( dx * dx + dy * dy ) <= b.radius * b.radius;
}

function resolveBallBlockBounce( block ) {
  const eXMin = block.x - ball.radius;
  const eXMax = block.x + block.width + ball.radius;
  const eYMin = block.y - ball.radius;
  const eYMax = block.y + block.height + ball.radius;

  const wasOutsideX = ball.prevX < eXMin || ball.prevX > eXMax;
  const wasOutsideY = ball.prevY < eYMin || ball.prevY > eYMax;

  let invertX = wasOutsideX;
  let invertY = wasOutsideY;

  if ( !wasOutsideX && !wasOutsideY ) {
    // Fallback: la bola ya estaba dentro (solo alcanzable con deltaTime extremo).
    const overlapX = ( ball.radius + block.width / 2 ) - Math.abs( ball.x - ( block.x + block.width / 2 ) );
    const overlapY = ( ball.radius + block.height / 2 ) - Math.abs( ball.y - ( block.y + block.height / 2 ) );
    invertX = overlapX < overlapY;
    invertY = !invertX;
  }

  if ( invertX ) ball.dx = -ball.dx;
  if ( invertY ) ball.dy = -ball.dy;

  if ( invertX ) ball.x = ball.dx > 0 ? eXMax : eXMin;
  if ( invertY ) ball.y = ball.dy > 0 ? eYMax : eYMin;
}

function updateCollisions( now ) {
  // Limpia el flag de contacto de bloques que la bola ya no solapa.
  for ( const block of blocks ) {
    if ( block.inContact && !ballIntersectsBlock( ball, block ) ) {
      block.inContact = false;
    }
  }

  // Avanza animaciones de destruccion y dano final en curso.
  for ( const block of blocks ) {
    if ( !block.alive ) continue;

    if ( block.exploding ) {
      const elapsed = now - block.explosionStartTime;
      if ( elapsed >= EXPLOSION_DURATION ) {
        block.alive = false;
        block.exploding = false;
        score += POINTS_BY_DESTRUCTION;
      } else {
        block.explosionFrame = Math.min( 4, Math.floor( elapsed / EXPLOSION_FRAME_DURATION ) );
      }
      continue;
    }

    if ( block.finalDamage ) {
      const elapsed = now - block.finalDamageStartTime;
      if ( elapsed >= FINAL_DAMAGE_DURATION ) {
        block.finalDamage = false;
        block.exploding = true;
        block.explosionFrame = 0;
        block.explosionStartTime = now;
      }
    }
  }

  // Detecta el bloque impactado (uno por frame como maximo): el de mayor penetracion.
  let impactedBlock = null;
  let maxPenetration = -Infinity;

  for ( const block of blocks ) {
    if ( !block.alive || block.exploding ) continue;
    if ( !ballIntersectsBlock( ball, block ) ) continue;

    const eXMin = block.x - ball.radius;
    const eXMax = block.x + block.width + ball.radius;
    const eYMin = block.y - ball.radius;
    const eYMax = block.y + block.height + ball.radius;
    const overlapX = Math.min( ball.x - eXMin, eXMax - ball.x );
    const overlapY = Math.min( ball.y - eYMin, eYMax - ball.y );
    const penetration = Math.min( overlapX, overlapY );

    if ( penetration > maxPenetration ) {
      maxPenetration = penetration;
      impactedBlock = block;
    }
  }

  if ( impactedBlock ) {
    resolveBallBlockBounce( impactedBlock );

    if ( !impactedBlock.inContact && !impactedBlock.finalDamage ) {
      impactedBlock.hits += 1;
      impactedBlock.inContact = true;

      if ( impactedBlock.hits >= MAX_HITS ) {
        impactedBlock.finalDamage = true;
        impactedBlock.finalDamageStartTime = now;
      }
    }
  }
}
