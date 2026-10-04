const config=window.JULIETE_CONFIG||{};
document.querySelectorAll('[data-config]').forEach(el=>{const key=el.dataset.config;el.textContent=config[key]??"A definir"});
const chapters=document.querySelector('#chapters');(config.chapters||[]).forEach((title,index)=>{chapters.insertAdjacentHTML('beforeend',`<article class="chapter reveal"><i>${String(index+1).padStart(2,'0')}</i><span>${title||'Conteúdo a definir'}</span></article>`)});
const benefits=document.querySelector('#benefits');(config.benefits||[]).forEach(text=>benefits.insertAdjacentHTML('beforeend',`<li>${text}</li>`));
document.querySelectorAll('[data-checkout]').forEach(link=>{link.href=config.checkoutUrl||'#oferta';if(!config.checkoutUrl||config.checkoutUrl==='#oferta')link.addEventListener('click',e=>{e.preventDefault();alert('O link do checkout ainda será cadastrado.')})});
const menu=document.querySelector('.menu-toggle'),header=document.querySelector('.site-header');menu.addEventListener('click',()=>{const open=header.classList.toggle('open');menu.setAttribute('aria-expanded',String(open))});header.querySelectorAll('nav a').forEach(a=>a.addEventListener('click',()=>header.classList.remove('open')));
const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}}),{threshold:.08});document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
document.querySelector('#year').textContent=new Date().getFullYear();
