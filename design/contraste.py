# Calcula razões de contraste WCAG 2.x e gera contrastes.md
def L(h):
    h=h.lstrip('#');c=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    c=[x/12.92 if x<=0.03928 else ((x+0.055)/1.055)**2.4 for x in c]
    return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2]
def r(a,b):
    x,y=sorted([L(a),L(b)],reverse=True);return (x+0.05)/(y+0.05)
E=dict(fundo='#192338',fundo2='#1E2E4F',sup='#31487A')
C=dict(fundo='#D9E1F1',fundo2='#E8EDF7',sup='#FFFFFF')
esc=dict(texto='#D9E1F1',texto_suave='#B4C3DE',primaria='#8FB3E2',bisseccao='#8FB3E2',newton='#C3B5F2',gauss='#86D3C8',
 funcao='#D9E1F1',eixo='#8FA3C7',intervalo_borda='#8FB3E2',ponto_medio='#C3B5F2',tangente='#C3B5F2',raiz='#F2C27B',pivo='#F2C27B',linha_operada_borda='#8FB3E2',erro='#F4A6B4',sucesso='#86D3C8',aviso='#F2C27B',tok_kw='#B79CF5',tok_str='#86D3C8',tok_num='#F2C27B',tok_com='#9AAACB',tok_fn='#7FB0F0')
cla=dict(texto='#192338',texto_suave='#3A4A6B',primaria='#31487A',bisseccao='#31487A',newton='#5B3FA8',gauss='#1F6359',
 funcao='#192338',eixo='#4A5C80',intervalo_borda='#31487A',ponto_medio='#5B3FA8',tangente='#5B3FA8',raiz='#8A4B00',pivo='#8A4B00',linha_operada_borda='#31487A',erro='#A3263F',sucesso='#1F6359',aviso='#8A4B00',tok_kw='#5B3FA8',tok_str='#1F6359',tok_num='#8A4B00',tok_com='#4F5E7A',tok_fn='#31487A')
o=["# Contrastes WCAG medidos (gerado por contraste.py)","","AA: texto normal ≥ 4,5; gráficos/UI ≥ 3,0. Regra de uso: texto colorido (acento, método, sintaxe) só sobre os fundos #192338/#1E2E4F (escuro) ou qualquer fundo claro — todos ≥ 4,5. Sobre a superfície YInMn #31487A use apenas texto/texto_suave (≥ 5,0); cores com valor < 4,5 nessa coluna são permitidas ali só como elemento gráfico/UI (≥ 3,0, ex. bordas, marcadores). O painel de código e o canvas usam fundo #192338/#1E2E4F.","",
"| Token | Escuro (padrão) | vs #192338 | vs #1E2E4F | vs #31487A | Claro | vs #D9E1F1 | vs #E8EDF7 | vs #FFFFFF |","|---|---|---|---|---|---|---|---|---|"]
bad=[]
for k in esc:
    a,b=esc[k],cla[k];vs=[r(a,E[x]) for x in E]+[r(b,C[x]) for x in C]
    if min(vs)<4.5: bad.append((k,min(vs)))
    o.append(f"| {k} | {a} | "+" | ".join(f"{v:.2f}" for v in vs[:3])+f" | {b} | "+" | ".join(f"{v:.2f}" for v in vs[3:])+" |")
o+=["","| Par especial | Razão |","|---|---|",
f"| texto botão primário escuro #192338 sobre #8FB3E2 | {r('#192338','#8FB3E2'):.2f} |",
f"| texto botão primário claro #FFFFFF sobre #31487A | {r('#FFFFFF','#31487A'):.2f} |",
f"| borda de UI escura #5C74A8 vs #192338 | {r('#5C74A8','#192338'):.2f} |",
f"| borda de UI clara #6B7DA3 vs #FFFFFF | {r('#6B7DA3','#FFFFFF'):.2f} |",
f"| texto sobre pivô escuro #D9E1F1 sobre #5A4526 | {r('#D9E1F1','#5A4526'):.2f} |",
f"| texto sobre pivô claro #192338 sobre #F6E2BE | {r('#192338','#F6E2BE'):.2f} |",
f"| texto sobre linha ativa escura #D9E1F1 sobre #2B4170 | {r('#D9E1F1','#2B4170'):.2f} |"]

o+=["","## Avisos (vantagens / problemas) — pares reais de uso","","| Par | Escuro | Razão | Claro | Razão | Mínimo |","|---|---|---|---|---|---|"]
P=[("--cor-apoio-vantagem sobre -fundo","#86D3C8","#173A43","#1F6359","#E3F3F0",4.5),
("texto sobre --cor-apoio-vantagem-fundo","#D9E1F1","#173A43","#192338","#E3F3F0",4.5),
("texto suave sobre --cor-apoio-vantagem-fundo","#B4C3DE","#173A43","#3A4A6B","#E3F3F0",4.5),
("--cor-apoio-vantagem-borda vs fundo-2","#4E9A90","#1E2E4F","#4E8F86","#E8EDF7",3),
("--cor-apoio-problema sobre -fundo","#F2C27B","#3A3122","#8A4B00","#FBEFD9",4.5),
("texto sobre --cor-apoio-problema-fundo","#D9E1F1","#3A3122","#192338","#FBEFD9",4.5),
("texto suave sobre --cor-apoio-problema-fundo","#B4C3DE","#3A3122","#3A4A6B","#FBEFD9",4.5),
("--cor-apoio-problema-borda vs fundo-2","#B08A4F","#1E2E4F","#B07A2E","#E8EDF7",3),
("--cor-apoio-problema (barra is-ativo) vs fundo-2","#F2C27B","#1E2E4F","#8A4B00","#E8EDF7",3),
("selo: --cor-sobre-selo sobre --cor-selo","#192338","#F2C27B","#FFFFFF","#8A4B00",4.5),
("selo vs superfície (card)","#F2C27B","#31487A","#8A4B00","#FFFFFF",3)]
for n,a,b,c,d,m in P:
    x,y=r(a,b),r(c,d); bad += [] if min(x,y)>=m else [(n,min(x,y))]
    o.append(f"| {n} | {a} / {b} | {x:.2f} | {c} / {d} | {y:.2f} | {m} |")
open('contrastes.md','w').write("\n".join(o)+"\n");print("\n".join(o));print("FALHAS:",bad)
