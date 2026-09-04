// main.js — loop principal: orquesta update/render de todas las piezas
// via game.js en el orden fondo, bloques, pala, bola, HUD, pantalla de fin.
(function () {
  const canvas = document.getElementById( 'gameCanvas' );
  const ctx = canvas.getContext( '2d' );
  let lastTime = null;

  function loop( now ) {
    if ( lastTime === null ) lastTime = now;
    const deltaTime = ( now - lastTime ) / 1000;
    lastTime = now;

    updateGame( deltaTime, now );

    ctx.clearRect( 0, 0, canvas.width, canvas.height );
    drawBlocks( ctx );
    drawPaddle( ctx );
    drawBall( ctx );
    drawHUD( ctx );
    drawEndScreen( ctx );

    requestAnimationFrame( loop );
  }

  loadSpritesheet( () => {
    requestAnimationFrame( loop );
  } );
})();
