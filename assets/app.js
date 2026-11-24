/* Wizualizacja - Twoje Domki (próbka). Ceny i zajęte terminy przykładowe, formularz niczego nie wysyła. */
const B = document.body.dataset.base || '';
const PAGE = document.body.dataset.page || '';
const $ = id => document.getElementById(id);
const IMG = name => `${B}img/${name}.jpg`;

/* Domki - ceny przykładowe (cena podstawowa za noc w tygodniu) */
const CABINS = [
  {id:'a', name:'Domek dla dwojga', tab:'Dla dwojga · 2 os.', sub:'sypialnia z łóżkiem podwójnym', max:2, price:260, img:'salon-domku-z-wyjsciem-na-taras',
   feat:['Sypialnia z łóżkiem podwójnym','Salon z wyjściem na taras','Aneks kuchenny i czajnik']},
  {id:'b', name:'Domek rodzinny', tab:'Rodzinny · 4 os.', sub:'sypialnia + rozkładana sofa w salonie', max:4, price:340, img:'salon-z-sofa-i-kuchnia',
   feat:['Sypialnia z łóżkiem podwójnym','Rozkładana sofa dla 2 osób','Kuchnia z płytą indukcyjną']},
  {id:'c', name:'Duży domek', tab:'Duży · 6 os.', sub:'2 sypialnie + rozkładana sofa', max:6, price:440, img:'salon-z-narozna-sofa',
   feat:['2 sypialnie: łóżko podwójne i pojedyncze','Narożna sofa rozkładana','Stół dla 6 osób, klimatyzacja']},
];

/* Zajęte noce - przykładowe [przyjazd, wyjazd) */
const BUSY = {
  a:[['2026-12-23','2026-12-27'],['2027-01-14','2027-01-18'],['2027-02-12','2027-02-15'],['2027-04-30','2027-05-03'],['2027-06-25','2027-07-03'],['2027-07-16','2027-07-25'],['2027-08-06','2027-08-15'],['2027-09-10','2027-09-13'],['2027-10-29','2027-11-01']],
  b:[['2026-12-05','2026-12-07'],['2026-12-24','2026-12-28'],['2027-02-01','2027-02-08'],['2027-05-01','2027-05-04'],['2027-07-03','2027-07-10'],['2027-07-24','2027-08-07'],['2027-08-20','2027-08-27'],['2027-12-24','2027-12-27']],
  c:[['2026-12-12','2026-12-14'],['2026-12-29','2027-01-03'],['2027-01-29','2027-02-01'],['2027-04-29','2027-05-03'],['2027-06-18','2027-06-27'],['2027-07-09','2027-07-18'],['2027-08-01','2027-08-14'],['2027-12-30','2028-01-02']],
};
const SEASON_FROM = new Date(2026,11,1), SEASON_TO = new Date(2027,11,31); // ostatnia noc: 31.12.2027
const MIN_M = 2026*12+11, MAX_M = 2027*12+10; // lewy miesiąc kalendarza: grudzień 2026 - listopad 2027
const MONTHS = ['styczeń','luty','marzec','kwiecień','maj','czerwiec','lipiec','sierpień','wrzesień','październik','listopad','grudzień'];
const MONTHS_GEN = ['stycznia','lutego','marca','kwietnia','maja','czerwca','lipca','sierpnia','września','października','listopada','grudnia'];

const d0 = s => { const [y,m,d] = String(s).split('-').map(Number); return new Date(y,m-1,d); };
const key = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const addDays = (d,n) => new Date(d.getFullYear(), d.getMonth(), d.getDate()+n);
const nightsBetween = (a,b) => Math.round((b-a)/864e5);
const fmt = d => `${d.getDate()} ${MONTHS_GEN[d.getMonth()]} ${d.getFullYear()}`;
const zl = n => n.toLocaleString('pl-PL') + ' zł';
const nTxt = n => n === 1 ? 'noc' : ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100) ? 'noce' : 'nocy');
const osTxt = g => g === 1 ? 'osoba' : (g < 5 ? 'osoby' : 'osób');
const valid = d => d instanceof Date && !isNaN(d);

