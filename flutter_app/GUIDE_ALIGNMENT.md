# Imaan & Akhlaq — guide alignment

## Branding and account entry

The existing AuthPage defines navy `#1E2D5A`, pink `#D63678`, orange `#E08020`. The shared dashboard uses ink `#16294D` and background `#F4F6FA`. Flutter now uses these original colors rather than the earlier green theme.

A launch now opens the original-art splash and an explicit Individual / School selector. Individual opens the public learning home; School opens registration and separate administrator, teacher and family login routes. Remembered accounts still choose a section and are checked against their actual role. See ENTRY_FLOW_REVIEW.md.

Individual and school registration follow the roles in the existing app. Families and teachers use school-provisioned PAR-/TCH- accounts. Account creation uses an isolated Firebase session so incomplete registration cannot send a user to a missing-profile dashboard. Individual trial dates remain server-owned. The native flow sends Firebase verification links; it does not port the legacy client-side OTP interface. Delivery failure is shown explicitly. Email verification is not currently enforced as an access gate, matching the existing backend's lack of such a gate.

## What the email guides actually require

* **Quran Companion:** two connected paths (Hifz/Recitation Skills and Masnun Recitations), ability-based pacing, Juz browsing, verse audio/highlighting, repeated recall, scheduled revision and adult verification.
* **Hadith:** listen, understand, memorise, make a contextual choice, one offline daily action, reflect and revisit. The second document extends lessons 51–100.
* **Zad al-Qulub:** ten volumes, 100 duas/adhkar, Arabic with English/Urdu meanings, correct occasion, gentle memorization and practical use.
* **Salah:** preparation, prayer worlds, recitation practice, sequence learning, parent/teacher guidance, reviewed Fiqh variations and no scores for real worship.
* **Tafsir:** Home/Welcome, Continue learning, Listen to a verse, Today's small action, parent entry, eight learning worlds, a reusable mission engine and reviewed source assets.
* **IBRAH:** 24 source-based story volumes with contemporary Imaan/Akhlaq framing, learning missions, real-world actions and reflection. The later resend is the content set used in the local review.
* **Hajj/Umrah:** separate adventures, age-adaptive lessons, safe virtual rehearsal, duas, ethics, family guidance and follow-up practice.
* **Rihlat al-Huda:** four age bands (6–8, 9–10, 11–12, 13–14), source-based teaching, stories, questions, practice and review.

The lesson system should share reusable interactions rather than implementing hundreds of unrelated games. Rewards represent personal learning effort, not piety or divine reward; no public worship ranking or forced evidence upload.

## Implemented vs pending

**Implemented now:** original colors, public home/course previews, sign in, native individual/school signup, school-login guidance, family child selection, existing book catalogue and native reader/activity foundation.

**Still pending:** the actual eight curricula as playable lessons, age/proficiency modes, Arabic audio/highlighting, spaced revision, multilingual content, parent learning controls, teacher/admin feature parity and complete backend integration. The Individual Hadith entry now includes the first five source-linked lessons as a playable, device-progress preview (see HADITH_DEMO.md). The remaining course entries and school-assigned curriculum remain in preparation; the preview is not the complete 100-Hadith curriculum.

The Tafsir manual refers to eight source volumes; the thread contains seven separate story volumes plus the developer manual. The Self-Improvement source volume still needs to be located or supplied before complete import.

## Verification boundaries

Registration orchestration and UI are covered using fake gateways/repositories, including rollback and failure recovery. No real account was created during these automated tests. Live Firebase registration/email delivery and remaining security rules require dedicated staging/emulator end-to-end verification before release.
