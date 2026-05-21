# Automatic Workout Start/Stop Detection Plan

This plan details the implementation of automatic start and stop detection in `PoseDetector.tsx` using MediaPipe Pose landmark visibility and coordinate analysis.

## User Review Required

> [!IMPORTANT]
> Please review the conditions for starting and stopping:
> 1. **Auto-Start**: Requires the user's key joints (shoulders, hips, knees, ankles for push-up; shoulders, elbows, wrists, hips for bench press) to be visible (> 0.5 confidence) and in the extended starting pose (elbow angle > 150 degrees) for 1.5 seconds.
> 2. **Auto-Stop**: Triggered if key joint visibility falls below 0.5 for 2.5 seconds (user left the frame / stopped), or if the user changes posture significantly (e.g., sitting up, standing up, or lying stationary for 5 seconds).
> Do you think these timing thresholds (1.5s to start, 2.5s to stop) are reasonable, or should they be shorter/longer?

## Proposed Changes

### Pose Detection Component

We will update `PoseDetector.tsx` to introduce a state machine and auto-saving logic.

#### [MODIFY] [PoseDetector.tsx](file:///c:/Users/USER/OneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90/%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4/KENTECH/3-1/%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88/Project%202/FitnessPartner/src/components/PoseDetector.tsx)
- Define a status state: `'detecting_user' | 'preparing' | 'active' | 'saving' | 'completed'`.
- Add refs to track:
  - Time/frames the user has been in full frame and in starting position.
  - Time/frames since joint visibility dropped.
  - Time/frames the user has been completely stationary.
- Implement checking functions:
  - `checkFullBodyInFrame(landmarks)`: checks the visibility of key landmarks.
  - `checkStartingPose(landmarks, exercise)`: checks if the body is aligned and arms extended.
  - `checkExerciseFinished(landmarks, exercise)`: checks if the user has changed posture (e.g. stood up) or left the frame.
- Automatically save the workout by calling the database insertion logic and routing once the workout is marked as finished (only if `reps > 0`).

## Verification Plan

### Automated Tests
- Run `npm run build` to ensure no Typescript or build compilation issues.

### Manual Verification
- Deploy/run the server.
- Step in front of the camera, check if status transitions from "Searching for User" -> "Aligning Starting Position" -> "Active! Start Reps".
- Do a few reps, check if reps count up.
- Step away or stand up, verify if it automatically triggers "Saving workout..." and redirects to the leaderboard.
