// border.js — marco de bloques grises irrompibles: limite solido del area jugable
// en los lados superior, izquierdo y derecho (el inferior queda sin marco a proposito).

const BORDER_TILE_WIDTH = 48; // igual a BLOCK_WIDTH
const BORDER_TILE_HEIGHT = 24; // igual a BLOCK_HEIGHT
const BORDER_THICKNESS = 24; // grosor del marco en los 3 lados con borde

function drawBorderSideTile( ctx, x, y, tileWidth, tileHeight ) {
  // Tile del lado izq/der: mismo sprite gris rotado 90°. tileWidth es el grosor
  // del marco (eje X), tileHeight el alto del tile en pantalla (eje Y).
  ctx.save();
  ctx.translate( x + tileWidth / 2, y + tileHeight / 2 );
  ctx.rotate( Math.PI / 2 );
  drawFrame( ctx, SPRITES.blocks.gray, -tileHeight / 2, -tileWidth / 2, tileHeight, tileWidth );
  ctx.restore();
}

function drawBorder( ctx ) {
  const topY = PLAY_AREA_TOP; // 40
  const playAreaBottom = CANVAS_HEIGHT; // 640

  // Marco superior: ancho completo, tileado horizontal.
  const topTiles = CANVAS_WIDTH / BORDER_TILE_WIDTH; // 12
  for ( let i = 0; i < topTiles; i++ ) {
    drawFrame( ctx, SPRITES.blocks.gray, i * BORDER_TILE_WIDTH, topY, BORDER_TILE_WIDTH, BORDER_TILE_HEIGHT );
  }

  // Marco izquierdo y derecho: tileado vertical rotado 90°, desde el borde
  // superior del area jugable hasta el fondo del canvas (sin marco inferior).
  let y = topY;
  while ( y < playAreaBottom ) {
    const tileHeight = Math.min( BORDER_TILE_WIDTH, playAreaBottom - y ); // 48 o resto final (24)
    drawBorderSideTile( ctx, 0, y, BORDER_THICKNESS, tileHeight );
    drawBorderSideTile( ctx, CANVAS_WIDTH - BORDER_THICKNESS, y, BORDER_THICKNESS, tileHeight );
    y += tileHeight;
  }
}
