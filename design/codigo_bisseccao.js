// Bissecção: encontra raiz de f em [a, b]
function bisseccao(f, a, b, tol = 1e-6, maxIter = 50) {
  if (f(a) * f(b) > 0) {
    throw new Error("f(a) e f(b) precisam ter sinais opostos");
  }
  const passos = [];
  for (let k = 0; k < maxIter; k++) {
    const m = (a + b) / 2;
    const fm = f(m);
    passos.push({ k, a, b, m, fm, erro: (b - a) / 2 });
    if (Math.abs(fm) < tol || (b - a) / 2 < tol) {
      return { raiz: m, passos, convergiu: true };
    }
    if (f(a) * fm < 0) b = m; // raiz em [a, m]
    else a = m;               // raiz em [m, b]
  }
  return { raiz: (a + b) / 2, passos, convergiu: false };
}
