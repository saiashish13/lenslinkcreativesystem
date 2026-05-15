# LensLink AI — Roles, Dashboards & India Localization Plan

This is a large scope. I'll deliver it in clearly-scoped phases so you see working software at every step instead of one giant unverifiable drop. Each phase is shippable on its own.

## Phase 0 — Localize to India + INR (quick win, no backend)
- Replace mock cities with Indian cities + add free-text location search that matches any Indian city/town (Mumbai, Bengaluru, Jaipur, Udaipur, Coorg, Rishikesh, Alibaug, Gokarna, Shillong, etc. — fuzzy match on a seeded list of 500+ Indian locations).
- Switch all pricing from `$` to `₹` using `Intl.NumberFormat('en-IN')` (e.g. `₹24,999`).
- Re-price the 12 mock professionals to realistic Indian rates (₹3,000–₹75,000/hr range).
- Update marketplace filter slider, creator profile pricing, services tiers, hero copy.

## Phase 1 — Enable Lovable Cloud + Auth + Roles foundation
- Enable Lovable Cloud (Postgres + auth + storage).
- Add email/password + Google sign-in.
- Schema:
  - `profiles` (id → auth.users, full_name, avatar_url, phone, city)
  - `user_roles` (user_id, role enum: `customer | photographer | editor | admin`) — separate table, `has_role()` security-definer function, RLS-safe (per security best practice)
  - Trigger to auto-create profile on signup with default `customer` role
- `/login`, `/signup`, `/onboarding` (choose role: Customer / Photographer / Editor)
- `_authenticated` layout guard + role-based route guards.

## Phase 2 — Customer role
Dashboard `/app` with: bookings list, favorites, messages, profile.
Features wired: browse (already done), favorites (toggle), booking request flow, requirements upload (Cloud Storage), reviews after delivery, AI recommendations (Lovable AI Gateway, Gemini Flash) on home.

## Phase 3 — Photographer role
Dashboard `/pro`: availability calendar, incoming bookings (accept/reject), portfolio upload (watermarked previews via canvas), pricing packages CRUD, revenue chart, AI tools (caption/tag generation, pricing suggestion) via Lovable AI.

## Phase 4 — Editor role
Dashboard `/editor`: assigned projects, file versions (Storage), annotations/comments, time tracking, revision requests, delivery to customer.

## Phase 5 — Payments (Indian market)
Razorpay (best for INR / India) — collect payment, escrow-style release on delivery, auto-invoice PDF with GST, commission split to platform.

## Phase 6 — Admin role
`/admin`: users + role management, verification queue, revenue & commission analytics, dispute center, AI moderation queue, banners/CMS, tax/invoice center, global settings.

## Phase 7 — Real-time
Supabase Realtime for chat (1:1 customer↔pro), booking status updates, notifications. Video consultation via Daily.co or Jitsi embed.

---

## What I'll do first (this turn, if you approve)

**Phase 0 only** — India + INR localization across the existing landing, marketplace, and creator profile pages. No backend yet, no breaking changes. You'll see the result immediately.

Then on your next "go" I'll do **Phase 1** (Cloud + auth + roles), which is the real foundation everything else hangs off.

## Why phased

Doing all 7 phases in one shot would produce ~80 files of unverifiable code, broken auth, mock data masquerading as real, and a frustrating debugging session. Phased delivery means each step actually works.

---

**Approve to start Phase 0**, or tell me to jump straight to Phase 1 (Cloud + auth) and skip the localization polish for now.