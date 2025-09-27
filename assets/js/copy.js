/* copy.js — utilitário simples para copiar o texto visível de um container */
function addCopyButton(targetSelector, buttonId){
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const target = document.querySelector(targetSelector);
      let text = '';
      if (target) text = target.innerText.replace(/\s+\n/g, '\n').trim();
      try{
        await navigator.clipboard.writeText(text || '(sem conteúdo)');
        btn.classList.add('btn-success'); btn.classList.remove('btn-outline-light');
        btn.textContent = 'Copiado!';
        setTimeout(()=>{ btn.classList.remove('btn-success'); btn.classList.add('btn-outline-light'); btn.textContent='Copiar informações'; }, 1500);
      }catch(e){ alert('Não foi possível copiar automaticamente.'); }
    });
  }
  