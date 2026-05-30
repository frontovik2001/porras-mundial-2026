const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, PageBreak,
  LevelFormat,
} = require('docx');
const fs = require('fs');

const BLUE = '1D4ED8';
const NAVY = '0B1F2E';
const GREY = '555555';
const LIGHT = 'EEF1F8';

// US Letter content width with 0.85" margins (~1224 DXA each side)
const CONTENT_W = 12240 - 2448; // 9792

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 140 },
    children: [new TextRun({ text, bold: true, color: BLUE, size: 32 })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 260, after: 100 },
    children: [new TextRun({ text, bold: true, color: NAVY, size: 26 })],
  });
}
function p(runs, opts = {}) {
  const children = Array.isArray(runs) ? runs : [new TextRun({ text: runs, size: 22 })];
  return new Paragraph({ spacing: { after: 120, line: 276 }, ...opts, children });
}
function bullet(runs) {
  const children = Array.isArray(runs) ? runs : [new TextRun({ text: runs, size: 22 })];
  return new Paragraph({ numbering: { reference: 'b', level: 0 }, spacing: { after: 80, line: 270 }, children });
}
function t(text, o = {}) { return new TextRun({ text, size: 22, ...o }); }
function b(text, o = {}) { return new TextRun({ text, bold: true, size: 22, ...o }); }
function code(text) { return new TextRun({ text, font: 'Consolas', size: 20, color: BLUE }); }
function spacer() { return new Paragraph({ spacing: { after: 80 }, children: [t('')] }); }
function pageBreak() { return new Paragraph({ children: [new PageBreak()] }); }

function callout(title, lines) {
  const kids = [new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: title, bold: true, size: 22, color: NAVY })] })];
  for (const ln of lines) kids.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: ln, size: 21 })] }));
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [CONTENT_W],
    borders: { top:{style:BorderStyle.SINGLE,size:6,color:BLUE}, bottom:{style:BorderStyle.SINGLE,size:6,color:BLUE}, left:{style:BorderStyle.SINGLE,size:18,color:BLUE}, right:{style:BorderStyle.SINGLE,size:6,color:BLUE}, insideHorizontal:{style:BorderStyle.NONE}, insideVertical:{style:BorderStyle.NONE} },
    rows: [ new TableRow({ children: [ new TableCell({ width:{size:CONTENT_W,type:WidthType.DXA}, shading:{type:ShadingType.CLEAR,fill:LIGHT}, margins:{top:120,bottom:120,left:160,right:160}, children: kids }) ] }) ],
  });
}

function refTable(header, rows, widths) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: header.map((htext, i) => new TableCell({
      width: { size: widths[i], type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: BLUE },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: htext, bold: true, color: 'FFFFFF', size: 21 })] })],
    })),
  });
  const bodyRows = rows.map((r, ri) => new TableRow({
    children: r.map((cell, ci) => new TableCell({
      width: { size: widths[ci], type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: ri % 2 ? 'F4F6FB' : 'FFFFFF' },
      margins: { top: 70, bottom: 70, left: 120, right: 120 },
      children: [new Paragraph({ children: parseCell(cell) })],
    })),
  }));
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: widths,
    borders: { top:{style:BorderStyle.SINGLE,size:2,color:'CCCCCC'}, bottom:{style:BorderStyle.SINGLE,size:2,color:'CCCCCC'}, left:{style:BorderStyle.SINGLE,size:2,color:'CCCCCC'}, right:{style:BorderStyle.SINGLE,size:2,color:'CCCCCC'}, insideHorizontal:{style:BorderStyle.SINGLE,size:2,color:'DDDDDD'}, insideVertical:{style:BorderStyle.SINGLE,size:2,color:'DDDDDD'} },
    rows: [headerRow, ...bodyRows],
  });
}
function parseCell(cell) {
  const parts = cell.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map(seg => seg.startsWith('**')
    ? new TextRun({ text: seg.slice(2, -2), bold: true, size: 21 })
    : new TextRun({ text: seg, size: 21 }));
}

const children = [];

