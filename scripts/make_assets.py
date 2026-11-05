"""Generate the exact QR and a printable A4 dieline for the NEXO prototype.

The dieline is concept-only: a paperboard visual mockup, not a production die-cut.
"""
from pathlib import Path

from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF, renderSVG
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "dist" / "assets"
ASSETS.mkdir(parents=True, exist_ok=True)
URL = "https://nexo-embalagem-inclusiva-2026.weedybull3.chatgpt.site/#experiencia"
VIOLET = HexColor("#3928B7")
LIME = HexColor("#DBFF63")
PAPER = HexColor("#FAF9F4")
INK = HexColor("#25183F")


def qr_drawing(size):
    widget = QrCodeWidget(URL)
    x0, y0, x1, y1 = widget.getBounds()
    scale = size / max(x1 - x0, y1 - y0)
    drawing = Drawing(size, size, transform=[scale, 0, 0, scale, 0, 0])
    drawing.add(widget)
    return drawing


renderSVG.drawToFile(qr_drawing(500), str(ASSETS / "nexo-qr.svg"))


def wordmark(c, x, y, size, color):
    c.setFillColor(color)
    c.setFont("Helvetica-Bold", size)
    c.drawString(x, y, "nexo.")


def dots(c, cx, cy, size, color):
    c.setFillColor(color)
    for dx in (-size * 1.4, size * 1.4):
        for dy in (-size * 1.4, size * 1.4):
            c.circle(cx + dx, cy + dy, size, stroke=0, fill=1)


pdf_path = ASSETS / "nexo-planificacao.pdf"
c = canvas.Canvas(str(pdf_path), pagesize=landscape(A4))
pw, ph = landscape(A4)

# Real-size simple rectangular folding-carton mockup: H=12 cm, W=6.5 cm, D=2 cm.
# Left-to-right: glue 1 cm | back 6.5 cm | side 2 cm | front 6.5 cm | side 2 cm.
widths = [1*cm, 6.5*cm, 2*cm, 6.5*cm, 2*cm]
body_h, flap_h = 12*cm, 1.65*cm
net_width = sum(widths)
start_x = (pw - net_width)/2
start_y = 146

c.setFillColor(PAPER)
c.rect(0, 0, pw, ph, fill=1, stroke=0)
c.setFillColor(VIOLET)
c.setFont("Helvetica-Bold", 15)
c.drawString(start_x, ph - 34, "NEXO  /  EMBALAGEM PLANIFICADA")
c.setFont("Helvetica", 9)
c.setFillColor(INK)
c.drawString(start_x, ph - 49, "Modelo de papel, escala 100%  |  imprimir A4 paisagem, tamanho real")

xs = [start_x]
for w in widths: xs.append(xs[-1]+w)

# Solid colored body panels.
fills = [VIOLET, PAPER, LIME, VIOLET, LIME]
for i, w in enumerate(widths):
    c.setFillColor(fills[i])
    c.rect(xs[i], start_y, w, body_h, stroke=0, fill=1)

# Top / bottom folding flaps are attached to each non-glue panel.
for i in range(1,5):
    w=widths[i]
    c.setFillColor(fills[i])
    for y in (start_y-flap_h, start_y+body_h):
        c.rect(xs[i], y, w, flap_h, stroke=0, fill=1)

# Back panel: ingredient and prototype labels.
bx = xs[1]
c.setFillColor(VIOLET)
wordmark(c,bx+14,start_y+body_h-38,28,VIOLET)
c.setFont("Helvetica-Bold",11)
c.drawString(bx+14,start_y+body_h-67,"CACAU + AVEIA")
c.setFont("Helvetica",8.5)
for i,line in enumerate([
    "PRODUTO ILUSTRATIVO - 45 g",
    "Ingredientes: aveia, tamaras,",
    "cacau e pasta de amendoim.",
    "Contem amendoim.",
    "Pode conter leite e soja.",
    "",
    "Exemplo ficticio para hackathon.",
    "Nao utilizar como rotulo real."
]):
    c.drawString(bx+14,start_y+body_h-95-(i*15),line)
    
