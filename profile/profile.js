const panel=document.querySelector('#panel');
const panelContent=document.querySelector('#panelContent');
const panelClose=document.querySelector('#panelClose');
const backScene=document.querySelector('#backScene');
const cursorDot=document.querySelector('#cursorDot');
const clockText=document.querySelector('#clockText');
const pdfModal=document.querySelector('#pdfModal');
const pdfFrame=document.querySelector('#pdfFrame');
const pdfTitle=document.querySelector('#pdfTitle');
const pdfClose=document.querySelector('#pdfClose');
const pdfZoomIn=document.querySelector('#pdfZoomIn');
const pdfZoomOut=document.querySelector('#pdfZoomOut');
const pdfFit=document.querySelector('#pdfFit');
const pdfZoomLabel=document.querySelector('#pdfZoomLabel');
let pdfZoom=1;


const content={
  about:`
    <h1>Qiuchen Shen</h1>
    <p>Landscape · Architecture · Spatial Design</p>
    <p>
      I work across landscape, architecture, mapping and visual storytelling,
      with a strong interest in spatial narratives, materials, research and interactive representation.
    </p>
    <dl class="meta">
      <dt>Location</dt><dd>Piacenza, Italy</dd>
      <dt>Currently</dt><dd>Politecnico di Milano</dd>
      <dt>Program</dt><dd>Sustainable Landscape and Architectural Design</dd>
    </dl>
  `,
  profile:`
    <h1>About Me</h1>
    <p>
      I am an MSc student in Sustainable Landscape and Architectural Design at Politecnico di Milano,
      with a focus on territorial strategies, ecological systems and spatial visualization.
    </p>
    <p>
      My work combines GIS-based analysis, landscape mapping, 3D modeling, hand sketching and
      visual storytelling across multiple scales. I am especially interested in how research,
      materiality and interaction can shape a clear spatial narrative.
    </p>
    <h2>Focus & Interests</h2>
    <ul>
      <li>Territorial and landscape strategies</li>
      <li>Ecological systems and urban transformation</li>
      <li>Spatial drawing and visual communication</li>
      <li>GIS mapping and physical / digital modeling</li>
      <li>Interactive portfolio and web experiences</li>
    </ul>
  `,
  contact:`
    <h1>Contact</h1>
    <dl class="meta">
      <dt>Email</dt><dd><a href="mailto:quinn999333@gmail.com">quinn999333@gmail.com</a></dd>
      <dt>Phone</dt><dd><a href="tel:+393520332337">+39 352 033 2337</a></dd>
      <dt>Location</dt><dd>Piacenza, Italy</dd>
    </dl>
  `,
  map:`
    <h1>My Path</h1>
    <p>A spatial timeline of study, internships and summer schools.</p>
    <h2>China</h2>
    <p>Bachelor · Guangzhou<br>Internships · Guangzhou / Shanghai</p>
    <h2>Italy</h2>
    <p>Master · Milan / Piacenza</p>
    <h2>Summer Schools</h2>
    <p>Edinburgh, UK · Vienna, Austria</p>
  `,
  behance:`
    <h1>Behance</h1>
    <p>Coming soon.</p>
  `
};

function setPdfZoom(next){
  pdfZoom=Math.min(2.5,Math.max(.6,next));
  pdfFrame.style.transform=`scale(${pdfZoom})`;
  pdfFrame.style.width=`${100/pdfZoom}%`;
  pdfFrame.style.height=`${100/pdfZoom}%`;
  pdfZoomLabel.textContent=`${Math.round(pdfZoom*100)}%`;
}

function openPdf(src,title){
  closePanel();
  pdfTitle.textContent=title;
  pdfFrame.src=`${src}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`;
  setPdfZoom(1);
  pdfModal.classList.add('open');
  pdfModal.setAttribute('aria-hidden','false');
  document.body.classList.add('pdf-open');
}

function closePdf(){
  pdfModal.classList.remove('open');
  pdfModal.setAttribute('aria-hidden','true');
  document.body.classList.remove('pdf-open');
  setTimeout(()=>{pdfFrame.src='';},250);
}

function openPanel(key){
  panelContent.innerHTML=content[key]||'';
  panel.classList.add('open');
  panel.setAttribute('aria-hidden','false');
}
function closePanel(){
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden','true');
}

document.querySelectorAll('[data-action]').forEach(el=>{
  el.addEventListener('click',()=>{
    const action=el.dataset.action;
    if(action==='cv'){
      openPdf('./docs/Qiuchen-Shen-CV.pdf','CURRICULUM VITAE');
      return;
    }
    if(action==='portfolio'){
      openPdf('./docs/Qiuchen-Shen-Portfolio.pdf','PORTFOLIO');
      return;
    }
    openPanel(action);
  });
});

panelClose.addEventListener('click',closePanel);
pdfClose.addEventListener('click',closePdf);
pdfZoomIn.addEventListener('click',()=>setPdfZoom(pdfZoom+.15));
pdfZoomOut.addEventListener('click',()=>setPdfZoom(pdfZoom-.15));
pdfFit.addEventListener('click',()=>setPdfZoom(1));
pdfModal.addEventListener('click',e=>{if(e.target===pdfModal)closePdf();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(pdfModal.classList.contains('open'))closePdf();else closePanel();}});

backScene.addEventListener('click',()=>{
  if(history.length>1) history.back();
  else window.location.href='/';
});

function updateClock(){
  const now=new Date();
  clockText.textContent=now.toLocaleTimeString([],{
    hour:'2-digit',
    minute:'2-digit'
  });
}
updateClock();
setInterval(updateClock,1000);

window.addEventListener('pointermove',e=>{
  cursorDot.style.left=`${e.clientX}px`;
  cursorDot.style.top=`${e.clientY}px`;
  cursorDot.classList.remove('hidden');
});
window.addEventListener('pointerleave',()=>cursorDot.classList.add('hidden'));

document.querySelectorAll('a,button,.asset').forEach(el=>{
  el.addEventListener('pointerenter',()=>cursorDot.classList.add('hovering'));
  el.addEventListener('pointerleave',()=>cursorDot.classList.remove('hovering'));
});
