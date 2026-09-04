// blocks.js — layout fijo de bloques: grid 6 filas x 8 columnas, un color por fila.

const BLOCK_WIDTH = 32;
const BLOCK_HEIGHT = 16;
const BLOCK_ROWS = 6;
const BLOCK_COLS = 8;
const BLOCK_GAP = 4;
const BLOCK_GRID_WIDTH = BLOCK_COLS * BLOCK_WIDTH + ( BLOCK_COLS - 1 ) * BLOCK_GAP; // 284
const BLOCK_GRID_START_X = ( 800 - BLOCK_GRID_WIDTH ) / 2; // 258
const BLOCK_GRID_START_Y = 60;

// Orden de filas (superior a inferior) segun la tabla de colores del spec.
const BLOCK_ROW_COLORS = [ 'hotpink', 'yellow', 'magenta', 'green', 'cyan', 'red' ];

let blocks = [];

function createBlocks() {
  const result = [];
  for ( let row = 0; row < BLOCK_ROWS; row++ ) {
    const color = BLOCK_ROW_COLORS[ row ];
    for ( let col = 0; col < BLOCK_COLS; col++ ) {
      result.push( {
        x: BLOCK_GRID_START_X + col * ( BLOCK_WIDTH + BLOCK_GAP ),
        y: BLOCK_GRID_START_Y + row * ( BLOCK_HEIGHT + BLOCK_GAP ),
        width: BLOCK_WIDTH,
        height: BLOCK_HEIGHT,
        color: color,
        hits: 0,
        alive: true,
        exploding: false,
        explosionFrame: 0,
        explosionStartTime: 0,
      } );
    }
  }
  return result;
}

function resetBlocks() {
  blocks = createBlocks();
}

resetBlocks();

function drawBlocks( ctx ) {
  for ( const block of blocks ) {
    if ( !block.alive ) continue;
    if ( block.exploding ) {
      drawFrame( ctx, EXPLOSION_FRAMES[ block.color ][ block.explosionFrame ], block.x, block.y, block.width, block.height );
    } else {
      drawFrame( ctx, getBlockHitFrame( block.color, block.hits ), block.x, block.y, block.width, block.height );
    }
  }
}
