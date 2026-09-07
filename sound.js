// sound.js — capa de audio: efectos, silenciado global y persistencia de la preferencia.

const SOUND_STORAGE_KEY = 'arkanoid.soundEnabled';

const SOUND_DEFS = {
  intro:    { src: 'assets/sounds/intro.mp3',       volume: 0.6, pool: 1 },
  gameover: { src: 'assets/sounds/game-over.mp3',   volume: 0.6, pool: 1 },
  bounce:   { src: 'assets/sounds/ball-bounce.mp3', volume: 0.5, pool: 4 },
  break:    { src: 'assets/sounds/break-sound.mp3', volume: 0.5, pool: 4 },
};

let soundEnabled = true; // se sobrescribe abajo con la preferencia de localStorage

// Un pool de elementos Audio por sonido, recorrido en round-robin: dos disparos
// seguidos del mismo efecto no se cortan entre si.
const soundPools = {};
const soundPoolIndex = {};

( function createSoundPools() {
  for ( const name of Object.keys( SOUND_DEFS ) ) {
    const def = SOUND_DEFS[ name ];
    const pool = [];
    for ( let i = 0; i < def.pool; i++ ) {
      const audio = new Audio( def.src );
      audio.preload = 'auto';
      audio.volume = def.volume;
      pool.push( audio );
    }
    soundPools[ name ] = pool;
    soundPoolIndex[ name ] = 0;
  }
} )();

function readSoundPreference() {
  try {
    const stored = localStorage.getItem( SOUND_STORAGE_KEY );
    if ( stored === null ) return true; // sin preferencia guardada: sonido activado
    return stored === 'true';
  } catch ( e ) {
    return true; // localStorage no disponible (modo privado): valor por defecto
  }
}

function saveSoundPreference() {
  try {
    localStorage.setItem( SOUND_STORAGE_KEY, String( soundEnabled ) );
  } catch ( e ) {
    // localStorage no disponible: la preferencia vive solo en memoria.
  }
}

soundEnabled = readSoundPreference();

function isSoundEnabled() {
  return soundEnabled;
}

function playSound( name ) {
  if ( !soundEnabled ) return;

  const pool = soundPools[ name ];
  if ( !pool ) return;

  const audio = pool[ soundPoolIndex[ name ] ];
  soundPoolIndex[ name ] = ( soundPoolIndex[ name ] + 1 ) % pool.length;

  audio.currentTime = 0;
  const played = audio.play();
  // Un mp3 que falle o un bloqueo de autoplay nunca debe romper el loop de juego.
  if ( played ) played.catch( () => {} );
}

function stopSound( name ) {
  const pool = soundPools[ name ];
  if ( !pool ) return;

  for ( const audio of pool ) {
    audio.pause();
    audio.currentTime = 0;
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  if ( !soundEnabled ) {
    // Corta los clips largos que puedan estar sonando.
    stopSound( 'intro' );
    stopSound( 'gameover' );
  }
  saveSoundPreference();
  return soundEnabled;
}
