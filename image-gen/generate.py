#!/usr/bin/env python3
"""
Batch image generator for Strava Analizator frontend.
Uses Z-Image-Turbo SDNQ uint4 quantized model via diffusers.

Setup (first time):
    ./setup.sh

Usage:
    /tmp/z-image-studio/.venv/bin/python generate.py [filter] [--force]

    --force     Regenerate even if file exists
    filter      Only generate images whose name starts with this prefix (e.g. hero, weather)

Requirements (auto-installed by setup.sh):
    - zimage (provides ZImagePipeline)
    - sdnq (quantization support)
    - torch (CUDA)
"""

import os
import sys
import json
import time
import gc

import torch

# Patch torch dynamo config to allow SDNQ quantized model loading on newer PyTorch
import torch._dynamo.config as _dc
_original_setattr = type(_dc).__setattr__
def _patched_setattr(self, name, value):
    try:
        _original_setattr(self, name, value)
    except AttributeError:
        object.__setattr__(self, name, value)
type(_dc).__setattr__ = _patched_setattr

from diffusers import ZImagePipeline

# Register SDNQ quantization format with transformers/diffusers
from sdnq import SDNQConfig

# ── Config ──────────────────────────────────────────────────
MODEL_ID = "Disty0/Z-Image-Turbo-SDNQ-uint4-svd-r32"
STEPS = 9
GUIDANCE = 0.0
OUTPUT_DIR = "/home/mariuszp/Dokumenty/stravaAnalizator/frontend/public/illustrations"

# ── Shared style tokens ─────────────────────────────────────
BASE = (
    "flat vector illustration, modern digital art style, "
    "dark navy background color #0D1117, "
    "clean minimalist design, vibrant accent colors, "
    "no text no letters no words no watermark, "
    "centered composition, soft glow effects, rounded smooth shapes, "
    "professional UI illustration for dark mode app"
)

CYCLIST = (
    "single cyclist side-view silhouette on road bike, "
    "consistent minimal body proportions, helmet visible, "
    "subtle motion lines, "
)

