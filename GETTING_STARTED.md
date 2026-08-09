# Setting Up The Recipe Box — Complete Walkthrough

No coding experience needed. You'll create three free accounts (GitHub,
Firebase, Cloudflare) and copy-paste a few values between them. Budget about
45 minutes the first time. If anything on screen doesn't match these
instructions exactly (these websites update their designs sometimes), just
describe what you're seeing and I'll help you find the right button.

**The order matters** — do these in sequence, don't skip ahead.

---

## Part 1 — Get an Anthropic API key

This is what powers the "read this recipe link" and "scan this photo"
features. It's separate from any Claude.ai subscription — you pay only for
what you use, and recipe extraction costs a small fraction of a cent each.

1. Go to **console.anthropic.com** and sign up or log in.
2. On the left, click **API Keys**.
3. Click **Create Key**, give it any name like "Recipe Box", click **Create**.
4. A long string starting with `sk-ant-` appears. **Click Copy.**
5. Paste it somewhere temporary — a Notes app, an email draft to yourself —
   you'll need it again in Part 3. You won't be able to see it again after
   you navigate away.
6. You may be asked to add a payment method for billing. This is normal —
   usage for a family recipe box will likely stay under $1/month.

---

## Part 2 — Put the app on GitHub Pages (free hosting)

### Create your account and repository

1. Go to **github.com/signup** and create a free account, if you don't
   already have one.
2. Once logged in, click the **+** icon top-right → **New repository**.
3. Name it something like `recipe-box`. Leave it set to **Public**.
   Don't check any of the boxes below (no README, no .gitignore). Click
   **Create repository**.

### Upload the app files

4. Unzip the `recipe-box-selfhosted.zip` file I gave you, so you have a
   regular folder on your computer with `index.html`, `firebase-config.js`,
   an `icons` folder, a `worker` folder, and so on.
5. On your new empty GitHub repository page, click **uploading an existing
   file** (a blue link in the middle of the page).
6. Open that unzipped folder on your computer, select **everything inside
   it** (all files and both folders), and drag them all onto the GitHub
   upload page at once. Wait for the upload bar to finish.
7. Scroll down, click the green **Commit changes** button.
8. Click into the repository's file list and confirm you see `index.html`,
   `firebase-config.js`, an `icons` folder, and a `worker` folder sitting
   at the top level (not nested inside another folder — if you see a
   `recipe-box-selfhosted` folder containing everything, open it, select
   everything inside, and move it up so `index.html` is at the top level).

### Turn on Pages

9. In your repository, click **Settings** (top menu, gear icon area).
10. In the left sidebar, click **Pages**.
11. Under **Build and deployment → Branch**, choose **main** and **/ (root)**,
    click **Save**.
12. Wait about a minute, then refresh the page. You'll see a message like
    "Your site is live at `https://yourname.github.io/recipe-box/`" —
    **copy that address**, you'll need it in Part 4.

At this point the site will load if you visit it, but recipes won't save
yet — we still need to connect the database and the recipe-reading feature.

---

## Part 3 — Create your free database (Firebase)

1. Go to **console.firebase.google.com**, sign in with any Google account.
2. Click **Add project** (or **Create a project**). Name it anything, like
   `family-recipe-box`. Click through the setup screens — when asked about
   Google Analytics, you can turn it off. Click **Create project**, then
   **Continue** once it's ready.

### Turn on the three pieces you need

3. In the left sidebar, click **Build → Firestore Database**. Click
   **Create database**. Choose **Start in production mode**, pick any
   location, click **Enable**.
4. In the left sidebar, click **Build → Storage**. Click **Get started**,
   click through the default prompts, click **Done**.
5. In the left sidebar, click **Build → Authentication**. Click
   **Get started**. Under the **Sign-in method** tab, click **Anonymous**,
   toggle it **Enable**, click **Save**.
   *(This quietly confirms a real browser opened the app — nobody will
   ever see a login screen.)*

### Get your project's connection details

6. Click the **gear icon** next to "Project Overview" (top-left) →
   **Project settings**.
7. Scroll down to **Your apps**. Click the **</>** icon (labeled "Web").
8. Give the app any nickname (e.g. "Recipe Box Web"), click **Register app**.
9. You'll see a code block containing a `firebaseConfig = { ... }` object
   with values like `apiKey`, `authDomain`, `projectId`, etc. Keep this
   page open — you'll copy from it in the next step.

### Paste those details into your app on GitHub

10. Go back to your GitHub repository, click on **firebase-config.js**.
11. Click the **pencil icon** (Edit this file) in the top-right of the file
    view.
