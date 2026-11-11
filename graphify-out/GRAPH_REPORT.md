# Graph Report - teamparature  (2026-11-11)

## Corpus Check
- 145 files · ~42,872 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 2, .puml 2, .ico 1)

## Summary
- 711 nodes · 2025 edges · 34 communities (17 shown, 17 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7c4d5fc5`
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
- bcryptjs
- clsx
- scripts
- next-auth.d.ts
- orgPermissions.ts
- @radix-ui/react-dropdown-menu
- date-fns
- gsap@^3.13.0
- jsonwebtoken@^9.0.2
- next-themes
- @radix-ui/react-avatar
- slugify
- tailwind-merge
- postcss.config.mjs
- moods.ts
- organization.ts
- sonner

## God Nodes (most connected - your core abstractions)
1. `cn()` - 101 edges
2. `next` - 56 edges
3. `react` - 50 edges
4. `connectDB()` - 38 edges
5. `lucide-react` - 37 edges
6. `MembersPage()` - 35 edges
7. `Button()` - 31 edges
8. `next-auth` - 27 edges
9. `Input()` - 24 edges
10. `mongoose` - 22 edges

## Surprising Connections (you probably didn't know these)
- `DashboardProps` --references--> `Role`  [EXTRACTED]
  app/(client)/(admin)/[orgId]/dashboard/Dashboard.tsx → lib/rbac.ts
- `BreadcrumbEllipsis()` --calls--> `cn()`  [EXTRACTED]
  app/components/ui/breadcrumb.tsx → lib/utils.ts
- `BreadcrumbLink()` --calls--> `cn()`  [EXTRACTED]
  app/components/ui/breadcrumb.tsx → lib/utils.ts
- `BreadcrumbSeparator()` --calls--> `cn()`  [EXTRACTED]
  app/components/ui/breadcrumb.tsx → lib/utils.ts
- `DropdownMenuCheckboxItem()` --calls--> `cn()`  [EXTRACTED]
  app/components/ui/dropdown-menu.tsx → lib/utils.ts

## Import Cycles
- None detected.

## Communities (34 total, 17 thin omitted)

### Community 0 - "next"
Cohesion: 0.06
Nodes (68): handler, POST(), POST(), GET(), POST(), GET(), POST(), ResendError (+60 more)

### Community 1 - "MembersView.tsx"
Cohesion: 0.06
Nodes (75): actionAccents, ActionLabel(), ActivityView(), changeSort(), sortableHeader(), Entry, OutcomeBadge(), outcomeStyles (+67 more)

### Community 2 - "cn"
Cohesion: 0.07
Nodes (61): ClientDashboardLayout(), DashboardContent(), Workspace, WorkspaceContext, DashboardContent(), DashboardLayout(), AppSidebar(), NavUser() (+53 more)

### Community 3 - "new/onboarding/page.tsx"
Cohesion: 0.11
Nodes (29): ChartCard2(), ChartCardProps, ChartCard(), ChartCardProps, KpiCardProps, COLORS, data, data (+21 more)

### Community 4 - "react"
Cohesion: 0.10
Nodes (33): MemberActions(), SettingsPage(), WorkspaceSettingsForm(), LoginPage(), AccountSettingsForm(), OnboardingPage(), OnboardingPage(), RegisterPage() (+25 more)

### Community 5 - "package.json"
Cohesion: 0.07
Nodes (41): devDependencies, autoprefixer@^10.4.21, eslint@^9, eslint-config-next@15.4.7, postcss@^8.5.6, tailwindcss@^4.1.12, @tailwindcss/postcss@^4, ts-node@^10.9.2 (+33 more)

### Community 6 - "analytics/MoodAnalytics.tsx"
Cohesion: 0.08
Nodes (34): Dashboard(), DashboardProps, AnalyticsRangePicker(), dateInZone(), formatDateRange(), AnalyticsPage(), KpiCard(), aggregateTrend() (+26 more)

### Community 7 - "dependencies"
Cohesion: 0.06
Nodes (36): dependencies, axios@^1.11.0, class-variance-authority@^0.7.1, date-fns-tz@^3.2.0, express@^5.1.0, framer-motion@^12.23.12, lucide-react@^0.540.0, mongoose@^8.17.2 (+28 more)

### Community 8 - "app/layout.tsx"
Cohesion: 0.07
Nodes (31): useWorkspace(), ProfilePage(), DashboardPage(), AuthSync(), TopProgressBar, TopProgressBarClientWrapper(), dashboardHeading, geistMono (+23 more)

### Community 9 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+12 more)

### Community 10 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 11 - "orgInvitationMailer.ts"
Cohesion: 0.12
Nodes (14): POST(), getEnvVar(), sendVerificationEmail(), SendVerificationEmailProps, transporter, escapeHtml(), getEnvVar(), getInvitationTransport() (+6 more)

### Community 12 - "@radix-ui/react-label"
Cohesion: 0.14
Nodes (8): apexcharts@^5.3.4, @radix-ui/react-label@^2.1.7, @radix-ui/react-tooltip@^1.2.8, @shadcn/ui@^0.0.4, apexcharts, @radix-ui/react-label, @radix-ui/react-tooltip, @shadcn/ui

### Community 13 - "WorkspaceSkeletons.tsx"
Cohesion: 0.12
Nodes (23): Dashboard(), DashboardProps, moodOptions, tooltip, MemberCheckIn(), MemberDashboard(), moods, DashboardPage() (+15 more)

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
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `MembersView.tsx`, `cn`, `new/onboarding/page.tsx`, `react`, `package.json`, `analytics/MoodAnalytics.tsx`, `dependencies`, `app/layout.tsx`, `orgInvitationMailer.ts`, `WorkspaceSkeletons.tsx`?**
  _High betweenness centrality (0.212) - this node is a cross-community bridge._
- **Should `next` be split into smaller, more focused modules?**
  _Cohesion score 0.05884179475236764 - nodes in this community are weakly interconnected._
- **Why does `react` connect `react` to `next`, `MembersView.tsx`, `cn`, `new/onboarding/page.tsx`, `package.json`, `analytics/MoodAnalytics.tsx`, `dependencies`, `app/layout.tsx`, `WorkspaceSkeletons.tsx`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **Should `MembersView.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05730777159348588 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `react` to `next`, `MembersView.tsx`, `cn`, `new/onboarding/page.tsx`, `package.json`, `analytics/MoodAnalytics.tsx`, `dependencies`, `app/layout.tsx`, `WorkspaceSkeletons.tsx`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.07267884322678843 - nodes in this community are weakly interconnected._
- **Should `new/onboarding/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10741971207087486 - nodes in this community are weakly interconnected._