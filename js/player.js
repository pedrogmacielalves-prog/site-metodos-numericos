/* Controle genérico de passos. new Player(container, { aoMudar(indice) }) ; player.carregar(total) */
(function (g) {
  'use strict';
  var ICONES = { pausa: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" focusable="false"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>', tocar: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" focusable="false"><path d="M7 4v16l13-8z"/></svg>' };
  function Player(container, opcoes) {
    this.aoMudar = opcoes.aoMudar; this.total = 0; this.indice = 0; this.velocidade = 1; this.timer = null;
    container.classList.add('player');
    container.innerHTML =
      '<button type="button" class="btn btn--secundario btn--icone" data-a="inicio" title="Ir ao início" aria-label="Ir ao início"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" focusable="false"><path d="M5 4h2v16H5zM20 4v16L9 12z"/></svg></button>' +
      '<button type="button" class="btn btn--secundario btn--icone" data-a="voltar" title="Voltar" aria-label="Voltar"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" focusable="false"><path d="M17 4v16L6 12z"/></svg></button>' +
      '<button type="button" class="btn btn--primario btn--icone" data-a="tocar" title="Reproduzir/pausar" aria-label="Reproduzir"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" focusable="false"><path d="M7 4v16l13-8z"/></svg></button>' +
      '<button type="button" class="btn btn--secundario btn--icone" data-a="avancar" title="Avançar" aria-label="Avançar"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" focusable="false"><path d="M7 4v16l11-8z"/><path d="M18 4h2v16h-2z"/></svg></button>' +
      '<button type="button" class="btn btn--secundario btn--icone" data-a="fim" title="Ir ao fim" aria-label="Ir ao fim"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" focusable="false"><path d="M4 4v16l11-8z"/><path d="M17 4h2v16h-2z"/></svg></button>' +
      '<input type="range" class="progresso" min="0" max="0" value="0" aria-label="Progresso">' +
      '<span class="contador" aria-live="off">0 / 0</span>' +
      '<select class="input" aria-label="Velocidade"><option value="0.5">0,5×</option><option value="1" selected>1×</option><option value="2">2×</option><option value="4">4×</option></select>';
    var self = this;
    this.el = container;
    this.btTocar = container.querySelector('[data-a=tocar]');
    this.barra = container.querySelector('.progresso');
    this.contador = container.querySelector('.contador');
    container.addEventListener('click', function (e) {
      var a = e.target.closest('button') && e.target.closest('button').dataset.a;
      if (a === 'inicio') { self.pausar(); self.irPara(0); }
      else if (a === 'voltar') { self.pausar(); self.irPara(self.indice - 1); }
      else if (a === 'avancar') { self.pausar(); self.irPara(self.indice + 1); }
      else if (a === 'fim') { self.pausar(); self.irPara(self.total - 1); }
      else if (a === 'tocar') { self.timer ? self.pausar() : self.tocar(); }
    });
    this.barra.addEventListener('input', function () { self.pausar(); self.irPara(+self.barra.value); });
    container.querySelector('select').addEventListener('change', function (e) { self.velocidade = +e.target.value; if (self.timer) { self.pausar(); self.tocar(); } });
    this.atualizarUI();
  }
  Player.prototype.intervalo = function () {
    var v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--intervalo-passo')) || 1200;
    return v / this.velocidade;
  };
  Player.prototype.carregar = function (total) { this.pausar(); this.total = total; this.barra.max = Math.max(0, total - 1); this.irPara(0); };
  Player.prototype.irPara = function (i) {
    if (!this.total) { this.atualizarUI(); return; }
    i = Math.max(0, Math.min(this.total - 1, i));
    var anterior = this.indice; this.indice = i; this.atualizarUI();
    this.aoMudar(i, anterior);
  };
  /* auto=true: reprodução automática (não manual); respeita prefers-reduced-motion */
  Player.prototype.tocar = function (auto) {
    if (!this.total) return;
    if (auto && window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (this.indice >= this.total - 1) this.irPara(0);
    var self = this;
    this.timer = setInterval(function () {
      if (self.indice >= self.total - 1) self.pausar(); else self.irPara(self.indice + 1);
    }, this.intervalo());
    this.atualizarUI();
  };
  Player.prototype.pausar = function () { clearInterval(this.timer); this.timer = null; this.atualizarUI(); };
  Player.prototype.atualizarUI = function () {
    var vazio = !this.total;
    this.el.querySelectorAll('button').forEach(function (b) { b.disabled = vazio; });
    if (!vazio) {
      this.el.querySelector('[data-a=inicio]').disabled = this.el.querySelector('[data-a=voltar]').disabled = this.indice === 0;
      this.el.querySelector('[data-a=fim]').disabled = this.el.querySelector('[data-a=avancar]').disabled = this.indice >= this.total - 1;
    }
    var ic = this.timer ? 'pausa' : 'tocar'; if (this.btTocar.dataset.ic !== ic) { this.btTocar.dataset.ic = ic; this.btTocar.innerHTML = ICONES[ic]; }
    this.btTocar.setAttribute('aria-label', this.timer ? 'Pausar' : 'Reproduzir');
    this.barra.value = this.indice;
    this.contador.textContent = vazio ? '0 / 0' : (this.indice + 1) + ' / ' + this.total;
  };
  g.Player = Player;
})(window);
