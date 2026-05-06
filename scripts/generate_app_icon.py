from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
WEB = ROOT / "web"
IOS_APP_ICON_DIR = (
    ROOT
    / "ios"
    / "MomBaby"
    / "MomBaby"
    / "Assets.xcassets"
    / "AppIcon.appiconset"
)

SIZE = 1024
SCALE = 4
CANVAS = SIZE * SCALE
IOS_ICON_SIZES = {
    "Icon-20@2x.png": 40,
    "Icon-20@3x.png": 60,
    "Icon-29@2x.png": 58,
    "Icon-29@3x.png": 87,
    "Icon-40@2x.png": 80,
    "Icon-40@3x.png": 120,
    "Icon-60@2x.png": 120,
    "Icon-60@3x.png": 180,
    "Icon-1024.png": 1024,
}


def hex_to_rgb(value):
    value = value.lstrip("#")
    return tuple(int(value[index : index + 2], 16) for index in (0, 2, 4))


def rounded_rectangle(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def make_icon():
    img = Image.new("RGB", (CANVAS, CANVAS), hex_to_rgb("#FFF8F4"))
    draw = ImageDraw.Draw(img)

    # Soft warm vertical wash.
    top = hex_to_rgb("#FFF8F4")
    bottom = hex_to_rgb("#FFEDE6")
    for y in range(CANVAS):
        ratio = y / max(1, CANVAS - 1)
        color = tuple(round(top[i] * (1 - ratio) + bottom[i] * ratio) for i in range(3))
        draw.line((0, y, CANVAS, y), fill=color)

    # Gentle mint halo behind the bottle.
    halo = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    halo_draw = ImageDraw.Draw(halo)
    halo_draw.ellipse(
        scale_box(214, 164, 850, 838),
        fill=(*hex_to_rgb("#DDF4EC"), 178),
    )
    halo = halo.filter(ImageFilter.GaussianBlur(28 * SCALE))
    img = Image.alpha_composite(img.convert("RGBA"), halo)
    draw = ImageDraw.Draw(img)

    # Parent-child crescent hug.
    draw.arc(
        scale_box(246, 214, 790, 802),
        start=122,
        end=318,
        fill=hex_to_rgb("#F6AFA0"),
        width=42 * SCALE,
    )
    draw.arc(
        scale_box(304, 282, 726, 734),
        start=130,
        end=306,
        fill=hex_to_rgb("#FAD7CC"),
        width=24 * SCALE,
    )

    # Bottle body with soft shadow.
    shadow = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    rounded_rectangle(
        shadow_draw,
        scale_box(348, 338, 684, 782),
        118 * SCALE,
        fill=(190, 94, 82, 54),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(24 * SCALE))
    img = Image.alpha_composite(img, shadow)
    draw = ImageDraw.Draw(img)

    rounded_rectangle(
        draw,
        scale_box(340, 316, 676, 764),
        116 * SCALE,
        fill=hex_to_rgb("#FFFFFF"),
        outline=hex_to_rgb("#F0D9D0"),
        width=8 * SCALE,
    )
    rounded_rectangle(
        draw,
        scale_box(392, 246, 624, 360),
        52 * SCALE,
        fill=hex_to_rgb("#FFE6A7"),
        outline=hex_to_rgb("#F0C679"),
        width=7 * SCALE,
    )
    rounded_rectangle(
        draw,
        scale_box(430, 194, 586, 268),
        36 * SCALE,
        fill=hex_to_rgb("#D96D5F"),
    )
    rounded_rectangle(
        draw,
        scale_box(456, 160, 560, 218),
        28 * SCALE,
        fill=hex_to_rgb("#F6AFA0"),
    )

    # Milk fill and measurement marks.
    rounded_rectangle(
        draw,
        scale_box(382, 444, 634, 718),
        86 * SCALE,
        fill=hex_to_rgb("#FFF0EA"),
    )
    draw.line(scale_points((426, 484, 486, 484)), fill=hex_to_rgb("#D96D5F"), width=10 * SCALE)
    draw.line(scale_points((426, 560, 514, 560)), fill=hex_to_rgb("#D96D5F"), width=10 * SCALE)
    draw.line(scale_points((426, 636, 486, 636)), fill=hex_to_rgb("#D96D5F"), width=10 * SCALE)

    # Heart-shaped milk drop.
    draw.ellipse(scale_box(506, 476, 586, 556), fill=hex_to_rgb("#4E9D8A"))
    draw.ellipse(scale_box(570, 476, 650, 556), fill=hex_to_rgb("#4E9D8A"))
    draw.polygon(
        [
            scale_point(500, 526),
            scale_point(656, 526),
            scale_point(578, 638),
        ],
        fill=hex_to_rgb("#4E9D8A"),
    )

    # Tiny highlight keeps the mark soft rather than clinical.
    draw.ellipse(scale_box(442, 376, 506, 440), fill=(255, 255, 255, 174))

    return img.convert("RGB").resize((SIZE, SIZE), Image.Resampling.LANCZOS)


def scale_box(left, top, right, bottom):
    return tuple(value * SCALE for value in (left, top, right, bottom))


def scale_point(x, y):
    return (x * SCALE, y * SCALE)


def scale_points(points):
    return tuple(value * SCALE for value in points)


def save_resized(source, path, size):
    source.resize((size, size), Image.Resampling.LANCZOS).save(path)


def main():
    ASSETS.mkdir(exist_ok=True)
    WEB.mkdir(exist_ok=True)
    IOS_APP_ICON_DIR.mkdir(parents=True, exist_ok=True)
    icon = make_icon()
    icon.save(ASSETS / "icon.png")
    icon.save(ASSETS / "adaptive-icon.png")
    icon.save(ASSETS / "splash-icon.png")
    save_resized(icon, ASSETS / "favicon.png", 48)
    icon.save(WEB / "app-icon.png")
    save_resized(icon, WEB / "favicon.png", 48)

    for filename, size in IOS_ICON_SIZES.items():
        save_resized(icon, IOS_APP_ICON_DIR / filename, size)


if __name__ == "__main__":
    main()
