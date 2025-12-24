# PostUps V2 Design Document

> **Status:** Approved for implementation
> **Goal:** Transform MVP into a fast, seamless, sellable product

---

## Executive Summary

PostUps V2 focuses on **speed** and **delegation**. Admins should set up a league in under 5 minutes. Captains should be able to enter scores. Players should get updates without logging in.

---

## Phase 2: Speed & Import (Current Focus)

### Quick Setup Wizard

**Entry Point:** "Quick Setup" button on Create League page alongside manual form

**Flow:** Guided chat that asks one question at a time, parses natural language answers

```
Step 1: League basics
🤖 "What's your league called and what sport?"
→ "Sunday Night Hockey"

Step 2: Teams
🤖 "How many teams? You can list names or I'll generate them."
→ "8 teams" or "Thunderbolts, Red Wings, Destroyers..."

Step 3: Schedule
🤖 "What days and times do you play?"
→ "Mondays at 6pm and 8pm"

Step 4: Location
🤖 "Where are games played?"
→ "Central Rec Center"

Step 5: Season dates
🤖 "When does the season start and end?"
→ "Jan 15 to March 30"

Step 6: Preview & Create
→ Show editable summary, one click to create everything
```

**Technical Implementation:**

1. **UI Component:** `/src/components/league/quick-setup-wizard.tsx`
   - Chat-style interface
   - Step indicator
   - Editable preview at end

2. **AI Integration:** Supabase Edge Function or Next.js API route
   - Provider: OpenAI GPT-4 (abstracted for future swapping)
   - Uses structured outputs / function calling for 100% valid JSON
   - Fallback: "I didn't understand X, can you clarify?"

3. **Schedule Generator:** `/src/lib/schedule-generator.ts`
   - Round-robin algorithm
   - Respects time slots and game days
   - Balances home/away

**AI Schema (OpenAI Function Calling):**

```typescript
interface QuickSetupData {
  league: {
    name: string;
    sport: "hockey" | "soccer" | "basketball" | "volleyball" | "football" | "softball" | "other";
  };
  teams: {
    count: number;
    names?: string[]; // If provided, use these. Otherwise generate.
  };
  schedule: {
    days: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
    timeSlots: string[]; // ["18:00", "20:00"]
    startDate: string; // ISO date
    endDate: string;
    format: "round-robin" | "double-round-robin";
  };
  location?: {
    name: string;
    address?: string;
  };
}
```

### V1 Scope (Ship Now)

- Single league setup per wizard run
- Guided chat: league → teams → times → location → preview → create
- Basic text input for location (no maps integration)
- Round-robin schedule generator
- Editable preview before creation
- Team colors auto-assigned

### Later Enhancements

- Multi-league batch creation ("5 leagues at once")
- Google Places autocomplete for addresses
- Maps links for players
- CSV/Excel file upload
- Import existing games with scores (mid-season migration)
- Custom schedule formats beyond round-robin

---

## Phase 3: Roles & Permissions

### Problem
Only league owner can do anything. Captains can't enter scores.

### Solution: League Members System

**New Database Table:**
```sql
CREATE TABLE public.league_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'captain', 'player')),
  team_id UUID REFERENCES public.teams(id), -- for captains/players
  invited_email TEXT, -- for pending invites
  invite_status TEXT DEFAULT 'pending' CHECK (invite_status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(league_id, user_id)
);
```

**Role Capabilities:**

| Role    | View | Edit Teams | Edit Schedule | Enter Scores | Manage Users | Billing |
|---------|------|------------|---------------|--------------|--------------|---------|
| Owner   | ✓    | ✓          | ✓             | ✓            | ✓            | ✓       |
| Admin   | ✓    | ✓          | ✓             | ✓            | ✓            | ✗       |
| Captain | ✓    | Own team   | ✗             | Own games    | ✗            | ✗       |
| Player  | ✓    | ✗          | ✗             | ✗            | ✗            | ✗       |

**Invite System:**
1. Owner/Admin enters email
2. System sends invite link
3. Recipient clicks link → creates account or logs in → auto-joined to league

**Captain Score Entry:**
```sql
CREATE TABLE public.score_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  submitted_by UUID REFERENCES public.profiles(id),
  team_id UUID REFERENCES public.teams(id),
  home_score INTEGER NOT NULL,
  away_score INTEGER NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);
```

- Captain submits score for their game
- If both captains agree → auto-approved
- If conflict → flagged for admin review

### V1 Scope
- League members table
- Invite via email link
- Captain score entry (trust-based, no verification)
- Basic role enforcement in UI

### Later Enhancements
- Score verification (both captains must agree)
- Dispute resolution flow
- Team roster management by captains
- Player self-registration

---

## Phase 4: Integration & Embedding

### Problem
Leagues have existing websites and want to show standings/schedule there.

### Embed Widget

**Usage:**
```html
<div id="postups-widget" data-league="sunday-hockey" data-view="standings"></div>
<script src="https://postups.io/embed.js"></script>
```

**Views:**
- `standings` - League standings table
- `schedule` - Upcoming games
- `both` - Tabbed view with both

**Customization:**
- `data-theme="dark|light"` - Color scheme
- `data-accent="#22c55e"` - Accent color to match their site
- `data-limit="10"` - Number of items to show

**Technical Implementation:**

1. **API Routes:**
   ```
   GET /api/embed/[slug]/standings
   GET /api/embed/[slug]/schedule
   GET /api/embed/[slug]/config
   ```

2. **Widget Script:** `/public/embed.js`
   - Lightweight (<10KB)
   - Renders iframe or inline HTML
   - Responsive

