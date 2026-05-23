# Implementation Plan - Phase 0: Foundation

Introduce the foundation for the baseline-based posture coaching system. We will refactor the existing `PoseDetector.tsx` logic into isolated, testable modules (`lib/pose/*` and `lib/baseline/*`), switch to the dynamic routing model `/workout/[exercise]`, and implement the foundational structures for baseline trajectories.

## User Review Required

> [!IMPORTANT]
> - Next.js 16/15+ App Router introduces asynchronous page parameters (`Promise<{ exercise: string }>`). We will handle dynamic routes according to these specifications.
> - We will install `vitest` and other testing libraries to support test-driven development (TDD) for the new modular business logic.

## Open Questions

- Confirm if there are any specific styling libraries we should look out for besides Tailwind CSS. (We will use the standard CSS files and utilities present in the project).

## Proposed Changes

### Testing Infrastructure

#### [NEW] [vitest.config.ts](file:///c:/Users/USER/OneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90/%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4/KENTECH/3-1/%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88/Project%202/FitnessPartner/vitest.config.ts)
- Configure test environment, alias mappings, and glob patterns for test files.

#### [MODIFY] [package.json](file:///c:/Users/USER/OneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90/%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4/KENTECH/3-1/%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88/Project%202/FitnessPartner/package.json)
- Add testing scripts and devDependencies for `vitest`, `@testing-library/react`, etc.

### Core Types & Pose Extraction

#### [NEW] [exercise.ts](file:///c:/Users/USER/OneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90/%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4/KENTECH/3-1/%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88/Project%202/FitnessPartner/src/types/exercise.ts)
- Expose key landmark indices, joint unions, exercise families, and frame-level interface shapes.

#### [NEW] [features.ts](file:///c:/Users/USER/OneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90/%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4/KENTECH/3-1/%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88/Project%202/FitnessPartner/src/lib/pose/features.ts) / [features.test.ts](file:///c:/Users/USER/OneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90/%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4/KENTECH/3-1/%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88/Project%202/FitnessPartner/src/lib/pose/features.test.ts)
- Compute 3D joint angles using vector projection (dot products and coordinates).

#### [NEW] [segmenter.ts](file:///c:/Users/USER/OneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90/%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4/KENTECH/3-1/%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88/Project%202/FitnessPartner/src/lib/pose/segmenter.ts) / [segmenter.test.ts](file:///c:/Users/USER/OneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90/%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4/KENTECH/3-1/%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88/Project%202/FitnessPartner/src/lib/pose/segmenter.test.ts)
- Stateful segmenter utilizing threshold-based state machine for down-and-up tracking of standard reps.

#### [NEW] [normalize.ts](file:///c:/Users/USER/OneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90/%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4/KENTECH/3-1/%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88/Project%202/FitnessPartner/src/lib/pose/normalize.ts) / [normalize.test.ts](file:///c:/Users/USER/OneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90/%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4/KENTECH/3-1/%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88/Project%202/FitnessPartner/src/lib/pose/normalize.test.ts)
- Resample time-series angular trajectories to fixed length (e.g. 50 frames) using linear interpolation.

#### [NEW] [mediapipe.ts](file:///c:/Users/USER/OneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90/%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4/KENTECH/3-1/%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88/Project%202/FitnessPartner/src/lib/pose/mediapipe.ts)
- Decouple MediaPipe Tasks-Vision instantiation and result transformation from the component.

### Baseline Management

#### [NEW] [types.ts](file:///c:/Users/USER%5COneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90%5C%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4%5CKENTECH%5C3-1%5C%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88%5CProject%202%5CFitnessPartner%5Csrc%5Clib%5Cbaseline%5Ctypes.ts)
- Type definitions for baseline trajectories and metadata.

