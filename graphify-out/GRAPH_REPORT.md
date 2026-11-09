# Graph Report - teamparature  (2026-11-09)

## Corpus Check
- 141 files · ~40,323 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 2, .puml 2, .ico 1)

## Summary
- 697 nodes · 1975 edges · 35 communities (17 shown, 18 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3205cf75`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- next
- MembersView.tsx
- cn
- new/onboarding/page.tsx
- react
- package.json
- analytics/MoodAnalytics.tsx
- dependencies
- app/layout.tsx
- compilerOptions
- components.json
- orgInvitationMailer.ts
- @radix-ui/react-label
- WorkspaceSkeletons.tsx
- eslint.config.mjs
- class-variance-authority
- clsx
- scripts
- next-auth.d.ts
- orgPermissions.ts
- framer-motion@^12.23.12
- date-fns
- gsap@^3.13.0
- jsonwebtoken@^9.0.2
- next-themes
- @radix-ui/react-avatar
- @radix-ui/react-dialog
- react-apexcharts
- tailwind-merge
- postcss.config.mjs
- moods.ts
- organization.ts
- sonner

## God Nodes (most connected - your core abstractions)
1. `cn()` - 101 edges
2. `next` - 52 edges
3. `react` - 49 edges
4. `connectDB()` - 37 edges
5. `MembersPage()` - 35 edges
6. `lucide-react` - 34 edges
7. `Button()` - 29 edges
8. `next-auth` - 25 edges
9. `Input()` - 22 edges
10. `mongoose` - 22 edges

## Surprising Connections (you probably didn't know these)
- `DashboardProps` --references--> `Role`  [EXTRACTED]
  app/(client)/(admin)/[orgId]/dashboard/Dashboard.tsx → lib/rbac.ts
- `CardDescription()` --calls--> `cn()`  [EXTRACTED]
  app/components/ui/card.tsx → lib/utils.ts
- `CardAction()` --calls--> `cn()`  [EXTRACTED]
  app/components/ui/card.tsx → lib/utils.ts
- `CardFooter()` --calls--> `cn()`  [EXTRACTED]
  app/components/ui/card.tsx → lib/utils.ts
- `SelectLabel()` --calls--> `cn()`  [EXTRACTED]
  app/components/ui/select.tsx → lib/utils.ts

## Import Cycles
- None detected.

## Communities (35 total, 18 thin omitted)

### Community 0 - "next"
Cohesion: 0.06
Nodes (66): handler, POST(), POST(), POST(), GET(), POST(), GET(), POST() (+58 more)

### Community 1 - "MembersView.tsx"
Cohesion: 0.07
Nodes (54): ActivityView(), changeSort(), sortableHeader(), Entry, SortColumn, dashboardFeatures, AllowedMood, MoodCheck() (+46 more)

### Community 2 - "cn"
Cohesion: 0.07
Nodes (73): ClientDashboardLayout(), DashboardContent(), Workspace, WorkspaceContext, MemberActions(), DashboardContent(), DashboardLayout(), AppSidebar() (+65 more)

### Community 3 - "new/onboarding/page.tsx"
Cohesion: 0.09
Nodes (38): ChartCard2(), ChartCardProps, ChartCard(), ChartCardProps, COLORS, data, data, MoodTrendsChart() (+30 more)

### Community 4 - "react"
Cohesion: 0.12
Nodes (24): SettingsPage(), WorkspaceSettingsForm(), DashboardPage(), LoginPage(), RegisterPage(), AuthBrandPanel(), AuthLayout(), AuthPasswordInput() (+16 more)

### Community 5 - "package.json"
Cohesion: 0.07
Nodes (41): devDependencies, autoprefixer@^10.4.21, eslint@^9, eslint-config-next@15.4.7, postcss@^8.5.6, tailwindcss@^4.1.12, @tailwindcss/postcss@^4, ts-node@^10.9.2 (+33 more)

### Community 6 - "analytics/MoodAnalytics.tsx"
Cohesion: 0.08
Nodes (35): Dashboard(), DashboardProps, AnalyticsRangePicker(), dateInZone(), AnalyticsPage(), KpiCard(), KpiCardProps, aggregateTrend() (+27 more)

### Community 7 - "dependencies"
Cohesion: 0.06
Nodes (36): dependencies, axios@^1.11.0, bcryptjs@^3.0.2, date-fns-tz@^3.2.0, express@^5.1.0, lucide-react@^0.540.0, mongoose@^8.17.2, next@15.4.10 (+28 more)

### Community 8 - "app/layout.tsx"
Cohesion: 0.12
Nodes (17): AuthSync(), TopProgressBar, TopProgressBarClientWrapper(), geistMono, geistSans, metadata, RootLayout(), titanOne (+9 more)

### Community 9 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+12 more)

### Community 10 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 11 - "orgInvitationMailer.ts"
Cohesion: 0.16
Nodes (12): getEnvVar(), sendVerificationEmail(), SendVerificationEmailProps, transporter, escapeHtml(), getEnvVar(), getInvitationTransport(), sendOrgInvitationEmail() (+4 more)

### Community 12 - "@radix-ui/react-label"
Cohesion: 0.14
Nodes (8): apexcharts@^5.3.4, @radix-ui/react-label@^2.1.7, @radix-ui/react-separator@^1.1.7, @tanstack/react-query@^5.85.3, apexcharts, @radix-ui/react-label, @radix-ui/react-separator, @tanstack/react-query

### Community 13 - "WorkspaceSkeletons.tsx"
Cohesion: 0.08
Nodes (38): Loading(), Loading(), Dashboard(), DashboardProps, moodOptions, tooltip, MemberCheckIn(), MemberDashboard() (+30 more)

### Community 14 - "eslint.config.mjs"
Cohesion: 0.22
Nodes (6): compat, __dirname, eslintConfig, __filename, @eslint/eslintrc@^3, @eslint/eslintrc

### Community 17 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, seed:moods, start

### Community 18 - "next-auth.d.ts"
Cohesion: 0.40
Nodes (4): JWT, next-auth, Session, User

## Knowledge Gaps
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `MembersView.tsx`, `cn`, `new/onboarding/page.tsx`, `react`, `package.json`, `analytics/MoodAnalytics.tsx`, `dependencies`, `app/layout.tsx`, `WorkspaceSkeletons.tsx`?**
  _High betweenness centrality (0.214) - this node is a cross-community bridge._
- **Should `next` be split into smaller, more focused modules?**
  _Cohesion score 0.05744449619624282 - nodes in this community are weakly interconnected._
- **Why does `react` connect `react` to `next`, `MembersView.tsx`, `cn`, `new/onboarding/page.tsx`, `package.json`, `analytics/MoodAnalytics.tsx`, `dependencies`, `app/layout.tsx`, `WorkspaceSkeletons.tsx`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **Should `MembersView.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07243460764587525 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `react` to `MembersView.tsx`, `cn`, `new/onboarding/page.tsx`, `package.json`, `analytics/MoodAnalytics.tsx`, `dependencies`, `WorkspaceSkeletons.tsx`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.0720658888126287 - nodes in this community are weakly interconnected._
- **Should `new/onboarding/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08961038961038961 - nodes in this community are weakly interconnected._