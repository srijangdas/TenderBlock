> **Note (v3):** This file was carried over from the earlier Bidder/Lister-only edition. For current API endpoints and the five-actor implementation, start with [SPRING_BOOT_API_CONTRACT.md](SPRING_BOOT_API_CONTRACT.md), [IMPLEMENTATION_MATRIX.md](IMPLEMENTATION_MATRIX.md), and [GITHUB_MERGE_GUIDE.md](GITHUB_MERGE_GUIDE.md). Some descriptions below refer to older placeholder screens.

# TenderBlock — Beginner’s code walkthrough (Bidder + Lister)

This guide explains the **actual source** in the attached React + Vite + Tailwind project. Read it while opening files in VS Code. This project is a **frontend prototype** and the Spring Boot API fields are **proposed**, not guaranteed to match the backend repository until the developers agree on DTOs.

## The required entry rule (important)

- **Public:** `/` → landing page → `/access` → `/register` or `/login` → `/bidder` or `/lister`.
- **Staff:** `/staff/login` → login with an existing, backend-provisioned `ADMIN`, `EVALUATOR`, or `AUDITOR` identity → `/staff/workspace` (a protected placeholder, not the finished staff modules).
- Public visitors are anonymous: the browser **cannot infer a person’s role from a single URL** before login. Give staff their dedicated link. They must not self-register for a privileged role. The public landing page is aimed at Bidder and Lister, while the staff route has no public header.
- `BIDDER` and `LISTER` are exclusive roles. Choosing a radio button is only a **UI guarantee**; the backend must enforce the rule too.

## Three fundamentals before code

**Component:** a JavaScript function that returns JSX (React markup). For example, `function LandingPage() { return <h1>Welcome</h1> }`.

**JSX:** HTML-like syntax within JavaScript. Use `className` rather than HTML `class`. A pair of braces such as `{user.fullName}` evaluates JavaScript inside JSX.

**State:** values tracked by React through `useState`. When you call a setter like `setForm(...)`, React rerenders the component to reflect the updated value. Never edit state variables directly.

**Tailwind:** a utility CSS framework. `p-5` means padding; `bg-white` sets a white background; `grid`, `flex`, `gap-4`, `rounded-lg` and `text-sm` control layout and appearance. Project-specific classes such as `tb-card`, `tb-input`, `tb-btn-primary` are defined in `src/index.css`.

**Routing:** React Router matches paths to components in `src/App.jsx`. It does **not** decide who is authorised to call Spring Boot. The backend must enforce permissions.

**Vite:** runs the local dev server, processes modules and JSX, supports fast updates, and produces a production bundle. Vite uses Node.js for development/build; Spring Boot is the application backend.

---

# Page 1: `src/pages/LandingPage.jsx`

## Imports (lines 1–5)

- `Link` from `react-router-dom`: navigates **inside** the single-page React application without a full browser reload.
- The icons imported from `lucide-react` (e.g., `ShieldCheck`, `Search`, `Timer`) are **visual React components**, not business logic.
- `PublicHeader`: reusable navbar: logo, anchor navigation and Sign in / Sign up buttons.
- `HeroIllustration`: the graphic in the first section.
- `TeamFooter`: the team/contact section rendered at the bottom.

## Data objects (lines 7–21)

`benefits`, `features` and `steps` are arrays of JavaScript objects. Example:

```jsx
const features = [
  { icon: Search, title: 'Discover opportunities', text: 'Explore published tenders...' },
];
```

Each object has properties `icon`, `title`, and `text`. This avoids typing almost-identical HTML cards repeatedly. Adding a feature means appending a single object to the array.

## Component (lines 23–50)

