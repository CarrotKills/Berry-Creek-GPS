/* Berry Creek GPS • independent prototype • no connection to DH Game */
(() => {
  'use strict';
  const STORAGE = 'bc-gps-2026-prototype-round-v1';
  const MARKERS_STORAGE = 'bc-gps-2026-green-markers-v1';
  const HISTORY_STORAGE = 'bc-gps-2026-round-history-v1';
  // Course clubhouse approximate published location, NOT green coordinates.
  const CLUBHOUSE = [30.706445, -97.670818];
  // Working copy from a public Berry Creek card (18Birdies/FreeGolfTracker);
  // verify against the current paper card before treating as authoritative.
  const pars = [4,3,5,4,4,4,5,3,4,4,5,3,5,4,4,4,3,4];
  const handicaps = [11,17,1,5,15,3,7,13,9,12,2,18,4,14,10,8,16,6];
  const yardages = {
    gold:[373,172,548,436,321,457,544,175,326,374,529,181,547,308,334,385,169,421],
    blue:[342,164,502,414,278,421,506,159,316,368,503,161,508,271,298,341,153,399],
    combo:Array(18).fill(null), // combo yards require current club card
    white:[288,152,450,346,260,385,454,134,231,312,475,135,473,256,280,328,148,362]
  };
  const teeName = {gold:'GOLD / 1',blue:'BLUE / 2',combo:'COMBO / 23',white:'WHITE / 3'};
  const $ = id => document.getElementById(id);
  let toastTimer;
  const newRound = () => ({
    id: 'r-'+Date.now()+'-'+Math.floor(Math.random()*100000),
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    hole: 1, tee:'gold',
    players: [{id:'p1',name:'Player 1',scores:Array(18).fill(null)},
              {id:'p2',name:'Player 2',scores:Array(18).fill(null)}]
  });
  const readJson = (key, fallback) => {try{const v=JSON.parse(localStorage.getItem(key));return v??fallback;}catch{return fallback;}};
  let state = readJson(STORAGE,null) || newRound();
  let markers = readJson(MARKERS_STORAGE,{});
  let history = readJson(HISTORY_STORAGE,[]);
  if (!Array.isArray(state.players) || state.players.length<1) state=newRound();
  state.hole=Math.max(1,Math.min(18,Number(state.hole)||1));
  if(!yardages[state.tee])state.tee='gold';
  state.players=state.players.slice(0,5).map((p,i)=>({id:p.id||'p'+i,name:String(p.name||'Player '+(i+1)).slice(0,32),scores:Array.from({length:18},(_,h)=>Number.isInteger(p.scores?.[h]) && p.scores[h]>=1 && p.scores[h]<=20?p.scores[h]:null)}));
  const save = () => {state.updatedAt=new Date().toISOString();try{localStorage.setItem(STORAGE,JSON.stringify(state));}catch{showToast('Storage unavailable. Export your scorecard to save it.');}};
  const saveMarkers=()=>{try{localStorage.setItem(MARKERS_STORAGE,JSON.stringify(markers));}catch{showToast('Could not save green locations on this device.');}};
  const saveHistory=()=>{try{localStorage.setItem(HISTORY_STORAGE,JSON.stringify(history));}catch{showToast('Could not save round history.');}};
  const esc = (text) => String(text).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const fmtScore=(n)=>!Number.isFinite(n)?'—':n>0?'+'+n:n===0?'E':String(n);
  const holeId=()=>state.hole-1;
  const roundHasScores=()=>state.players.some(p=>p.scores.some(v=>v!==null));
  const courseYardage=(hole=holeId())=>yardages[state.tee]?.[hole]??null;
  const holesEntered=(p)=>p.scores.filter(x=>x!==null).length;
  function showToast(msg){const t=$('toast');t.textContent=msg;t.classList.add('shown');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('shown'),3500);}
  function render(){
    const h=holeId(), par=pars[h];
    $('holeLabel').innerHTML=`HOLE ${state.hole} <b>•</b> PAR ${par} <b>•</b> HCP ${handicaps[h]}`;
    $('parInfo').textContent=par;
    $('hcpInfo').textContent=handicaps[h];
    $('teeInfo').textContent=courseYardage()??'—';
    $('teeYards').textContent=teeName[state.tee]+' · '+(courseYardage()??'—')+' YDS';
    $('teeSelect').value=state.tee;
    $('yardHole').textContent=state.hole;
    $('parToHole').textContent=pars.slice(0,state.hole).reduce((a,b)=>a+b,0);
    $('holesCount').textContent=`${Math.max(...state.players.map(holesEntered))} / 18`;
    $('playersCount').textContent=state.players.length;
    $('prevHole').disabled=state.hole===1;
    $('nextHole').disabled=state.hole===18;
    $('nextHoleBottom').disabled=state.hole===18;
    $('scoreRows').innerHTML=state.players.map((p,index)=>{
      const score=p.scores[h];
      const entered=p.scores.map((s,i)=>s===null?null:s-pars[i]);
      const totalToPar=entered.reduce((n,s)=>n+(s??0),0);
      const gross=p.scores.reduce((n,s)=>n+(s??0),0);
      const scoreClass=score===null?'':score<par?'under':score>par?'over':'';
      return `<div class="score-row" data-player="${index}"><div class="score-player"><strong title="${esc(p.name)}">${esc(p.name)}</strong><small>${holesEntered(p)} holes · ${gross||'—'} gross · ${fmtScore(totalToPar)} par</small></div><button class="score-change" data-action="minus" data-index="${index}" aria-label="Decrease ${esc(p.name)} score">−</button><button class="score-value ${scoreClass}" data-action="par" data-index="${index}" title="Tap to set par; tap again to clear" aria-label="Set or clear ${esc(p.name)} par score">${score??'—'}</button><button class="score-change plus" data-action="plus" data-index="${index}" aria-label="Increase ${esc(p.name)} score">+</button></div>`;
    }).join('');
    updateDistances();
    refreshMapMarkers();
  }
  function updateScore(playerIndex,action){
    const p=state.players[playerIndex];if(!p)return;
    const h=holeId(), prev=p.scores[h], par=pars[h];
    if(action==='par')p.scores[h]=prev===null?par:null;
    if(action==='plus')p.scores[h]=Math.min(20,(prev??par)+1);
    if(action==='minus')p.scores[h]=Math.max(1,(prev??par)-1);
    save();render();
  }
  function moveHole(newHole){
    const next=Math.max(1,Math.min(18,newHole));if(next===state.hole)return;
    state.hole=next;save();render();
    const center=markers[next]?.center;
    if(map && center)map.flyTo([center.lat,center.lng],Math.max(map.getZoom(),17),{duration:.8});
    else setInstruction(`Hole ${next}: green not mapped yet. Choose “Mark Green” to add a location.`);
  }

  // Map and live position
  let map=null, satelliteLayer=null, roadLayer=null, activeBase='satellite';
  let gpsWatch=null, livePosition=null, demoPosition=null, positionMarker=null, accuracyCircle=null;
  let greenLayers=[], measureLayer=null, measureTarget=null, mapMode='normal', markType='center';
  const effectivePosition=()=>livePosition??demoPosition;
  const isLive=()=>Boolean(livePosition);
  const yards=(lat1,lng1,lat2,lng2)=>{
    const rad=n=>n*Math.PI/180, R=6371000;
    const dLat=rad(lat2-lat1),dLon=rad(lng2-lng1);
    const a=Math.sin(dLat/2)**2+Math.cos(rad(lat1))*Math.cos(rad(lat2))*Math.sin(dLon/2)**2;
    return Math.round((2*R*Math.asin(Math.min(1,Math.sqrt(a))))*1.0936133);
  };
  function setInstruction(s){$('mapInstruction').textContent=s;}
  function updateStatus(){
    const s=$('gpsStatus');
    if(livePosition){s.className='status-pill on';s.textContent=`● GPS ON ±${Math.round((livePosition.accuracy||0)*1.0936)}YD`;}
    else if(demoPosition){s.className='status-pill test';s.textContent='◇ TEST POINT';}
    else{s.className='status-pill';s.textContent='● GPS OFF';}
  }
  function updateDistances(){
    const pos=effectivePosition(), pts=markers[state.hole]||{};
    ['front','center','back'].forEach(kind=>{
      const id='yard'+kind.charAt(0).toUpperCase()+kind.slice(1);
      $(id).textContent=pos&&pts[kind]?yards(pos.lat,pos.lng,pts[kind].lat,pts[kind].lng):'—';
    });
    const count=['front','center','back'].filter(k=>Boolean(pts[k])).length;
    $('yardageFoot').textContent=!count?'Green coordinates not yet mapped':!pos?'Enable GPS to show green distances':`${isLive()?'GPS':'TEST'} distances in yards · ${count}/3 green positions mapped`;
    updateStatus();
  }
  function setPosition(lat,lng,accuracy=0,mode='live'){
    if(mode==='live'){livePosition={lat,lng,accuracy};demoPosition=null;}
    else if(!livePosition)demoPosition={lat,lng,accuracy};
    if(!map){updateDistances();return;}
    const pos=effectivePosition();
    if(!pos)return;
    if(positionMarker)map.removeLayer(positionMarker);
    if(accuracyCircle)map.removeLayer(accuracyCircle);
    positionMarker=L.circleMarker([pos.lat,pos.lng],{radius:9,weight:3,color:'#fff',fillColor:isLive()?'#1576ed':'#edaa35',fillOpacity:1}).addTo(map).bindPopup(isLive()?'Your reported device location':'TEST POSITION — not a live GPS reading');
    if(isLive()&&accuracy){accuracyCircle=L.circle([pos.lat,pos.lng],{radius:accuracy,color:'#1677eb',weight:1,fillOpacity:.09,interactive:false}).addTo(map);}
    updateDistances();
    if(measureTarget)drawMeasurement();
  }
  function refreshMapMarkers(){
    if(!map)return;
    greenLayers.forEach(l=>map.removeLayer(l));greenLayers=[];
    const pts=markers[state.hole]||{};
    const styles={front:{color:'#e8f5ff',fill:'#2680d3'},center:{color:'#ffffff',fill:'#961f2a'},back:{color:'#ffffff',fill:'#dba02c'}};
    ['front','center','back'].forEach(k=>{
      if(!pts[k])return;
      const p=pts[k],s=styles[k];
      const m=L.circleMarker([p.lat,p.lng],{radius:k==='center'?11:8,weight:3,color:s.color,fillColor:s.fill,fillOpacity:1}).addTo(map)
        .bindTooltip(`${k.toUpperCase()} • Hole ${state.hole}`,{permanent:true,direction:k==='center'?'top':'right',offset:[0,-4]});
      greenLayers.push(m);
    });
    updateDistances();
  }
  function initMap(){
    if(typeof window.L==='undefined'){$('mapUnavailable').hidden=false;setInstruction('Map library offline. Scoring remains available.');return;}
    map=L.map('map',{zoomControl:false,attributionControl:true,preferCanvas:true}).setView(CLUBHOUSE,16);
    satelliteLayer=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:20,maxNativeZoom:19,attribution:'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics and GIS User Community'});
    roadLayer=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'});
    satelliteLayer.addTo(map);
    L.control.zoom({position:'bottomright'}).addTo(map);
    map.on('click',e=>{
      if(mapMode==='mark'){
        markers[state.hole]??={};
        markers[state.hole][markType]={lat:Number(e.latlng.lat.toFixed(8)),lng:Number(e.latlng.lng.toFixed(8))};
        saveMarkers();showToast(`Hole ${state.hole} ${markType} green point saved on this iPad.`);
        setMode('normal');refreshMapMarkers();
      }else if(mapMode==='measure'){
        measureTarget=e.latlng;drawMeasurement();
      }else if(mapMode==='test'){
        if(livePosition){showToast('Live GPS is active; disable GPS or use it for distances.');setMode('normal');return;}
        setPosition(e.latlng.lat,e.latlng.lng,0,'test');setMode('normal');
        showToast('Yellow marker is only a TEST position, not your actual location.');
      }
    });
    let firstError=true;
    satelliteLayer.on('tileerror',()=>{if(firstError){firstError=false;setInstruction('Map imagery unavailable; try Streets or check your network.');}});
    refreshMapMarkers();
    setTimeout(()=>map?.invalidateSize(),200);
  }
  function setMode(mode,point){
    mapMode=mode;markType=point||markType;
    ['measureBtn','markBtn','testBtn'].forEach(id=>$(id).classList.remove('active'));
    if(mode==='mark'){$('markBtn').classList.add('active');setInstruction(`MARKING HOLE ${state.hole} ${markType.toUpperCase()}: tap the correct spot on satellite imagery.`);}
    else if(mode==='measure'){$('measureBtn').classList.add('active');setInstruction('MEASURE: tap any visible point. Requires your GPS location or a TEST point.');}
    else if(mode==='test'){$('testBtn').classList.add('active');setInstruction('TEST POINT: tap a spot to simulate your position (not live GPS).');}
    else setInstruction(`Hole ${state.hole} • interactive course satellite map`);
    if(mode!=='measure'){
      $('measureReadout').hidden=true;
      measureTarget=null;
      if(measureLayer&&map){map.removeLayer(measureLayer);measureLayer=null;}
    }else $('measureReadout').hidden=false;
  }
  function drawMeasurement(){
    if(!map||!measureTarget)return;
    const pos=effectivePosition();
    if(!pos){$('measureReadout').textContent='Turn on GPS or choose Test Point first';return;}
    if(measureLayer)map.removeLayer(measureLayer);
    measureLayer=L.polyline([[pos.lat,pos.lng],measureTarget],{color:'#ffdd74',weight:4,dashArray:'8,7'}).addTo(map);
    $('measureReadout').textContent=`${isLive()?'GPS':'TEST'} → Target: ${yards(pos.lat,pos.lng,measureTarget.lat,measureTarget.lng)} yards`;
  }
  function startGPS(){
    if(!navigator.geolocation){showToast('This device or browser does not provide location services.');return;}
    if(!window.isSecureContext){showToast('Live GPS requires HTTPS hosting or localhost.');return;}
    if(gpsWatch!==null){navigator.geolocation.clearWatch(gpsWatch);gpsWatch=null;livePosition=null;updateStatus();updateDistances();showToast('GPS stopped.');return;}
    $('gpsStatus').textContent='◌ LOCATING…';
    gpsWatch=navigator.geolocation.watchPosition(pos=>{
      setPosition(pos.coords.latitude,pos.coords.longitude,pos.coords.accuracy,'live');
    },err=>{
      let m=err.code===1?'Location permission denied. Enable Location Services for the web app.':err.code===2?'Location unavailable on this device.':'GPS request timed out. Try outdoors.';
      showToast(m);$('gpsStatus').textContent='● GPS UNAVAILABLE';
      if(gpsWatch!==null){navigator.geolocation.clearWatch(gpsWatch);gpsWatch=null;}
    },{enableHighAccuracy:true,maximumAge:3000,timeout:14000});
  }
  function centerMap(){if(!map){showToast('Map has not loaded.');return;}const p=effectivePosition();if(!p){showToast('Start GPS first, or use the Test Point tool.');return;}map.flyTo([p.lat,p.lng],18);}
  function focusCourse(){if(map)map.flyTo(CLUBHOUSE,16);else showToast('Map requires an internet connection.');}
  function toggleLayer(){if(!map)return;if(activeBase==='satellite'){map.removeLayer(satelliteLayer);roadLayer.addTo(map);activeBase='road';$('layerBtn').innerHTML='▧ <span>Streets</span>';}else{map.removeLayer(roadLayer);satelliteLayer.addTo(map);activeBase='satellite';$('layerBtn').innerHTML='▧ <span>Satellite</span>';}}
  function toggleExpand(){const expanded=document.querySelector('.workspace').classList.contains('map-expanded');document.querySelector('.workspace').classList.toggle('map-expanded',!expanded);$('expandBtn').innerHTML=!expanded?'⛶ <span>Show Scores</span>':'⛶ <span>Full Map</span>';setTimeout(()=>map?.invalidateSize(),200);}

  // Modals, saved rounds, and data export
  function openModal(title,html){$('modalTitle').textContent=title;$('modalContent').innerHTML=html;$('modalBackdrop').hidden=false;}
  function closeModal(){$('modalBackdrop').hidden=true;}
  function setupPlayers(){
    const rows=state.players.map((p,i)=>`<div class="player-input-row"><label>Golfer ${i+1}</label><input class="player-name" maxlength="32" data-player="${i}" value="${esc(p.name)}" aria-label="Golfer ${i+1} name"><button class="remove-player" data-player="${i}" title="Remove golfer">Remove</button></div>`).join('');
    openModal('Manage Players',`<div class="message">Up to 5 golfers. Player scores are stored on this iPad, separately from the Berry Creek DH Game.</div><div id="playerInputs">${rows}</div><div><button class="action secondary" id="addPlayer">+ Add Golfer</button><button class="action" id="savePlayers">Save Players</button></div><p class="hint">Changing names will preserve their existing scores. Removing a player removes that player's scores from the current round.</p>`);
    $('addPlayer').onclick=()=>{
      const existing=document.querySelectorAll('#playerInputs .player-name');
      if(existing.length>=5){showToast('Maximum five golfers.');return;}
      const i=existing.length, row=document.createElement('div');row.className='player-input-row';
      row.innerHTML=`<label>Golfer ${i+1}</label><input class="player-name" maxlength="32" value="Player ${i+1}" aria-label="Golfer name"><button class="remove-player" title="Remove golfer">Remove</button>`;
      $('playerInputs').appendChild(row);attachPlayerRemove();
    };
    const attachPlayerRemove=()=>{
      document.querySelectorAll('.remove-player').forEach(btn=>btn.onclick=()=>{
        if(document.querySelectorAll('.player-name').length<=1){showToast('At least one golfer is needed.');return;}
        btn.closest('.player-input-row').remove();
      });
    };attachPlayerRemove();
    $('savePlayers').onclick=()=>{
      const inputs=Array.from(document.querySelectorAll('#playerInputs .player-name'));
      const oldByName=new Map(state.players.map(p=>[p.name,p]));
      // Existing input rows retain their original player indices.
      state.players=inputs.map((inp,i)=>{
        const oldIndex=inp.closest('.player-input-row').querySelector('.remove-player').dataset.player;
        const old=oldIndex!==undefined?state.players[Number(oldIndex)]:null;
        const name=inp.value.trim()||`Player ${i+1}`;
        return {id:old?.id||'p-'+Date.now()+'-'+i,name,scores:old?.scores||Array(18).fill(null)};
      });
      save();render();closeModal();showToast('Golfers updated.');
    };
  }
  function archiveCurrent(){
    if(!roundHasScores())return false;
    const already=history.findIndex(r=>r.id===state.id);
    const snapshot=JSON.parse(JSON.stringify(state));snapshot.archivedAt=new Date().toISOString();
    if(already>=0)history[already]=snapshot;else history.unshift(snapshot);
    history=history.slice(0,80);saveHistory();return true;
  }
  function fmtDate(iso){try{return new Date(iso).toLocaleString(undefined,{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});}catch{return iso;}}
  function roundMenu(){
    openModal('Round Menu',`<div class="message">Round data is saved locally in this browser. It is not shared or synchronized with the DH app or other devices. Saved rounds remain on this iPad unless browser data is cleared.</div><div><button class="action" id="archiveRound">Save Round Snapshot</button><button class="action" id="newRound">Start New Round</button><button class="action secondary" id="exportCSV">Export Scores CSV</button><button class="action secondary" id="exportPins">Export Green Points JSON</button><button class="action secondary" id="importPins">Import Green Points JSON</button><input type="file" accept=".json,application/json" id="pinsFile" hidden></div><h3>Saved Rounds</h3><div id="roundHistory" class="round-list"></div>`);
    const refresh=()=>{
      $('roundHistory').innerHTML=history.length?history.map((r,i)=>`<div class="round-entry"><div><strong>${esc(fmtDate(r.startedAt))}</strong><small>${r.players.length} golfers · ${r.players.reduce((a,p)=>a+holesEntered(p),0)} scores recorded</small></div><button class="action secondary load-round" data-id="${esc(r.id)}">Open</button></div>`).join(''):'<p class="hint">No saved rounds yet. Starting a new round will archive your current scores automatically.</p>';
      document.querySelectorAll('.load-round').forEach(btn=>btn.onclick=()=>{
        const found=history.find(r=>r.id===btn.dataset.id);if(!found)return;
        if(!confirm('Load this saved round? Current scores will first be saved to history.'))return;
        archiveCurrent();state=JSON.parse(JSON.stringify(found));save();render();closeModal();showToast('Saved round loaded.');
      });
    };refresh();
    $('archiveRound').onclick=()=>{if(archiveCurrent()){showToast('Round snapshot saved.');refresh();}else showToast('Enter at least one score before saving a round.');};
    $('newRound').onclick=()=>{
      if(!confirm('Begin a new round? The current round will be added to history if scores have been entered.'))return;
      archiveCurrent();const players=state.players.map(p=>({id:p.id,name:p.name,scores:Array(18).fill(null)}));const tee=state.tee;
      state=newRound();state.players=players;state.tee=tee;save();render();closeModal();showToast('New round started. Previous round saved in history if it contained scores.');
    };
    $('exportCSV').onclick=exportCSV;
    $('exportPins').onclick=()=>download('berry-creek-green-points.json',JSON.stringify({course:'Berry Creek',version:1,markers},null,2),'application/json');
    $('importPins').onclick=()=>$('pinsFile').click();
    $('pinsFile').onchange=async ev=>{
      const file=ev.target.files?.[0];if(!file)return;
      try{
        const raw=JSON.parse(await file.text()),candidate=raw.markers;
        if(!candidate||typeof candidate!=='object')throw new Error('Invalid green-points file');
        const clean={};
        for(let i=1;i<=18;i++){
          const row=candidate[i];if(!row)continue;clean[i]={};
          for(const k of ['front','center','back']){const p=row[k];if(p&&Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&Math.abs(p.lat)<=90&&Math.abs(p.lng)<=180)clean[i][k]={lat:p.lat,lng:p.lng};}
        }
        if(!confirm('Replace green point mappings currently stored on this iPad with the imported mappings?'))return;
        markers=clean;saveMarkers();render();showToast('Green points imported.');closeModal();
      }catch{showToast('Could not read that green-points file.');}
    };
  }
  function download(filename,content,type){
    const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
  }
  function exportCSV(){
    const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
    const rows=[['Player','Tee',...pars.map((_,i)=>'Hole '+(i+1)),'Out','In','Gross Total','To Par','Holes Played']];
    for(const p of state.players){
      const sum=a=>a.reduce((n,v)=>n+(v??0),0);
      const gross=sum(p.scores),played=holesEntered(p),parPlayed=p.scores.reduce((n,s,i)=>n+(s===null?0:pars[i]),0);
      rows.push([p.name,teeName[state.tee],...p.scores.map(x=>x??''),sum(p.scores.slice(0,9)),sum(p.scores.slice(9)),gross,gross-parPlayed,played]);
    }
    download('berry-creek-scores-'+new Date().toISOString().slice(0,10)+'.csv',rows.map(r=>r.map(q).join(',')).join('\r\n'),'text/csv;charset=utf-8');showToast('Score CSV exported.');
  }
  function openCard(){
    const sum=a=>a.reduce((n,v)=>n+(v??0),0);
    const heading=['GOLFER',...Array.from({length:18},(_,i)=>i+1),'OUT','IN','TOT'];
    const row=(arr,klass='')=>`<tr>${arr.map((x,i)=>`<${i===0?'th':'td'} class="${i>=19?'totcol ':''}${klass}">${esc(x)}</${i===0?'th':'td'}>`).join('')}</tr>`;
    const cardRows=state.players.map(p=>{
      const cells=[p.name,...p.scores.map(s=>s??'—'),sum(p.scores.slice(0,9))||'—',sum(p.scores.slice(9))||'—',sum(p.scores)||'—'];
      return `<tr>${cells.map((v,i)=>i===0?`<th>${esc(v)}</th>`:`<td class="${i>=19?'totcol ':''}${i>0&&i<19?'editable':''}" data-player="${esc(p.id)}" data-hole="${i-1}" title="Tap to edit on this hole">${esc(v)}</td>`).join('')}</tr>`;
    }).join('');
    const parsLine=['PAR',...pars,36,36,72];
    const hcpLine=['HCP',...handicaps,'','',''];
    const yardLine=['YARDS',...yardages[state.tee].map(x=>x??'—'),sum(yardages[state.tee].slice(0,9)),sum(yardages[state.tee].slice(9)),sum(yardages[state.tee])];
    openModal('18-Hole Scorecard',`<div class="message">Swipe horizontally to view holes 1–18. Tap a golfer’s hole cell to navigate to that hole and edit the score.</div><div class="score-grid-wrap"><table class="score-grid"><thead>${row(heading)}</thead><tbody>${row(parsLine)}${row(hcpLine)}${row(yardLine)}${cardRows}</tbody></table></div><div style="margin-top:15px"><button class="action" id="cardExport">Export Scores CSV</button><button class="action secondary" id="cardDone">Back to Hole</button></div>`);
    $('cardExport').onclick=exportCSV;$('cardDone').onclick=closeModal;
    document.querySelectorAll('.score-grid td.editable').forEach(c=>c.onclick=()=>{const h=Number(c.dataset.hole)+1;if(h>=1&&h<=18){moveHole(h);closeModal();}});
  }
  function chooseMark(){
    if(!map){showToast('Load the map before calibrating greens.');return;}
    const pts=markers[state.hole]||{};
    openModal(`Map Hole ${state.hole} Green`,`<div class="message"><strong>Calibration tool:</strong> choose a green point, then tap its real position in the satellite map. These points are stored only on this iPad until exported; no approximate green locations are preloaded.</div><p>Mapped for this hole: Front ${pts.front?'✓':'—'} · Center ${pts.center?'✓':'—'} · Back ${pts.back?'✓':'—'}</p><button class="action" data-point="front">Set FRONT</button><button class="action" data-point="center">Set CENTER</button><button class="action" data-point="back">Set BACK</button><button class="action secondary" id="clearPins">Clear This Hole's Points</button><p class="hint">For best results, use accurately surveyed coordinates or precise mapping data. Satellite estimates alone may be off by several yards or more.</p>`);
    document.querySelectorAll('[data-point]').forEach(btn=>btn.onclick=()=>{const point=btn.dataset.point;closeModal();setMode('mark',point);showToast('Now tap the '+point+' edge of the green on the map.');});
    $('clearPins').onclick=()=>{if(!confirm(`Clear all mapped green points for hole ${state.hole}?`))return;delete markers[state.hole];saveMarkers();refreshMapMarkers();updateDistances();closeModal();showToast('Green points cleared.');};
  }

  // UI bindings
  $('prevHole').onclick=()=>moveHole(state.hole-1);
  $('nextHole').onclick=()=>moveHole(state.hole+1);
  $('nextHoleBottom').onclick=()=>moveHole(state.hole+1);
  $('teeSelect').onchange=ev=>{state.tee=ev.target.value;save();render();};
  $('scoreRows').addEventListener('click',ev=>{const btn=ev.target.closest('[data-action]');if(btn)updateScore(Number(btn.dataset.index),btn.dataset.action);});
  $('setupBtn').onclick=setupPlayers;
  $('roundBtn').onclick=roundMenu;
  $('fullCardBtn').onclick=openCard;
  $('closeModal').onclick=closeModal;
  $('modalBackdrop').addEventListener('click',ev=>{if(ev.target===$('modalBackdrop'))closeModal();});
  window.addEventListener('keydown',ev=>{if(ev.key==='Escape'){if(!$('modalBackdrop').hidden)closeModal();else setMode('normal');}else if($('modalBackdrop').hidden&&ev.key==='ArrowRight')moveHole(state.hole+1);else if($('modalBackdrop').hidden&&ev.key==='ArrowLeft')moveHole(state.hole-1);});
  $('locateBtn').onclick=startGPS;
  $('centerBtn').onclick=centerMap;
  $('courseBtn').onclick=focusCourse;
  $('layerBtn').onclick=toggleLayer;
  $('expandBtn').onclick=toggleExpand;
  $('measureBtn').onclick=()=>setMode(mapMode==='measure'?'normal':'measure');
  $('markBtn').onclick=chooseMark;
  $('testBtn').onclick=()=>setMode(mapMode==='test'?'normal':'test');
  render();
  initMap();
  if('serviceWorker' in navigator && window.isSecureContext){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));}
})();
