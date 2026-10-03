const params = new URLSearchParams(location.search);
let screen = params.get('screen') || 'inventory';
document.documentElement.dataset.theme = params.get('theme') === 'dark' ? 'dark' : 'light';
const $ = s => document.querySelector(s);
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${{work:'<path d="M4 6h16M4 12h12M4 18h8"/>',character:'<circle cx="12" cy="8" r="3"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',inspect:'<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>',back:'<path d="m10 5-7 7 7 7M3 12h18"/>'}[name]}</svg>`;
const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const items = [
  ['War Mattock','Equipped','Starting gear','—','8 lbs'],['Leather armor','Equipped','Starting gear','—','12 lbs'],
  ['Normal personal effects','Carried','Adventuring gear','—','—'],['Weapon scabbard','Carried','Adventuring gear','—','—'],
  ['Backpack','Carried','Adventuring gear','2 sp','2 lbs'],['Rope, 50 ft','Carried','Adventuring gear','1 sp','5 lbs'],['Rations','Carried','Adventuring gear','3 cp','1 lb']
];
const quantities = {}, carrying = {};
let selected = items[0][0], surface = 'work', rail = 'character', opener = null, lastInspection = null;
const context = (name,money='') => `<div class="context"><h1>${name}</h1>${money?`<span class="money"><b>${money}</b>Gold</span>`:''}<button class="primary" data-action="continue">Continue</button></div>`;
const sectionHead = (title,count,action,label) => `<div class="section-head"><h2>${title}<span class="count">${count}</span></h2><button data-action="${action}">${label}</button></div>`;
const label = (name,control) => `<label><span>${name}</span>${control}</label>`;
const numeric = (name,value='0') => label(name,`<input type="number" value="${value}" aria-label="${name}">`);
const fields = rows => `<dl>${rows.map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`;
const results = () => `<div class="results">${[['Melee','25'],['Missile','20'],['Directed','15'],['Area','10']].map(([name,n])=>`<button data-action="db" data-name="${name}" aria-label="Inspect ${name} DB +${n}"><span class="subline">${name}</span>+${n}</button>`).join('')}</div>`;
function inventory() {
  return context('Outfitting','1 gp') + `<details class="gear-summary"><summary><span>Starting gear<span class="subline">War Mattock · Leather armor</span></span></summary><p class="safe-note">Two saved choices</p><button data-action="gear">Edit starting gear</button></details>` + sectionHead('Inventory','7 items','armory','Armory') +
  `<div class="ledger inventory"><div class="table-head"><span>Item</span><span>Carrying</span><span class="numeric">Value</span><span class="numeric">Weight</span><span class="numeric">Quantity</span></div>${items.map(([name,state,origin,value,weight])=>`<div class="row" data-item="${name}"><button class="identity" data-action="item" data-name="${name}" title="${name}"><span>${name}</span><small class="subline" data-carrying="${name}">${carrying[name]||state} · ${origin}</small></button><span class="cell" data-state="${name}">${carrying[name]||state}</span><span class="cell numeric">${value}</span><span class="cell numeric">${weight}</span><div class="stepper" aria-label="Quantity of ${name}"><button data-action="minus" data-name="${name}" aria-label="Remove one ${name}">−</button><output data-qty="${name}">${quantities[name]||1}</output><button data-action="plus" data-name="${name}" aria-label="Buy one ${name}">+</button></div></div>`).join('')}</div><p class="safe-note">Select an item for carrying and sale. − removes; + buys another unit.</p>`;
}
function loadout() {
  return context('Combat') + sectionHead('Attacks','2','addattack','Add attack') + `<div class="ledger attacks"><div class="table-head"><span>Attack</span><span>Mode</span><span class="numeric">Base</span><span class="numeric">Equip</span><span class="numeric">Misc</span><span class="numeric">OB</span><span></span></div>${[['War Mattock','Melee','Starting gear','+45'],['Dagger','Thrown','Purchased','+20']].map(([name,mode,origin,n])=>`<div class="row"><button class="identity" data-action="ob" data-name="${name}" title="${name}"><span>${name}</span><small class="subline">${mode} · ${origin}</small></button><span class="cell">${mode}</span><span class="cell numeric">${n}</span><span class="cell numeric">0</span><span class="cell numeric">0</span><button class="result" data-action="ob" data-name="${name}" aria-label="Inspect ${name} OB ${n}">${n}<small class="subline">OB</small></button><button class="quiet" data-action="attackedit">Edit</button></div>`).join('')}</div>` + sectionHead('Defense sets','2','defedit','Add set') + `<div class="ledger">${['Travel set','Shield ready'].map(name=>`<div class="defense-row"><div><h3>${name}</h3><small class="subline">Leather armor · ${name==='Travel set'?'No shield':'Target shield'}</small></div>${results()}<button class="quiet" data-action="defedit">Edit</button></div>`).join('')}</div><p class="safe-note">OB and DB open their accepted breakdown. Edit opens the owning workspace.</p>`;
}
function editorHeader(name,type,total=false) {
  return context('Combat') + `<div class="editor-nav"><button class="quiet" data-action="loadout">Back to loadout</button><span> / ${type}</span></div><div class="editor-top"><div><span class="eyebrow">${type}</span><h2>${name}</h2><span class="subline">${total?'Melee · Starting gear':'Leather armor · No shield'}</span></div>${total?'<button class="result" data-action="ob" data-name="War Mattock" aria-label="Inspect War Mattock OB +45"><span class="subline">Total OB</span>+45</button>':''}</div>`;
}
function defense() {
  return editorHeader('Travel set','Defense set') + `<div class="defense-results">${results()}</div><div class="form"><section class="editor-section">${label('Set name','<input value="Travel set">')}</section><section class="editor-section"><h3>Equipment</h3><div class="equipment-grid">${[['Armor','Leather armor'],['Shield','None'],['Defensive item','None']].map(([name,value])=>`<div class="pair">${label(name,`<select><option>${value}</option><option>Choose inventory item</option><option>Free text</option></select>`)}${label('Bonus',`<input type="number" placeholder="Auto" aria-label="${name} bonus">`)}</div>`).join('')}</div><p class="safe-note">Blank bonuses use the selected item's accepted bonus.</p></section><details><summary><span>Other adjustments<small class="subline">Automatic · Adrenal Defense off</small></span></summary><div class="disclosure-body">${numeric('Special bonus')}<label class="checks"><input type="checkbox">Use Adrenal Defense</label></div></details><details><summary>Set actions</summary><div class="disclosure-body"><button class="danger" data-action="remove">Remove defense set</button></div></details></div>`;
}
function options() {
  return `<details id="critical"><summary><span>Critical policy<small class="subline">Attack table default</small></span></summary><div class="disclosure-body">${label('Policy','<select><option>Attack table default</option><option>Custom critical</option></select>')}</div></details>${['Equipment modifiers','Other modifiers'].map(name=>`<details><summary><span>${name}<small class="subline">No modifiers · +0 OB</small></span></summary><div class="disclosure-body"><button data-action="modifier">Add modifier</button><div class="mods"></div></div></details>`).join('')}<details ${screen==='options'?'open':''}><summary><span>Operational details<small class="subline">Fumble 1–5 · Range bands off</small></span></summary><div class="disclosure-body"><label class="checks"><input type="checkbox">Include range bands</label><label class="checks"><input type="checkbox" checked>Include fumble</label><div class="pair">${numeric('Fumble low','1')}${numeric('Fumble high','5')}</div></div></details><details><summary>Attack actions</summary><div class="disclosure-body"><button class="danger" data-action="remove">Remove attack</button></div></details>`;
}
function attack() {
  return editorHeader('War Mattock','Attack',true) + `<div class="form"><section class="editor-section"><div class="fields">${label('Attack name','<input value="War Mattock">')}<div class="pair">${label('Use','<select><option>Melee</option><option>Thrown</option></select>')}${numeric('Mode bonus')}</div></div></section><section class="editor-section"><h3>Base formula</h3><div class="formula-type">${label('Formula type','<select><option>Single skill</option><option>Combined skills</option></select>')}</div><div class="formula"><div><h3>Weapon – 2H</h3><p>War Mattock · accepted total <b>+45</b></p></div><button class="quiet" data-action="skill">Change</button></div></section>${options()}<p class="safe-note">Complete edits save automatically in the app.</p></div>`;
}
function setActiveSurface(next) {
  surface=next;document.body.classList.toggle('inspecting',surface!=='work');
  document.querySelectorAll('.bottom button').forEach(b=>b.setAttribute('aria-current',b.dataset.action===surface?'page':'false'));
}
function panel(title,body,type='Inspector') {
  rail=type==='Character'?'character':'inspect';
  $('#inspector').innerHTML=`<nav class="rail-tabs" aria-label="Side panel"><button data-action="character" aria-selected="${rail==='character'}">Character</button><button data-action="inspect" aria-selected="${rail==='inspect'}">Inspector</button></nav><div class="panel-heading">${screen==='inventory'?'Outfitting':'Combat'} / ${type}</div><div class="panel-body">${title?`<span class="eyebrow">${type}</span><h2>${title}</h2>`:''}${body}</div><footer class="panel-back"><button data-action="work">${icon('back')}Back to ${screen==='inventory'?'inventory':screen==='loadout'?'loadout':'editing'}</button></footer>`;
  document.querySelectorAll('.row').forEach(r=>r.classList.toggle('is-selected',r.dataset.item===selected&&type==='Item'));
}
function inspect(title,body,type='Inspector') {
  if(!document.body.classList.contains('inspecting'))opener=document.activeElement;
  lastInspection={title,body,type};panel(title,body,type);setActiveSurface('inspect');
  if(innerWidth<1200)$('#inspector .panel-back button').focus({preventScroll:true});
}
function character(open=true) {
  if(open&&!document.body.classList.contains('inspecting'))opener=document.activeElement;
  panel('',`<div class="character-mark"><span class="monogram">B</span><div><h2>Boris Casoy</h2><span class="subline">Level 1 · Character draft</span></div></div><h3>At a glance</h3>${fields([['Gold','1 gp'],['Attacks','2'],['Defense sets','2']])}<h3>Combat</h3>${fields([['War Mattock OB','+45'],['Melee DB','+25'],['Missile DB','+20']])}<div class="rail-note">Illustrative character values.<br>Select an item or result to inspect it.</div>`,'Character');
  if(open)setActiveSurface('character');
}
function back() {setActiveSurface('work');if(opener?.isConnected)opener.focus({preventScroll:true});}
function render() {
  setActiveSurface('work');$('#step').textContent=screen==='inventory'?'9/11 · Outfitting':'10/11 · Combat';
  $('.desktop-steps').innerHTML=['Race','Culture','Profession','Talents','Stats','Adolescence','Packages','Apprentice','Outfitting','Combat','Review'].map(name=>`<span class="${name===(screen==='inventory'?'Outfitting':'Combat')?'active':''}">${name}</span>`).join('');
  $('#work').innerHTML=`<div class="work-content ${['defense','attack','options'].includes(screen)?'is-editor':''}">${screen==='inventory'?inventory():screen==='loadout'?loadout():screen==='defense'?defense():attack()}</div>`;
  $('#work').scrollTop=0;character(false);
  if(screen==='options')requestAnimationFrame(()=>$('#work').scrollTop=$('#critical').offsetTop-80);
}
function toast(message) {$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>$('#toast').hidden=true,3500);}
function item(name) {
  selected=name;const [,state,origin,value,weight]=items.find(x=>x[0]===name)||items[0];
  inspect(name,`<p>${origin}</p>${fields([['Value',value],['Weight',weight],['Quantity',quantities[name]||1]])}<div class="form">${label('Carrying',`<select id="carrying">${['Equipped','Carried','Not carried'].map(s=>`<option ${s===(carrying[name]||state)?'selected':''}>${s}</option>`).join('')}</select>`)}</div><button data-action="sell">Sell item</button><p class="safe-note">Mock: carrying changes the displayed state; character values remain illustrative.</p>`,'Item');
}
document.body.addEventListener('change',e=>{
  if(e.target.id==='carrying') {carrying[selected]=e.target.value;const origin=items.find(x=>x[0]===selected)[2];document.querySelectorAll('[data-state]').forEach(x=>{if(x.dataset.state===selected)x.textContent=e.target.value});document.querySelectorAll('[data-carrying]').forEach(x=>{if(x.dataset.carrying===selected)x.textContent=e.target.value+' · '+origin});}
});
document.body.addEventListener('click',e=>{
  const b=e.target.closest('[data-action]');if(!b)return;const a=b.dataset.action,name=b.dataset.name;
  if(a==='work')back();
  else if(a==='character')character();
  else if(a==='item')item(name);
  else if(a==='inspect'){if(lastInspection&&lastInspection.type!=='Item')inspect(lastInspection.title,lastInspection.body,lastInspection.type);else item(selected);}
  else if(a==='ob')inspect(name||'War Mattock',`<p>Offensive Bonus</p>${fields([['Base skill',name==='Dagger'?'+20':'+45'],['Equipment','0'],['Character','0'],['Other modifiers','0'],['Total OB',name==='Dagger'?'+20':'+45']])}<button data-action="attackedit">Edit attack</button><p class="safe-note">Illustrative accepted result. The application opens its existing Breakdown Story.</p>`,'Attack');
  else if(a==='db')inspect(name+' DB',`<p>Defensive Bonus · Travel set</p>${fields([['Result',({Melee:'+25',Missile:'+20',Directed:'+15',Area:'+10'})[name]],['Source','Accepted projection']])}<p>Equipment and character contributions are explained here in the application.</p><button data-action="defedit">Edit defense set</button>`,'Defense');
  else if(['attackedit','defedit','loadout'].includes(a)){screen=a==='attackedit'?'attack':a==='defedit'?'defense':'loadout';render();}
  else if(a==='plus'||a==='minus'){quantities[name]=Math.max(1,(quantities[name]||1)+(a==='plus'?1:-1));document.querySelectorAll('[data-qty]').forEach(x=>{if(x.dataset.qty===name)x.textContent=quantities[name]});toast(a==='plus'?'Mock: quantity increased; gold is unchanged.':'Mock: remove one without sale proceeds.');}
  else if(a==='modifier')b.parentElement.querySelector('.mods').insertAdjacentHTML('beforeend',`<div class="pair">${label('Description','<input placeholder="Modifier name">')}${numeric('Bonus')}</div>`);
  else if(a==='sell')inspect('Sell '+esc(selected),`<div class="form">${numeric('Sale amount')}</div><p>Sale retains its own confirmation flow.</p><button class="primary" data-action="simconfirm">Confirm sale · mock</button>`,'Sale');
  else if(a==='remove')toast('Mock: removal requires a named confirmation.');
  else if(['armory','gear','addattack','skill'].includes(a))inspect(a==='skill'?'Projected skill':a==='addattack'?'Available attacks':'Armory',`<p>Existing catalog flow retained.</p><div class="form">${label('Search','<input placeholder="Search catalog">')}</div>${fields([['War Mattock','Starting gear'],['Dagger','Weapon catalog']])}<button data-action="simconfirm">Choose · mock</button>`,'Catalog');
  else toast(a==='continue'?'End of this mock. Record your opinion in the review panel.':'Demonstration only. No character was changed.');
});
document.querySelectorAll('.bottom button').forEach(b=>b.innerHTML=icon(b.dataset.action==='work'?'work':b.dataset.action==='character'?'character':'inspect')+`<span>${b.dataset.action==='work'?'Work':b.dataset.action==='character'?'Character':'Inspector'}</span>`);
render();
