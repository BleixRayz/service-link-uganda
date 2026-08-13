// script.js — interactions for Service Link page
(function(){
  const copyButtons = document.querySelectorAll('.copy');
  const toast = document.getElementById('toast');
  const search = document.getElementById('search');
  const grid = document.getElementById('linksGrid');
  const themeToggle = document.getElementById('themeToggle');

  function showToast(msg='Link copied!'){
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(()=>toast.classList.remove('show'), 2200);
  }

  copyButtons.forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const card = e.target.closest('.card');
      const url = card?.dataset?.url || '#';
      navigator.clipboard?.writeText(url).then(()=>{
        showToast('Link copied to clipboard');
      }).catch(()=>{
        showToast('Could not copy — open link instead');
      });
    });
  });

  // Simple search filter
  search.addEventListener('input', (e)=>{
    const q = e.target.value.toLowerCase().trim();
    const cards = grid.querySelectorAll('.card');
    cards.forEach(card=>{
      const name = (card.dataset.name||'').toLowerCase();
      const desc = (card.querySelector('.card-desc')?.textContent||'').toLowerCase();
      const show = !q || name.includes(q) || desc.includes(q);
      card.style.display = show ? '' : 'none';
    });
  });

  // Reveal animation using IntersectionObserver
  const observer = new IntersectionObserver((entries)=>{
    entries.forEach((entry)=>{
      if(entry.isIntersecting){
        entry.target.style.opacity = 1;
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  },{threshold:0.12});

  document.querySelectorAll('.card').forEach((c,i)=>{
    c.style.opacity = 0;
    c.style.transform = 'translateY(18px)';
    c.style.transition = `opacity .6s cubic-bezier(.2,.9,.3,1) ${i*80}ms, transform .6s cubic-bezier(.2,.9,.3,1) ${i*80}ms`;
    observer.observe(c);
  });

  // Theme toggle (light/dark)
  function setTheme(dark){
    document.documentElement.style.setProperty('--bg', dark? '#071226' : '#f6fbff');
    if(dark){
      document.body.style.background='linear-gradient(180deg,#071226 0%, #04111a 100%)';
      themeToggle.setAttribute('aria-pressed','true');
    } else {
      document.body.style.background='#f7fbff';
      themeToggle.setAttribute('aria-pressed','false');
    }
  }
  themeToggle.addEventListener('click', ()=>{
    const isDark = themeToggle.getAttribute('aria-pressed') === 'true';
    setTheme(!isDark);
    localStorage.setItem('service-link-dark', String(!isDark));
  });
  // initialize
  const saved = localStorage.getItem('service-link-dark');
  setTheme(saved === null ? true : saved === 'true');

})();