12. You'll see placeholder text like `"YOUR_API_KEY"`. One by one, replace
    each placeholder with the matching real value from the Firebase page
    (keep the quote marks, just swap what's inside them):
    - `apiKey` → the `apiKey` value
    - `authDomain` → the `authDomain` value
    - `projectId` → the `projectId` value
    - `storageBucket` → the `storageBucket` value
    - `messagingSenderId` → the `messagingSenderId` value
    - `appId` → the `appId` value
13. Leave the `WORKER_URL` line alone for now — you'll come back to it in
    Part 4.
14. Scroll down, click **Commit changes**.

### Lock down the security rules

15. Back in Firebase, go to **Build → Firestore Database → Rules** tab.
16. Delete everything in the box and paste in the contents of the
    `firestore.rules` file from your unzipped folder. Click **Publish**.
17. Go to **Build → Storage → Rules** tab. Delete everything and paste in
    the contents of `storage.rules`. Click **Publish**.

---

## Part 4 — Turn on recipe reading (Cloudflare Worker)

This is the part that reads a pasted link or a scanned photo and turns it
into ingredients and steps.

1. Go to **dash.cloudflare.com**, sign up free.
2. In the left sidebar, click **Workers & Pages**.
3. Click **Create** → **Create Worker**. Give it a name like
   `recipe-box-worker`. Click **Deploy** (it'll deploy a placeholder page
   first — that's fine).
4. Click **Edit code**. You'll see a code editor with some sample code
   already in it.
5. Select all of that sample code and delete it.
6. Open the `worker/recipe-worker.js` file from your unzipped folder in
   any text editor (double-click it — on Mac it opens in TextEdit, on
   Windows in Notepad; if it opens in a browser instead, right-click → Open
   With → Notepad/TextEdit). Select all the text (Ctrl/Cmd+A), copy it
   (Ctrl/Cmd+C).
7. Click back into the Cloudflare code editor, paste (Ctrl/Cmd+V).
8. Click **Deploy** (top-right).
9. Go to the Worker's **Settings** tab → **Variables and Secrets**.
10. Click **Add**. For the name, type exactly `ANTHROPIC_API_KEY`. For the
    value, paste the `sk-ant-...` key you saved in Part 1. Make sure it's
    set as **Secret** (not plain text). Click **Save** / **Deploy**.
11. At the top of the Worker's page, find its address — something like
    `https://recipe-box-worker.yourname.workers.dev`. Copy it.

### Connect it to your app

12. Go back to GitHub, open **firebase-config.js** again, click the pencil
    to edit.
13. Replace the `WORKER_URL` placeholder with the address you just copied
    (keep the quote marks). Click **Commit changes**.

### Optional: restrict who can use your Worker

14. Back in Cloudflare, go to the Worker's **Settings → Variables and
    Secrets** → **Add**. Name it `ALLOWED_ORIGIN`, and for the value paste
    your GitHub Pages address from Part 2 step 12 — but only the beginning
    part, like `https://yourname.github.io` (no `/recipe-box/` at the end).
    This isn't a secret, just a plain variable. Click **Save**/**Deploy**.

---

## Part 5 — Try it out

1. Open your GitHub Pages address (`https://yourname.github.io/recipe-box/`)
   in a browser.
2. Enter your first name.
3. Try pasting a link to any recipe website and tapping **Extract** — you
   should see it fill in a title, ingredients, and steps within a few
   seconds.
4. Try adding a recipe, then reload the page — it should still be there.
   That confirms the database is working.

### Add it to your iPhone home screen

5. On your iPhone, open the same address in **Safari** (this has to be
   Safari, not Chrome, for "Add to Home Screen" to work correctly).
6. Tap the **Share** icon (square with an arrow) at the bottom of the
   screen.
7. Scroll down, tap **Add to Home Screen**, tap **Add**.
8. Send the same link (text message, email, whatever's easiest) to family
   — everyone who opens it and enters their name shares the same box.

---

## If something doesn't work

- **Recipes don't save / disappear on reload** → double check every value
  in `firebase-config.js` was pasted correctly, with no extra spaces, and
  that you clicked Commit changes on GitHub after editing.
- **"Extract" button gives an error** → double-check `WORKER_URL` in
  `firebase-config.js` matches your Worker's address exactly, and that
  `ANTHROPIC_API_KEY` is saved correctly in the Worker's Settings.
- **The page loads but looks unstyled or broken** → make sure `index.html`
  and the `icons` folder ended up at the top level of the repository, not
  nested inside an extra folder.
- **Anything else** → tell me exactly what you see on screen (a
  screenshot helps a lot) and I'll help you fix it.
