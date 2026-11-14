# Approved character sources

Use the original source assets supplied by the user for every occurrence of the characters.

- Imaan: girl with braid, pink kameez and orange trousers. Source: C:\Users\Almas\OneDrive\Desktop\imaan akhlaq\imaan.jpeg. Bundled unchanged as assets/images/original-imaan.jpg.
- Akhlaq: boy with black hair, blue shirt and khaki trousers. Source: C:\Users\Almas\OneDrive\Desktop\imaan akhlaq\akhlaq.jpeg. Bundled unchanged as assets/images/original-akhlaq.jpg.
- Both bundled files were verified against their source using SHA256. BrandCompanions renders these source files directly, with native clipping/layout only. No generated replacement faces or costumes are bundled.
- Other canonical poses and character sheets remain in the user's Character and Sheets folder. Consult these before adding any other character artwork.

The course icon atlas and fictional Amanpur background were generated with the built-in image tool for the selected UI design. They contain no character portraits. Course icons share one decoded atlas; map decoding is bounded to 1000px width.

## User-requested reading hero

The user requested a new shared-book pose based on the original Imaan/Akhlaq identity references and supplied reading-pose reference. assets/images/reading-hero-book1.png is the resulting derived illustration. It preserves Imaan's braid/pink kameez and Akhlaq's blue T-shirt and applies the actual Book 1 cover, The Whispering Shadows, sourced from ../public/assets/covers/book1.jpg. This is an authorized derived pose, not a byte-identical original portrait. The original portraits remain unchanged for the other uses documented above.

## Adventure map v2
User-authorized generated storybook map derived from selected Design 2 and original Imaan/Akhlaq portraits. Final built-in image-generation edit: preserve scenery and characters, re-pose both walking toward the viewer along the cream trail, not sideways. Artwork integrates characters and has no baked-in labels; native compact pin markers remain interactive. Asset: assets/images/amanpur-adventure-v2.png. Source: exec-20f92a6a-564f-429c-bd85-82faac410238.png.

The active bundled asset path is assets/images/amanpur-map.png (replaced as requested); amanpur-adventure-v2.png retains a versioned copy.

## Launch splash
launch-logo.jpg is copied unchanged from the original app public/kidba_assets/img/splash_logo.jpg, as requested. The Flutter splash adds a short native fade/scale transition; no new character design is generated. Android launch uses the original splash_icon.png while the engine starts.

## Hadith preview Arabic font
Bundled Noto Naskh Arabic variable font from https://github.com/google/fonts/tree/main/ofl/notonaskharabic with SIL OFL text included in assets/fonts/noto-naskh-arabic-OFL.txt. First five Hadith entries are imported from the supplied email curriculum; see HADITH_DEMO.md for provenance and authored activity separation.

## Fredoka (brand display font)
assets/fonts/fredoka.ttf is Fredoka[wdth,wght].ttf from the official Google Fonts repository, https://github.com/google/fonts/tree/main/ofl/fredoka (downloaded 15 November 2026, 159,184 bytes, with the user's approval). SIL Open Font License 1.1, copy in assets/fonts/fredoka-OFL.txt. The website and original app use Fredoka One for the same role. Used only for headings and large numbers via displayStyle() in lib/screens/ui_kit.dart; body text stays AppSans.
