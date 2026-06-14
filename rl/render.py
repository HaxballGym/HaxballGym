"""Shared headless renderer: draw a Haxball frame to a PIL image.

World coords: x in [-420,420], y in [-200,200], y up. Image y is flipped.
Used by render_demo.py (GIF proof) and as the reference for play.py's pygame draw.
"""

from PIL import Image, ImageDraw

W, H = 860, 440
OX, OY = W // 2, H // 2  # world origin -> image centre
GOAL_HALF = 64
FIELD_X, FIELD_Y = 370, 170


def w2i(x, y):
    return OX + x, OY - y


def draw_frame(ball, players, score=(0, 0)):
    """ball=(x,y); players=list of (x,y,team) team 1=red 2=blue."""
    img = Image.new("RGB", (W, H), (123, 140, 90))  # grass
    d = ImageDraw.Draw(img)
    # pitch outline
    d.rectangle([w2i(-FIELD_X, FIELD_Y), w2i(FIELD_X, -FIELD_Y)], outline=(199, 230, 189), width=3)
    d.line([w2i(0, FIELD_Y), w2i(0, -FIELD_Y)], fill=(199, 230, 189), width=2)
    d.ellipse([w2i(-75, 75), w2i(75, -75)], outline=(199, 230, 189), width=2)
    # goals (red defends left x=-370, blue right x=+370)
    for gx, col in [(-FIELD_X, (255, 120, 120)), (FIELD_X, (120, 150, 255))]:
        d.line([w2i(gx, GOAL_HALF), w2i(gx, -GOAL_HALF)], fill=col, width=4)
        d.ellipse([w2i(gx - 6, GOAL_HALF + 6), w2i(gx + 6, GOAL_HALF - 6)], fill=col)
        d.ellipse([w2i(gx - 6, -GOAL_HALF + 6), w2i(gx + 6, -GOAL_HALF - 6)], fill=col)
    # players
    for x, y, team in players:
        col = (229, 110, 86) if team == 2 else (86, 137, 229)
        d.ellipse([w2i(x - 15, y + 15), w2i(x + 15, y - 15)], fill=col, outline=(0, 0, 0), width=2)
    # ball
    bx, by = ball
    d.ellipse(
        [w2i(bx - 10, by + 10), w2i(bx + 10, by - 10)], fill=(240, 240, 240), outline=(20, 20, 20), width=2
    )
    d.text((12, 10), f"RED {score[0]} - {score[1]} BLUE", fill=(255, 255, 255))
    return img
