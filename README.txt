TPG Online — build unificado
============================

Como usar
---------
1) Abra `index.html` no navegador.
2) Para simular o menu "Usuários":
   - Abra o dropdown "Conta" na navbar e digite **admin**. O item aparecerá.
   - Isso usa `localStorage.userName`. Em produção, troque por verificação de sessão (PHP).

Estrutura
---------
/assets/css/theme.css    — tema único (navbar, hero, cards, etc)
/assets/js/app.js        — utilidades (ano no footer e controle do menu admin)
/assets/js/cnpj.js       — lógica da consulta de CNPJ (BrasilAPI)
/assets/img/hero.svg     — ilustração do hero

Observações
-----------
- Sem JS inline (melhor CSP).
- Layout responsivo melhorado (grids consistentes, cartões com alturas iguais, hero otimizado).
