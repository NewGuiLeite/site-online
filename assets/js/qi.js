// assets/js/qi.js
/* Quiz engine:
 - 30 questions: 18 image (placeholders) + 12 text
 - progress bar updates
 - saves result to server (save_result.php) and localStorage
*/

(function(){
    // Build questions array (placeholders)
    const qs = [];
    // Create 18 image questions
    for (let i=1;i<=18;i++){
      qs.push({
        id: i,
        type: 'image',
        image: 'assets/img/qi/' + i + '.png',
        text: 'Qual figura completa/combina com a lógica mostrada?',
        options: ['Opção A','Opção B','Opção C','Opção D'],
        correctIndex: Math.floor(Math.random()*4)
      });
    }
    // Create 12 text questions
    for (let j=19;j<=30;j++){
      qs.push({
        id: j,
        type: 'text',
        text: `Questão textual ${j}: escolha a alternativa correta.`,
        options: ['Alternativa 1','Alternativa 2','Alternativa 3','Alternativa 4'],
        correctIndex: Math.floor(Math.random()*4)
      });
    }
  
    // State
    let index = 0;
    let correct = 0;
    const total = qs.length;
    const startTime = Date.now();
  
    // DOM
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const qText = document.getElementById('qText');
    const imgWrap = document.getElementById('imgWrap');
    const opts = document.getElementById('options');
    const timerEl = document.getElementById('timer');
  
    // Timer
    function formatTime(s){ const m=Math.floor(s/60); const ss=s%60; return m+':'+(ss<10?'0'+ss:ss); }
    setInterval(()=> {
      const s = Math.floor((Date.now() - startTime)/1000);
      timerEl.innerText = formatTime(s);
    }, 1000);
  
    function render() {
      const q = qs[index];
      progressFill.style.width = ( (index/total)*100 ) + '%';
      progressText.innerText = (index+1) + ' / ' + total;
  
      qText.innerText = q.text;
      imgWrap.innerHTML = '';
      if (q.type === 'image' && q.image) {
        const img = document.createElement('img');
        img.src = q.image;
        img.alt = 'Figura';
        img.className = 'qimg';
        imgWrap.appendChild(img);
      }
  
      opts.innerHTML = '';
      q.options.forEach((o,i) => {
        const b = document.createElement('button');
        b.className = 'option';
        b.innerText = o;
        b.addEventListener('click', () => select(i));
        opts.appendChild(b);
      });
  
      // small UX: animate progress percentage visible
      // (could add motivational snippets at certain checkpoints)
      if (index > 0 && index % 5 === 0) {
        // you can show a motivational overlay here (omitted for brevity)
      }
    }
  
    function select(i) {
      const q = qs[index];
      if (i === q.correctIndex) correct++;
      index++;
      if (index >= total) finish();
      else render();
    }
  
    function finish() {
      const scoreCorrect = correct;
      const qi = 60 + scoreCorrect * 2; // simple formula
      const summary = generateSummary(scoreCorrect);
      const user = JSON.parse(localStorage.getItem('qi_user') || '{}');
      const record = {
        name: user.name || 'Participante',
        dob: user.dob || '',
        gender: user.gender || '',
        age: user.age || '',
        email: user.email || (user.name ? user.name.replace(/\s+/g,'').toLowerCase()+'@example.com' : 'cliente@example.com'),
        score: qi,
        qi: qi,
        correct: scoreCorrect,
        total: total,
        summary: summary,
        created_at: new Date().toISOString(),
        external_reference: 'ext_' + Date.now()
      };
  
      // Save locally
      localStorage.setItem('qi_result', JSON.stringify(record));
  
      // Save to server (non-blocking)
      fetch('save_result.php', {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(record)
      }).catch(err => console.warn('Erro ao salvar resultado no servidor (ok em sandbox):', err));
  
      // Redirect to resultado (where user will pay)
      window.location.href = 'resultado.php';
    }
  
    function generateSummary(score) {
      if (score <= 15) return 'Abaixo da média';
      if (score <= 23) return 'Média';
      if (score <= 28) return 'Acima da média';
      return 'Gênio';
    }
  
    document.getElementById('backBtn').addEventListener('click', () => {
      if (confirm('Deseja voltar à tela inicial? Progresso será perdido.')) window.location.href = 'qi.html';
    });
  
    // Start
    render();
  
  })();
  