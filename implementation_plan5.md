# Implementation Plan - Phase 1: Rule-Based Coaching & Data Capture

Implement Phase 1 of the baseline-based posture coaching system, as outlined in the project specifications and plans. This phase introduces rule-based coaching against an ideal baseline trajectory, real-time visual feedback, and a developer-only data capture page to record reps.

## User Review Required

> [!IMPORTANT]
> - **Supabase Migration**: Task 18 includes a database migration to add `baseline_id`, `rep_scores`, and `defects` columns to the `workouts` table, and updates the `leaderboard` view. This SQL script must be run in the Supabase SQL editor.
> - **Environment Variable**: We will enable the `/capture` page by setting `NEXT_PUBLIC_ENABLE_CAPTURE=true` in `.env.local` for local development.

## Proposed Changes

### Configuration & Data

#### [MODIFY] [.env.example](file:///c:/Users/USER/OneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90/%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4/KENTECH/3-1/%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88/Project%202/FitnessPartner/.env.example)
- Add `NEXT_PUBLIC_ENABLE_CAPTURE=false` as a default example.

#### [NEW] [.env.local](file:///c:/Users/USER/OneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90/%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4/KENTECH/3-1/%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88/Project%202/FitnessPartner/.env.local)
- Add `NEXT_PUBLIC_ENABLE_CAPTURE=true`.

#### [MODIFY] [pushup_standard.json](file:///c:/Users/USER/OneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90/%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4/KENTECH/3-1/%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88/Project%202/FitnessPartner/public/baselines/pushup_standard.json)
- Author a 50-frame baseline trajectory for standard push-ups (angles for elbow, shoulder, hip, and body line).

### Coaching Logic

#### [NEW] [scoring.ts](file:///c:/Users/USER/OneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90/%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4/KENTECH/3-1/%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88/Project%202/FitnessPartner/src/lib/coach/scoring.ts) / [scoring.test.ts](file:///c:/Users/USER/OneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90/%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4/KENTECH/3-1/%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88/Project%202/FitnessPartner/src/lib/coach/scoring.test.ts)
- Compute overall and per-joint scores comparing resampled user reps against baseline trajectories.

#### [NEW] [realtimeGuide.ts](file:///c:/Users/USER/OneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90/%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4/KENTECH/3-1/%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88/Project%202/FitnessPartner/src/lib/coach/realtimeGuide.ts) / [realtimeGuide.test.ts](file:///c:/Users/USER/OneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90/%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4/KENTECH/3-1/%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88/Project%202/FitnessPartner/src/lib/coach/realtimeGuide.test.ts)
- Estimate current movement phase and return real-time deviations for each joint.

#### [NEW] [defectMessages.ts](file:///c:/Users/USER/OneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90/%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4/KENTECH/3-1/%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88/Project%202/FitnessPartner/src/lib/coach/defectMessages.ts)
- Map the worst deviating joint and direction to helpful Korean feedback messages.

### Frontend Components

#### [NEW] [SkeletonOverlay.tsx](file:///c:/Users/USER/OneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90/%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4/KENTECH/3-1/%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88/Project%202/FitnessPartner/src/components/SkeletonOverlay.tsx)
- Canvas overlay drawing skeletal bones color-coded (Green/Amber/Red) by deviation intensity.

#### [NEW] [FormHud.tsx](file:///c:/Users/USER/OneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90/%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4/KENTECH/3-1/%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88/Project%202/FitnessPartner/src/components/FormHud.tsx)
- Displays reps, last rep score, average score, phase completion bar, and coaching hint toasts.

#### [NEW] [WorkoutResultCard.tsx](file:///c:/Users/USER/OneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90/%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4/KENTECH/3-1/%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88/Project%202/FitnessPartner/src/components/WorkoutResultCard.tsx)
- Workout summary card with score bar charts per rep and top defects triggered.

#### [NEW] [CaptureControls.tsx](file:///c:/Users/USER/OneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90/%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4/KENTECH/3-1/%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88/Project%202/FitnessPartner/src/components/CaptureControls.tsx)
- Controls for capturing and downloading rep data (quality labels, defects selector, record toggle).

#### [MODIFY] [PoseDetector.tsx](file:///c:/Users/USER/OneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90/%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4/KENTECH/3-1/%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88/Project%202/FitnessPartner/src/components/PoseDetector.tsx)
- Integrate real-time deviations, HUD overlay, and scoring on rep completion. Persist results in Supabase.

### Routing & Pages

#### [NEW] [capture/page.tsx](file:///c:/Users/USER/OneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90/%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4/KENTECH/3-1/%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88/Project%202/FitnessPartner/src/app/capture/page.tsx)
- Camera view page that feeds frames to the segmenter and accumulates frames for downloading as a JSON file.

#### [MODIFY] [leaderboard/page.tsx](file:///c:/Users/USER/OneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90/%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4/KENTECH/3-1/%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88/Project%202/FitnessPartner/src/app/leaderboard/page.tsx)
- Surface the average form score in the leaderboard.

### Database

#### [NEW] [20260522_add_form_scoring.sql](file:///c:/Users/USER/OneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90/%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4/KENTECH/3-1/%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88/Project%202/FitnessPartner/supabase_migrations/20260522_add_form_scoring.sql)
- SQL migration script to add required table columns and update the leaderboard view.

## Verification Plan

### Automated Tests
- Run `npm test` to verify scoring and real-time guidance logic.
- Run `npm run build` to verify compiling/linking.

### Manual Verification
- Access `/workout/pushup_standard` and test real-time skeleton overlay, rep-counter, HUD, and workout summary.
- Access `/capture` to record and download JSON of reps.
