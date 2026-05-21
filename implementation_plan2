# Mobile Layout Implementation Plan

This plan details the steps to convert the current desktop-oriented web application into a responsive mobile form factor, mimicking a mobile app layout.

## User Review Required

> [!IMPORTANT]
> Please review the proposed changes below. The application will be wrapped in a mobile-sized container on desktop screens, and a Bottom Navigation Bar will replace the top header navigation. Do you agree with adding a Bottom Navigation Bar, or do you prefer keeping a hamburger menu/top header?

## Proposed Changes

### Global Layout & Shell

We will modify the root layout to create a mobile shell.

#### [MODIFY] [layout.tsx](file:///c:/Users/USER/OneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90/%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4/KENTECH/3-1/%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88/Project%202/FitnessPartner/src/app/layout.tsx)
- Change the `<body>` background to a dark desktop backdrop (e.g., `bg-slate-900`).
- Wrap `{children}` in a `div` with `max-w-md mx-auto w-full min-h-screen bg-slate-950 shadow-2xl relative overflow-x-hidden pb-16`. This creates the mobile phone container.
- Include the new `BottomNav` component at the bottom of this container.

#### [NEW] [BottomNav.tsx](file:///c:/Users/USER/OneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90/%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4/KENTECH/3-1/%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88/Project%202/FitnessPartner/src/components/BottomNav.tsx)
- A fixed navigation bar positioned at the bottom of the mobile container (`absolute bottom-0 w-full`).
- Contains icons/links for **Home**, **Workout**, and **Leaderboard**.

---

### Pages

We will update existing pages to remove desktop navigation and adjust layout for mobile.

#### [MODIFY] [page.tsx](file:///c:/Users/USER/OneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90/%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4/KENTECH/3-1/%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88/Project%202/FitnessPartner/src/app/page.tsx)
- Remove the top header (`<header className="sticky top-0...">`).
- Adjust the Hero section: reduce `text-5xl`/`text-7xl` to smaller sizes suitable for mobile screens.
- Stack buttons vertically instead of horizontally if they don't fit well.

#### [MODIFY] [workout/page.tsx](file:///c:/Users/USER/OneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90/%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4/KENTECH/3-1/%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88/Project%202/FitnessPartner/src/app/workout/page.tsx)
- Remove the top header or replace it with a smaller, inline "Workout" title.
- Ensure the exercise cards stack vertically (`grid-cols-1`).

#### [MODIFY] [leaderboard/page.tsx](file:///c:/Users/USER/OneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90/%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4/KENTECH/3-1/%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88/Project%202/FitnessPartner/src/app/leaderboard/page.tsx)
- Remove the top header.
- Add horizontal scrolling for the leaderboard table (`overflow-x-auto`) to ensure it doesn't break the mobile layout.

## Verification Plan

### Manual Verification
- Start the Next.js development server.
- Verify that on a desktop browser, the app appears as a centered phone-sized container.
- Verify that the bottom navigation bar is visible and routes correctly between Home, Workout, and Leaderboard.
- Verify that no horizontal scrolling occurs on the main mobile container.