# ── Image definitions ───────────────────────────────────────
IMAGES = [
    # ── Empty States (512×512) ──
    {
        "name": "empty-activities",
        "prompt": f"{BASE}, a sleek road bicycle leaning on a kickstand with subtle circular sync arrows and a small clock floating above, empty state concept, orange #FF6B35 and cyan #4ECDC4 accents, peaceful waiting mood",
        "w": 512, "h": 512, "seed": 42000,
    },
    {
        "name": "empty-analytics",
        "prompt": f"{BASE}, abstract empty chart with a flat horizontal line, dotted grid behind, small bar chart outlines with zero height bars, data analytics placeholder, cyan #4ECDC4 glowing lines on dark background, simple geometric shapes only",
        "w": 512, "h": 512, "seed": 42001,
    },
    {
        "name": "empty-training",
        "prompt": f"{BASE}, an open blank calendar planner with a small dumbbell and stopwatch beside it, empty workout plan concept, orange #FF6B35 page edges, motivational mood",
        "w": 512, "h": 512, "seed": 42002,
    },
    {
        "name": "empty-ai",
        "prompt": f"{BASE}, a friendly cute robot mascot wearing a cycling helmet, small neural network nodes floating around its head, AI coach concept, purple #BC8CFF glow, approachable futuristic",
        "w": 512, "h": 512, "seed": 42003,
    },
    {
        "name": "empty-weight",
        "prompt": f"{BASE}, a minimalist digital scale with a glowing target bullseye hovering above, weight tracking goal concept, green #3FB950 accent ring, clean simple composition",
        "w": 512, "h": 512, "seed": 42004,
    },
    {
        "name": "empty-routes",
        "prompt": f"{BASE}, a folded paper map with a dotted route path and a single pin marker, no saved routes concept, small mountain silhouettes background, orange #FF6B35 dotted trail line",
        "w": 512, "h": 512, "seed": 42005,
    },
    {
        "name": "empty-gallery",
        "prompt": f"{BASE}, a camera lens with an empty polaroid frame floating beside it, empty photo gallery concept, subtle cyan #4ECDC4 aperture glow, photography theme",
        "w": 512, "h": 512, "seed": 42006,
    },
    {
        "name": "empty-health",
        "prompt": f"{BASE}, a stylized heart with a flat ECG heartbeat line running through it, health monitoring concept, red and green #3FB950 pulse accents, medical wellness theme",
        "w": 512, "h": 512, "seed": 42007,
    },

    # ── Page Heroes (1280×480) ──
    {
        "name": "hero-dashboard",
        "prompt": (
            "photorealistic editorial cycling photography, wide panoramic road through high valley at first light, "
            "single rider moving steadily along empty asphalt, layers of mountains and low mist in the distance, "
            "muted amber sunrise highlights with deep blue shadows, quiet overview mood, natural texture, "
            "premium outdoor magazine aesthetic, no text, no watermark, cinematic but restrained color grade"
        ),
        "w": 1280, "h": 480, "seed": 42010,
    },
    {
        "name": "hero-analytics",
        "prompt": (
            "photorealistic editorial cycling photography, close wide shot of road bike cockpit with bike computer glowing softly, "
            "empty mountain road disappearing into the background, blue hour light with subtle cyan reflections on metal and bar tape, "
            "measured analytical mood, premium sports magazine style, realistic texture, no readable text on screen, "
            "no watermark, subdued cinematic contrast, dark asphalt and cool atmospheric depth"
        ),
        "w": 1280, "h": 480, "seed": 42011,
    },
    {
        "name": "hero-training",
        "prompt": (
            "photorealistic editorial still life for cycling training, top-down wide composition of handwritten training notes, map sketch, "
            "helmet, sunglasses, bottles and gloves arranged on a dark worn wooden table, early morning side light, "
            "small hints of road bike frame at the edge, disciplined preparation mood, muted green and amber accents, "
            "premium magazine photography, no readable text, no watermark, natural shadows and tactile detail"
        ),
        "w": 1280, "h": 480, "seed": 42012,
    },
    {
        "name": "hero-priorities",
        "prompt": (
            "photorealistic editorial cycling photography, intimate close-up of a cyclist studying a route map and notes "
            "under warm desk lamp, glasses, coffee cup and bike computer on the side, quiet strategic planning moment, "
            "deep navy background with amber light pool on the table, tactical preparation mood, premium sports magazine, "
            "no text, no watermark, cinematic lighting with sharp focus on the planning materials"
        ),
        "w": 1280, "h": 480, "seed": 42013,
    },

    # ── Readiness Cyclists (512×512) — 9 levels ──
    {
        "name": "readiness-peak",
        "prompt": f"{BASE}, {CYCLIST} sprinting in full aero tuck position, bright flame and lightning energy radiating outward, peak performance explosion, bright green #3FB950 energy aura, triumphant explosive power",
        "w": 512, "h": 512, "seed": 42120,
    },
    {
        "name": "readiness-rested",
        "prompt": f"{BASE}, {CYCLIST} riding tall with perfect upright posture hands on hoods, fully recovered fresh body language, soft golden sunrise behind, teal #4ECDC4 calm glow halo, serene ready-to-go energy",
        "w": 512, "h": 512, "seed": 42126,
    },
    {
        "name": "readiness-energetic",
        "prompt": f"{BASE}, {CYCLIST} pedaling uphill with strong confident posture, electric spark effects and small energy bolts, high energy readiness, light green #3FB950 glow trail, confident powerful mood",
        "w": 512, "h": 512, "seed": 42121,
    },
    {
        "name": "readiness-fresh",
        "prompt": f"{BASE}, {CYCLIST} cruising at moderate pace with relaxed smile, light breeze swirl effects, feeling fresh concept, soft green-cyan #4ECDC4 gradient aura, easy breezy pleasant ride",
        "w": 512, "h": 512, "seed": 42127,
    },
    {
        "name": "readiness-good",
        "prompt": f"{BASE}, {CYCLIST} riding comfortably on scenic road relaxed but strong posture, smooth flowing trail behind, good fitness form, cyan #4ECDC4 color trail, pleasant balanced enjoyable ride",
        "w": 512, "h": 512, "seed": 42122,
    },
    {
        "name": "readiness-recovering",
        "prompt": f"{BASE}, {CYCLIST} spinning easy gear on flat road gentle pace, small healing sparkle effects around legs, active recovery ride concept, warm amber #D29922 and soft green accents, calm therapeutic mood",
        "w": 512, "h": 512, "seed": 42128,
    },
    {
        "name": "readiness-tired",
        "prompt": f"{BASE}, {CYCLIST} riding slowly with slightly drooping shoulders showing mild fatigue, gentle sunset amber tones, tiredness setting in, yellow #D29922 warm glow, still moving with visible effort",
        "w": 512, "h": 512, "seed": 42123,
    },
    {
        "name": "readiness-struggling",
        "prompt": f"{BASE}, {CYCLIST} hunched over handlebars struggling up steep hill, heavy effort visible, dark moody atmosphere, orange-red #F85149 warning glow, sweat effects, determination despite exhaustion",
        "w": 512, "h": 512, "seed": 42124,
    },
    {
        "name": "readiness-exhausted",
        "prompt": f"{BASE}, {CYCLIST} completely stopped leaning heavily on bicycle head down, barely standing, total energy drain, red #F85149 dim glow, very dark heavy atmosphere, zero energy remaining",
        "w": 512, "h": 512, "seed": 42125,
    },

    # ── Weather Editorials (512×512) — 10 types ──
    {
        "name": "weather-sunny",
        "prompt": (
            "photorealistic editorial cycling photography, square crop of a rider on quiet asphalt just after sunrise, "
            "clear sky opening above rolling hills, warm sun flare catching the bars and shoulders, realistic road texture, "
            "subtle amber highlights with deep blue morning shadows, intimate premium outdoor magazine aesthetic, "
            "no text, no watermark, restrained cinematic color grade"
        ),
        "w": 512, "h": 512, "seed": 42130,
    },
    {
        "name": "weather-partly-cloudy",
        "prompt": (
            "photorealistic editorial cycling photography, square crop of a solo road rider on an empty backroad, "
            "broken clouds moving across a bright sky with sunlight slipping through gaps, natural greens at roadside, "
            "soft cool-blue atmosphere balanced with pale gold highlights, grounded realistic texture, "
            "premium cycling magazine mood, no text, no watermark"
        ),
        "w": 512, "h": 512, "seed": 42136,
    },
    {
        "name": "weather-cloudy",
        "prompt": (
            "photorealistic editorial cycling photography, square crop of a rider under thick overcast sky on a quiet mountain road, "
            "soft diffused light, cool slate-blue palette, damp roadside grass, subdued but beautiful natural mood, "
            "realistic textures, premium outdoor magazine styling, no text, no watermark"
        ),
        "w": 512, "h": 512, "seed": 42137,
    },
    {
        "name": "weather-rainy",
        "prompt": (
            "photorealistic editorial cycling photography, square crop of a rider continuing through light rain on wet asphalt, "
            "spray lifting from tires, dark reflective road surface, layered clouds, muted steel blue palette, "
            "personal stubborn training-day feeling, realistic droplets and texture, premium magazine realism, "
            "no text, no watermark"
        ),
        "w": 512, "h": 512, "seed": 42131,
    },
    {
        "name": "weather-stormy",
        "prompt": (
            "photorealistic editorial cycling photography, square crop of dramatic storm front over a mountain road, "
            "single rider framed small against dark cloud mass, distant lightning illuminating rain curtains, "
            "deep charcoal, blue and bruised violet tones, cinematic but believable weather drama, "
            "premium outdoor editorial look, no text, no watermark"
        ),
        "w": 512, "h": 512, "seed": 42138,
    },
    {
        "name": "weather-windy",
        "prompt": (
            "photorealistic editorial cycling photography, square crop of a road rider leaning into a strong crosswind on exposed open road, "
            "grass and jacket edges pulled sideways by wind, low clouds racing overhead, earthy subdued color grade, "
            "natural motion and realistic detail, personal gritty training atmosphere, no text, no watermark"
        ),
        "w": 512, "h": 512, "seed": 42132,
    },
    {
        "name": "weather-snowy",
        "prompt": (
            "photorealistic editorial cycling photography, square crop of winter road ride with light snowfall, "
            "icy roadside textures, pale sky, muted blue-grey mountains in background, cyclist moving carefully but calmly, "
            "cold breathable atmosphere, refined magazine aesthetic, no text, no watermark"
        ),
        "w": 512, "h": 512, "seed": 42133,
    },
    {
        "name": "weather-foggy",
        "prompt": (
            "photorealistic editorial cycling photography, square crop of a rider emerging from dense morning fog on a narrow road, "
            "headlight glow softened by mist, silvery low-contrast palette, quiet lonely pre-ride atmosphere, "
            "realistic moisture and haze, premium cycling editorial style, no text, no watermark"
        ),
        "w": 512, "h": 512, "seed": 42134,
    },
    {
        "name": "weather-hot",
        "prompt": (
            "photorealistic editorial cycling photography, square crop of a rider on sun-baked road at midday, "
            "heat haze rising from asphalt, dry grass and bleached landscape, strong sun high overhead, "
            "dusty amber and faded olive tones, realistic harsh summer atmosphere, premium editorial realism, "
            "no text, no watermark"
        ),
        "w": 512, "h": 512, "seed": 42139,
    },
    {
        "name": "weather-night",
        "prompt": (
            "photorealistic editorial cycling photography, square crop of a rider on quiet road after dusk, "
            "deep navy sky, thin moon and distant stars, warm bike lights cutting through cool darkness, "
            "restrained blue-black palette with subtle amber highlights, intimate nocturnal training mood, "
            "premium outdoor magazine style, no text, no watermark"
        ),
        "w": 512, "h": 512, "seed": 42135,
    },

    # ── Error Pages (512×512) ──
    {
        "name": "error-404",
        "prompt": f"{BASE}, a lost cyclist looking at a broken road sign with a question mark, dead-end path splitting in two directions, confused but friendly mood, orange #FF6B35 question mark glow, page not found concept",
        "w": 512, "h": 512, "seed": 42040,
    },
    {
        "name": "error-500",
        "prompt": f"{BASE}, a bicycle with a broken chain and gears scattered, small wrench and tools floating around, server error maintenance concept, red #F85149 warning triangle, mechanical breakdown mood",
        "w": 512, "h": 512, "seed": 42041,
    },

    # ── App Logo (512×512) ──
    {
        "name": "logo",
        "prompt": (
            "minimalist vector logo mark, single iconic symbol, "
            "abstract cyclist merged with data chart upward arrow, "
            "road bike wheel forming letter S shape, "
            "gradient from orange #FF6B35 to cyan #4ECDC4, "
            "dark navy background #0D1117, "
            "ultra clean geometric lines, negative space design, "
            "no text no letters, modern tech startup logo style, "
            "perfectly centered, high contrast, scalable icon"
        ),
        "w": 512, "h": 512, "seed": 42050,
    },

    # ── Background Textures (realistic photo, JPEG) ──
    {
        "name": "bg-sidebar",
        "prompt": (
            "photorealistic cycling photography, narrow winding mountain forest road at dusk, "
            "dense pine trees both sides forming natural tunnel, misty atmospheric depth, "
            "dim blue-green ambient light filtering through canopy, rich dark tones navy blue green, "
            "empty road perspective no people, professional DSLR telephoto lens, "
            "shallow depth of field bokeh, cinematic mood, no text, no watermark, "
            "dark moody nature photography, high contrast shadows"
        ),
        "w": 512, "h": 768, "seed": 43001, "ext": "jpg", "quality": 90,
    },
    {
        "name": "bg-main",
        "prompt": (
            "photorealistic aerial drone photography, epic winding cycling route through dramatic mountain valley, "
            "golden hour sunset low angle light, long shadows across landscape, "
            "muted desaturated earth tones greens and browns, panoramic ultra wide angle view, "
            "high resolution sharp landscape photography, cinematic dark dramatic sky with clouds, "
            "misty mountain peaks in background, river valley below, no people, "
            "no text, no watermark, highly detailed texture, HDR photography style"
        ),
        "w": 1280, "h": 720, "seed": 43002, "ext": "jpg", "quality": 90,
    },

    # ── Home widget artwork (960×720, JPEG) ──
    {
        "name": "home-weather",
        "prompt": (
            "photorealistic editorial cycling photography, empty backroad at dawn after light rain, "
            "wide open sky with layered clouds breaking apart, cold blue shadows and warm sunbeam on wet asphalt, "
            "wind moving tall grass at roadside, realistic natural texture, cinematic subdued color grade, "
            "quiet solitary training-day mood, no people, no text, no watermark, premium outdoor magazine photo"
        ),
        "w": 960, "h": 720, "seed": 43010, "ext": "jpg", "quality": 92,
    },
    {
        "name": "home-readiness",
        "prompt": (
            "photorealistic editorial still life, road bike leaned against rough concrete wall before sunrise, "
            "helmet gloves and full bottle prepared on a weathered wooden bench, soft side light, subtle film grain, "
            "dark teal and muted amber palette, realistic wear and texture, intimate pre-ride ritual, "
            "no people, no logos, no readable text, no watermark, premium cycling magazine photography"
        ),
        "w": 960, "h": 720, "seed": 43011, "ext": "jpg", "quality": 92,
    },
    {
        "name": "home-block",
        "prompt": (
            "photorealistic editorial cycling photography, early morning training camp scene, "
            "two road bikes resting beside a narrow mountain road with repeating switchbacks in the background, "
            "jacket and bottles laid out with deliberate order on stone barrier, soft mist in the valley, "
            "muted earthy tones, cinematic natural light, sense of structure and discipline, "
            "no people, no text, no watermark, realistic quiet atmosphere"
        ),
        "w": 960, "h": 720, "seed": 43012, "ext": "jpg", "quality": 92,
    },
    {
        "name": "home-progress",
        "prompt": (
            "photorealistic editorial cycling landscape, long climbing road with elegant hairpin turns rising toward a ridge, "
            "late evening light cutting across asphalt and rock, deep shadows with warm copper highlights, "
            "natural desaturated greens and slate tones, cinematic depth, strong forward direction and progression feeling, "
            "no people, no text, no watermark, premium outdoor sports photography"
        ),
        "w": 960, "h": 720, "seed": 43013, "ext": "jpg", "quality": 92,
    },

    # ── Achievement Badges (256×256) ──
    {
        "name": "badge-first-ride",
        "prompt": f"{BASE}, circular medal badge design, single star in center with small bicycle below, first achievement concept, gold and orange #FF6B35 metallic shine, celebration ribbon",
        "w": 256, "h": 256, "seed": 42060,
    },
    {
        "name": "badge-100km",
        "prompt": f"{BASE}, circular medal badge design, winding road stretching to horizon, distance milestone concept, silver and cyan #4ECDC4 metallic shine, odometer wheel element",
        "w": 256, "h": 256, "seed": 42061,
    },
    {
        "name": "badge-1000km",
        "prompt": f"{BASE}, circular medal badge design, globe with cycling route circling it, epic distance milestone, gold and orange #FF6B35 metallic shine, world explorer element",
        "w": 256, "h": 256, "seed": 42062,
    },
    {
        "name": "badge-speed-demon",
        "prompt": f"{BASE}, circular medal badge design, flame trail with speedometer needle at max, speed achievement concept, hot red and orange gradient metallic, lightning bolt accent",
        "w": 256, "h": 256, "seed": 42063,
    },
    {
        "name": "badge-climber",
        "prompt": f"{BASE}, circular medal badge design, mountain peak with zigzag road going up, climbing achievement concept, green #3FB950 and white metallic shine, summit flag element",
        "w": 256, "h": 256, "seed": 42064,
    },
    {
        "name": "badge-endurance",
        "prompt": f"{BASE}, circular medal badge design, clock face with cyclist silhouette as hour hand, long ride achievement concept, deep blue and silver metallic shine, time element",
        "w": 256, "h": 256, "seed": 42065,
    },
    {
        "name": "badge-consistency",
        "prompt": f"{BASE}, circular medal badge design, calendar grid with checkmarks filling every day, streak achievement concept, purple #BC8CFF and gold metallic shine, flame streak element",
        "w": 256, "h": 256, "seed": 42066,
    },
    {
        "name": "badge-power",
        "prompt": f"{BASE}, circular medal badge design, lightning bolt with power meter gauge at maximum, power milestone concept, electric yellow and cyan #4ECDC4 metallic shine, watt symbol element",
        "w": 256, "h": 256, "seed": 42067,
    },
    {
        "name": "badge-early-bird",
        "prompt": f"{BASE}, circular medal badge design, sunrise over hills with bicycle silhouette, morning ride achievement concept, warm dawn pink and orange #FF6B35 metallic shine, sunrise rays",
        "w": 256, "h": 256, "seed": 42068,
    },
    {
        "name": "badge-night-owl",
        "prompt": f"{BASE}, circular medal badge design, crescent moon with owl eyes and bicycle wheel, night ride achievement concept, deep purple and silver metallic shine, stars element",
        "w": 256, "h": 256, "seed": 42069,
    },
    {
        "name": "badge-rain-warrior",
        "prompt": f"{BASE}, circular medal badge design, rain drops with shield emblem and bicycle, bad weather riding achievement concept, steel blue and grey metallic shine, water splash element",
        "w": 256, "h": 256, "seed": 42070,
    },
    {
        "name": "badge-century",
        "prompt": f"{BASE}, circular medal badge design, laurel wreath surrounding number 100 with tiny bicycle, century ride achievement concept, platinum and gold metallic shine, championship ribbon",
        "w": 256, "h": 256, "seed": 42071,
    },
]


