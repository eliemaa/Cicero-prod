(function(){
  var root=document.documentElement; root.classList.add('js');
  var D=window.CICERO_I18N||null;
  var SUP=['en','ar','fr','de','es','it','pt'];
  var NAMES={en:'English',ar:'العربية',fr:'Français',de:'Deutsch',es:'Español',it:'Italiano',pt:'Português'};
  var HTMLLANG={en:'en-US',ar:'ar',fr:'fr',de:'de',es:'es',it:'it',pt:'pt-BR'};
  var LS='cicero.lang', cur='en';
  function store(k,v){try{localStorage.setItem(k,v)}catch(e){}}
  function recall(k){try{return localStorage.getItem(k)}catch(e){return null}}
  function T(k){var t=D&&D.js&&D.js[cur]&&D.js[cur][k];return t||(D&&D.js&&D.js.en&&D.js.en[k])||k}
  function detect(){
    var q=(location.search.match(/[?&]lang=([a-z]{2})/)||[])[1]; if(q&&SUP.indexOf(q)>=0) return q;
    var s=recall(LS); if(s&&SUP.indexOf(s)>=0) return s;
    var nl=navigator.languages||[navigator.language||'en'];
    for(var i=0;i<nl.length;i++){var c=String(nl[i]).slice(0,2).toLowerCase(); if(SUP.indexOf(c)>=0) return c}
    return 'en';
  }

  var pages=[].slice.call(document.querySelectorAll('[data-page]'));
  var ids=pages.map(function(p){return p.getAttribute('data-page')});
  var alias={arabic:['languages','arabic-spotlight'],edrm:['platform','edrm-s'],studies:['research-four-ways','studies-s']};
  var menuBtn=document.getElementById('menu-btn'), mnav=document.getElementById('mnav');
  var lbtn=document.getElementById('lang-btn'), lmenu=document.getElementById('lang-menu');

  // Language: swap every translatable block and attribute, then set direction
  function applyLocale(loc){
    if(SUP.indexOf(loc)<0) loc='en';
    cur=loc;
    if(D){
      var S=D.s[loc]||{}, B=D.s.en;
      [].forEach.call(document.querySelectorAll('[data-t]'),function(el){
        var k=el.getAttribute('data-t'), v=S[k]; if(v==null) v=B[k];
        if(v!=null&&el.innerHTML!==v) el.innerHTML=v;
      });
      [].forEach.call(document.querySelectorAll('[data-ta]'),function(el){
        el.getAttribute('data-ta').split('|').forEach(function(p){
          var i=p.indexOf(':'), a=p.slice(0,i), k=p.slice(i+1), v=S[k]; if(v==null) v=B[k];
          if(v!=null) el.setAttribute(a,v);
        });
      });
    }
    root.setAttribute('lang',HTMLLANG[loc]); root.setAttribute('dir',loc==='ar'?'rtl':'ltr');
    lbtn.querySelector('.cur').textContent=NAMES[loc];
    lbtn.setAttribute('aria-label',T('language')+': '+NAMES[loc]);
    [].forEach.call(lmenu.querySelectorAll('[data-setlang]'),function(b){b.setAttribute('aria-checked',String(b.getAttribute('data-setlang')===loc))});
    [].forEach.call(document.querySelectorAll('a[data-setlang]'),function(a){a.classList.toggle('is-current',a.getAttribute('data-setlang')===loc)});
    [].forEach.call(document.querySelectorAll('.site-lang-name'),function(b){b.textContent=NAMES[loc];b.setAttribute('lang',HTMLLANG[loc])});
    [].forEach.call(document.querySelectorAll('.lchip,.lcard'),function(c){
      var b=c.querySelector('b'), s=c.querySelector('span'); if(b&&s) s.hidden=b.textContent.trim().toLowerCase()===s.textContent.trim().toLowerCase();
    });
    menuBtn.textContent=T(mnav.hidden?'menu':'close');
    root.classList.remove('i18n-wait');
    try{document.dispatchEvent(new Event('cicero:locale'))}catch(e){}
  }

  function closeLang(){lmenu.hidden=true;lbtn.setAttribute('aria-expanded','false')}
  lbtn.addEventListener('click',function(e){
    e.stopPropagation(); var open=lmenu.hidden; lmenu.hidden=!open; lbtn.setAttribute('aria-expanded',String(open));
    if(open){(lmenu.querySelector('[aria-checked="true"]')||lmenu.querySelector('button')).focus()}
  });
  lmenu.addEventListener('keydown',function(e){
    var items=[].slice.call(lmenu.querySelectorAll('button')), i=items.indexOf(document.activeElement);
    if(e.key==='Escape'){closeLang();lbtn.focus()}
    else if(e.key==='ArrowDown'){e.preventDefault();items[(i+1)%items.length].focus()}
    else if(e.key==='ArrowUp'){e.preventDefault();items[(i-1+items.length)%items.length].focus()}
  });
  document.addEventListener('click',function(e){
    var t=e.target.closest&&e.target.closest('[data-setlang]');
    if(t){e.preventDefault();var l=t.getAttribute('data-setlang');store(LS,l);applyLocale(l);closeLang();return}
    if(!lmenu.hidden&&!(e.target.closest&&e.target.closest('.langsel'))) closeLang();
  });

  function closeMenu(){mnav.hidden=true;menuBtn.setAttribute('aria-expanded','false');menuBtn.textContent=T('menu')}
  menuBtn.addEventListener('click',function(){var open=mnav.hidden;mnav.hidden=!open;menuBtn.setAttribute('aria-expanded',String(open));menuBtn.textContent=T(open?'close':'menu')});

  function section(id){
    if(id.indexOf('post-')===0||id.indexOf('research-')===0||id.indexOf('guide-')===0) return 'insights';
    return id;
  }
  function jump(y){try{window.scrollTo({top:y,left:0,behavior:'instant'})}catch(e){window.scrollTo(0,y)}}
  var PAGE=document.body.getAttribute('data-page')||'home';
  function fileFor(id){return id==='home'?'index.html':id+'.html'}
  function route(){
    pages.forEach(function(p){p.classList.add('active')});
    var nav=fileFor(section(PAGE));
    [].forEach.call(document.querySelectorAll('.nav a, .mnav a'),function(a){
      if(a.getAttribute('href')===nav) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
    });
    closeMenu(); closeLang();
  }
  document.addEventListener('cicero:locale',function(){route()});

  // Quote carousel: slides every 5 seconds with the next quote showing beside the current one.
  // Pauses on hover, focus, when off screen, or on request.
  [].forEach.call(document.querySelectorAll('[data-qc]'),function(qc){
    var track=qc.querySelector('.qc-track'), dots=[].slice.call(qc.querySelectorAll('.qc-dots button'));
    var pauseBtn=qc.querySelector('[data-qc-pause]'), timer=null, hover=false, seen=true, moving=false;
    var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches, stopped=reduce;
    function list(){return [].slice.call(track.children)}
    function mark(){
      var s=list();
      s.forEach(function(el,k){el.classList.toggle('is-on',k===0);el.classList.toggle('is-far',k>1);if(k===0)el.removeAttribute('aria-hidden');else el.setAttribute('aria-hidden','true')});
      var cur=+s[0].getAttribute('data-i');
      dots.forEach(function(d,k){if(k===cur)d.setAttribute('aria-current','true');else d.removeAttribute('aria-current')});
    }
    function gap(){var s=list();return s[1].getBoundingClientRect().left-s[0].getBoundingClientRect().left}
    function after(cb){
      var fired=false;function f(e){if(e&&e.target!==track)return;if(fired)return;fired=true;track.removeEventListener('transitionend',f);cb()}
      track.addEventListener('transitionend',f);setTimeout(f,900);
    }
    function next(){
      if(moving)return; var s=list();
      if(reduce){track.appendChild(s[0]);mark();return}
      moving=true; var d=gap();
      s[0].classList.remove('is-on');s[1].classList.add('is-on');s[1].classList.remove('is-far');if(s[2])s[2].classList.remove('is-far');
      track.classList.add('anim');track.style.transform='translateX('+(-d)+'px)';
      after(function(){track.classList.remove('anim');track.appendChild(list()[0]);track.style.transform='';mark();moving=false});
    }
    function prev(){
      if(moving)return; var s=list();
      track.insertBefore(s[s.length-1],s[0]);
      if(reduce){mark();return}
      moving=true; var d=gap();
      track.style.transform='translateX('+(-d)+'px)';track.getBoundingClientRect();mark();
      track.classList.add('anim');track.style.transform='';
      after(function(){track.classList.remove('anim');moving=false});
    }
    function go(k){if(moving)return; var guard=0; while(+list()[0].getAttribute('data-i')!==k&&guard++<10) track.appendChild(list()[0]); mark()}
    function label(){pauseBtn.setAttribute('aria-pressed',String(stopped));pauseBtn.setAttribute('aria-label',T(stopped?'play':'pause'))}
    function tick(){clearTimeout(timer);timer=null;if(!stopped&&!hover&&seen&&!document.hidden) timer=setTimeout(function(){next();tick()},5000)}
    qc.querySelector('[data-qc-prev]').addEventListener('click',function(){prev();tick()});
    qc.querySelector('[data-qc-next]').addEventListener('click',function(){next();tick()});
    dots.forEach(function(d,k){d.addEventListener('click',function(){go(k);tick()})});
    track.addEventListener('click',function(e){var f=e.target.closest&&e.target.closest('.qc-slide');if(f&&!f.classList.contains('is-on')){next();tick()}});
    pauseBtn.addEventListener('click',function(){stopped=!stopped;label();tick()});
    qc.addEventListener('mouseenter',function(){hover=true;tick()});
    qc.addEventListener('mouseleave',function(){hover=false;tick()});
    qc.addEventListener('focusin',function(){hover=true;tick()});
    qc.addEventListener('focusout',function(e){if(!qc.contains(e.relatedTarget)){hover=false;tick()}});
    document.addEventListener('visibilitychange',tick);
    document.addEventListener('cicero:locale',label);
    if('IntersectionObserver' in window) new IntersectionObserver(function(es){seen=es[0].isIntersecting;tick()}).observe(qc);
    mark(); label(); tick();
  });

  // Pricing calculator: figures from the October 2026 pricing proposal and public calculator
  (function(){
    var pc=document.querySelector('[data-pc]'); if(!pc) return;
    var LAW=[[1,350,1000],[10,300,1000],[50,250,1000],[201,200,1000]], LAWMAX=1000;
    var CORP=[[1,350,1000],[11,325,950],[26,300,900],[51,275,850]], CORPMAX=100, EA_DOCS=1500, BASE=1000, POOL=10000;
    // Translation: $4 a document, and each larger plan is 5% cheaper per document than the one below.
    var TR=[[0,0],[3000,12000],[6000,22800],[12000,43200],[30000,102000]];
    var DISC={1:0,2:.05,3:.15};
    var st={seg:'law',n:10,pools:0,tr:0,per:'month',term:1};
    var nIn=pc.querySelector('#pc-n'), range=pc.querySelector('#pc-range'), poolsIn=pc.querySelector('#pc-pools');
    function each(sel,fn){[].forEach.call(pc.querySelectorAll(sel),fn)}
    function loc(){var l=root.getAttribute('lang')||'en';return l==='ar'?'ar-u-nu-latn':l}
    function money(v,neg){var s;if(loc()==='ar-u-nu-latn'){s='US$'+num(v);return '\u2066'+(neg?'\u2212':'')+s+'\u2069'}
      try{s=new Intl.NumberFormat(loc(),{style:'currency',currency:'USD',currencyDisplay:'narrowSymbol',maximumFractionDigits:0}).format(Math.round(v))}catch(e){s='$'+Math.round(v)}return (neg?'\u2212':'')+s}
    function num(v){try{return new Intl.NumberFormat(loc(),{maximumFractionDigits:0}).format(Math.round(v))}catch(e){return String(Math.round(v))}}
    function lawTier(n){var t=LAW[0];for(var i=0;i<LAW.length;i++) if(n>=LAW[i][0]) t=LAW[i];return t}
    function tier(T,n){var t=T[0];for(var i=0;i<T.length;i++) if(n>=T[i][0]) t=T[i];return t}
    function corp(n){var t=tier(CORP,n);return {rate:t[1],seats:n*t[1],ea:n*t[2]}}
    function max(){return st.seg==='law'?LAWMAX:CORPMAX}
    function toRange(n){return st.seg==='law'?Math.round(Math.log(n)/Math.log(LAWMAX)*1000):Math.round((n-1)/(CORPMAX-1)*1000)}
    function fromRange(v){return st.seg==='law'?Math.max(1,Math.round(Math.pow(LAWMAX,v/1000))):Math.round(1+v/1000*(CORPMAX-1))}
    function set(k,v){each('[data-o="'+k+'"]',function(e){e.textContent=v})}
    function show(){
      each('[data-show]',function(e){e.hidden=e.getAttribute('data-show').split(' ').indexOf(st.seg)<0});
      each('[data-per]',function(e){e.hidden=e.getAttribute('data-per')!==st.per});
      each('[data-term]',function(e){e.hidden=e.getAttribute('data-term').split(' ').indexOf(String(st.term))<0});
      each('.pc-seg',function(l){l.classList.toggle('is-on',l.querySelector('input').checked)});
      each('.pc-plans label',function(l){l.classList.toggle('is-on',l.querySelector('input').checked)});
    }
    function calc(){
      if(st.seg!=='law'&&st.seg!=='corp') return;
      var n=st.n, f=st.per==='month'?1/12:1, seatsM, once, rate=0, incl, hint=null, i;
      if(st.seg==='law'){
        var t=lawTier(n); rate=t[1]; seatsM=n*rate; once=st.pools*POOL; incl=n*t[2]*12;
        for(i=0;i<LAW.length;i++){var th=LAW[i][0]; if(th>n){var tot=th*LAW[i][1]; if(tot<seatsM) hint={add:th-n,rate:LAW[i][1],save:(seatsM-tot)*12}; break}}
      } else {
        var c=corp(n); rate=c.rate; seatsM=c.seats; once=c.ea; incl=n*BASE;
        for(i=0;i<CORP.length;i++){var th2=CORP[i][0]; if(th2>n){var tot2=th2*CORP[i][1]; if(tot2<seatsM) hint={add:th2-n,rate:CORP[i][1],save:(seatsM-tot2)*12}; break}}
      }
      var trA=TR[st.tr][1], list=seatsM*12+trA, d=DISC[st.term]||0, renew=list*(1-d), signup=renew+once;
      set('save',money(list*d*f,true)); set('renew3',money(renew)); set('termTotal',money(renew*st.term+once));
      set('n',num(n)); set('n2',num(n)); set('n3',num(n)); set('rate',money(rate)); set('rate2',money(rate)); set('avg',money(seatsM/n));
      set('big',money(renew*f)); set('renew',money(renew)); set('renew2',money(renew));
      set('seats',money(seatsM*12*f)); set('tr',money(trA*f)); set('once',money(once)); set('signup',money(signup));
      set('incl',num(incl)); set('eaDocs',num(n*EA_DOCS)); set('eaFee',money(st.seg==='corp'?once:0));
      for(i=0;i<TR.length;i++) set('tr'+i,money(TR[i][1]*f));
      var pl=pc.querySelector('input[name="pc-tr"]:checked'); set('plan',pl?pl.parentNode.querySelector('b').textContent:'');
      var h=pc.querySelector('[data-pc-hint]');
      if(hint){h.hidden=false;set('hintAdd',num(hint.add));set('hintRate',money(hint.rate));set('hintSave',money(hint.save))} else h.hidden=true;
      each('.pc-presets button',function(b){b.classList.toggle('on',+b.getAttribute('data-p')===n)});
    }
    function setN(v,from){
      var m=max(); v=parseInt(v,10); if(isNaN(v)) v=1;
      var over=v>m; v=Math.max(1,Math.min(m,v)); st.n=v;
      pc.querySelector('[data-pc-over]').hidden=!over;
      if(from!=='input') nIn.value=v; if(from!=='range') range.value=toRange(v);
      nIn.max=m; calc();
    }
    each('input[name="pc-seg"]',function(r){r.addEventListener('change',function(){st.seg=r.value;show();if(st.seg==='law'||st.seg==='corp') setN(st.n)})});
    each('input[name="pc-per"]',function(r){r.addEventListener('change',function(){st.per=r.value;show();calc()})});
    each('input[name="pc-term"]',function(r){r.addEventListener('change',function(){st.term=+r.value;show();calc()})});
    each('input[name="pc-tr"]',function(r){r.addEventListener('change',function(){st.tr=+r.value;show();calc()})});
    nIn.addEventListener('input',function(){if(nIn.value!=='') setN(nIn.value,'input')});
    nIn.addEventListener('change',function(){setN(nIn.value)});
    range.addEventListener('input',function(){setN(fromRange(+range.value),'range')});
    each('[data-pc-n]',function(b){b.addEventListener('click',function(){setN(st.n+(+b.getAttribute('data-pc-n')))})});
    each('.pc-presets button',function(b){b.addEventListener('click',function(){setN(+b.getAttribute('data-p'))})});
    function setPools(v){v=parseInt(v,10);if(isNaN(v)) v=0;st.pools=Math.max(0,Math.min(100,v));poolsIn.value=st.pools;calc()}
    poolsIn.addEventListener('change',function(){setPools(poolsIn.value)});
    poolsIn.addEventListener('input',function(){if(poolsIn.value!=='') setPools(poolsIn.value)});
    each('[data-pc-pools]',function(b){b.addEventListener('click',function(){setPools(st.pools+(+b.getAttribute('data-pc-pools')))})});
    // Carry the plan into the request form
    var cta=pc.querySelector('[data-pc-cta]');
    if(cta) cta.addEventListener('click',function(){
      var msg={set value(v){try{sessionStorage.setItem('cicero.plan',v)}catch(e){}}};
      var seg=pc.querySelector('.pc-seg.is-on b'), sum=pc.querySelector('.pc-sum');
      var term=pc.querySelector('input[name="pc-term"]:checked');
      var lines=[seg?seg.textContent:'', pc.querySelector('.pc-chip').textContent.replace(/\s+/g,' ').trim(), term?term.parentNode.textContent.replace(/\s+/g,' ').trim():''];
      [].forEach.call(sum.querySelectorAll('.pc-lines > div'),function(d){
        var dt=d.querySelector('dt').cloneNode(true);[].forEach.call(dt.querySelectorAll('[hidden]'),function(x){x.remove()});
        var sm=dt.querySelector('small'), note=sm?sm.textContent.replace(/\s+/g,' ').trim():''; if(sm) sm.remove();
        lines.push(dt.textContent.replace(/\s+/g,' ').trim()+(note?' ('+note+')':'')+': '+d.querySelector('dd').textContent)});
      lines.push(pc.querySelector('.pc-due span').textContent+': '+pc.querySelector('.pc-due b').textContent);
      [].forEach.call(pc.querySelectorAll('.pc-renew'),function(p){if(!p.hidden) lines.push(p.textContent.replace(/\s+/g,' ').trim())});
      msg.value=lines.filter(Boolean).join('\n');
    });
    document.addEventListener('cicero:locale',function(){show();calc()});
    show(); setN(10);
  })();

  // Accordion. Wide screens: one item open at a time, its screen alongside, and scrolling the list opens each in turn.
  // Phones: each item's screen sits inside it. Items unfold as they come up from the bottom of the screen and stay open,
  // so nothing above what the reader is looking at ever changes height and the page never has to be moved.
  [].forEach.call(document.querySelectorAll('[data-acc]'),function(acc){
    var items=[].slice.call(acc.querySelectorAll('.acc-item'));
    var panels=[].slice.call(acc.querySelectorAll('.acc-panel'));
    var list=acc.querySelector('.acc-list'), wide=window.matchMedia('(min-width: 901px)'), lock=0, ticking=false, cur=0;
    var stage=acc.querySelector('.acc-stage');
    function set(j,on){items[j].classList.toggle('on',on);panels[j].classList.toggle('on',on);items[j].querySelector('button').setAttribute('aria-expanded',String(on))}
    function open(i){cur=i;items.forEach(function(x,j){set(j,j===i)})}
    function place(){
      panels.forEach(function(p,j){var home=wide.matches?stage:items[j]; if(p.parentNode!==home) home.appendChild(p)});
      if(wide.matches) open(cur);
    }
    items.forEach(function(item,i){
      item.querySelector('button').addEventListener('click',function(){
        if(wide.matches){open(i);lock=Date.now()+1500;return}
        item.setAttribute('data-seen','');
        set(i,!item.classList.contains('on'));
      });
    });
    if(wide.addEventListener) wide.addEventListener('change',place); else if(wide.addListener) wide.addListener(place);
    place();
    function spy(){
      ticking=false;
      if(!acc.offsetParent) return;
      var vh=window.innerHeight, r=list.getBoundingClientRect();
      if(r.bottom<0||r.top>vh) return;
      if(!wide.matches){
        // open each item as its title rises past three quarters of the screen; it only grows downward
        for(var k=0;k<items.length;k++){
          var it=items[k]; if(it.hasAttribute('data-seen')) continue;
          if(it.getBoundingClientRect().top<vh*.75){it.setAttribute('data-seen','');set(k,true)}
        }
        return;
      }
      if(Date.now()<lock) return;
      var line=vh*.5, i=0;
      for(var k2=0;k2<items.length;k2++) if(items[k2].getBoundingClientRect().top<line) i=k2;
      if(i!==cur) open(i);
    }
    window.addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(spy)}},{passive:true});
  });

  // Work streams: one tab per kind of matter
  [].forEach.call(document.querySelectorAll('[data-tabs]'),function(box){
    var tabs=[].slice.call(box.querySelectorAll('[role="tab"]'));
    function pick(i,focus){
      tabs.forEach(function(t,j){var on=j===i;t.setAttribute('aria-selected',String(on));t.tabIndex=on?0:-1;document.getElementById(t.getAttribute('aria-controls')).hidden=!on});
      if(focus) tabs[i].focus();
    }
    tabs.forEach(function(t,i){
      t.addEventListener('click',function(){pick(i)});
      t.addEventListener('keydown',function(e){
        var n=tabs.length, k=e.key, rtl=root.getAttribute('dir')==='rtl';
        if(k==='ArrowRight'||k==='ArrowLeft'){e.preventDefault();var d=(k==='ArrowRight')!==rtl?1:-1;pick((i+d+n)%n,true)}
        else if(k==='Home'){e.preventDefault();pick(0,true)} else if(k==='End'){e.preventDefault();pick(n-1,true)}
      });
    });
  });

  // Chronology entry: read the translations in the site language or in Arabic
  [].forEach.call(document.querySelectorAll('[data-ev]'),function(ev){
    var btns=[].slice.call(ev.querySelectorAll('[data-read-btn]'));
    btns.forEach(function(b){b.addEventListener('click',function(){
      ev.setAttribute('data-read',b.getAttribute('data-read-btn'));
      btns.forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});
    })});
  });

  // Matter model plays once it scrolls into view
  var mms=[].slice.call(document.querySelectorAll('.mm'));
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('play');io.unobserve(e.target)}})},{threshold:.35});
    mms.forEach(function(m){io.observe(m)});
  } else mms.forEach(function(m){m.classList.add('play')});

  // Insights filter
  var filterBtns=[].slice.call(document.querySelectorAll('[data-filter]'));
  filterBtns.forEach(function(b){
    b.addEventListener('click',function(){
      var f=b.getAttribute('data-filter');
      filterBtns.forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});
      [].forEach.call(document.querySelectorAll('[data-page="insights"] [data-cat]'),function(el){el.hidden=!(f==='all'||el.getAttribute('data-cat')===f)});
    });
  });

  // Links that carry a topic open the request page with it preselected
  var topic=document.getElementById('f-topic');
  function preselect(t){
    if(!topic) return;
    if([].some.call(topic.options,function(o){return o.value===t})) topic.value=t;
    if(t==='arabic') document.getElementById('f-l2').checked=true;
    if(t==='languages') document.getElementById('f-l3').checked=true;
    var mt={claims:'f-m3',disputes:'f-m1',investigations:'f-m2'}[t]; if(mt) document.getElementById(mt).checked=true;
  }
  var qt=(location.search.match(/[?&]topic=([a-z-]+)/)||[])[1]; if(qt) preselect(qt);
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[data-topic]'); if(!a) return;
    if((a.getAttribute('href')||'').split(/[?#]/)[0]!=='demo.html') return;
    e.preventDefault(); location.href='demo.html?topic='+encodeURIComponent(a.getAttribute('data-topic'));
  });
  // A plan built on the pricing page arrives in the request message
  try{var plan=sessionStorage.getItem('cicero.plan'), fm=document.getElementById('f-msg'); if(plan&&fm){fm.value=plan;sessionStorage.removeItem('cicero.plan')}}catch(e){}

  if(document.getElementById('req')){
  // Request form: build the request for the visitor to send
  var form=document.getElementById('req'), sent=document.getElementById('sent'), out=document.getElementById('sent-text'), err=document.getElementById('f-err');
  form.addEventListener('submit',function(e){
    e.preventDefault();
    var f=form.elements;
    var ok=f.name.value.trim()&&f.firm.value.trim()&&/.+@.+\..+/.test(f.email.value.trim());
    err.hidden=!!ok; if(!ok) return;
    var lab=function(n){return form.querySelector('input[name='+n+']:checked').parentNode.textContent.trim()};
    var lines=['Cicero working session request','Name: '+f.name.value.trim(),'Email: '+f.email.value.trim(),'Firm: '+f.firm.value.trim(),
      f.role.value.trim()?'Role: '+f.role.value.trim():null,'Interested in: '+topic.options[topic.selectedIndex].text,
      'Matter type: '+lab('mtype'),'Languages: '+lab('lang'),'Site language: '+NAMES[cur],
      f.msg.value.trim()?'About the matter: '+f.msg.value.trim():null].filter(Boolean);
    out.value=lines.join('\n'); form.hidden=true; sent.hidden=false;
  });
  document.getElementById('edit-btn').addEventListener('click',function(){sent.hidden=true;form.hidden=false});
  document.getElementById('copy-btn').addEventListener('click',function(){
    var note=document.getElementById('copy-note');
    function fallback(){out.focus();out.select();note.textContent=T('selected')}
    try{navigator.clipboard.writeText(out.value).then(function(){note.textContent=T('copied')},fallback)}catch(x){fallback()}
  });

  }

  // Briefing signup: preview only
  [].forEach.call(document.querySelectorAll('form[data-brief]'),function(bf){
    bf.addEventListener('submit',function(e){
      e.preventDefault();
      var msg=bf.parentNode.querySelector('.brief-msg'), email=bf.querySelector('input[type=email]').value.trim();
      msg.hidden=false; msg.textContent=/.+@.+\..+/.test(email)?T('thanks'):T('addEmail');
    });
  });

  // Hero film: plays with sound on request, stops when its page is left. Captions are English and off until chosen in the player.
  var FILM_CUES=[[0.4, 4.55, "Your client bought just over fifty thousand tons of steel."], [4.97, 7.54, "It was due in Dammam by March 15th."], [7.92, 14.67, "On February 28th, the Strait of Hormuz closed, and the steel didn’t reach Dammam until the end of April."], [14.98, 17.38, "The seller says that’s force majeure."], [17.61, 22.72, "If it wasn’t for the strait’s closure, they say, it would have arrived, and on time."], [22.98, 27.85, "Your client missed its own delivery dates and lost millions of dollars in business."], [28.07, 31.76, "That loss is theirs, unless something else held up that ship."], [31.93, 38.21, "If something did, it’s somewhere in forty-one thousand documents, and a lot of them aren’t in English."], [38.27, 45.4, "Cicero reads them as they were written, in Arabic, in Chinese and in English, and puts every fact in order."], [45.46, 48.7, "So you ask it why the contract wasn’t performed."], [48.76, 51.61, "It gives you the seller’s account, and one other."], [51.72, 59.91, "On February 20th, more than a week before the strait closed, the seller’s own sales team expected the ship on March 26th."], [60.34, 63.32, "The memo asks that the buyer not be told."], [63.75, 65.74, "The ship was going to be late anyway."], [65.97, 68.92, "That puts your client’s millions back in play."], [69.45, 72.6, "Cicero. Know your case."]];
  // Hero film: plays silently on a loop as the section's picture. The play button opens it full screen, from the start, with sound.
  [].forEach.call(document.querySelectorAll('[data-film]'),function(f){
    var v=f.querySelector('video'), b=f.querySelector('.film-play');
    var still=false, seen=true, full=false; v.defaultMuted=true; v.muted=true; v.setAttribute('muted','');
    try{var tt=v.addTextTrack('captions','English','en');tt.mode='hidden';FILM_CUES.forEach(function(c){tt.addCue(new VTTCue(c[0],c[1],c[2]))});}catch(e){}
    function ambient(){
      full=false; f.classList.remove('is-on'); v.controls=false; v.muted=true; v.loop=true;
      if(!still&&seen){var p=v.play(); if(p&&p.catch)p.catch(function(){})} else v.pause();
    }
    function fsEl(){return document.fullscreenElement||document.webkitFullscreenElement||null}
    b.addEventListener('click',function(){
      full=true; v.loop=false; v.muted=false; v.controls=true;
      try{v.currentTime=0}catch(e){}
      var p=v.play(); if(p&&p.catch)p.catch(function(){});
      var canDoc=document.fullscreenEnabled||document.webkitFullscreenEnabled;
      var req=canDoc?(v.requestFullscreen||v.webkitRequestFullscreen):null, r=null;
      try{ if(req) r=req.call(v); else if(v.webkitEnterFullscreen){v.webkitEnterFullscreen()} }catch(e){r=null}
      // Where full screen is refused, the film plays in place with its controls
      if(r&&r.catch) r.catch(function(){f.classList.add('is-on');v.focus()});
      else if(!req&&!v.webkitEnterFullscreen){f.classList.add('is-on');v.focus()}
    });
    function onFs(){ if(full&&!fsEl()) ambient() }
    document.addEventListener('fullscreenchange',onFs); document.addEventListener('webkitfullscreenchange',onFs);
    v.addEventListener('webkitendfullscreen',function(){if(full)ambient()});
    v.addEventListener('ended',function(){ if(!full) return; if(fsEl()){try{(document.exitFullscreen||document.webkitExitFullscreen).call(document)}catch(e){}} ambient() });
    v.addEventListener('pause',function(){ if(full&&!fsEl()&&f.classList.contains('is-on')&&v.ended) ambient() });
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(es){seen=es[0].isIntersecting; if(full) return; if(seen&&!still){var p=v.play(); if(p&&p.catch)p.catch(function(){})} else v.pause()}).observe(f);
    } else {seen=true}
    window.addEventListener('hashchange',function(){setTimeout(function(){var pg=f.closest('[data-page]');if(pg&&!pg.classList.contains('active')){if(full&&!fsEl())ambient();v.pause()}},0)});
    // Load the film into memory, then play it from there
    var url=v.getAttribute('data-src');
    function direct(){ if(!v.getAttribute('src')){ v.src=url; v.load(); kick() } }
    try{
      fetch(url).then(function(r){ if(!r.ok) throw 0; return r.arrayBuffer() }).then(function(buf){
        v.src=URL.createObjectURL(new Blob([buf],{type:'video/mp4'})); v.load(); kick();
      }).catch(direct);
    }catch(e){ direct() }
    ambient();
    // Phones can hold back the first play until the file is ready or the visitor first touches the page: try again then
    function kick(){ if(!full&&seen&&v.paused){var p=v.play(); if(p&&p.catch)p.catch(function(){})} }
    v.addEventListener('loadedmetadata',kick); v.addEventListener('canplay',kick);
    ['touchstart','scroll','click'].forEach(function(ev){window.addEventListener(ev,kick,{passive:true})});
    document.addEventListener('visibilitychange',function(){ if(!document.hidden) kick() });
  });

  applyLocale(detect());
  route();
})();