/* Cennik przykładowy: weekend +40 zł, lipiec-sierpień +60 zł, święta / Sylwester / majówka = cena + 100 zł */
const isHoliday = d => { const m = d.getMonth(), x = d.getDate(); return (m===11 && x>=23) || (m===0 && x===1) || (m===3 && x===30) || (m===4 && x<=2); };
const nightPrice = (cab, d) => {
  const base = CABINS.find(c => c.id===cab).price;
  if(isHoliday(d)) return base + 100;
  return base + ([5,6].includes(d.getDay()) ? 40 : 0) + ([6,7].includes(d.getMonth()) ? 60 : 0);
};
const stayPrice = (cab, a, b) => { let s = 0; for(let d = new Date(a); d < b; d = addDays(d,1)) s += nightPrice(cab,d); return s; };

const isBusyNight = (cab, d) => BUSY[cab].some(([a,b]) => d >= d0(a) && d < d0(b));
const inSeason = d => d >= SEASON_FROM && d <= SEASON_TO;
function rangeFree(cab, a, b){
  for(let d = new Date(a); d < b; d = addDays(d,1)){ if(!inSeason(d) || isBusyNight(cab,d)) return false; }
  return true;
}

let cabin = 'b', viewM = MIN_M, selIn = null, selOut = null;

/* ===== wyniki wyszukiwania ===== */
function renderResults(a, b, g){
  const box = $('results'); if(!box) return;
  const n = nightsBetween(a,b);
  $('resultsHead').textContent = `${fmt(a)} - ${fmt(b)} · ${n} ${nTxt(n)} · ${g} ${osTxt(g)}`;
  box.innerHTML = CABINS.map(c => {
    const fits = g <= c.max, free = rangeFree(c.id,a,b), ok = fits && free, tot = ok ? stayPrice(c.id,a,b) : 0;
    const side = ok
      ? `<span class="avail free">Wolny w tym terminie</span><div class="total">${zl(tot)}</div><small>za ${n} ${nTxt(n)}, średnio ${zl(Math.round(tot/n))} / noc</small><button class="btn btn-clay" type="button" data-pick="${c.id}">Wybierz ten domek</button>`
      : `<span class="avail taken">${fits ? 'Zajęty w tym terminie' : `Za mało miejsc (do ${c.max} os.)`}</span><button class="btn btn-line" type="button" data-cal="${c.id}">Pokaż wolne dni</button>`;
    return `<article class="result ${ok ? '' : 'taken'}">
      <img src="${IMG(c.img)}" alt="${c.name} - wnętrze" loading="lazy" width="500" height="375">
      <div class="r-body"><span class="tag">do ${c.max} ${osTxt(c.max)}</span><h3>${c.name}</h3><div class="muted">${c.sub}</div><ul>${c.feat.map(f => `<li>${f}</li>`).join('')}</ul></div>
      <div class="r-side">${side}</div></article>`;
  }).join('');
  box.querySelectorAll('[data-pick]').forEach(btn => btn.onclick = () => {
    cabin = btn.dataset.pick; selIn = a; selOut = b; showMonth(a); renderTabs(); renderCal(); $('kalendarz').scrollIntoView({behavior:'smooth'});
  });
  box.querySelectorAll('[data-cal]').forEach(btn => btn.onclick = () => {
    cabin = btn.dataset.cal; selIn = null; selOut = null; renderTabs(); renderCal(); $('kalendarz').scrollIntoView({behavior:'smooth'});
  });
}
function showMonth(d){ viewM = Math.min(Math.max(d.getFullYear()*12 + d.getMonth(), MIN_M), MAX_M); }