// Cover
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1400, after: 100 }, children: [new TextRun({ text: 'Porras Mundial 2026', bold: true, size: 56, color: BLUE })] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: 'Guia de lo que hemos construido y configurado', size: 28, color: NAVY })] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: 'Explicado desde cero, para entenderlo en el futuro', italics: true, size: 22, color: GREY })] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 220 }, children: [new TextRun({ text: 'Mayo 2026 - Luis Pena', size: 20, color: GREY })] }));
children.push(pageBreak());

// 1
children.push(h1('1. Que es esta app'));
children.push(p([
  b('Porras Mundial 2026'), t(' es una aplicacion movil donde un grupo de amigos predice los resultados de los 104 partidos del Mundial de futbol 2026 (fase de grupos + eliminatoria) y compite por puntos.'),
]));
children.push(p('Sistema de puntos: 5 puntos por acertar el resultado exacto, 2 puntos por acertar quien gana (o empate) sin el marcador exacto, 0 si fallas.'));
children.push(p([
  t('La app esta construida con '), b('Expo / React Native'), t(' (un mismo codigo funciona en Android y iPhone), usa '),
  b('Firebase'), t(' como base de datos y sistema de cuentas, y los resultados de los partidos se actualizan solos desde una API gratuita de futbol.'),
]));

// 2
children.push(h1('2. Las plataformas que usamos (y por que)'));
children.push(p('Una app moderna no vive en un solo sitio. Cada pieza tiene un trabajo concreto. Este es el mapa completo:'));
children.push(spacer());
children.push(refTable(
  ['Plataforma', 'Para que la usamos', 'Por que la necesitabamos'],
  [
    ['**Node.js**', 'Motor que ejecuta JavaScript en tu ordenador.', 'Sin el no se puede arrancar el proyecto ni instalar nada. Es el cimiento de todo.'],
    ['**Expo**', 'Framework sobre React Native. Arranca, compila y empaqueta la app.', 'Crear la app sin instalar Android Studio ni mil configuraciones. Expo se encarga de lo dificil.'],
    ['**Expo Go**', 'App en tu movil para ver la app en desarrollo al instante.', 'Probar cambios en tiempo real sin compilar. Escaneas un QR y ves la app.'],
    ['**Firebase**', 'Servicios de Google: base de datos (Firestore) + cuentas (Authentication).', 'Guarda predicciones, grupos y usuarios sin montar y mantener un servidor propio.'],
    ['**GitHub**', 'Copia del codigo en la nube con historial de cambios.', 'Copia de seguridad + permite que el robot de resultados se ejecute.'],
    ['**GitHub Actions**', 'Robot que ejecuta codigo en la nube segun un horario.', 'Cada 10 min consulta los resultados y los guarda. Gratis en repos publicos.'],
    ['**football-data.org**', 'API publica con resultados de futbol.', 'Fuente gratuita de los marcadores reales del Mundial.'],
    ['**EAS**', 'Servicio de Expo que compila la app en la nube.', 'Convierte el codigo en un .aab/.apk real sin necesitar un Mac.'],
    ['**Google Play Console**', 'Panel de Google para publicar apps.', 'El unico sitio desde el que se distribuye una app Android al publico.'],
    ['**Google Cloud Console**', 'Panel donde se configuran las credenciales del login con Google.', 'Para que el boton "Continuar con Google" funcione y sea seguro.'],
  ],
  [1900, 3900, 3992]
));

