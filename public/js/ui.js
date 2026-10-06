(function(){if(window.__ciceroUIStarted)return;window.__ciceroUIStarted=true;(function(){
  [].forEach.call(document.querySelectorAll('[data-qc]'),function(qc){
    var area=qc.querySelector('.qc-clip')||qc, x0=null, y0=null, t0=0;
    area.addEventListener('touchstart',function(e){var t=e.touches[0];x0=t.clientX;y0=t.clientY;t0=Date.now()},{passive:true});
    area.addEventListener('touchend',function(e){
      if(x0==null) return; var t=e.changedTouches[0], dx=t.clientX-x0, dy=t.clientY-y0; x0=null;
      if(Math.abs(dx)<40||Math.abs(dx)<Math.abs(dy)*1.2) return;
      var rtl=document.documentElement.getAttribute('dir')==='rtl', forward=(dx<0)!==rtl;
      var b=qc.querySelector(forward?'[data-qc-next]':'[data-qc-prev]'); if(b) b.click();
    },{passive:true});
  });
})();

(function(){
  var btn=document.getElementById('menu-btn'), nav=document.getElementById('mnav'), close=document.getElementById('ms-close'), root=document.documentElement;
  if(!btn||!nav||!close) return;
  close.addEventListener('click',function(){ if(!nav.hidden) btn.click() });
  new MutationObserver(function(){
    var open=!nav.hidden; root.classList.toggle('menu-open',open);
    if(open) close.focus(); else if(document.activeElement&&document.getElementById('menu-sheet').contains(document.activeElement)) btn.focus();
  }).observe(nav,{attributes:true,attributeFilter:['hidden']});
  document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&!nav.hidden) btn.click() });
  // Clicking the page you are already on still closes the sheet
  document.getElementById('menu-sheet').addEventListener('click',function(e){
    var l=e.target.closest&&e.target.closest('a[href^="#"]'); if(l&&l.getAttribute('href')===location.hash&&!nav.hidden) btn.click();
  });
})();
})();