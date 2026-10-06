import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();

const panel=document.querySelector('#panel');
const panelContent=document.querySelector('#panelContent');
const panelClose=document.querySelector('#panelClose');
const backScene=document.querySelector('#backScene');
const cursorDot=document.querySelector('#cursorDot');
const clockText=document.querySelector('#clockText');
const pdfModal=document.querySelector('#pdfModal');
const pdfStage=document.querySelector('#pdfStage');
const pdfPages=document.querySelector('#pdfPages');
const pdfLoading=document.querySelector('#pdfLoading');
const pdfTitle=document.querySelector('#pdfTitle');
const pdfClose=document.querySelector('#pdfClose');
const pdfZoomIn=document.querySelector('#pdfZoomIn');
const pdfZoomOut=document.querySelector('#pdfZoomOut');
const pdfFit=document.querySelector('#pdfFit');
const pdfZoomLabel=document.querySelector('#pdfZoomLabel');
let pdfZoom=1;
let currentPdf=null;
let currentSrc='';
let renderToken=0;

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
  pdfZoom=Math.min(2.2,Math.max(.65,next));
  pdfZoomLabel.textContent=`${Math.round(pdfZoom*100)}%`;
  if(currentPdf) renderPdfPages();
}

async function renderPdfPages(){
  if(!currentPdf) return;
  const token=++renderToken;
  pdfPages.innerHTML='';
  pdfLoading.style.display='block';

  const availableWidth=Math.max(280,pdfStage.clientWidth-40);

  try{
    for(let pageNum=1;pageNum<=currentPdf.numPages;pageNum++){
      if(token!==renderToken) return;
      const page=await currentPdf.getPage(pageNum);
      const baseViewport=page.getViewport({scale:1});
      const fitScale=Math.min(1.45,availableWidth/baseViewport.width);
      const viewport=page.getViewport({scale:fitScale*pdfZoom});
      const dpr=Math.min(window.devicePixelRatio||1,2);

      const pageWrap=document.createElement('div');
      pageWrap.className='pdf-page-wrap';

      const canvas=document.createElement('canvas');
      canvas.className='pdf-page-canvas';
      canvas.width=Math.floor(viewport.width*dpr);
      canvas.height=Math.floor(viewport.height*dpr);
      canvas.style.width=`${viewport.width}px`;
      canvas.style.height=`${viewport.height}px`;
      canvas.setAttribute('aria-label',`Document page ${pageNum}`);

      const watermark=document.createElement('div');
      watermark.className='pdf-watermark';
      watermark.textContent='QIUCHEN SHEN · VIEW ONLY';

      pageWrap.appendChild(canvas);
      pageWrap.appendChild(watermark);
      pdfPages.appendChild(pageWrap);

      const ctx=canvas.getContext('2d',{alpha:false});
      await page.render({
        canvasContext:ctx,
        viewport,
        transform:dpr===1?null:[dpr,0,0,dpr,0,0]
      }).promise;
    }
  }catch(err){
    console.error(err);
    pdfPages.innerHTML='<div class="pdf-error">Unable to display this document.</div>';
  }finally{
    if(token===renderToken) pdfLoading.style.display='none';
  }
}

async function openPdf(src,title){
  closePanel();
  currentSrc=src;
  pdfTitle.textContent=title;
  pdfZoom=1;
  pdfZoomLabel.textContent='100%';
  pdfPages.innerHTML='';
  pdfLoading.style.display='block';
  pdfModal.classList.add('open');
  pdfModal.setAttribute('aria-hidden','false');
  document.body.classList.add('pdf-open');

  try{
    const task=pdfjsLib.getDocument({url:src,disableAutoFetch:false,disableStream:false});
    currentPdf=await task.promise;
    await renderPdfPages();
  }catch(err){
    console.error(err);
    currentPdf=null;
    pdfLoading.style.display='none';
    pdfPages.innerHTML='<div class="pdf-error">Unable to display this document.</div>';
  }
}

function closePdf(){
  renderToken++;
  pdfModal.classList.remove('open');
  pdfModal.setAttribute('aria-hidden','true');
  document.body.classList.remove('pdf-open');
  currentPdf=null;
  currentSrc='';
  setTimeout(()=>{pdfPages.innerHTML='';},250);
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
pdfModal.addEventListener('contextmenu',e=>e.preventDefault());

document.addEventListener('keydown',e=>{
  if(pdfModal.classList.contains('open') && (e.ctrlKey||e.metaKey) && ['s','p'].includes(e.key.toLowerCase())){
    e.preventDefault();
    return;
  }
  if(e.key==='Escape'){
    if(pdfModal.classList.contains('open')) closePdf();
    else closePanel();
  }
});

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

window.addEventListener('resize',()=>{
  if(currentPdf) renderPdfPages();
});

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