/* ===== kalendarz ===== */
function renderTabs(){
  const t = $('tabs'); if(!t) return;
  t.innerHTML = CABINS.map(c => `<button type="button" class="tab ${c.id===cabin?'on':''}" data-tab="${c.id}">${c.tab}</button>`).join('');
  t.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => setCabin(b.dataset.tab));
}
function monthHTML(idx){
  const y = Math.floor(idx/12), m = idx%12;
  const first = new Date(y,m,1), days = new Date(y,m+1,0).getDate(), offset = (first.getDay()+6)%7;
  const base = CABINS.find(c => c.id===cabin).price;
  let h = `<div class="month"><h4>${MONTHS[m]} ${y}</h4><div class="grid">`;
  ['pn','wt','śr','cz','pt','so','nd'].forEach(x => h += `<div class="dow">${x}</div>`);
  for(let i=0;i<offset;i++) h += `<div class="day empty"></div>`;
  for(let d=1; d<=days; d++){
    const dt = new Date(y,m,d);
    let cls = 'day', dis = false, lab = '';
    const canBeCheckout = (selIn && !selOut && dt > selIn && rangeFree(cabin, selIn, dt)) || (selOut && key(dt)===key(selOut));
    if(!inSeason(dt)){ cls += ' off'; dis = !canBeCheckout; }
    else if(isBusyNight(cabin,dt) && !canBeCheckout){ cls += ' busy'; dis = true; }
    else { const p = nightPrice(cabin,dt); lab = `<small>${p}</small>`; if(p > base) cls += ' hot'; }
    if(selIn && key(dt)===key(selIn)) cls += ' start';
    if(selOut && key(dt)===key(selOut)) cls += ' end';
    if(selIn && selOut && dt > selIn && dt < selOut) cls += ' in-range';
    h += `<button type="button" class="${cls}" ${dis?'disabled':''} data-d="${key(dt)}" aria-label="${fmt(dt)}">${d}${lab}</button>`;
  }
  return h + `</div></div>`;
}
function renderCal(){
  if(!$('months')) return;
  $('months').innerHTML = monthHTML(viewM) + monthHTML(viewM+1);
  $('prev').disabled = viewM <= MIN_M;
  $('next').disabled = viewM >= MAX_M;
  document.querySelectorAll('#months .day[data-d]').forEach(b => b.addEventListener('click', () => clickDay(d0(b.dataset.d))));
  renderSummary();
}
function clickDay(d){
  if(!selIn || selOut || d <= selIn){ if(inSeason(d) && !isBusyNight(cabin,d)){ selIn = d; selOut = null; } }
  else if(rangeFree(cabin, selIn, d)){ selOut = d; }
  else if(inSeason(d) && !isBusyNight(cabin,d)){ selIn = d; selOut = null; }
  renderCal();
}
function renderSummary(){
  const c = CABINS.find(x => x.id===cabin);
  $('sumCabin').textContent = `${c.name} (do ${c.max} os.)`;
  $('sumIn').textContent = selIn ? fmt(selIn) : 'kliknij dzień w kalendarzu';
  $('sumOut').textContent = selOut ? fmt(selOut) : (selIn ? 'kliknij dzień wyjazdu' : '-');
  const n = selIn && selOut ? nightsBetween(selIn, selOut) : 0;
  $('sumNights').textContent = n ? `${n} ${nTxt(n)}` : '-';
  $('sumTotal').textContent = n ? zl(stayPrice(cabin, selIn, selOut)) : '-';
  $('bookBtn').disabled = !n;
}
function setCabin(id){ cabin = id; if(selIn && selOut && !rangeFree(id,selIn,selOut)) selOut = null; renderTabs(); renderCal(); }