# Front panel: premium visual branding.
fx = xs[3]; fw = widths[3]
dots(c,fx+fw/2,start_y+body_h-83,8,LIME)
wordmark(c,fx+17,start_y+body_h-155,42,PAPER)
c.setFillColor(LIME)
c.setFont("Helvetica-Bold",14)
c.drawString(fx+18,start_y+body_h-184,"CACAU + AVEIA")
c.setFont("Helvetica-Bold",10)
c.drawString(fx+18,start_y+body_h-203,"45 g")
qrsize = 85
qx=fx+fw/2-qrsize/2
qy=start_y+32
c.setFillColor(PAPER)
c.roundRect(qx-8,qy-9,qrsize+16,qrsize+33,7,stroke=0,fill=1)
renderPDF.draw(qr_drawing(qrsize),c,qx,qy)
c.setFillColor(VIOLET)
c.setFont("Helvetica-Bold",7)
c.drawCentredString(fx+fw/2,qy+qrsize+7,"ESCANEIE E EXPERIMENTE")

# Side text, rotated to fit narrow faces.
for i in (2,4):
    c.saveState(); c.translate(xs[i]+widths[i]/2,start_y+body_h/2); c.rotate(90)
    c.setFillColor(VIOLET)
    c.setFont("Helvetica-Bold",10)
    c.drawCentredString(0,0,"UMA EMBALAGEM PARA TODOS")
    c.restoreState()

# Glue flap is explicitly called out.
c.saveState(); c.translate(xs[0]+widths[0]/2,start_y+body_h/2); c.rotate(90)
c.setFillColor(PAPER);c.setFont("Helvetica-Bold",7)
c.drawCentredString(0,0,"COLA")
c.restoreState()

# Cutting outline: full exterior and flap cuts. Solid lines to cut.
c.setLineWidth(1);c.setStrokeColor(INK)
c.line(start_x,start_y,xs[-1],start_y)
c.line(start_x,start_y+body_h,xs[-1],start_y+body_h)
c.line(start_x,start_y,start_x,start_y+body_h)
c.line(xs[-1],start_y,xs[-1],start_y+body_h)
for i in range(1,5):
    for y in (start_y-flap_h,start_y+body_h+flap_h):
        c.line(xs[i],y,xs[i+1],y)
    c.line(xs[i],start_y-flap_h,xs[i],start_y)
    c.line(xs[i+1],start_y-flap_h,xs[i+1],start_y)
    c.line(xs[i],start_y+body_h,xs[i],start_y+body_h+flap_h)
    c.line(xs[i+1],start_y+body_h,xs[i+1],start_y+body_h+flap_h)

# Dashed folds. Only vertical body folds and flap hinges.
c.setDash(5,4);c.setLineWidth(.8);c.setStrokeColor(HexColor('#777777'))
for x in xs[1:-1]: c.line(x,start_y,x,start_y+body_h)
c.line(xs[1],start_y,xs[-1],start_y)
c.line(xs[1],start_y+body_h,xs[-1],start_y+body_h)
c.setDash()

c.setFillColor(INK)
c.setFont("Helvetica-Bold",10)
c.drawString(start_x,79,"MONTAGEM RAPIDA")
c.setFont("Helvetica",8.5)
c.drawString(start_x,64,"1. Recorte as linhas continuas.  2. Vinque as linhas tracejadas.  3. Dobre e cole a aba COLA.  4. Feche as abas superiores e inferiores.")
c.setFillColor(HexColor("#777777"))
c.setFont("Helvetica",7)
c.drawString(start_x,48,"Referencia fisica simplificada: fechamento manual com cola ou fita. Relevo tatil da arte e apenas conceitual, nao produzido pela impressao comum.")
c.showPage()
c.save()
print(pdf_path)
print(ASSETS / "nexo-qr.svg")