#### [NEW] [schema.ts](file:///c:/Users/USER%5COneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90%5C%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4%5CKENTECH%5C3-1%5C%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88%5CProject%202%5CFitnessPartner%5Csrc%5Clib%5Cbaseline%5Cschema.ts) / [schema.test.ts](file:///c:/Users/USER%5COneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90%5C%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4%5CKENTECH%5C3-1%5C%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88%5CProject%202%5CFitnessPartner%5Csrc%5Clib%5Cbaseline%5Cschema.test.ts)
- Schema validation functions to guarantee that baseline JSON files meet constraints (lengths, types).

#### [NEW] [registry.ts](file:///c:/Users/USER%5COneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90%5C%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4%5CKENTECH%5C3-1%5C%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88%5CProject%202%5CFitnessPartner%5Csrc%5Clib%5Cbaseline%5Cregistry.ts) / [registry.test.ts](file:///c:/Users/USER%5COneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90%5C%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4%5CKENTECH%5C3-1%5C%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88%5CProject%202%5CFitnessPartner%5Csrc%5Clib%5Cbaseline%5Cregistry.test.ts)
- Static mapping registry compiling active baseline files (including `pushup_standard.json` stub).

#### [NEW] [pushup_standard.json](file:///c:/Users/USER%5COneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90%5C%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4%5CKENTECH%5C3-1%5C%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88%5CProject%202%5CFitnessPartner%5Cpublic%5Cbaselines%5Cpushup_standard.json)
- Seed standard push-up baseline stub for testing.

### Routing & Component Integration

#### [NEW] [page.tsx](file:///c:/Users/USER%5COneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90%5C%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4%5CKENTECH%5C3-1%5C%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88%5CProject%202%5CFitnessPartner%5Csrc%5Capp%5Cworkout%5C%5Bexercise%5D%5Cpage.tsx)
- Replaces static routes with a single dynamic routing directory utilizing `Promise<{ exercise: string }>` properties.

#### [DELETE] `src/app/workout/pushup/page.tsx`, `src/app/workout/benchpress/page.tsx`
- Remove static routes.

#### [MODIFY] [page.tsx](file:///c:/Users/USER%5COneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90%5C%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4%5CKENTECH%5C3-1%5C%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88%5CProject%202%5CFitnessPartner%5Csrc%5Capp%5Cworkout%5Cpage.tsx)
- Dynamically build exercise lists from the baseline registry.

#### [MODIFY] [BottomNav.tsx](file:///c:/Users/USER%5COneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90%5C%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4%5CKENTECH%5C3-1%5C%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88%5CProject%202%5CFitnessPartner%5Csrc%5Ccomponents%5CBottomNav.tsx)
- Hide bottom navigation for `/capture` pages.

#### [MODIFY] [PoseDetector.tsx](file:///c:/Users/USER%5COneDrive%20-%20%ED%95%9C%EA%B5%AD%EC%97%90%EB%84%88%EC%A7%80%EA%B3%B5%EA%B3%BC%EB%8C%80%ED%95%99%EA%B5%90%5C%EB%B0%94%ED%83%95%20%ED%99%94%EB%A9%B4%5CKENTECH%5C3-1%5C%EC%9D%B8%EA%B3%B5%EC%A7%80%EB%8A%A5%EA%B3%BC%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%20%EA%B8%B0%EC%B4%88%5CProject%202%5CFitnessPartner%5Csrc%5Ccomponents%5CPoseDetector.tsx)
- Delegate math structures and loader routines to `lib/pose/` modules. Pass a `baselineId` prop to support modular loading.

## Verification Plan

### Automated Tests
- Run `npm test` to verify Vitest configuration and the correctness of our mathematical calculations (`features.ts`, `segmenter.ts`, `normalize.ts`, `schema.ts`, `registry.ts`).

### Manual Verification
- Launch the development server (`npm run dev`) and test standard pushup detection with camera stream to confirm that:
  1. The new dynamic routes resolve correctly.
  2. Rep counting still functions normally via the new `RepSegmenter`.