- `export default function LandingPage()` defines the component and makes it importable by `App.jsx`.
- `return <> ... </>` is a React *fragment*: lets the component return `PublicHeader`, `main`, and `TeamFooter` without adding an unnecessary `<div>`.
- `<PublicHeader />` prints the navbar.
- `<main id="home">` contains the page’s primary content and allows `/#home` anchor navigation.
- The first `<section>` is a hero region: large heading, an explanatory paragraph and buttons. `lg:grid-cols-[...]` makes it a two-column layout on large screens.
- `<Link to="/access">Get started</Link>` moves to the Bidder/Lister access-choice page. `to` is a React Router prop; it is **not** a backend API call.
- `<a href="#about">Learn more</a>` scrolls to the section with `id="about"`. A normal anchor link is best for this job.
- `<HeroIllustration />` renders the decorative hero graphic; the app remains functional without it.
- `<section id="about">` explains what the application does; it does **not** implement Fabric.
- `benefits.map(...)` loops over the benefit array and renders one `<article>` per item. The nested `points.map(...)` makes each benefit bullet. React’s `key={title}` tells React which item is which during rerenders.
- The Features section works with `features.map(...)` in exactly the same way.
- The How It Works section uses `steps.map(({icon:Icon,title,description}, i) => ...)`. Destructuring extracts fields from each object, `Icon` is capitalised so JSX treats it as a component, and `i+1` displays step numbers.
- The final CTA repeats the navigation to `/access` for visitors who reach the bottom.
- `<TeamFooter />` draws the four team members and their placeholder contact fields; to change names or contact details edit `src/data/constants.js`.

### Why not use one giant HTML file?

Splitting common header, illustration and footer makes maintenance easier: the same header can appear on login/registration without duplicating code. If you want a smaller dependency footprint, the Lucide icons can be replaced by text or inline SVGs.

### Security note

The marketing text describes **planned** Fabric integrity support. It does not imply that the frontend itself records blockchain data.

---

# Page 2: `src/pages/RegisterPage.jsx`

## Imports and initial object

- `useState` stores the form inputs, validation errors, busy state and password visibility.
- `Link` gives users a route to login; `useNavigate` lets code redirect after success.
- `AuthLayout` is the shared authentication page wrapper.
- `FormField` is a reusable component for label, hint and error text.
- `ORGANIZATION_TYPES`, `ROLES`, `SECTORS` keep dropdown values in one place.
- `useAuth()` provides the `register` function through context, so registration does **not** need to know the HTTP details.
- `initial` contains empty values for `fullName`, `email`, `phoneNumber`, `organizationName`, `organizationType`, `address`, `registrationId`, `sector`, `role`, `password`, `confirmPassword`.

## `validate(form)`

This function returns an `errors` object. An empty object means all client-side checks passed. Examples:

```js
if (!form.organizationName.trim()) errors.organizationName = 'Organization name is required.';
if (![ROLES.BIDDER, ROLES.LISTER].includes(form.role)) errors.role = 'Choose Bidder or Lister.';
if (form.confirmPassword !== form.password) errors.confirmPassword = 'Passwords do not match.';
```

