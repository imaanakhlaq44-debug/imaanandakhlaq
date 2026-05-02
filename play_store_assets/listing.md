# Imaan & Akhlaq — Google Play Store Listing
**Version: 3.3 (versionCode 24) — May 2026**

Copy-paste these values into Google Play Console.

---

## 1. App details

| Field | Value |
|---|---|
| App name | `Imaan & Akhlaq` |
| Default language | English (United States) — `en-US` |
| App or Game | App |
| Free or Paid | Free |
| Category | Education |
| Tags | Islamic, Kids, Learning, Quran |
| Contact email | `contact@imaanakhlaq.org` |
| Contact phone | `+92 339 0106475` |
| Contact website | `https://imaanakhlaq.org` |
| Privacy Policy URL | `https://imaanakhlaq.org/privacy.html` |
| Account Deletion URL | `https://imaanakhlaq.org/delete-account.html` |

---

## 2. Short description (max 80 characters)

```
Islamic learning for kids — stories, Qibla, Tasbeeh, books and school progress.
```
(79 chars)

**Urdu alternative (for ur-PK locale, optional):**
```
بچوں کے لیے اسلامی تعلیم — کہانیاں، قبلہ، تسبیح، کتابیں اور اسکول کی پیش رفت۔
```

---

## 3. Full description (max 4000 characters)

```
Imaan & Akhlaq is a joyful character-building app for children aged 5–12, built by Imaan Akhlaq in Islamabad. The app brings together stories, illustrated books, puppet shows, audio lessons, daily prayers, the Qibla finder, a digital Tasbeeh and a complete school workflow for parents, teachers and administrators — all in one place.

WHAT YOUR CHILD CAN DO
• Read beautifully illustrated Islamic story books with audio narration.
• Watch puppet shows and short videos that teach Akhlaq (good character) in a fun way.
• Practice the digital Tasbeeh counter with vibration and progress saving.
• Find the Qibla using the camera-based AR Qibla Finder (works offline, no internet needed).
• Track learning progress and earn small achievements as books are completed.
• Colour, play simple games and explore safe, ad-free Islamic content.

FOR PARENTS
• Create a parent account and link your children.
• See exactly what your child has read, listened to and completed.
• View teacher feedback and quiz results.
• Receive only essential notifications — no marketing, no profiling, no tracking ads.

FOR TEACHERS & SCHOOLS
• A complete teacher dashboard to assign books, mark attendance and add notes.
• Class-wise student lists, fee status and announcement tools.
• Admin and Super-Admin panels for school owners to manage multiple branches.
• Designed with input from real Islamic schools in Pakistan.

PRIVACY-FIRST DESIGN
• Camera (for Qibla AR) is processed entirely on your device — never recorded or uploaded.
• Location (for Qibla direction) is used on-device only — never sent to our servers, never sold.
• No third-party advertising SDKs. No social-media tracking pixels. No AI-model training on your data.
• Children's accounts are created and managed by a parent, teacher or school administrator.
• Built to comply with COPPA, GDPR-K and Google Play's Designed for Families policy.

YOUR DATA, YOUR CONTROL
• You can review, correct or delete your data at any time.
• In-app account deletion is available from your dashboard.
• You can also email contact@imaanakhlaq.org with the subject "Delete my account".
• Full details: https://imaanakhlaq.org/privacy.html

ABOUT US
Imaan & Akhlaq is an Ilm-O-Amal initiative — a small team of Muslim parents, teachers and engineers building thoughtful Islamic technology for the next generation. Our mission is to make learning Deen joyful, beautiful and trustworthy for every child.

CONTACT
Email: contact@imaanakhlaq.org
WhatsApp: +92 339 0106475
Website: https://imaanakhlaq.org

JazakAllahu khairan for installing Imaan & Akhlaq. May Allah make it beneficial for your family.
```

---

## 4. Graphic assets (already prepared)

| Asset | File | Size |
|---|---|---|
| App icon | `play_store_assets/icon-512.png` | 512×512 PNG |
| Feature graphic | `play_store_assets/feature-graphic.png` | 1024×500 PNG |
| Phone screenshots | `play_store_assets/screenshots/01_splash.png` … `06_book.png` | min 320 px, max 3840 px |

Tablet screenshots are optional — skip unless you have tablet-specific shots.

---

## 5. App content (Play Console → "App content" section)

### 5.1 Privacy Policy
- URL: `https://imaanakhlaq.org/privacy.html`

### 5.2 Ads
- **Does your app contain ads?** → **No**

### 5.3 App access
- **Is all functionality available without special access?** → **No, some functionality is restricted**
- Provide test credentials (create a demo account in your Firebase and paste here):
  ```
  Username: demo-parent@imaanakhlaq.org
  Password: <pick a demo password>
  Notes: Logs in as a parent. Use the dashboard to view linked children.
  ```
- Add a second test account for teacher role if reviewers ask.

### 5.4 Content rating
Run the questionnaire. Honest answers for this app:
- Violence: **None**
- Sexuality: **None**
- Profanity: **None**
- Controlled substances: **None**
- Gambling: **None**
- User-generated content shared with others: **No** (teacher notes are private to the school)
- User interaction: **No** (no public chat / no social features)
- Shares user location: **No** (location stays on device)
- Digital purchases: **No**

Expected rating: **Everyone** / PEGI 3.

