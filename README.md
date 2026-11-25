# Pharmie

**What to take, what to avoid, when to get help.**

Pharmie is a mobile-first web app that helps people check common symptoms, see which over-the-counter options are suitable (and which to avoid), keep count of doses so nothing doubles up, manage the medicine cabinet at home, and get help fast.

> ⚠️ **Prototype.** Pharmie gives general guidance, not a diagnosis. The rules and product data in this repo are simplified examples. Before real users rely on it you need clinical governance, pharmacist- and physician-reviewed protocols, a validated and locally registered medicine database, and a review against Thai medical-device, advertising and PDPA requirements.

## Features

| Tab | What it does |
| --- | --- |
| **Check** | Pick symptoms → set strength (Mild/Moderate/High, Occasional/Frequent/Persistent…) and duration → follow-up questions (temperature, sudden onset, extras, warning signs) → result with a 4-level care scale (Self-care · Pharmacist · Doctor · Emergency), the reasons for it, and a care plan sorted into **Recommended / Optional / Not recommended**. |
| **Product** | Ingredient, strength, age limit, label directions, checks against the selected profile (allergies, age, liver, unanswered questions), and anything in the cabinet that shares an ingredient. |
| **Safety** | Dose guard: 24-hour paracetamol total across every product, minimum 4-hour gap, daily limit, duplicate-ingredient warning, allergy and age blocks, frequent-painkiller pattern, and a solo check-in for people living alone. |
| **Cabinet** | Separate cabinets (Mine, Leo’s, Family, Mom’s), expiry and low-stock alerts, quantity steppers, shared-ingredient flags, add by photo or by hand (always confirmed before saving), shopping list with sharing. |
| **Family** | Health profiles per person, private by default, permission levels (View, Edit, Manage dependent, Emergency access), revoke, activity log, and a caregiver view for a parent’s daily medicines. |
| **Help** | One-tap 1669, health hotline 1330, poison center 1367, alert contacts by SMS with a summary, nearby pharmacy/clinic/hospital via maps, and a shareable summary for a doctor. |
| **Plans** | Free, Premium ฿79, Family ฿149, Premium+ ฿199–249 (demo only, no payments). |

Safety rules the app follows:

- Emergency warning signs always override medicine suggestions.
- A blank answer is never treated as “safe”: checks are marked incomplete.
- Children: syrup dosed by weight from the label, never aspirin, no adult tablets.
- Products sharing an active ingredient are counted together.

All data is stored in the browser (`localStorage`) on the user’s device. There is no backend and nothing is uploaded. Use **Profile → Reset demo data** to start over.

## Run it locally

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # rule tests (triage, dose guard, care plan, expiry)
npm run build    # production build in dist/
```

Node 18 or newer.

## Deploy to Render

The repo includes a `render.yaml` Blueprint that deploys Pharmie as a free **static site**.

1. Push this folder to a new GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Pharmie web app"
   git branch -M main
   git remote add origin https://github.com/<your-username>/pharmie.git
   git push -u origin main
   ```
2. In the [Render dashboard](https://dashboard.render.com), choose **New → Blueprint**, connect the repo, and click **Apply**.
   Render reads `render.yaml`, runs `npm ci && npm test && npm run build`, and publishes `dist/`.
3. Every push to `main` redeploys automatically. If a rule test fails, the deploy stops, so broken safety logic never goes live.

Prefer not to use a Blueprint? Create a **Static Site** instead with:

- Build command: `npm ci && npm run build`
- Publish directory: `dist`
- Add a rewrite rule: source `/*` → destination `/index.html`

## Project layout

```
src/
  data.js            symptoms, demo products, profiles, cabinet, initial state
  logic.js           triage, care plan, dose checks, expiry (pure, tested)
  logic.test.js      vitest tests for the rules
  store.js           reducer + localStorage persistence + hash router
  components/ui.jsx  icons, header, cards, tags, buttons, nav, toast
  screens/           one file per screen
  styles.css         calm-blue design tokens and components
render.yaml          Render Blueprint (static site)
```

## Not built yet

- Automatic label/barcode reading (the scan screen takes a photo; details are typed and confirmed by the user).
- Accounts, sync between family members' devices, and real notifications. Sharing, reminders and check-in alerts are simulated on one device.
- Payments.
