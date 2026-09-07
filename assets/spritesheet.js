/**
 * Equivalencia entre las claves internas de este archivo y el color VISUAL real
 * de cada fila del spritesheet (confirmado por muestreo de píxeles). Las claves
 * quedan como están para no romper referencias existentes, pero el color que
 * el usuario ve en pantalla es el de la columna derecha:
 *
 *   clave interna   ->  color visual   (sy)
 *   'red'           ->  red            (176)
 *   'cyan'          ->  green          (192)
 *   'green'         ->  light blue     (208)
 *   'magenta'       ->  purple         (224)
 *   'yellow'        ->  yellow         (240)
 *   'hotpink'       ->  orange         (256)
 *   'gray'          ->  gray (piedra)  (288)  -- no forma parte del layout jugable de 6 filas
 *
 * Cada fila de color tiene 11 frames de 32x16px con contenido, de sx:32 a sx:352:
 *   sx:32                      -> frame de reposo (0 golpes)      -> SPRITES.blocks[color]
 *   sx:64,96,128,160,192       -> 5 frames de daño (golpes 1 a 5) -> HIT_FRAMES[color]
 *   sx:224,256,288,320,352     -> 5 frames de destrucción         -> EXPLOSION_FRAMES[color]
 */

const MAX_HITS = 5;

const HIT_FRAMES = {
  red:     [ { sx: 64, sy: 176, sw: 32, sh: 16 }, { sx: 96, sy: 176, sw: 32, sh: 16 }, { sx: 128, sy: 176, sw: 32, sh: 16 }, { sx: 160, sy: 176, sw: 32, sh: 16 }, { sx: 192, sy: 176, sw: 32, sh: 16 } ],
  cyan:    [ { sx: 64, sy: 192, sw: 32, sh: 16 }, { sx: 96, sy: 192, sw: 32, sh: 16 }, { sx: 128, sy: 192, sw: 32, sh: 16 }, { sx: 160, sy: 192, sw: 32, sh: 16 }, { sx: 192, sy: 192, sw: 32, sh: 16 } ],
  green:   [ { sx: 64, sy: 208, sw: 32, sh: 16 }, { sx: 96, sy: 208, sw: 32, sh: 16 }, { sx: 128, sy: 208, sw: 32, sh: 16 }, { sx: 160, sy: 208, sw: 32, sh: 16 }, { sx: 192, sy: 208, sw: 32, sh: 16 } ],
  magenta: [ { sx: 64, sy: 224, sw: 32, sh: 16 }, { sx: 96, sy: 224, sw: 32, sh: 16 }, { sx: 128, sy: 224, sw: 32, sh: 16 }, { sx: 160, sy: 224, sw: 32, sh: 16 }, { sx: 192, sy: 224, sw: 32, sh: 16 } ],
  yellow:  [ { sx: 64, sy: 240, sw: 32, sh: 16 }, { sx: 96, sy: 240, sw: 32, sh: 16 }, { sx: 128, sy: 240, sw: 32, sh: 16 }, { sx: 160, sy: 240, sw: 32, sh: 16 }, { sx: 192, sy: 240, sw: 32, sh: 16 } ],
  hotpink: [ { sx: 64, sy: 256, sw: 32, sh: 16 }, { sx: 96, sy: 256, sw: 32, sh: 16 }, { sx: 128, sy: 256, sw: 32, sh: 16 }, { sx: 160, sy: 256, sw: 32, sh: 16 }, { sx: 192, sy: 256, sw: 32, sh: 16 } ],
  gray:    [ { sx: 64, sy: 288, sw: 32, sh: 16 }, { sx: 96, sy: 288, sw: 32, sh: 16 }, { sx: 128, sy: 288, sw: 32, sh: 16 }, { sx: 160, sy: 288, sw: 32, sh: 16 }, { sx: 192, sy: 288, sw: 32, sh: 16 } ],
};