### 5.5 Target audience and content
- **Target age groups:** **Ages 5 and under, Ages 6–8, Ages 9–12, Adults** (parents/teachers).
- **Appeals to children?** → **Yes** → app must comply with Families policy.
- **Designed for Families program:** Opt in (recommended for this app).
- **Mixed audience age verification:** Adult section (parent/teacher dashboards) is access-controlled by login, not by age gate.

### 5.6 News app
- **Is your app a news app?** → **No**

### 5.7 COVID-19 contact tracing / status
- **No**

### 5.8 Data safety form
See section 6 below — copy answers from there.

### 5.9 Government app
- **No**

### 5.10 Financial features
- **No**

### 5.11 Health
- **No**

---

## 6. Data Safety form (Play Console → "Data safety")

### 6.1 Data collection and security (overview)

| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | **Yes** |
| Is all of the user data collected by your app encrypted in transit? | **Yes** |
| Do you provide a way for users to request that their data be deleted? | **Yes** — `https://imaanakhlaq.org/delete-account.html` |
| Has your app been independently validated against a global security standard? | **No** |

### 6.2 Data types — declare each as below

#### Personal info
| Data | Collected | Shared | Processed ephemerally | Required / Optional | Purposes |
|---|---|---|---|---|---|
| Name | Yes | No | No | Required | Account management, App functionality |
| Email address | Yes | No | No | Required | Account management, App functionality |
| User IDs (Firebase UID) | Yes | No | No | Required | Account management, App functionality, Analytics |
| Phone number | Yes | No | No | Optional | Account management, Customer support |
| Address | No | — | — | — | — |
| Race / ethnicity | No | — | — | — | — |
| Political or religious beliefs | No | — | — | — | — |
| Sexual orientation | No | — | — | — | — |
| Other personal info | No | — | — | — | — |

#### Financial info
- **None collected.**

#### Health and fitness
- **None collected.**

#### Messages
- **None collected.** (No in-app chat. Teacher notes are not user-to-user messages.)

#### Photos and videos
| Data | Collected | Shared | Purposes |
|---|---|---|---|
| Photos | Optional (profile picture only) | No | Account management, App functionality |
| Videos | No | — | — |

#### Audio files
- **None collected.**

#### Files and docs
| Data | Collected | Shared | Purposes |
|---|---|---|---|
| Files and docs (homework upload, optional) | Optional | No | App functionality |

#### Calendar
- **None collected.**

#### Contacts
- **None collected.**

#### App activity
| Data | Collected | Shared | Purposes |
|---|---|---|---|
| App interactions (quiz scores, book progress, attendance) | Yes | No | App functionality, Analytics |
| In-app search history | No | — | — |
| Installed apps | No | — | — |
| Other user-generated content (teacher notes about a student) | Yes | No | App functionality |
| Other actions | No | — | — |

#### Web browsing
- **None collected.**

#### App info and performance
| Data | Collected | Shared | Purposes |
|---|---|---|---|
| Crash logs | Yes | No | Diagnostics, App functionality |
| Diagnostics (device model, OS, app version) | Yes | No | Diagnostics, Analytics |
| Other app performance data | No | — | — |

#### Device or other IDs
- **None collected.** (We use Firebase UID, which is an account ID, not a device ID.)

#### Location
- **Approximate location** — **NOT collected** (used on-device only, never sent to servers).
- **Precise location** — **NOT collected** (used on-device only for Qibla bearing calculation).

> Important note for the form: If Play Console asks specifically about *runtime permission usage*, declare that the app **uses** location and camera permissions but **does not collect or share** that data. The "Data safety" section is about data leaving the device — your app keeps it local, so the answer is **Not collected**.

### 6.3 Security practices
- ☑ Data is encrypted in transit (TLS / HTTPS).
- ☑ Users can request that their data be deleted.
- ☐ Independent security review (leave unchecked).
- ☑ Follows Google Play Families Policy.

---

## 7. Pricing & distribution
- **Free** app.
- **Countries:** Select **All countries / regions** (or start with Pakistan + a few test countries for the closed test).
- **Contains ads:** **No**.
- **In-app purchases:** **No**.
- **Designed for Families:** **Yes** (opt in).

---

## 8. Release plan (recommended order)

1. **Internal testing** — upload `app-release.aab`, add yourself + 2–3 testers by email, test login, Qibla, Tasbeeh, books, dashboards.
2. **Closed testing** (only required if your developer account is brand-new under the new Personal Developer rules — needs 12 testers × 14 days).
3. **Production** — submit for review. First review usually takes 1–7 days.

### Release notes for first version (paste in "What's new")
```
Welcome to Imaan & Akhlaq! This first release brings illustrated Islamic books, audio stories, the Qibla finder, a Tasbeeh counter and complete dashboards for parents, teachers and schools. JazakAllahu khairan for trying us out.
```

---

## 9. Things to remember for every future release

- Bump `versionCode` in `android/app/build.gradle` (currently `1`).
- Optionally bump `versionName` (e.g. `1.0.1`).
- Pause OneDrive sync before running `gradlew bundleRelease`.
- Build command:
  ```powershell
  npm run build:apk
  npx cap sync android
  cd android
  .\gradlew.bat bundleRelease --no-daemon
  ```
- AAB output: `android/app/build/outputs/bundle/release/app-release.aab`.
