const panel = document.querySelector('#panel');
const panelContent = document.querySelector('#panelContent');
const panelClose = document.querySelector('#panelClose');
const archiveTrigger = document.querySelector('#archiveTrigger');
const archiveOverlay = document.querySelector('#archiveOverlay');
const archiveClose = document.querySelector('#archiveClose');
const archiveTrack = document.querySelector('#archiveTrack');
const cursorDot = document.querySelector('#cursorDot');
const backScene = document.querySelector('#backScene');

const archiveItems = [{"file": "Autocad 01.png", "software": "AUTOCAD"}, {"file": "Autocad 02.png", "software": "AUTOCAD"}, {"file": "Autocad 03.png", "software": "AUTOCAD"}, {"file": "D5 01.png", "software": "D5"}, {"file": "D5 02.png", "software": "D5"}, {"file": "D5 03.png", "software": "D5"}, {"file": "D5 04.png", "software": "D5"}, {"file": "D5 05.png", "software": "D5"}, {"file": "Illustrator 01.png", "software": "ILLUSTRATOR"}, {"file": "Illustrator 02.png", "software": "ILLUSTRATOR"}, {"file": "Illustrator 03.png", "software": "ILLUSTRATOR"}, {"file": "Photoshop 01.png", "software": "PHOTOSHOP"}, {"file": "Photoshop 02.png", "software": "PHOTOSHOP"}, {"file": "Photoshop 03.png", "software": "PHOTOSHOP"}, {"file": "Photoshop 04.png", "software": "PHOTOSHOP"}, {"file": "Photoshop 05.png", "software": "PHOTOSHOP"}, {"file": "Qgis 01.png", "software": "QGIS"}, {"file": "Qgis 02.png", "software": "QGIS"}, {"file": "Rhino 01.png", "software": "RHINO"}, {"file": "Rhino 03.png", "software": "RHINO"}, {"file": "Rhino 04.png", "software": "RHINO"}, {"file": "Rhino 05.png", "software": "RHINO"}];

const skillContent = {
  skill1: `
    <h1>3D Modeling</h1>
    <p>Developing spatial models to test form, massing, structure and design relationships.</p>
    <h2>Tools</h2>
    <p>Rhino · SketchUp</p>
  `,
  skill2: `
    <h1>Technical Drawing</h1>
    <p>Producing precise architectural drawings, plans, sections and construction-oriented documentation.</p>
    <h2>Tools</h2>
    <p>AutoCAD</p>
  `,
  skill3: `
    <h1>Visualization & Rendering</h1>
    <p>Combining graphic design, post-production and rendering to communicate spatial ideas clearly.</p>
    <h2>Tools</h2>
    <p>Adobe Illustrator · Photoshop · InDesign · D5 · V-Ray</p>
  `,
  skill4: `
    <h1>GIS Mapping</h1>
    <p>Territorial analysis, layered spatial reading and landscape mapping.</p>
    <h2>Tools</h2>
    <p>QGIS</p>
  `,
  skill5: `
    <h1>Energy Simulation</h1>
    <p>Environmental and building-performance analysis to support climate-responsive design decisions.</p>
    <h2>Tools</h2>
    <p>Honeybee · environmental simulation workflows</p>
  `,
  language: `
    <h1>Languages</h1>
    <p>Chinese — Native</p>
    <p>English — C1</p>
    <p>Italian — A2</p>
  `
};

function openPanel(key) {
  panelContent.innerHTML = skillContent[key] || '';
  panel.classList.add('open');
  panel.setAttribute('aria-hidden','false');
}

function closePanel() {
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden','true');
}

document.querySelectorAll('[data-skill]').forEach(el => {
  el.addEventListener('click', () => openPanel(el.dataset.skill));
});

panelClose.addEventListener('click', closePanel);

function renderArchive() {
  archiveTrack.innerHTML = archiveItems.map(item => `
    <figure class="archive-card">
      <img src="./archive/${encodeURIComponent(item.file)}" alt="${item.software} work" />
      <figcaption class="archive-caption">${item.software}</figcaption>
    </figure>
  `).join('');
}

function openArchive() {
  renderArchive();
  archiveOverlay.classList.add('open');
  archiveOverlay.setAttribute('aria-hidden','false');
  archiveTrack.scrollLeft = 0;
}

function closeArchive() {
  archiveOverlay.classList.remove('open');
  archiveOverlay.setAttribute('aria-hidden','true');
}

archiveTrigger.addEventListener('click', openArchive);
archiveClose.addEventListener('click', closeArchive);

archiveOverlay.addEventListener('click', (e) => {
  if (e.target === archiveOverlay) closeArchive();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closePanel();
    closeArchive();
  }
});

archiveTrack.addEventListener('wheel', e => {
  e.preventDefault();
  const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
  archiveTrack.scrollLeft += delta * 6.5;
}, { passive:false });

let dragging = false;
let startX = 0;
let startScroll = 0;

archiveTrack.addEventListener('pointerdown', e => {
  dragging = true;
  startX = e.clientX;
  startScroll = archiveTrack.scrollLeft;
  archiveTrack.setPointerCapture(e.pointerId);
});

archiveTrack.addEventListener('pointermove', e => {
  if (!dragging) return;
  archiveTrack.scrollLeft = startScroll - (e.clientX - startX) * 4.5;
});

function stopDrag(e) {
  dragging = false;
  try { archiveTrack.releasePointerCapture(e.pointerId); } catch {}
}
archiveTrack.addEventListener('pointerup', stopDrag);
archiveTrack.addEventListener('pointercancel', stopDrag);

backScene.addEventListener('click', () => {
  if (history.length > 1) history.back();
  else window.location.href = '/';
});

window.addEventListener('pointermove', e => {
  cursorDot.style.left = `${e.clientX}px`;
  cursorDot.style.top = `${e.clientY}px`;
  cursorDot.classList.remove('hidden');
});

window.addEventListener('pointerleave', () => cursorDot.classList.add('hidden'));

document.addEventListener('pointerover', e => {
  if (e.target.closest('a,button,.asset,.archive-track')) {
    cursorDot.classList.add('hovering');
  }
});

document.addEventListener('pointerout', e => {
  if (e.target.closest('a,button,.asset,.archive-track')) {
    cursorDot.classList.remove('hovering');
  }
});
