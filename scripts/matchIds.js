/**
 * Mapa de homeTeam__awayTeam → matchId
 * Generado a partir de la misma lógica que constants/matches.ts
 * para que el script de sync pueda encontrar el matchId de cada partido.
 */

const GROUPS = {
  A: ['Estados Unidos', 'Uruguay', 'Panamá', 'Bolivia'],
  B: ['México', 'Ecuador', 'Jamaica', 'Venezuela'],
  C: ['Canadá', 'Marruecos', 'Bélgica', 'Croacia'],
  D: ['Francia', 'Brasil', 'Albania', 'Arabia Saudita'],
  E: ['España', 'Argentina', 'Nigeria', 'Nueva Zelanda'],
  F: ['Inglaterra', 'Portugal', 'Colombia', 'Senegal'],
  G: ['Alemania', 'Países Bajos', 'Costa Rica', 'Australia'],
  H: ['Italia', 'Chile', 'Camerún', 'Uzbekistán'],
  I: ['Turquía', 'Japón', 'Ghana', 'Serbia'],
  J: ['Irán', 'Dinamarca', 'Argelia', 'Honduras'],
  K: ['Suiza', 'Corea del Sur', 'Túnez', 'Escocia'],
  L: ['Polonia', 'Austria', 'Irak', 'Sudáfrica'],
};

const PAIRS = [[0,1],[2,3],[0,2],[1,3],[0,3],[1,2]];

const MATCH_ID_MAP = {}; // "HomeTeam__AwayTeam" → matchId

Object.entries(GROUPS).forEach(([letter, teams]) => {
  PAIRS.forEach(([hi, ai], idx) => {
    const key = `${teams[hi]}__${teams[ai]}`.replace(/\s/g, '_');
    MATCH_ID_MAP[key] = `group-${letter}-${idx + 1}`;
  });
});

module.exports = MATCH_ID_MAP;