3. **Customization Storage:**
   ```sql
   ALTER TABLE public.leagues ADD COLUMN IF NOT EXISTS
     customization JSONB DEFAULT '{}'::jsonb;
   -- { accent_color: "#22c55e", logo_url: "", banner_url: "" }
   ```

### V1 Scope
- Standings embed widget
- Schedule embed widget
- Basic color customization
- Copy-paste embed code from dashboard

### Later Enhancements
- Custom domains (`standings.theirleague.com`)
- White-label (remove PostUps branding) for Pro tier
- Full API with documentation and API keys
- Webhook notifications

---

## Phase 5: Player Experience

### Problem
Players need a seamless way to stay informed without logging in.

### Features

**Public League Pages (Already Exist):**
- `/l/[slug]` - League home
- `/l/[slug]/standings` - Standings
- `/l/[slug]/schedule` - Schedule

**Enhancements Needed:**

1. **Add to Calendar**
   - "Add to Google Calendar" / "Add to Apple Calendar" buttons
   - iCal feed URL for subscribing

2. **Team Pages**
   - `/l/[slug]/teams/[team-slug]`
   - Roster (optional)
   - Team's upcoming games
   - Team's record

3. **Notifications (Optional Account)**
   - Email notifications for score updates
   - Push notifications (PWA)

   ```sql
   CREATE TABLE public.notification_preferences (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
     league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE,
     email_scores BOOLEAN DEFAULT true,
     email_schedule_changes BOOLEAN DEFAULT true,
     push_enabled BOOLEAN DEFAULT false,
     UNIQUE(user_id, league_id)
   );
   ```

4. **PWA Improvements**
   - Installable on home screen
   - Offline support for viewing cached standings/schedule
   - Push notification support

### V1 Scope
- Add to calendar buttons (Google, Apple)
- Team pages with schedule and record

### Later Enhancements
- iCal subscription feed
- Email notifications
- Push notifications
- Full PWA with offline support

---

## Phase 6: Monetization

### Pricing Tiers

| Tier       | Price    | Leagues | Teams    | Features                              |
|------------|----------|---------|----------|---------------------------------------|
| Free       | $0       | 1       | 8 max    | Basic features, PostUps branding      |
| Starter    | $19/mo   | 1       | Unlimited| Remove branding, captain scoring      |
| Pro        | $49/mo   | 3       | Unlimited| Embed widget, custom colors           |
| Enterprise | $149/mo  | Unlimited| Unlimited| API access, white-label, priority support |

### Technical Implementation

1. **Stripe Integration**
   - Checkout for subscription signup
   - Customer portal for managing subscription
   - Webhook for subscription events

2. **Database:**
   ```sql
   ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS
     stripe_customer_id TEXT,
     subscription_tier TEXT DEFAULT 'free',
     subscription_status TEXT DEFAULT 'active';
   ```

3. **Limit Enforcement:**
   - Check tier before creating leagues
   - Check tier before creating teams
   - Show upgrade prompts when hitting limits

### V1 Scope
- Stripe Checkout integration
- Basic tier enforcement (league/team limits)
- Customer portal link

### Later Enhancements
- Usage-based billing options
- Annual discount
- Team/organization billing
- Promo codes

---

## Technical Architecture

### Current Stack
- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS
- **Backend:** Supabase (Auth, Database, Edge Functions)
- **Deployment:** Vercel

### New Dependencies for V2
- `openai` - AI parsing for Quick Setup
- `stripe` - Payment processing
- `ical-generator` - Calendar export (optional, can build manually)

### API Routes Needed

```
POST /api/quick-setup/parse     - AI parses user input
POST /api/quick-setup/generate  - Generate schedule from parsed data
POST /api/quick-setup/create    - Create league, teams, games

GET  /api/embed/[slug]/standings
GET  /api/embed/[slug]/schedule
GET  /api/embed/[slug]/config

POST /api/stripe/checkout       - Create checkout session
POST /api/stripe/webhook        - Handle Stripe events
GET  /api/stripe/portal         - Customer portal link
```

### Edge Functions (Supabase)

```
supabase/functions/
  ai-parse/          - Parse natural language input
  send-invite/       - Send invite emails
  score-notification/ - Notify on score updates
```

---

## Implementation Order

### Phase 2: Speed & Import (Now)
1. Quick Setup wizard UI component
2. OpenAI integration for parsing
3. Schedule generator algorithm
4. Preview and create flow
5. Wire up to existing league creation

### Phase 3: Roles & Permissions
1. league_members table migration
2. Invite system UI and emails
3. Captain score entry UI
4. Role-based UI restrictions

### Phase 4: Integration
1. Embed API routes
2. Widget script
3. Customization UI in dashboard
4. Embed code generator

### Phase 5: Player Experience
1. Add to calendar buttons
2. Team pages
3. (Later) Notifications

### Phase 6: Monetization
1. Stripe setup
2. Checkout flow
3. Tier enforcement
4. Customer portal

---

## Success Metrics

- **Setup time:** < 5 minutes for full league with schedule
- **Captain adoption:** 50%+ leagues using captain score entry
- **Embed usage:** 20%+ of Pro users embedding widgets
- **Conversion:** 10%+ free → paid
- **Churn:** < 5% monthly

---

## Open Questions

1. **AI cost** - Eat the ~$0.05/setup cost or pass to user?
2. **Free tier limits** - 8 teams enough? Add time limit?
3. **Score verification** - Trust captains or require both to agree?
4. **Notifications** - Email first or push first?

---

*Created: 2025-12-23*