// 3
children.push(pageBreak());
children.push(h1('3. Conceptos clave explicados'));
children.push(h2('Repositorio (repo) en GitHub'));
children.push(p('Una carpeta de tu proyecto guardada en la nube, con historial. Cada vez que subes (push), GitHub guarda una version. Si rompes algo, puedes volver atras. El tuyo es publico, lo que permite que GitHub Actions sea gratis ilimitado.'));
children.push(h2('Firestore (la base de datos)'));
children.push(p('Donde se guardan los datos vivos de la app, en "colecciones":'));
children.push(bullet([b('users'), t(' - los usuarios registrados (nombre, email).')]));
children.push(bullet([b('groups'), t(' - los grupos privados y sus miembros.')]));
children.push(bullet([b('predictions'), t(' - las predicciones de cada usuario.')]));
children.push(bullet([b('matchResults'), t(' - los resultados de los partidos (los escribe el robot o tu desde el panel admin).')]));
children.push(p([t('Las '), b('reglas de seguridad'), t(' deciden quien puede leer y escribir cada cosa: solo tu (admin) escribes resultados; cada usuario solo edita sus predicciones.')]));
children.push(h2('Autenticacion (Authentication)'));
children.push(p('El sistema de cuentas. Se entra con email+contrasena o con Google. Firebase gestiona todo (guardar contrasenas de forma segura, mantener la sesion, etc.).'));
children.push(h2('API'));
children.push(p('Una forma de que dos programas se hablen. Nuestro robot le pregunta a football-data.org por los resultados y ella responde. Usamos un token (una contrasena) para identificarnos.'));
children.push(h2('Variable de entorno (.env)'));
children.push(p([t('Datos de configuracion que no van escritos en el codigo, como las claves de Firebase. Viven en un archivo '), code('.env.local'), t(' que NO se sube a GitHub. En EAS y GitHub se guardan como "secrets" cifrados.')]));

// 4 SHA
children.push(pageBreak());
children.push(h1('4. Que es un SHA-1 (y por que dimos tres)'));
children.push(p([
  t('Un '), b('SHA-1'), t(' (o huella digital / fingerprint) es un codigo unico que identifica la '),
  b('firma'), t(' de tu app. Cada app Android va firmada con una clave secreta; el SHA-1 es como la huella dactilar de esa clave. Sirve para demostrar que una app es autentica y no una copia falsa.'),
]));
children.push(p([
  b('Por que importa para el login de Google: '),
  t('cuando alguien pulsa "Continuar con Google", Google comprueba que la app que lo pide tiene una firma autorizada. Si el SHA-1 no esta registrado en Google Cloud, Google rechaza el login. Por eso hubo que registrar cada firma.'),
]));
children.push(spacer());
children.push(p([b('Tuvimos TRES SHA-1 porque la app se firma distinto en cada contexto:')]));
children.push(spacer());
children.push(refTable(
  ['Firma (SHA-1)', 'Cuando se usa', 'Por que'],
  [
    ['**Debug keystore**', 'Desarrollo con Expo Go.', 'Firma de pruebas que genera tu PC automaticamente.'],
    ['**EAS upload key**', 'El .aab que generaste y subiste.', 'EAS firma con su propia clave al compilar en la nube.'],
    ['**Google Play App Signing**', 'La app final que descargan los usuarios.', 'Google RE-FIRMA tu app con su clave antes de distribuirla (obligatorio). Esta es la firma real que ven los usuarios.'],
  ],
  [2600, 3200, 3992]
));
children.push(spacer());
children.push(callout('La trampa habitual', [
  'Mucha gente registra solo el SHA-1 de subida y el login de Google le falla en produccion.',
  'El que de verdad cuenta es el de "Play App Signing", que solo aparece DESPUES de subir el primer .aab.',
  'Por eso registramos los tres: pruebas, subida y produccion.',
]));

// 5
children.push(pageBreak());
children.push(h1('5. Como se actualizan los resultados solos'));
children.push(p('Una de las partes mas potentes, y 100% gratuita. El flujo es:'));
children.push(spacer());
children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [code('football-data.org  ->  GitHub Actions  ->  Firestore  ->  App')] }));
children.push(spacer());
children.push(bullet([b('1. '), t('Cada 10 minutos, un robot (GitHub Action) se despierta solo.')]));
children.push(bullet([b('2. '), t('Le pregunta a football-data.org por los resultados.')]));
children.push(bullet([b('3. '), t('Guarda esos resultados en Firestore (coleccion matchResults).')]));
children.push(bullet([b('4. '), t('La app escucha Firestore en tiempo real: al cambiar un dato, la pantalla se actualiza sola y recalcula los puntos.')]));
children.push(p([b('Plan B manual: '), t('si la API fallara, tienes un Panel de Administrador (solo visible para ti) para meter resultados a mano. Escribe en el mismo sitio, asi que la app no nota la diferencia.')]));
children.push(h2('El cuadro de eliminatoria se calcula solo'));
children.push(p('No hace falta meter a mano quien juega en octavos, cuartos, etc. La app calcula las clasificaciones de cada grupo, aplica las reglas oficiales de la FIFA (que primero juega contra que segundo o tercero) y rellena los cruces automaticamente. Lo unico manual es indicar quien pasa cuando un partido de eliminatoria acaba en empate (penaltis), porque eso no se deduce del marcador.'));

