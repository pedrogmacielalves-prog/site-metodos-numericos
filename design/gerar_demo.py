f=lambda x:x*x-2
X=lambda x:60+(x+0.25)/2.5*520
Y=lambda y:160-y/2.5*130
pts=" ".join(f"{X(x):.1f},{Y(f(x)):.1f}" for x in [i/50*2.4-0.2 for i in range(51)] if -2.5<=f(x)<=2.6)
grid="".join(f'<line class="g-grade" x1="{X(v):.1f}" y1="30" x2="{X(v):.1f}" y2="290"/><text class="g-rotulo" x="{X(v):.1f}" y="{Y(0)+18:.1f}" text-anchor="middle">{str(v).replace(".",",")}</text>' for v in [0,0.5,1,1.5,2])
grid+="".join(f'<line class="g-grade" x1="60" y1="{Y(v):.1f}" x2="580" y2="{Y(v):.1f}"/><text class="g-rotulo" x="52" y="{Y(v)+4:.1f}" text-anchor="end">{v}</text>' for v in [-2,-1,1,2])
a,b=1.0,1.5
# tangent at x0=2: y=2+4(x-2)
x0=2.0; tx=lambda x: f(x0)+2*x0*(x-x0)
r=2**.5
svg=f'''<svg viewBox="0 0 600 320" role="img" aria-labelledby="g-t g-d">
<title id="g-t">Gráfico de f(x) = x² − 2 (exemplo)</title>
<desc id="g-d">Curva de f no intervalo de −0,2 a 2,2. Intervalo atual da bissecção [1; 1,5] destacado. Tangente de Newton em x₀ = 2 cruza o eixo x em x₁ = 1,5. Raiz aproximada em x ≈ 1,4142.</desc>
{grid}
<rect class="g-intervalo" x="{X(a):.1f}" y="30" width="{X(b)-X(a):.1f}" height="260"/>
<line class="g-eixo" x1="60" y1="{Y(0):.1f}" x2="580" y2="{Y(0):.1f}"/><line class="g-eixo" x1="{X(0):.1f}" y1="30" x2="{X(0):.1f}" y2="290"/>
<polyline class="g-curva" points="{pts}"/>
<line class="g-tangente" x1="{X(1.4):.1f}" y1="{Y(tx(1.4)):.1f}" x2="{X(2.15):.1f}" y2="{Y(tx(2.15)):.1f}"/>
<line class="g-guia" x1="{X(2):.1f}" y1="{Y(0):.1f}" x2="{X(2):.1f}" y2="{Y(2):.1f}"/>
<circle class="g-ponto-newton" cx="{X(2):.1f}" cy="{Y(2):.1f}" r="5"/><text class="g-texto-tangente" x="{X(2)+10:.1f}" y="{Y(2)+18:.1f}">x₀ = 2</text>
<rect class="g-ponto-newton" x="{X(1.5)-5:.1f}" y="{Y(0)-5:.1f}" width="10" height="10" transform="rotate(45 {X(1.5):.1f} {Y(0):.1f})"/><text class="g-texto-tangente" x="{X(1.5)+8:.1f}" y="{Y(0)+34:.1f}">x₁ = 1,5</text>
<circle class="g-ponto-intervalo" cx="{X(a):.1f}" cy="{Y(f(a)):.1f}" r="5"/><text class="g-texto-intervalo" x="{X(a)-6:.1f}" y="44" text-anchor="end">a = 1</text>
<circle class="g-ponto-intervalo" cx="{X(b):.1f}" cy="{Y(f(b)):.1f}" r="5"/><text class="g-texto-intervalo" x="{X(b)+6:.1f}" y="44">b = 1,5</text>
<circle class="g-raiz" cx="{X(r):.1f}" cy="{Y(0):.1f}" r="7"/><text class="g-texto-raiz" x="{X(r)-10:.1f}" y="{Y(0)-10:.1f}" text-anchor="end">x* ≈ 1,4142</text>
</svg>'''
fmt=lambda v,n=6:f"{v:+.{n}f}".replace(".",",").replace("+","").replace("-","−")
rows="";a,b=1.0,2.0
for k in range(7):
    m=(a+b)/2;e=(b-a)/2
    cls=' class="atual"' if k==3 else (' class="final"' if k==6 else "")
    rc=' class="destaque-raiz"' if k==6 else ""
    rows+=f"<tr{cls}><td>{k}</td><td>{fmt(a)}</td><td>{fmt(b)}</td><td{rc}>{fmt(m)}</td><td>{fmt(f(m))}</td><td>{fmt(e)}</td></tr>"
    if f(a)*f(m)<0: b=m
    else: a=m
html=open("demo.tpl.html").read().replace("{{SVG}}",svg).replace("{{LINHAS}}",rows).replace("{{CODIGO}}",open("codigo_bisseccao.tokens.html").read())
open("demo.html","w").write(html)
