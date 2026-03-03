# Winku Phase 2 Rollout Checklist

This checklist tracks reusable UI pieces to apply Winku-inspired styling across the remaining Reddit UI pages.

## Shared Shell Targets

- `Navbar` in all major pages:
  - `post/[slug]/page.tsx`
  - `submit/page.tsx`
  - `settings/page.tsx`
  - `my-posts/page.tsx`
  - `c/[slug]/page.tsx`
- Shared spacing container pattern: `winku-page` + `winku-container`.
- Shared card surface pattern: `winku-panel`.

## Reusable Component Candidates

- **Post surfaces**
  - Convert detail post wrapper to `winku-post-card` variants.
  - Reuse `winku-vote-col`, action button, and metadata rows.
- **Sidebar blocks**
  - Community summary cards.
  - Author/profile summary.
  - Rule and utility widgets.
- **Forms**
  - Submit form sections, text inputs, and selector groups.
  - Settings form sections and save actions.
- **Comment stack**
  - Composer section container.
  - Comment item spacing, nested thread lines, and interaction rows.

## Phase 2 Execution Order

1. Apply shell + shared panel classes to `post/[slug]/page.tsx`.
2. Align `submit` and `settings` layout wrappers and form card styling.
3. Normalize `my-posts` and community pages with same feed card language.
4. Remove duplicated inline style blocks that are replaced by `winku.css`.
5. Final responsive pass for mobile and tablet breakpoints.

## Validation

- Run lint diagnostics for touched files.
- Spot-check:
  - Desktop: 1366px+
  - Tablet: ~768px
  - Mobile: 390px
- Verify auth actions in `NavUser` still work:
  - Login modal trigger
  - Dropdown links
  - Logout flow