// 6
children.push(pageBreak());
children.push(h1('6. Publicar en Google Play: el proceso'));
children.push(p('Los pasos para llevar la app a la Play Store:'));
children.push(bullet([b('Generar el .aab: '), t('con eas build. El .aab es el paquete que entiende Google Play.')]));
children.push(bullet([b('Crear la app en Play Console: '), t('con su nombre de paquete (com.porrasmundial.app), que es PERMANENTE.')]));
children.push(bullet([b('Rellenar la ficha: '), t('descripcion, capturas, icono, categoria, clasificacion por edad.')]));
children.push(bullet([b('Politica de privacidad: '), t('obligatoria. La publicamos gratis con GitHub Pages.')]));
children.push(bullet([b('Seguridad de los datos: '), t('declarar que datos recoge (nombre, email, ID) y que no se comparten con terceros.')]));
children.push(bullet([b('Prueba cerrada: '), t('primero un grupo reducido de testers, antes que el publico general.')]));
children.push(spacer());
children.push(callout('Requisito nuevo de Google para apps nuevas', [
  'Para pasar de prueba cerrada a produccion publica necesitas:',
  '- Al menos 12 testers que ACEPTEN la invitacion (no basta con anadir su email).',
  '- Mantenerlos probando durante 14 dias seguidos.',
  'Para una porra entre amigos, con la prueba cerrada ya es suficiente.',
]));

// 7
children.push(h1('7. Como subir una nueva version en el futuro'));
children.push(p('Toda la configuracion (keystore, secretos, proyecto EAS, credenciales) ya esta hecha para siempre. Para una actualizacion solo necesitas:'));
children.push(bullet([b('1. '), t('Hacer los cambios en el codigo.')]));
children.push(bullet([b('2. '), code('eas build --platform android --profile production'), t('  (genera el nuevo .aab).')]));
children.push(bullet([b('3. '), t('Subir el .aab a Play Console como nueva version.')]));
children.push(p('El numero de version se incrementa solo. No hay que reconfigurar nada.'));

// 8
children.push(pageBreak());
children.push(h1('8. Glosario rapido'));
children.push(refTable(
  ['Termino', 'Que es'],
  [
    ['**.aab**', 'Android App Bundle. El paquete que se sube a Google Play.'],
    ['**.apk**', 'El instalable directo de Android (se comparte por WhatsApp sin Play Store).'],
    ['**Keystore**', 'El archivo con la clave secreta que firma tu app. EAS lo gestiona.'],
    ['**OAuth**', 'El estandar que permite iniciar sesion con Google sin compartir tu contrasena.'],
    ['**Token / API key**', 'Una contrasena que identifica a tu app ante un servicio.'],
    ['**Secret**', 'Un dato sensible guardado cifrado en EAS o GitHub, fuera del codigo.'],
    ['**Commit / Push**', 'Guardar un cambio (commit) y subirlo a GitHub (push).'],
    ['**Build**', 'El proceso de convertir el codigo en una app instalable.'],
    ['**Managed workflow**', 'Modo de Expo en el que no tocas codigo nativo; Expo lo gestiona.'],
    ['**Prueba cerrada**', 'Version de la app disponible solo para una lista concreta de testers.'],
  ],
  [2600, 7192]
));
children.push(spacer());
children.push(new Paragraph({ spacing: { before: 300 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: '- Fin -', italics: true, color: GREY, size: 20 })] }));

const doc = new Document({
  creator: 'Porras Mundial 2026',
  title: 'Guia Porras Mundial 2026',
  styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
  numbering: { config: [ { reference: 'b', levels: [ { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 260 } } } } ] } ] },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1224, bottom: 1224, left: 1224, right: 1224 } } },
    children,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  const out = 'C:\\Users\\pein2\\Documents\\porras-mundial-2026\\Guia-Porras-Mundial-2026.docx';
  fs.writeFileSync(out, buf);
  console.log('DOC_WRITTEN ' + buf.length);
});