const EXPLOSION_FRAMES = {
  red:     [ { sx: 224, sy: 176, sw: 32, sh: 16 }, { sx: 256, sy: 176, sw: 32, sh: 16 }, { sx: 288, sy: 176, sw: 32, sh: 16 }, { sx: 320, sy: 176, sw: 32, sh: 16 }, { sx: 352, sy: 176, sw: 32, sh: 16 } ],
  cyan:    [ { sx: 224, sy: 192, sw: 32, sh: 16 }, { sx: 256, sy: 192, sw: 32, sh: 16 }, { sx: 288, sy: 192, sw: 32, sh: 16 }, { sx: 320, sy: 192, sw: 32, sh: 16 }, { sx: 352, sy: 192, sw: 32, sh: 16 } ],
  green:   [ { sx: 224, sy: 208, sw: 32, sh: 16 }, { sx: 256, sy: 208, sw: 32, sh: 16 }, { sx: 288, sy: 208, sw: 32, sh: 16 }, { sx: 320, sy: 208, sw: 32, sh: 16 }, { sx: 352, sy: 208, sw: 32, sh: 16 } ],
  magenta: [ { sx: 224, sy: 224, sw: 32, sh: 16 }, { sx: 256, sy: 224, sw: 32, sh: 16 }, { sx: 288, sy: 224, sw: 32, sh: 16 }, { sx: 320, sy: 224, sw: 32, sh: 16 }, { sx: 352, sy: 224, sw: 32, sh: 16 } ],
  yellow:  [ { sx: 224, sy: 240, sw: 32, sh: 16 }, { sx: 256, sy: 240, sw: 32, sh: 16 }, { sx: 288, sy: 240, sw: 32, sh: 16 }, { sx: 320, sy: 240, sw: 32, sh: 16 }, { sx: 352, sy: 240, sw: 32, sh: 16 } ],
  hotpink: [ { sx: 224, sy: 256, sw: 32, sh: 16 }, { sx: 256, sy: 256, sw: 32, sh: 16 }, { sx: 288, sy: 256, sw: 32, sh: 16 }, { sx: 320, sy: 256, sw: 32, sh: 16 }, { sx: 352, sy: 256, sw: 32, sh: 16 } ],
  // NOTA: antes 'gray' reusaba por error los frames de 'red' (sy:176). Se corrigió para
  // usar su propia fila (sy:288), ya que 'gray' no es parte de las 6 filas jugables pero
  // conviene que sea consistente si se llega a usar.
  gray:    [ { sx: 224, sy: 288, sw: 32, sh: 16 }, { sx: 256, sy: 288, sw: 32, sh: 16 }, { sx: 288, sy: 288, sw: 32, sh: 16 }, { sx: 320, sy: 288, sw: 32, sh: 16 }, { sx: 352, sy: 288, sw: 32, sh: 16 } ],
};

const EXPLOSION_DURATION = 150; // ms totales para reproducir los 5 EXPLOSION_FRAMES

const SPRITES = {
  paddle: { sx: 112, sy: 80, sw: 48, sh: 12 },
  ball: { sx: 32, sy: 32, sw: 16, sh: 16 },
  blocks: {
    gray: { sx: 32, sy: 288, sw: 32, sh: 16 },
    red: { sx: 32, sy: 176, sw: 32, sh: 16 },
    yellow: { sx: 32, sy: 240, sw: 32, sh: 16 },
    cyan: { sx: 32, sy: 192, sw: 32, sh: 16 },
    magenta: { sx: 32, sy: 224, sw: 32, sh: 16 },
    hotpink: { sx: 32, sy: 256, sw: 32, sh: 16 },
    green: { sx: 32, sy: 208, sw: 32, sh: 16 },
  }
};

let ssImg = null;
let ssLoaded = false;
const ssCallbacks = [];

function loadSpritesheet( cb ) {
  if ( ssLoaded ) { cb(); return; }
  ssCallbacks.push( cb );
  if ( ssImg ) return;

  const rawImg = new Image();
  rawImg.onload = () => {
    const oc = document.createElement( 'canvas' );
    oc.width = rawImg.width;
    oc.height = rawImg.height;
    const octx = oc.getContext( '2d' );
    octx.drawImage( rawImg, 0, 0 );
    ssImg = oc;
    ssLoaded = true;
    ssCallbacks.forEach( f => f() );
  };
  rawImg.onerror = () => console.error( 'Failed to load spritesheet' );
  rawImg.src = 'assets/spritesheet-breakout.png';
}

function drawFrame( ctx, frame, x, y, w, h ) {
  if ( !ssLoaded ) return;
  ctx.drawImage( ssImg, frame.sx, frame.sy, frame.sw, frame.sh, x, y, w, h );
}

function drawSprite( ctx, name, x, y, w, h ) {
  if ( !ssLoaded ) return;
  let sp;
  if ( name.startsWith( 'block_' ) ) {
    sp = SPRITES.blocks[ name.slice( 6 ) ];
  } else {
    sp = SPRITES[ name ];
  }
  if ( !sp ) return;
  ctx.drawImage( ssImg, sp.sx, sp.sy, sp.sw, sp.sh, x, y, w, h );
}

/**
 * Devuelve el frame visual que corresponde a un bloque según los golpes que lleva.
 * hits = 0            -> sprite de reposo (SPRITES.blocks[color])
 * hits = 1..MAX_HITS   -> HIT_FRAMES[color][hits - 1]
 * hits > MAX_HITS      -> null (el bloque ya debería estar en animación de destrucción,
 *                         ver EXPLOSION_FRAMES / EXPLOSION_DURATION)
 */
function getBlockHitFrame( color, hits ) {
  if ( hits <= 0 ) return SPRITES.blocks[ color ];
  if ( hits <= MAX_HITS ) return HIT_FRAMES[ color ][ hits - 1 ];
  return null;
}