def load_pipe():
    """Load the quantized Z-Image-Turbo pipeline with CPU offload for 8GB VRAM."""
    print(f"Loading model: {MODEL_ID}")
    pipe = ZImagePipeline.from_pretrained(
        MODEL_ID,
        torch_dtype=torch.bfloat16,
    )
    pipe.enable_model_cpu_offload()
    print("Pipeline loaded with CPU offload enabled.")
    return pipe


def generate_one(pipe, img):
    """Generate a single image."""
    generator = torch.Generator(device="cpu").manual_seed(img["seed"])
    result = pipe(
        prompt=img["prompt"],
        height=img["h"],
        width=img["w"],
        num_inference_steps=STEPS,
        guidance_scale=GUIDANCE,
        generator=generator,
    )
    return result.images[0]


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    force = "--force" in sys.argv
    args = [a for a in sys.argv[1:] if a != "--force"]
    filter_prefix = args[0] if args else None

    if filter_prefix:
        images = [i for i in IMAGES if i["name"].startswith(filter_prefix)]
        if not images:
            print(f"No images matching prefix '{filter_prefix}'")
            sys.exit(1)
    else:
        images = IMAGES

    pipe = load_pipe()

    results = []
    total = len(images)

    for idx, img in enumerate(images):
        ext = img.get("ext", "png")
        output_path = os.path.join(OUTPUT_DIR, f"{img['name']}.{ext}")

        if os.path.exists(output_path) and not force:
            print(f"[{idx+1}/{total}] SKIP (exists): {img['name']}")
            results.append({"name": img["name"], "status": "skipped"})
            continue

        tag = "REGEN" if os.path.exists(output_path) else "NEW"
        print(f"[{idx+1}/{total}] {tag}: {img['name']} ({img['w']}x{img['h']}, seed={img['seed']})...")
        t0 = time.time()

        try:
            pil_img = generate_one(pipe, img)
            save_kwargs = {}
            if ext == "jpg":
                pil_img = pil_img.convert("RGB")
                save_kwargs = {"format": "JPEG", "quality": img.get("quality", 90)}
            pil_img.save(output_path, **save_kwargs)
            elapsed = time.time() - t0
            size_kb = os.path.getsize(output_path) // 1024
            print(f"         ✓ {elapsed:.1f}s, {size_kb}KB")
            results.append({"name": img["name"], "status": "ok", "time_s": round(elapsed, 1), "size_kb": size_kb})
        except Exception as e:
            elapsed = time.time() - t0
            print(f"         ✗ FAILED {elapsed:.1f}s: {e}")
            results.append({"name": img["name"], "status": "error", "error": str(e)})
            gc.collect()
            torch.cuda.empty_cache()

    ok = sum(1 for r in results if r["status"] == "ok")
    skip = sum(1 for r in results if r["status"] == "skipped")
    fail = sum(1 for r in results if r["status"] == "error")
    print(f"\n{'='*50}")
    print(f"DONE: {ok} generated, {skip} skipped, {fail} failed")
    print(f"Output: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
