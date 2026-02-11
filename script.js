(() => {
  const canvas = document.getElementById('logoCanvas');
  const ctx = canvas.getContext('2d');
  const colorPrimary = document.getElementById('colorPrimary');
  const colorSecondary = document.getElementById('colorSecondary');
  const colorBg = document.getElementById('colorBg');
  const sizeSelect = document.getElementById('sizeSelect');
  const downloadPng = document.getElementById('downloadPng');
  const downloadIco = document.getElementById('downloadIco');
  const randomize = document.getElementById('randomize');
  const fileLogo = document.getElementById('fileLogo');

  let gearImage = null; // Image object loaded from gear.png or user file
  let customSvgString = null; // if user edits or we generate an SVG

  function setCanvasSize(size){
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  function clearBG(bg){
    ctx.fillStyle = bg;
    ctx.fillRect(0,0,canvas.width,canvas.height);
  }

  function draw(){
    const size = parseInt(sizeSelect.value,10);
    setCanvasSize(size);
    const primary = colorPrimary.value;
    const secondary = colorSecondary.value;
    const bg = colorBg.value;
    clearBG(bg);
    const design = document.querySelector('input[name=design]:checked').value;
    if(design==='gear'){
      if(gearImage) drawGearImage(size, gearImage);
      else {
        // generate SVG on the fly using current colors (or use customSvgString if provided)
        const svg = customSvgString || generateGearSVG(size, primary, secondary, bg);
        svgStringToImage(svg, (img)=> drawGearImage(size, img));
      }
    }
    if(design==='chip') drawChip(size,primary,secondary);
    if(design==='hex') drawHex(size,primary,secondary);
  }

  function generateGearSVG(size, primary, secondary, bg){
    const w = size, h = size;
    // build gear teeth by repeating rects for each gear programmatically
    function gearGroup(cx, cy, r, teeth, hole){
      let s = `\n  <g transform="translate(${cx},${cy})">`;
      for(let i=0;i<teeth;i++){
        const ang = (i/teeth)*360;
        // tooth positioned at radius r
        s += `\n    <rect x="${r+2}" y="${-r*0.08}" width="${Math.max(6, r*0.18)}" height="${Math.max(6, r*0.16)}" rx="2" transform="rotate(${ang})" fill="${primary}" />`;
      }
      s += `\n    <circle cx="0" cy="0" r="${r}" fill="${primary}" />`;
      if(hole){ s += `\n    <circle cx="0" cy="0" r="${r*0.45}" fill="${bg}" />`; }
      s += `\n  </g>`;
      return s;
    }

    // positions roughly matching the uploaded logo
    const sx = w/2, sy = h/2;
    const g1 = gearGroup(sx+70, sy-36, Math.round(size*0.12), 10, true);
    const g2 = gearGroup(sx-80, sy-10, Math.round(size*0.10), 10, true);
    const g3 = gearGroup(sx-6, sy+80, Math.round(size*0.12), 10, true);

    // connectors
    const conn = `\n  <path d="M${sx+18},${sy+6} L${sx+62},${sy-14} L${sx+110},${sy-40}" stroke="${secondary}" stroke-width="${Math.max(6,size*0.02)}" fill="none" stroke-linecap="round"/>`;

    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>\n  <rect width='100%' height='100%' fill='${bg}'/>\n  ${g1}\n  ${g2}\n  ${g3}\n  ${conn}\n</svg>`;
    return svg;
  }

  function svgStringToImage(svgString, cb){
    const svgBlob = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function(){ URL.revokeObjectURL(url); cb(img); };
    img.onerror = function(){ URL.revokeObjectURL(url); cb(null); };
    img.src = url;
  }
  function drawGearImage(size, img){
    // draw centered, scaled to fit (pad 10%)
    const pad = size * 0.08;
    const wMax = size - pad*2;
    const hMax = size - pad*2;
    const ratio = Math.min(wMax / img.width, hMax / img.height, 1);
    const w = img.width * ratio;
    const h = img.height * ratio;
    const x = (size - w) / 2;
    const y = (size - h) / 2;
    ctx.save();
    // optional subtle shadow
    ctx.shadowColor = 'rgba(0,0,0,0.12)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();
  }

  function drawGearNetwork(size, a, b){
    const cx = size/2, cy = size/2, r = size*0.22;
    // gear base
    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate(-Math.PI/8);
    // teeth
    const teeth = 12;
    for(let i=0;i<teeth;i++){
      const ang = (i/teeth)*Math.PI*2;
      ctx.beginPath();
      const x = Math.cos(ang)*(r+6);
      const y = Math.sin(ang)*(r+6);
      ctx.fillStyle = a;
      ctx.fillRect(x-4,y-4,8,8);
    }
    // central circle
    ctx.beginPath();
    ctx.fillStyle = a;
    ctx.arc(0,0,r,0,Math.PI*2);
    ctx.fill();
    // inner hole
    ctx.beginPath();ctx.fillStyle='#fff';ctx.arc(0,0,r*0.45,0,Math.PI*2);ctx.fill();
    ctx.restore();

    // network nodes
    const nodes = [
      {x:cx + r*2.1, y:cy},
      {x:cx - r*2.1, y:cy - r*0.8},
      {x:cx - r*2.1, y:cy + r*0.8}
    ];
    ctx.strokeStyle = b; ctx.lineWidth = 3;
    nodes.forEach(n=>{
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(n.x,n.y); ctx.stroke();
      ctx.beginPath(); ctx.fillStyle = b; ctx.arc(n.x,n.y, size*0.06,0,Math.PI*2); ctx.fill();
    });
  }

  function drawChip(size,a,b){
    const margin = size*0.12;
    const w = size - margin*2, h = size - margin*2;
    const x = margin, y = margin;
    // chip body
    ctx.fillStyle = a; ctx.strokeStyle = '#0002'; ctx.lineWidth=1;
    roundRect(ctx,x,y,w,h,12,true,false);
    // inner chip
    ctx.fillStyle = '#fff'; roundRect(ctx,x+size*0.06,y+size*0.06,w-size*0.12,h-size*0.12,8,true,false);
    // traces
    ctx.strokeStyle = b; ctx.lineWidth = 2;
    const padCount = 6;
    for(let i=0;i<padCount;i++){
      const px = x + (i+0.5)*(w/(padCount));
      ctx.beginPath(); ctx.moveTo(px,y+size*0.06); ctx.lineTo(px,y - size*0.02 + size*0.2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px,y+h-size*0.06); ctx.lineTo(px,y+h+size*0.02 - size*0.2); ctx.stroke();
    }
    // central traces
    ctx.beginPath(); ctx.moveTo(x+w*0.2,y+h*0.5); ctx.lineTo(x+w*0.8,y+h*0.5); ctx.stroke();
    for(let i=0;i<3;i++){ ctx.beginPath(); ctx.arc(x+w*0.5, y+h*0.5 - (i-1)*8, 4,0,Math.PI*2); ctx.fillStyle=b; ctx.fill(); }
  }

  function drawHex(size,a,b){
    const cx=size/2, cy=size/2, R=size*0.28;
    // hex background
    ctx.save(); ctx.translate(cx,cy);
    ctx.beginPath();
    for(let i=0;i<6;i++){ const ang = Math.PI/3*i; const x = Math.cos(ang)*R; const y = Math.sin(ang)*R; if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); }
    ctx.closePath(); ctx.fillStyle=a; ctx.fill(); ctx.restore();
    // small nodes on corners
    for(let i=0;i<6;i++){ const ang = Math.PI/3*i; const x = cx + Math.cos(ang)*R; const y = cy + Math.sin(ang)*R; ctx.beginPath(); ctx.fillStyle=b; ctx.arc(x,y, size*0.045,0,Math.PI*2); ctx.fill(); }
    // connecting traces
    ctx.strokeStyle=b; ctx.lineWidth=3;
    for(let i=0;i<6;i++){ const ang = Math.PI/3*i; const x = cx + Math.cos(ang)*R*0.7; const y = cy + Math.sin(ang)*R*0.7; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(x,y); ctx.stroke(); }
  }

  function roundRect(ctx,x,y,w,h,r,fill,stroke){
    if(typeof r==='undefined') r=5;
    ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
    if(fill) ctx.fill(); if(stroke) ctx.stroke();
  }

  // downloads
  function downloadPNG(){
    canvas.toBlob(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'logo.png';
      a.click();
      URL.revokeObjectURL(a.href);
    }, 'image/png');
  }

  function downloadICO(){
    // create a PNG blob at the chosen size, then wrap into ICO
    canvas.toBlob(async (blob) => {
      const pngArray = new Uint8Array(await blob.arrayBuffer());
      const ico = buildIcoFromPng(pngArray);
      const blobIco = new Blob([ico], {type: 'image/x-icon'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blobIco);
      a.download = 'logo.ico';
      a.click();
      URL.revokeObjectURL(a.href);
    }, 'image/png');
  }

  function buildIcoFromPng(pngBytes){
    const pngSize = pngBytes.length;
    const count = 1;
    const header = new ArrayBuffer(6 + 16*count + pngSize);
    const dv = new DataView(header);
    let offset = 0;
    dv.setUint16(offset,0,true); offset+=2; // reserved
    dv.setUint16(offset,1,true); offset+=2; // type 1 = ICON
    dv.setUint16(offset,count,true); offset+=2;
    // entry
    const width = Math.min(256, parseInt(sizeSelect.value,10));
    dv.setUint8(offset, width===256?0:width); offset+=1;
    dv.setUint8(offset, width===256?0:width); offset+=1; // height
    dv.setUint8(offset,0); offset+=1; // color count
    dv.setUint8(offset,0); offset+=1; // reserved
    dv.setUint16(offset,1,true); offset+=2; // planes
    dv.setUint16(offset,32,true); offset+=2; // bit count
    dv.setUint32(offset,pngSize,true); offset+=4; // bytes in res
    const imageOffset = 6 + 16*count;
    dv.setUint32(offset,imageOffset,true); offset+=4;
    // copy png data
    const out = new Uint8Array(header);
    out.set(pngBytes, imageOffset);
    return out.buffer;
  }

  // events
  document.querySelectorAll('input[name=design]').forEach(el=>el.addEventListener('change',draw));
  [colorPrimary,colorSecondary,colorBg,sizeSelect].forEach(el=>el.addEventListener('input',draw));
  downloadPng.addEventListener('click',downloadPNG);
  downloadIco.addEventListener('click',downloadICO);
  randomize.addEventListener('click',()=>{
    colorPrimary.value = randomColor(); colorSecondary.value = randomColor(); colorBg.value = ['#ffffff','#0b0b12','#f6fbff'][Math.floor(Math.random()*3)]; draw();
  });

  // try to auto-load a file named 'gear.png' from project root (if present when served locally)
  (function tryLoadLocalGear(){
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function(){ gearImage = img; draw(); };
    img.onerror = function(){ /* no local gear.png found */ };
    img.src = 'gear.png';
  })();

  // allow user to upload an image which will be used for the gear design
  if(fileLogo){
    fileLogo.addEventListener('change', (ev)=>{
      const f = ev.target.files && ev.target.files[0];
      if(!f) return;
      const reader = new FileReader();
      reader.onload = function(e){
        const img = new Image();
        img.onload = function(){ gearImage = img; draw(); };
        img.src = e.target.result;
      };
      reader.readAsDataURL(f);
    });
  }

  // SVG editor UI
  const editSvgToggle = document.getElementById('editSvgToggle');
  const svgEditorWrap = document.getElementById('svgEditorWrap');
  const svgEditor = document.getElementById('svgEditor');
  const applySvg = document.getElementById('applySvg');
  const resetSvg = document.getElementById('resetSvg');

  if(editSvgToggle){
    editSvgToggle.addEventListener('click', ()=>{
      if(svgEditorWrap.style.display === 'none'){
        svgEditorWrap.style.display = 'block';
        editSvgToggle.textContent = 'Hide SVG Editor';
        // populate editor with current generated SVG
        svgEditor.value = customSvgString || generateGearSVG(parseInt(sizeSelect.value,10), colorPrimary.value, colorSecondary.value, colorBg.value);
      } else {
        svgEditorWrap.style.display = 'none';
        editSvgToggle.textContent = 'Show SVG Editor';
      }
    });
  }

  if(applySvg){
    applySvg.addEventListener('click', ()=>{
      const val = svgEditor.value.trim();
      if(!val) return;
      customSvgString = val;
      gearImage = null; // prefer SVG
      draw();
    });
  }

  if(resetSvg){
    resetSvg.addEventListener('click', ()=>{
      customSvgString = null; gearImage = null; svgEditor.value = generateGearSVG(parseInt(sizeSelect.value,10), colorPrimary.value, colorSecondary.value, colorBg.value); draw();
    });
  }

  function randomColor(){ return '#'+Math.floor(Math.random()*16777215).toString(16).padStart(6,'0'); }

  // initial render
  draw();
})();
