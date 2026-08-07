# PostHog Self-driving Setup Report

**App:** Savey — React Native / Expo subscription management app  
**Run date:** 2026-08-07  
**Inbox:** https://us.posthog.com/project/546443/inbox

## Summary

PostHog Self-driving has been configured for Savey. Error tracking, session replay, support, and health-check signal sources are now armed. The scout troop is tuned to four active scouts for this project's current stage. Findings will start appearing in the [Self-driving inbox](https://us.posthog.com/project/546443/inbox) within ~30 minutes of the first scout coordinator tick.

---

## AI data processing

**Approved.** Organization-level AI data processing approval was granted before this run.

---

## GitHub

**Already connected.** The PostHog GitHub App was connected to `HasnainMughal7` (integration id: 204382, connected 2026-08-07). No action needed — Self-driving can research findings in your repo and open draft fix PRs.

---

## Products enabled

The `products-enable` MCP tool was not available on this deploy. Products are recorded as inert (the server toggle wasn't callable). As a React Native mobile app, session replay and error tracking both need SDK-level configuration regardless.

| Product | Status | Notes |
|---|---|---|
| Session Replay | **Enabled but inert** | Mobile app — replay works via `posthog-react-native` SDK. `captureAppLifecycleEvents: true` is already set. See follow-ups to add session recording config. |
| Error Tracking | **Enabled but inert** | SDK autocapture for `uncaughtExceptions` and `unhandledRejections` is already configured in `lib/posthog.ts`. Once events flow, error tracking native sources will fire. |
| Support (Conversations) | **Enabled but inert** | The responder row is enabled. Tickets only arrive once an inbound channel (email / inbox / Slack) is connected in PostHog — see follow-ups. |

---

## Signal sources

| source_product | source_type | Action | Notes |
|---|---|---|---|
| `signals_scout` | `cross_source_issue` | **Skipped** | ON by default — no config row needed |
| `health_checks` | `health_issue` | **Enabled** | id: `019fdad5-de43-7d2b-bc7a-e0350deb4fcc` |
| `error_tracking` | `issue_created` | **Enabled** | id: `019fdad5-e37f-79e9-b86f-4927da9edc62` |
| `error_tracking` | `issue_reopened` | **Enabled** | id: `019fdad5-e5a0-7f42-920c-8197609efcb9` |
| `error_tracking` | `issue_spiking` | **Enabled** | id: `019fdad5-f5ec-72e7-a92b-e173d74c364c` |
| `session_replay` | `session_analysis_cluster` | **Enabled** | id: `019fdad5-fb60-73b0-9dd3-0e2ce164357e`, sample_rate: 0.1 |
| `conversations` | `ticket` | **Enabled** | id: `019fdad5-fe69-7443-a61a-a27cd551b6b6` — dormant until inbound channel connected |
| `llm_analytics` | — | **Skipped** | Internal only — not a user-facing responder |
| `logs` | — | **Skipped** | Not a v1 responder |
| `replay_vision` | — | **Skipped** | Self-authorizing via scanner `emits_signals` flag — no row needed |

---

## Connected tools

No external tools were selected. All connected-tool sources are "not used" — skipped at user request.

---

## Scout troop

**Budget:** 100 runs/day (early-access default, verified via `scout-metadata-get`). 0 runs used today. Max 3 runs per coordinator tick.  
**Banner:** "Scouts are in early access. Each project gets up to 100 scout runs a day. Contact team-self-driving@posthog.com if you need more."

### Enabled (4 scouts)

| Scout | Reason enabled |
|---|---|
| `signals-scout-general` | Always on — cross-product correlations and surfaces no specialist covers |
| `signals-scout-health-checks` | Fresh integration — instrumentation health is high-value on a new setup |
| `signals-scout-product-analytics` | App captures product events (`subscription_details_toggled`, lifecycle events); funnel/retention coverage |
| `signals-scout-observability-gaps` | New integration with thin event taxonomy — will surface missing instrumentation coverage |

### Disabled (23 scouts)

| Scout | Reason |
|---|---|
| `signals-scout-error-tracking` | **Covered by native source** — error tracking enabled as a native source in step 4; no scout duplication |
| `signals-scout-session-replay` | **Covered by native source** — session replay enabled as a native source in step 4; no scout duplication |
| `signals-scout-feature-flags` | No feature flags in use in this codebase |
| `signals-scout-experiments` | No A/B experiments configured |
| `signals-scout-surveys` | No surveys in use |
| `signals-scout-revenue-analytics` | No payment SDK (no Stripe, RevenueCat, etc.) |
| `signals-scout-ai-observability` | No `$ai_*` events or LLM SDK |
| `signals-scout-web-analytics` | Mobile-first app — no confirmed web analytics surface |
| `signals-scout-web-vitals` | No web surface in active use |
| `signals-scout-csp-violations` | No CSP reporting configured |
| `signals-scout-customer-analytics` | No group/accounts analytics |
| `signals-scout-data-pipelines` | No CDP destinations or batch exports |
| `signals-scout-data-warehouse` | No warehouse sources connected |
| `signals-scout-logs` | PostHog logs product not in use |
| `signals-scout-apm` | No distributed tracing / OpenTelemetry |
| `signals-scout-conversations` | Support channel not yet connected |
| `signals-scout-anomaly-detection` | Insufficient saved insights/dashboards to watch yet |
| `signals-scout-inbox-validation` | Not useful on a fresh setup — no shipped fixes to validate |
| `signals-scout-insight-alerts` | No insight alerts configured |
| `signals-scout-replay-vision` | No accumulated observations yet — scanner step 6c deferred (mobile app) |
| `signals-scout-mcp-tool-calls` | No MCP tool call telemetry configured |
| `signals-scout-skills-store` | No skills hygiene issues to watch |
| `signals-scout-tasks` | No PostHog task delivery issues |

Re-enable follow-up candidates: `signals-scout-feature-flags` (if feature flags are added), `signals-scout-experiments` (if A/B tests are run), `signals-scout-surveys` (if surveys are added), `signals-scout-anomaly-detection` (once dashboards are built).

---

## Custom scouts

**None created.** Gap analysis result: no candidate surfaces pass all three filters (watchable, uncovered, ready for a quality discriminator) at the current instrumentation level.

**Surfaces considered and ruled out:**

| Surface | Filter that eliminated it |
|---|---|
| Auth funnel (sign-up / sign-in) | Not watchable — Clerk manages auth; no PostHog events captured for sign-up or sign-in steps |
| Subscription engagement | Not ready — only one event (`subscription_details_toggled`) with 2 properties; too thin for meaningful discriminators |
| App lifecycle drops (DAU) | Covered by `signals-scout-anomaly-detection` (available to enable once dashboards exist); `signals-scout-observability-gaps` will flag the gap |
| Session security task flow | Not watchable — `user_signed_out` (source: session_task) is the only event; insufficient signal |

The `signals-scout-observability-gaps` scout will be more effective here — it will surface the missing instrumentation (auth events, subscription CRUD events) as concrete recommendations.

**Noise escape hatch:** if any scout becomes noisy, set `emit: false` on its config in PostHog to switch it to dry-run (it runs and logs, but writes nothing to the inbox).

---

## Replay Vision scanners

**Both skeletons deferred — follow-ups recorded.**

Savey is a React Native / Expo mobile-first app. The two Replay Vision scanner skeletons are web-centric:

- **Scanner 1 (Broken experiences)** — requires a URL-based completion flow (`$current_url` filter). React Native mobile sessions don't navigate via HTTP URLs. No identifiable completion flow on the mobile surface. **Skipped.**
- **Scanner 2 (User frustration)** — gates on `$rageclick`, a browser-only event that does not fire in native mobile sessions. **Skipped.**

Additionally, the `creating-replay-vision-scanners` sizing skill was not available on this deploy, so credit spend could not be verified.

**What to do when a web surface is added:** Once `expo start --web` sessions are being recorded, create both scanners. Scanner 1 should target the subscription management flow (the key completion action in this app). Scanner 2 uses `$rageclick` with no URL filter.

A Replay Vision scanner is an LLM that watches individual session recordings on a schedule and pushes what it finds to the inbox. Findings arrive at half weight — they need corroboration from a second scanner or source before being promoted to a report.

---

## Follow-ups

- [ ] **Enable session replay in the mobile SDK** — add `sessionReplay: { androidDeferredStartMs: 0, iOSReplayConfig: { ... } }` to the `PostHog` constructor in `lib/posthog.ts`. See [posthog-react-native session replay docs](https://posthog.com/docs/session-replay/react-native).
- [ ] **Verify error tracking is capturing exceptions** — `errorTracking.autocapture` is already configured for `uncaughtExceptions` and `unhandledRejections`. Once the app has users, confirm issues appear at https://us.posthog.com/project/546443/error_tracking.
- [ ] **Connect a Support inbound channel** — the Conversations responder row is enabled but dormant. Go to PostHog → Support → connect an email address, inbox, or Slack channel. Tickets will then route to the inbox automatically.
- [ ] **Enable `products-enable` MCP tool** — the tool was not available on this deploy. Verify Session Replay and Error Tracking are toggled ON in PostHog project settings (Settings → Session replay, Settings → Error tracking).
- [ ] **Add auth event instrumentation** — `sign_up_started`, `sign_in_succeeded`, `sign_in_failed` events are not captured. Adding them unlocks the auth funnel in PostHog and enables future custom scout coverage.
- [ ] **Add subscription CRUD events** — `subscription_added`, `subscription_removed`, `subscription_viewed` are not captured. The only current event is `subscription_details_toggled`. Richer events enable funnel/retention insights.
- [ ] **Create Replay Vision scanners once web recordings exist** — once the expo-web surface has session recordings, create the "Broken experiences" scanner (targeting subscription management URLs) and "User frustration" scanner (`$rageclick` gate).
- [ ] **Build a retention insight in PostHog** — `signals-scout-product-analytics` watches saved funnel/retention flows. Create at least one saved retention or funnel insight to give it something to watch.
- [ ] **Enable `signals-scout-anomaly-detection`** once dashboards are created — it watches saved insights for anomalies and is currently disabled only because no dashboards exist.

---

## What happens next

1. The scout coordinator picks up the fresh configs within **~30 minutes** and fires the first scans.
2. Each enabled scout runs once per day, drawing from the 100-run daily budget (3 per tick).
3. Scout findings cluster into reports in the [Self-driving inbox](https://us.posthog.com/project/546443/inbox).
4. Actionable reports can auto-start coding tasks against your connected GitHub repo (`HasnainMughal7`).
5. Error tracking findings arrive as native signals the moment exceptions are captured.
