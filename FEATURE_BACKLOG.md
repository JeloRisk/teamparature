# Feature backlog

Recorded November 7, 2026. These are proposed improvements; descriptions of current behavior are reported observations pending verification during implementation.

| Priority | Feature | Recommendation |
| --- | --- | --- |
| **1** | Workspace settings | Add editing for the name, description, and timezone. Settings currently mostly shows the workspace name and deletion controls. |
| **1** | Reliable daily check-ins | Use the workspace timezone for “today” and enforce one check-in per member per day in the database. |
| **1** | Consistent reporting | The dashboard temperature measures the share of Happy/Excited responses, while detailed analytics uses average intensity. Give each metric a clear meaning and use it consistently. |
| **1** | Accurate heatmap | Each period currently uses its first recorded mood. Show the most common mood or positive-response percentage, together with the number of responses. |
| **2** | Invitation management | Add **Resend**, a status filter, and pagination. Expired invitations currently have no direct way to send a fresh invitation. |
| **2** | Member management | Add a **Removed members** filter and a deliberate **Restore** action. Deactivated members currently disappear from the active table. |
| **2** | Analytics filters | Add a shared date range—7 days, 30 days, and custom—and compare it with the preceding period. |
| **2** | Privacy controls | Suppress team summaries when too few people respond. Explain to members what owners can see and how notes are used. |
| **3** | Check-in reminders | Let owners choose a schedule and timezone, with a member opt-out. |
| **3** | Activity history | Record who invited, removed, restored, or changed someone’s role, and when. |
| **3** | Follow-up actions | Let owners record an action after reviewing a trend—for example, “Review workload on Friday”—and mark it complete. |
