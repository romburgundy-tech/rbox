# The Recipe Box — self-hosted version

A shared family recipe box that runs on your own GitHub Pages site, with a free
Firebase database behind it. No Claude account needed for anyone to use it.

Total cost for normal family use: **$0/month.**

---

## What's in this folder

- `index.html` — the whole app (UI + logic)
- `firebase-config.js` — where you paste your Firebase project's credentials
- `icons/` — your app icon, already sized for favicon / home screen use
- `worker/recipe-worker.js` — a small server function that reads recipe links
  and photos using Claude, without exposing your API key to the browser
- `firestore.rules`, `storage.rules` — security rules for your Firebase project

---

## Step 1 — Create a Firebase project (free)

1. Go to https://console.firebase.google.com → **Add project** → give it any
   name (e.g. "family-recipe-box") → finish the wizard (you can skip Google
   Analytics).
2. In the left sidebar, click **Build → Firestore Database → Create database**.
   Choose **Production mode**, pick any region close to you.
3. Click **Build → Storage → Get started**. Accept the defaults.
4. Click **Build → Authentication → Get started**. Under **Sign-in method**,
   enable **Anonymous**. (This lets the app quietly verify a real browser
   opened it, without ever asking your family to log in or create a
   password.)
5. Click the gear icon → **Project settings** → scroll to **Your apps** →
   click the **</> (Web)** icon → register an app (any nickname) →
   Firebase will show you a `firebaseConfig` object.
6. Open `firebase-config.js` in this folder and paste your real values in,
   replacing the placeholders.

### Set the security rules
7. In Firestore → **Rules** tab, replace the contents with what's in
   `firestore.rules` in this folder, then click **Publish**.
8. In Storage → **Rules** tab, replace the contents with what's in
   `storage.rules` in this folder, then click **Publish**.

---

## Step 2 — Deploy the Worker (handles the "extract recipe" feature)

This is a small always-on server function on Cloudflare's free tier — it's
what reads a recipe link or a photo and turns it into ingredients/steps.

1. Get an Anthropic API key: https://console.anthropic.com → **API Keys** →
   **Create Key**. (This is billed separately from any Claude.ai
   subscription — pay-as-you-go, and recipe extraction costs a small
   fraction of a cent per recipe.)
2. Go to https://dash.cloudflare.com → sign up free → **Workers & Pages** →
   **Create** → **Create Worker** → give it a name (e.g. `recipe-box-worker`)
   → **Deploy**.
3. Click **Edit code**, delete the placeholder code, and paste in the full
   contents of `worker/recipe-worker.js` from this folder → **Deploy**.
4. Back on the Worker's page, go to **Settings → Variables and Secrets** →
   **Add** → name it `ANTHROPIC_API_KEY`, paste your key, mark it as
   **Secret** → **Save**.
5. Optional but recommended: add a second variable `ALLOWED_ORIGIN` set to
   your future GitHub Pages URL (e.g. `https://yourname.github.io`) — this
   stops other websites from using your Worker. You can leave this until
   after Step 3, once you know your Pages URL, then come back and add it.
6. Copy the Worker's URL (shown at the top of its page, looks like
   `https://recipe-box-worker.yourname.workers.dev`).
7. Open `firebase-config.js` again and paste that URL in as `WORKER_URL`.

---

## Step 3 — Put it on GitHub Pages (free hosting)

1. Create a free GitHub account if you don't have one: https://github.com/signup
2. Create a new repository (e.g. `recipe-box`) — public is fine and free.
3. Upload every file in this folder to that repository (drag-and-drop on
   the GitHub website works, or use `git push` if you're comfortable with
   git), keeping the folder structure (`icons/` stays a folder).
4. In the repository, go to **Settings → Pages**. Under **Branch**, choose
   `main` and `/ (root)` → **Save**.
5. GitHub will give you a URL like `https://yourname.github.io/recipe-box/`
   — that's your app's permanent address. It may take a minute to go live.
6. If you added `ALLOWED_ORIGIN` in Step 2, go back to the Worker's
   **Variables** and set it to this exact URL (without the trailing path,
   just `https://yourname.github.io`).

---

## Step 4 — Use it

Open the GitHub Pages URL on your iPhone in Safari → tap the **Share**
icon → **Add to Home Screen**. Send the same link to family — everyone who
opens it, enters their name, and starts adding recipes shares one box.

---

## Notes & limits

- **Free tier limits:** Firebase's free tier (Spark plan) allows far more
  reads/writes and storage than a family recipe box will ever use. If you
  somehow outgrew it, Firebase would ask you to switch to a pay-as-you-go
  plan rather than cutting you off.
- **The Worker needs to stay funded with your Anthropic key**, but usage is
  tiny — a handful of recipes a week costs well under $1/month.
- **If you ever want to lock this down further** (e.g. require a shared
  family passcode instead of open anonymous access), that's a reasonable
  next step — just ask.
- **Updating the app later:** edit `index.html` and re-upload it to GitHub;
  Pages updates automatically within a minute or two.
