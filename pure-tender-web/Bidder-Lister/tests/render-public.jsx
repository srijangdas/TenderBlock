import assert from 'node:assert/strict';
import process from 'node:process';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProfilePage from '../src/pages/ProfilePage.jsx';
import { AuthProvider } from '../src/context/AuthContext.jsx';
import { ThemeProvider } from '../src/context/ThemeContext.jsx';
import LandingPage from '../src/pages/LandingPage.jsx';
import LoginPage from '../src/pages/LoginPage.jsx';
import WorkspaceLayout from '../src/components/WorkspaceLayout.jsx';
import { DEMO_MODE } from '../src/data/constants.js';

// Only the browser storage/media APIs needed during render; no HTTP responses
// are mocked. This test validates the rendered public UI and build-mode switch.
globalThis.window = { localStorage: { getItem: () => 'light' }, matchMedia: () => ({ matches: false }) };
let session = null;
globalThis.sessionStorage = { getItem: () => session, removeItem: () => { session = null; } };
const expectedDemo = process.env.EXPECT_DEMO === 'true';
assert.equal(DEMO_MODE, expectedDemo);
const render = element => renderToStaticMarkup(<MemoryRouter><AuthProvider><ThemeProvider>{element}</ThemeProvider></AuthProvider></MemoryRouter>);
const landing = render(<LandingPage />);
assert.match(landing, /Campus maintenance services/);
assert.match(landing, /Tender record/);
assert.doesNotMatch(landing, /Member access|public-login-email/);
assert.match(landing, /<a\b(?=[^>]*href="\/login")[^>]*>Login<\/a>/);
assert.doesNotMatch(landing, /#sign-in/);
const login = render(<LoginPage />);
assert.match(login, /id="public-login-email"/);
assert.match(login, /id="public-login-password"/);
assert.doesNotMatch(login, /Try Bidder account|Try Lister account|Preview accounts|Demo@12345/);
assert.match(landing, /<a\b(?=[^>]*href="\/register")[^>]*>Sign in<\/a>/);
if (!expectedDemo) assert.doesNotMatch(login, /Interactive preview/);
for (const role of ['BIDDER', 'LISTER']) {
  session = JSON.stringify({ token: 'render-only-placeholder', user: { id: 'render-user', fullName: 'Render User', role, verified: true, accountStatus: 'VERIFIED' } });
  const workspace = render(<WorkspaceLayout />);
  assert.doesNotMatch(workspace, /accounts, tender drafts and bids are stored only in this browser/);
  if (expectedDemo) assert.match(workspace, /Interactive preview/);
  else assert.doesNotMatch(workspace, /Interactive preview|Demo mode/);
}
// A pending Profile has one notice, describes only that actor's actions,
// and displays the status consistently in the account-details section.
for (const role of ['BIDDER', 'LISTER']) {
  session = JSON.stringify({ token: 'render-only-placeholder', user: {
    id: 'pending-user', fullName: 'Pending User', role, verified: false,
    ...(expectedDemo ? {} : { accountStatus: 'PENDING' }),
  } });
  const profile = render(<Routes><Route element={<WorkspaceLayout />}><Route path="/" element={<ProfilePage />} /></Route></Routes>);
  assert.equal((profile.match(/Account awaiting Admin verification/g) || []).length, 1);
  assert.doesNotMatch(profile, /Account status:|Not available/);
  assert.match(profile, role === 'BIDDER' ? /required before you can submit bids/ : /required before you can create tenders/);
  assert.doesNotMatch(profile, role === 'BIDDER' ? /required before you can create tenders/ : /required before you can submit bids/);
}
if (!expectedDemo) {
  session = JSON.stringify({ token: 'DEMO_TOKEN_NOT_FOR_PRODUCTION', user: { id: 'demo-bidder', role: 'BIDDER', verified: true } });
  const afterDemo = render(<LandingPage />);
  assert.equal(session, null);
  assert.doesNotMatch(afterDemo, /My workspace/);
  assert.match(afterDemo, />Login<\/a>/);
}
console.log(`PASS: tender illustration, direct Login link, dedicated login and ${expectedDemo ? 'explicit preview' : 'real API'} workspace rendering`);
