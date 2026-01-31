from pypdf import PdfReader, PdfWriter, PageObject, Transformation
from reportlab.pdfgen import canvas
from io import BytesIO
from math import floor

MM_TO_PT = 72 / 25.4

# Target sizes
CARD_W = 85.5 * MM_TO_PT
CARD_H = 54 * MM_TO_PT
A4_W = 210 * MM_TO_PT
A4_H = 297 * MM_TO_PT

MARGIN = 10 * MM_TO_PT
GAP = 5 * MM_TO_PT
SAFETY_CUT = 0.1  # tiny buffer inside the card
EDGE_WIDTH = 1.5  # more thickness for black edge than golden corners
CORNER_WIDTH = 1.0

cards_per_row = floor((A4_W - 2 * MARGIN + GAP) / (CARD_W + GAP))
cards_per_col = floor((A4_H - 2 * MARGIN + GAP) / (CARD_H + GAP))

reader = PdfReader("input.pdf")
writer = PdfWriter()

def new_a4():
    return PageObject.create_blank_page(width=A4_W, height=A4_H)

def card_edge_pdf(tx, ty):
    """
    Draws black edge exactly around the card content (inside safety cut)
    and golden corners at the outer card slot, constrained to the safety cut buffer
    """
    packet = BytesIO()
    c = canvas.Canvas(packet, pagesize=(A4_W, A4_H))

    # Black edge around the scaled card content
    c.setStrokeColorRGB(0, 0, 0)  # black
    c.setLineWidth(EDGE_WIDTH)
    rect_x = tx + SAFETY_CUT
    rect_y = ty + SAFETY_CUT
    rect_w = CARD_W - 2*SAFETY_CUT
    rect_h = CARD_H - 2*SAFETY_CUT
    c.rect(rect_x, rect_y, rect_w, rect_h, stroke=1, fill=0)

    # Golden corners constrained to the card slot (respecting safety cut)
    corner_len = 5
    c.setStrokeColorRGB(1, 0.84, 0)  # gold
    c.setLineWidth(CORNER_WIDTH)

    # Adjusted corner coordinates
    x0, y0 = tx + SAFETY_CUT, ty + SAFETY_CUT
    x1, y1 = tx + CARD_W - SAFETY_CUT, ty + CARD_H - SAFETY_CUT

    # top-left
    c.line(x0, y1, x0, y1 - corner_len)
    c.line(x0, y1, x0 + corner_len, y1)
    # top-right
    c.line(x1, y1, x1, y1 - corner_len)
    c.line(x1, y1, x1 - corner_len, y1)
    # bottom-left
    c.line(x0, y0, x0 + corner_len, y0)
    c.line(x0, y0, x0, y0 + corner_len)
    # bottom-right
    c.line(x1, y0, x1 - corner_len, y0)
    c.line(x1, y0, x1, y0 + corner_len)

    c.save()
    packet.seek(0)
    return PdfReader(packet).pages[0]


a4_page = new_a4()
slot = 0

for page in reader.pages:
    col = slot % cards_per_row
    row = slot // cards_per_row

    if row >= cards_per_col:
        writer.add_page(a4_page)
        a4_page = new_a4()
        slot = 0
        col = 0
        row = 0

    # scale page to fit card with safety cut
    scale_x = (CARD_W - 2*SAFETY_CUT) / page.mediabox.width
    scale_y = (CARD_H - 2*SAFETY_CUT) / page.mediabox.height

    tx = MARGIN + col * (CARD_W + GAP) + SAFETY_CUT
    ty = A4_H - MARGIN - CARD_H - row * (CARD_H + GAP) + SAFETY_CUT

    transform = Transformation().scale(scale_x, scale_y).translate(tx, ty)
    a4_page.merge_transformed_page(page, transform)

    # draw black edge + golden corners
    edge_page = card_edge_pdf(
        MARGIN + col * (CARD_W + GAP),
        A4_H - MARGIN - CARD_H - row * (CARD_H + GAP)
    )
    a4_page.merge_page(edge_page)

    slot += 1

if slot > 0:
    writer.add_page(a4_page)

with open("output_a4_cards.pdf", "wb") as f:
    writer.write(f)