- `.trim()` removes leading/trailing whitespace.
- `!value` detects missing or false-like values.
- `.includes(form.role)` checks whether the role is in the allowed list.
- `!==` checks non-equality. `form.confirmPassword` is **not** sent to the server.
- The regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` performs a *basic* email format check. Email existence and uniqueness must be checked by the backend.
- Phone validation removes non-digit characters and checks length; it is not country-specific identity verification.
- A minimum password length with letters and numbers is checked in the frontend; Spring Security must enforce its own password policy.

## `useState` variables

```jsx
const [form, setForm] = useState(initial);
const [errors, setErrors] = useState({});
const [notice, setNotice] = useState('');
const [busy, setBusy] = useState(false);
const [showPassword, setShowPassword] = useState(false);
```

- `form`: all user-entered values.
- `errors`: map of field names to validation messages.
- `notice`: general backend/rejected registration message.
- `busy`: stops repeat submits and switches the button to a spinner.
- `showPassword`: toggles password input `type` between `password` and `text`.

## `update(event)`

```js
const update = (event) => {
  const { name, value } = event.target;
  setForm(old => ({ ...old, [name]: value }));
  setErrors(old => ({ ...old, [name]: undefined }));
};
```

- `event.target` is the input that changed.
- `name` corresponds to a property in `initial`, e.g. `name="email"`.
- `{ ...old, [name]: value }` preserves old fields and updates exactly one field. `[name]` is a computed object key.
- The second update clears the old validation message for that field as the user corrects it.

## `handleSubmit(event)`

1. `event.preventDefault()` stops the browser’s default form navigation.
2. `setNotice('')` clears the previous general error.
3. `validate(form)` checks required fields.
4. `Object.keys(fieldErrors).length` tells you whether any validation messages exist; if so, `return` stops processing.
5. `setBusy(true)` marks a request in progress.
6. `await register(form)` calls `AuthContext.register` → `authApi.register` → DTO mapper → demo store or Spring Boot HTTP POST.
7. On success, `navigate('/login', { replace: true, state: { message: ... } })` redirects to login and sends a success message through router state.
8. `catch` displays an error without losing entered form values.
9. `finally` clears the busy state whether the request succeeds or fails.

## JSX form

- `onSubmit={handleSubmit}` wires the form to the function.
- `noValidate` disables browser-native constraint UI so the custom React errors can be used; the server must still validate everything.
- `FormField` wraps each label/input and may display field-level errors.
- Inputs use `value={form.field}` and `onChange={update}`; these are **controlled components**.
- `select` options are built with `.map()`. The role selection uses `type="radio"` and both options share `name="role"`, so only one radio can be checked.
- The role selection includes **only BIDDER and LISTER**. Admin, Auditor and Evaluator are not public self-registration options.
- `type="password"` masks password characters; clicking the eye toggles visibility.
- `disabled={busy}` prevents duplicate clicks while awaiting completion.

### Important improvement before production

The UI currently accepts the requested role and sends it to Spring Boot. The backend must confirm that such public role assignment is permitted; privileged accounts must be provisioned separately. Consider server-side organisation verification for listers. Never depend on client-side checks for authorisation.

---

# Page 3: `src/pages/LoginPage.jsx`

## Login state and imports

`useState` stores `form`, `visible`, `busy`, and `error`. `useNavigate()` allows redirecting after successful authentication. `useLocation()` reads the optional registration-success message passed in Router state. `useAuth().login` is the context function that calls the authentication API.

## `handleLogin(event)`

```jsx
async function handleLogin(event) {
  event.preventDefault();
  setError('');
  setBusy(true);
  try {
    const user = await login(form);
    navigate(user.role === 'LISTER' ? '/lister' : '/bidder', { replace: true });
  } catch (err) {
    setError(err?.message || 'Sign in failed.');
  } finally {
    setBusy(false);
  }
}
```

- `async` allows `await` to wait for the server response.
- `login(form)` does **not** validate against a frontend password list in live mode. It calls `/auth/login` on the backend.
- Successful live responses must supply an access token; the frontend then uses either `result.user` or `/users/me` to learn the signed-in role.
- The ternary `condition ? a : b` is a short `if/else`. Here it routes **Lister** to `/lister` and **Bidder** to `/bidder`. Staff roles are rejected in this public login API service.
- A failed login shows an error; successful login sets the session through the context.

## The JSX form

- `type="email"` offers an email-friendly input.
- `autoComplete="username"` and `autoComplete="current-password"` help password managers.
- The eye button (`type="button"`) toggles input visibility without submitting the form.
- `disabled={busy}` avoids repeated submissions while authentication runs.
- `DEMO_MODE` controls whether demo credentials are shown; it is a UI/testing switch, **not** a security feature.
- The link to `/register` helps visitors who do not yet have accounts.

### Why not redirect based on a role dropdown?

The user’s role must come from the **authenticated server response**, not from a freely editable frontend dropdown. A malicious person can edit browser requests and JavaScript variables.

---

# Page 4: `src/pages/ListerPage.jsx`

The lister dashboard is supported by the separate `TenderForm.jsx` and API service methods.

## `useMyTenders()` custom hook

```jsx
function useMyTenders() {
  const { user, token } = useAuth();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState(0);
  useEffect(() => { /* fetches */ }, [user, token, key]);
  return { items, error, loading, refresh: () => setKey(n => n + 1) };
}
```

A **custom hook** is a reusable function that uses React hooks. It obtains the current signed-in user/token and fetches that user’s tenders through `tenderApi.mine(...)`. `useEffect` runs after rendering and again whenever its dependencies change. `active` prevents an obsolete async request from updating a component after the effect has cleaned up. `refresh()` increments `key`, triggering a new fetch.

## `ListerPage({ createOnly = false })`

- The `createOnly` parameter is a **prop**. `/lister/create` passes `true`, causing the component to show only the tender creation form.
- Otherwise, the page shows a heading, a New Tender navigation link, three summary cards, `TenderForm` and recent tenders.
- `.filter(t => t.status === 'DRAFT')` counts drafts.
- `.filter(t => t.status === 'PENDING_APPROVAL')` counts tenders awaiting the Admin.
- `.map(({label,value,icon:Icon}) => ...)` creates the three dashboard cards from one array rather than duplicating JSX.
- `.slice(0,6)` shows only the first six recent items.
- `StatusBadge` translates status values into colored labels. These are **display states**, not the database’s source of authority.
- `onCreated={refresh}` allows the child `TenderForm` to tell its parent to fetch the updated tender list after a successful create/request operation.

## `TenderForm.jsx` — the actual create form

- `EMPTY` defines the initial tender fields: title, description, department, budget, sector, eligibility criteria, required documents and deadline.
- `setForm(old => ({ ...old, [event.target.name]: event.target.value }))` updates the field being edited.
- `isValid` checks required fields, a positive budget, and a future deadline. The backend must enforce the real rules.
- `save(event)` calls `tenderApi.create(user, form, token)` and stores the returned tender in `created` state.
- `requestApproval()` calls `tenderApi.requestApproval(...)` for that tender ID and switches the screen to pending approval.
- The created confirmation screen explicitly says the tender is **not yet published**.
- In demo mode `demoCreateTender` creates a local `DRAFT`, then `demoRequestApproval` changes its status to `PENDING_APPROVAL`.
- In live mode these methods are **proposed API calls**: `/tenders` and `/tenders/{id}/request-approval`. Confirm the latter with the Spring Boot team before calling it a live integration.

## `MyTendersPage()`

A table lists a lister’s own tenders. The Request Approval button only appears for items in `DRAFT`. Clicking it calls `requestApproval(id)`, awaits the result, shows a message and triggers `refresh()`.

### Why does Lister not directly publish?

Your whiteboard: **Lister creates → Admin verifies/approves → tender becomes publicly visible**. The frontend must never claim that clicking Request Approval bypasses Admin review.

---

# Page 5: `src/pages/BidderPage.jsx`

The Bidder page renders tender recommendations, a search table, the selected tender details and the bid form.

## Imports and state

`useState` stores `items`, `selectedId`, `search`, `showAll`, `loading`, `error`, and `refreshKey`. `useParams` reads the optional tender ID from the URL. `useAuth` obtains the logged-in user profile and token.

## Loading tenders

```jsx
useEffect(() => {
  let active = true;
  async function load() {
    try {
      const result = await tenderApi.list(token);
      if (active) {
        setItems(result.filter(t => t.status === 'PUBLISHED'));
        setError('');
      }
    } catch (err) {
      if (active) setError(err?.message || 'Unable to load tenders.');
    } finally {
      if (active) setLoading(false);
    }
  }
  load();
  return () => { active = false; };
}, [token, refreshKey]);
```

- `useEffect` requests data when the component mounts or the token/refresh key changes.
- `tenderApi.list(token)` retrieves tender records. In demo mode this is local data; in live mode this calls Spring Boot.
- `.filter(t => t.status === 'PUBLISHED')` displays only published tenders. This UI filtering is **not** a substitute for backend visibility restrictions.
- `active` is a cleanup guard against stale async callbacks.
- `loading` and `error` control feedback rendered below the heading.

## Sector-based recommendations

```jsx
const recommended = useMemo(
  () => items.filter(t => t.sector?.toLowerCase() === user.sector?.toLowerCase()),
  [items, user.sector]
);
const visible = showAll || !user.sector ? items : recommended;
```

- `useMemo` caches the filtered result until `items` or the user’s sector changes. For this small list it is optional, but reasonable.
- Optional chaining `?.` prevents an error if the sector is missing.
- `.toLowerCase()` avoids case mismatches such as `Infrastructure` vs `infrastructure`.
- If `showAll` is checked, show all published tenders; otherwise display the relevant sector.

## Tender selection

`const selected = items.find(t => String(t.id) === String(selectedId)) || visible[0] || null;` searches for the selected ID; if none is selected, it uses the first visible tender. `String()` normalises numeric/string IDs during comparison.

`TenderTable` receives `tenders`, `selectedId`, `onSelect`, `search`, and `setSearch` as props. It renders a searchable table and calls `onSelect(t.id)` when the View button is pressed. This updates `selectedId` in the parent, rerendering `TenderDetailsPanel`.

## Tender details and bidding

`TenderDetailsPanel` displays the tender title, department, budget, deadline, eligibility criteria and required documents. Only when status is `PUBLISHED` and the deadline has not passed does it render `<BidForm tender={tender} />`.

`BidForm`:

1. Stores a controlled form with amount, proposal summary, remarks, eligibility PDF and proposal PDF.
2. `update(event)` detects file inputs via `event.target.files` and saves the selected `File` object; for other inputs it saves text.
3. On submit, checks required fields and validates PDF MIME type and a 10 MiB limit per file.
4. Checks the deadline in the browser for immediate feedback. **The backend must independently check its server clock.**
5. Calls `bidApi.submit(user, tender.id, form, token)`.
6. In demo mode, the service stores the bid fields and **filenames only**, not file bytes or blockchain hashes.
7. In live mode, the service creates a `FormData` object and attaches the files for a `multipart/form-data` API request. The browser must set its own multipart boundary; the HTTP wrapper correctly avoids forcing `Content-Type: application/json` for `FormData`.
8. On success, displays a bid reference; on failure, displays an error message.

`MyBidsPage()` is exported from the same source file. It calls `bidApi.mine(user, token)` and renders a table of submitted bids and their statuses.

### Important limitation

Recommended tenders currently use **exact sector matching**, not AI/ML. A bidder with sector `Construction` will not automatically match a tender tagged `Infrastructure`. A richer recommendation system could support category mappings and multiple preferred sectors.

---

# Supporting files — the parts connecting every page

## `src/main.jsx`

`ReactDOM.createRoot(document.getElementById('root')).render(...)` finds the HTML `div` with id `root` and mounts React. `<React.StrictMode>` helps detect certain development-time issues. `<BrowserRouter>` enables page URLs. `<AuthProvider>` makes login state available throughout the component tree. `<App />` renders the matching page.

## `src/App.jsx`

The route table maps URLs to pages. `RequireRole role="LISTER"` wraps `/lister` routes; `RequireRole role="BIDDER"` wraps `/bidder` routes. `<Outlet/>` indicates where nested route components are rendered. The new `RequireRole roles={[...]}` protects the staff **placeholder**. Routes protect the user experience; **Spring Security** must independently enforce access to APIs.

## `src/context/AuthContext.jsx`

The provider has `login`, `staffLogin`, `register`, and `logout`. It stores the session in `sessionStorage` and exposes the current user and token through `useAuth()`. The staff login is explicitly disabled in demo mode and accepts only real backend-authorised `ADMIN`, `EVALUATOR`, `AUDITOR` roles. **Security note:** JavaScript-accessible session storage is not protected from an XSS attack; a production team should evaluate its token transport/storage approach and apply CSRF protections where relevant.

## `src/api/dtos.js`

- `toRegisterRequest(form)` converts React field names into a proposed backend JSON request. For instance `sector` becomes `industry`.
- `toLoginRequest(form)` creates `{ email, password }`.
- `normalizeRole()` supports older names `CONTRACTOR → BIDDER`, `AUTHORITY → LISTER` for the two public roles.
- `toCurrentUser(raw)` normalises different possible backend response shapes.
- `toTenderCreateRequest(form)` trims strings, converts budget to number, and converts the datetime to ISO 8601.
- `normalizeTenderList(response)` supports an array or paginated `content` shape.

**These are proposed DTO mappings, not guaranteed backend contracts.** Confirm exact Java record fields, role enum values, date formats and upload API before switching off demo mode.

## `src/api/services.js`

The service layer chooses browser demo functions when `VITE_DEMO_MODE` is true; otherwise it calls Spring Boot through `http()`. `authApi`, `staffAuthApi`, `tenderApi`, and `bidApi` keep backend implementation details away from presentation components.

## `src/api/http.js`

The `http(path, {method, body, token})` function calls `fetch`, sets the Bearer header for token-based authentication, serializes JSON bodies, parses JSON responses, and throws an `ApiError` on non-2xx responses. Multipart `FormData` is sent unmodified so the browser can set the boundary itself.

## `src/api/demoStore.js`

This is an explicitly **insecure browser-only prototype**, not a backend. It uses `localStorage` for users, tenders and bids and a demo SHA-256 password digest. It must not be used for real accounts, passwords, confidential bids or production access control. It does not upload real PDFs or create Fabric transactions.

---

# How a button click becomes a backend operation

**Register:** Input `onChange` → React state → `validate` → `AuthContext.register` → `authApi.register` → `toRegisterRequest` → `/api/v1/auth/register`.

**Login:** Form `onSubmit` → `AuthContext.login` → `authApi.login` → `/api/v1/auth/login` → token and user details → dashboard redirect.

**Lister draft:** Form `onSubmit` → `tenderApi.create` → `toTenderCreateRequest` → `/api/v1/tenders` → database record (when backend implemented) → refresh UI.

**Admin approval request:** Button → `tenderApi.requestApproval` → proposed `/api/v1/tenders/{id}/request-approval` endpoint → pending approval (not published).

**Bid:** Form `onSubmit` → `bidApi.submit` → multipart `FormData` → `/api/v1/tenders/{id}/bids` → server-side validation/storage and possibly downstream ledger recording → response shown in UI.

---

# What to explain in your SEM viva

1. **Why React?** Reusable components and state-driven interactive pages.
2. **Why Vite?** Fast dev server/HMR and build tooling. Node.js is the tooling runtime; Spring Boot remains the backend.
3. **Why Tailwind?** Consistent utility classes and responsive styling without manually writing every CSS rule.
4. **Why separate services and DTO mappers?** A frontend form representation need not equal the Java backend model; mappers provide explicit conversion points.
5. **Why separate staff entry?** Staff uses a dedicated URL and backend-provisioned identities; public registration exposes only Bidder/Lister.
6. **How are roles exclusive?** Radio buttons and frontend validators improve UX; Spring Security and the database must enforce the rule.
7. **Why Admin approval?** The Lister cannot publish directly under the updated five-actor whiteboard workflow.
8. **How are tender recommendations made?** By matching the bidder's sector with the tender's sector; currently rule-based, not an ML model.
9. **Is the blockchain currently real?** Not through these demo pages. Blockchain recording is the responsibility of the backend/Fabric integration. Don't call a `PENDING_APPROVAL` or demo bid a ledger-confirmed event.
10. **What would you improve?** Add tests, accessible form error association, abortable queries, stronger field validation, secure session strategy, pagination, backend-owned role policies, and API contracts generated from OpenAPI if available.

---

# Suggested learning exercises

- In `LandingPage.jsx`, add a fourth benefit by editing the `benefits` array; see how React `.map()` creates the card automatically.
- In `RegisterPage.jsx`, intentionally leave `organizationName` blank and follow the error path from `validate()` through `setErrors` into `FormField`.
- In `LoginPage.jsx`, explain every state variable and show how `busy` prevents duplicate submission.
- In `ListerPage.jsx`, create a draft and watch its status change from `DRAFT` to `PENDING_APPROVAL` in demo mode.
- In `BidderPage.jsx`, register in the `Infrastructure` sector and observe how `recommended` and `showAll` change the tender list.
- In `App.jsx`, try directly visiting `/lister` while signed in as a Bidder; `RequireRole` redirects you to your own workspace. **Then explain why this does not replace backend authorization.**

