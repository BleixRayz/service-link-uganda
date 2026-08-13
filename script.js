// script.js — interactions for Service Link page
(async function(){
  const toast = document.getElementById('toast');
  const search = document.getElementById('search');
  const grid = document.getElementById('linksGrid');
  const categoriesEl = document.getElementById('categories');
  const themeToggle = document.getElementById('themeToggle');

  function showToast(msg='Link copied!'){
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(()=>toast.classList.remove('show'), 2200);
  }

  // Load services.json
  let services = [];
  try{
    const res = await fetch('services.json');
    services = await res.json();
  }catch(err){
    console.error('Could not load services.json', err);
    services = [];
  }

  // Derive categories
  const categories = ['All', ...Array.from(new Set(services.map(s=>s.category).filter(Boolean)))];

  // Render category buttons
  categories.forEach((c, i)=>{
    const btn = document.createElement('button');
    btn.className = 'category' + (i===0? ' active':'');
    btn.type = 'button';
    btn.dataset.category = c;
    btn.innerText = c;
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.category').forEach(x=>x.classList.remove('active'));
      btn.classList.add('active');
      renderGrid();
    });
    categoriesEl.appendChild(btn);
  });

  function createCard(item){
    const article = document.createElement('article');
    article.className = 'card';
    article.dataset.name = item.name;
    article.dataset.url = item.url;
    article.dataset.category = item.category;

    article.innerHTML = `
      <div class="card-icon">${item.icon || '🔗'}</div>
      <h3 class="card-title">${item.name}</h3>
      <p class="card-desc">${item.description || ''}</p>
      <div class="card-actions">
        <a class="btn open" href="${item.url || '#'}" target="_blank" rel="noopener">Open</a>
        <button class="btn ghost copy" title="Copy link">Copy</button>
      </div>
    `;
    return article;
  }

  function renderGrid(){
    const q = (search.value||'').toLowerCase().trim();
    const activeCategory = document.querySelector('.category.active')?.dataset?.category || 'All';
    grid.innerHTML = '';
    const filtered = services.filter(s=>{
      const matchesCategory = activeCategory === 'All' || s.category === activeCategory;
      const matchesQuery = !q || (s.name && s.name.toLowerCase().includes(q)) || (s.description && s.description.toLowerCase().includes(q)) || (s.tags && s.tags.join(' ').toLowerCase().includes(q));
      return matchesCategory && matchesQuery;
    });

    if(filtered.length === 0){
      grid.innerHTML = '<p style="color:var(--muted)">No services found.</p>';
      return;
    }

    filtered.forEach((s,i)=>{
      const card = createCard(s);
      // set up animations
      card.style.opacity = 0;
      card.style.transform = 'translateY(18px)';
      card.style.transition = `opacity .6s cubic-bezier(.2,.9,.3,1) ${i*60}ms, transform .6s cubic-bezier(.2,.9,.3,1) ${i*60}ms`;
      grid.appendChild(card);
    });

    // setup copy handlers and reveal
    document.querySelectorAll('.copy').forEach(btn=>{
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

    // Reveal with IntersectionObserver
    const observer = new IntersectionObserver((entries)=>{
      entries.forEach((entry)=>{
        if(entry.isIntersecting){
          entry.target.style.opacity = 1;
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    },{threshold:0.12});

    document.querySelectorAll('.card').forEach(c=>observer.observe(c));
  }

  // wire search
  search.addEventListener('input', ()=>renderGrid());

  // initial render
  renderGrid();

  // Theme toggle
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
  const saved = localStorage.getItem('service-link-dark');
  setTheme(saved === null ? true : saved === 'true');

})();
