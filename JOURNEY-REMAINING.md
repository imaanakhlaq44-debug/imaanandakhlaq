# Learning Journey ka baqi kaam

21 November 2026 ke audit mein sab 1,000 levels app se load hue aur Flutter ke checks pass hue. Report har level ki asal source, plan wali activity, app mein maujood exercise aur baqi review dikhati hai. [1,000-level audit](./Imaan-Akhlaq-1000-Level-Audit.csv)

## Abhi baqi

- 192 levels par specific follow-up hai. 808 levels ki exercise aur marking criteria ko plan se manually milana hai. Yeh counts release approval ko represent nahi karte.
- 54 levels ki lesson-specific tasveerain aur 41 levels ki recordings chahiye. Recording ka exact text, playback aur public distribution ki ijazat verify karein.
- 60 levels mein check karein ke scored sawal chahiye ya guided recall kafi hai. 21 checkpoints ki cumulative mastery, marking aur retry flow source rubric se milayein.
- 35 levels ke meaning guides aur adult verification ka flow verify karein. Qur’an, Hadith, Tafsir aur fiqh ke liye qualified reviewer ki approval record karein.
- Pehle 10 levels mein reflection, faislay aur optional action ke Urdu drafts hain. Baqi Urdu content, age-group alternatives aur accessibility review complete karein.

Kuch levels aik se zyada follow-up mein hain. Super Admin mein **Journey Review** har level ki corrections aur package ki approvals record karta hai. Review complete hone tak public learner release band rahegi.

## Development reference

- App package: `flutter_app/assets/data/journey-preview.json`
- Package check: `node scripts/build-journey-preview.mjs --verify`
- Local preview flag: `LEARNING_JOURNEY_PREVIEW=true`
- Production learner flag: `LEARNING_JOURNEY_RELEASE=true`. The app checks for an active publication record matching the exact package.