if(PAGE === 'rezerwacja'){
  const P = new URLSearchParams(location.search);
  const DEF_IN = '2026-12-30', DEF_OUT = '2027-01-02';
  let a = d0(P.get('in') || DEF_IN), b = d0(P.get('out') || DEF_OUT), g = +(P.get('g') || 4);
  if(!valid(a) || !valid(b) || !(b > a) || !inSeason(a) || !inSeason(addDays(b,-1))){ a = d0(DEF_IN); b = d0(DEF_OUT); }
  if(!(g >= 1 && g <= 6)) g = 4;
  $('sIn').value = key(a); $('sOut').value = key(b); $('sGuests').value = String(g);
  renderResults(a,b,g);
  const wanted = CABINS.find(c => c.id === P.get('domek'));
  if(wanted){ cabin = wanted.id; if(rangeFree(cabin,a,b) && g <= wanted.max){ selIn = a; selOut = b; } }
  else { const free = CABINS.find(c => rangeFree(c.id,a,b) && g <= c.max); if(free){ cabin = free.id; selIn = a; selOut = b; } }
  showMonth(a); renderTabs(); renderCal();
  if(wanted) setTimeout(() => $('kalendarz').scrollIntoView(), 50);
  $('prev').onclick = () => { viewM--; renderCal(); };
  $('next').onclick = () => { viewM++; renderCal(); };
  $('searchForm').addEventListener('submit', e => {
    e.preventDefault();
    const na = d0($('sIn').value), nb = d0($('sOut').value), ng = +$('sGuests').value;
    if(!valid(na) || !valid(nb) || !(nb > na)){ alert('Data wyjazdu musi być po dacie przyjazdu.'); return; }
    if(!inSeason(na) || !inSeason(addDays(nb,-1))){ alert('W próbce kalendarz obejmuje pobyty od 1 grudnia 2026 do 1 stycznia 2028.'); return; }
    history.replaceState(null, '', `?in=${key(na)}&out=${key(nb)}&g=${ng}`);
    renderResults(na,nb,ng);
    const free = CABINS.find(c => rangeFree(c.id,na,nb) && ng <= c.max);
    if(free){ cabin = free.id; selIn = na; selOut = nb; } else { selIn = null; selOut = null; }
    showMonth(na); renderTabs(); renderCal();
    $('resultsHead').scrollIntoView({behavior:'smooth'});
  });

  /* okno rezerwacji */
  const modal = $('modal');
  $('bookBtn').onclick = () => {
    const c = CABINS.find(x => x.id===cabin), n = nightsBetween(selIn,selOut);
    $('mSummary').innerHTML = `<b>${c.name}</b> (do ${c.max} os.)<br>${fmt(selIn)} - ${fmt(selOut)} · ${n} ${nTxt(n)}<br>Razem: <b>${zl(stayPrice(cabin,selIn,selOut))}</b>`;
    $('mForm').style.display = ''; $('mOk').style.display = 'none';
    modal.classList.add('on');
  };
  $('mClose').onclick = () => modal.classList.remove('on');
  modal.addEventListener('click', e => { if(e.target === modal) modal.classList.remove('on'); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape') modal.classList.remove('on'); });
  $('bookForm').addEventListener('submit', e => {
    e.preventDefault(); // wizualizacja - nic nie jest wysyłane
    $('mForm').style.display = 'none'; $('mOk').style.display = 'block';
  });
}

/* ===== galeria z powiększeniem ===== */
const gal = $('gallery');
if(gal){
  const items = [...gal.querySelectorAll('button')];
  const lb = $('lb'), lbImg = $('lbImg'); let lbI = 0;
  const show = i => { lbI = (i + items.length) % items.length; const im = items[lbI].querySelector('img'); lbImg.src = im.src; lbImg.alt = im.alt; lb.classList.add('on'); };
  items.forEach((b,i) => b.onclick = () => show(i));
  $('lbPrev').onclick = () => show(lbI-1);
  $('lbNext').onclick = () => show(lbI+1);
  $('lbClose').onclick = () => lb.classList.remove('on');
  lb.addEventListener('click', e => { if(e.target === lb) lb.classList.remove('on'); });
  document.addEventListener('keydown', e => {
    if(!lb.classList.contains('on')) return;
    if(e.key === 'Escape') lb.classList.remove('on');
    if(e.key === 'ArrowRight') show(lbI+1);
    if(e.key === 'ArrowLeft') show(lbI-1);
  });
}
