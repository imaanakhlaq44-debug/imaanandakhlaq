"""Install the smaller web representations in an existing Flutter web build."""

import argparse
import json
import shutil
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("build_directory", type=Path)
    args = parser.parse_args()
    variants = Path(__file__).with_name("web-assets")
    bundled = args.build_directory / "assets"

    manifest_path = bundled / "FontManifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    urdu = next(entry for entry in manifest if entry["family"] == "JameelNoori")
    font_dir = bundled / "assets" / "fonts"
    for filename in ("noto-nastaliq-urdu.ttf", "noto-nastaliq-urdu-OFL.txt"):
        shutil.copyfile(variants / "fonts" / filename, font_dir / filename)
    urdu["fonts"] = [{"asset": "assets/fonts/noto-nastaliq-urdu.ttf"}]

    image_dir = bundled / "assets" / "images"
    for image in sorted((variants / "images").glob("*.webp")):
        if not (image_dir / f"{image.stem}.png").is_file():
            raise FileNotFoundError(f"No bundled PNG for {image.name}")
        shutil.copyfile(image, image_dir / image.name)

    manifest_path.write_text(json.dumps(manifest) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
