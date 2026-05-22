# Baseline 기반 자세 코칭 시스템 설계

- **Date:** 2026-05-22
- **Project:** FitnessPartner (EF2039 — Intro to AI Programming)
- **Status:** Design approved, pending implementation plan

## 1. 배경 및 목표

현재 FitnessPartner는 MediaPipe Pose로 푸쉬업/벤치프레스의 rep을 카운팅하지만, 자세 품질 평가는 없고 score가 100으로 고정되어 있다. 본 설계의 목표는 **baseline 자세 대비 사용자 rep의 품질을 평가하고 실시간으로 교정 피드백을 주는 코칭 시스템**을 도입하는 것이다.

### 핵심 가설
> 운동마다 "이상적인 1 rep"을 관절 각도 시계열로 저장(=baseline)하고, 사용자의 rep을 그 baseline과 비교해 점수와 결함(defect)을 산출하면, 사용자는 자기 자세를 baseline에 맞추도록 학습할 수 있다.

### 수업 맥락
- EF2039 Intro to AI Programming의 학기 프로젝트
- 데모 가능한 MVP가 1차 목표 (제출까지 1개월+)
- "딥러닝 적용 전/후" 비교가 보고서 핵심 컨텐츠

## 2. 기술 선택 근거

### 2.1 Pose 라이브러리: MediaPipe 유지 (단, 업그레이드)
웹/실시간/3D 라는 제약 하에서 검토한 결과:

| 옵션 | 키포인트 | 3D | 웹 | 결론 |
|---|---|---|---|---|
| MediaPipe Tasks-Vision | 33 | ✅ worldLandmarks | 네이티브 | **채택** |
| TF.js MoveNet | 17 | ❌ | ✅ | 2D만 → 체격 보정 불가, 탈락 |
| TF.js BlazePose | 33 | ✅ | ✅ | 사실상 MediaPipe와 동일 |
| YOLOv8-Pose | 17 | ❌ | △ ONNX | 브라우저 inference 부담, 탈락 |
| OpenPose / Apple Vision | - | - | ❌ | 서버 전용 / iOS 전용, 탈락 |

**현 코드 개선점:**
- `pose_landmarker_lite` → `pose_landmarker_full`로 교체 (정확도)
- `worldLandmarks` (3D 미터 좌표) 활용 → 체격/카메라 독립적 비교 가능

### 2.2 모델 역할: Siamese Embedding + Defect Classifier

데이터가 적은 학생 프로젝트 맥락에서 가장 유리한 조합:

- **Siamese encoder** (contrastive learning) — baseline rep과의 거리로 form score 산출. 새 운동 추가 시 재학습 불필요(baseline JSON만 등록).
- **Defect classifier** (다중라벨) — "엉덩이 처짐", "팔꿈치 외전" 등 액션러블 피드백.

대안으로 검토한 옵션:
- Variation classifier: 카탈로그 nearest neighbor으로 자동 처리 가능 → 별도 모델 불필요
- Form quality regressor: 0~100 정답 라벨 매기기 어려움 → 부적합
- 룰베이스만: 보고서에서 "AI" 어필 약함

### 2.3 Inference 위치: 브라우저 (ONNX-Web)

- 모델 크기 작음 (<500KB 양자화 후) → 클라이언트 부담 작음
- 실시간 피드백 가능 (서버 latency 없음)
- 학습은 PyTorch (Colab/로컬) → ONNX export → 앱은 `onnxruntime-web`으로 로드
- 서버 인프라 0, 프라이버시 ↑

## 3. 시스템 아키텍처

```
BROWSER (Next.js 16 / React 19)
  Webcam → MediaPipe Pose (Full, 3D)
         → Feature Extractor (joint angles)
            ├─→ Realtime Guide (rule-based, 30fps)
            │     • phase 추정 / skeleton 색상 / 토스트 hint
            │
            └─→ Rep Segmenter (peak detection)
                  → 50-frame 정규화
                  → ONNX Runtime Web
                      ├─ Siamese Encoder → 128-d emb
                      │     → baseline emb과 cosine distance → score 0~100
                      └─ Defect Classifier → 다중라벨 sigmoid

  결과 → Supabase (workouts + rep_scores)

OFFLINE
  /capture 페이지에서 rep JSON 수집
  → ml/ Python 환경에서 학습
  → ONNX export → public/models/*.onnx
```

3가지 모드:
1. **Workout Mode** — 사용자 운동, 실시간 코칭
2. **Capture Mode** (dev only) — 데이터 수집 / baseline 등록
3. **Train Pipeline** (앱 외부, Python) — ONNX export

## 4. 디렉토리 구조

```
FitnessPartner/
├─ src/
│  ├─ app/
│  │  ├─ workout/[exercise]/page.tsx   # dynamic route (운동-agnostic)
│  │  └─ capture/page.tsx              # 🆕 dev-only 캡처 모드
│  ├─ components/
│  │  ├─ PoseDetector.tsx              # slim 화면 컴포넌트로 축소
│  │  ├─ SkeletonOverlay.tsx           # 🆕 색상 피드백 캔버스
│  │  ├─ FormHud.tsx                   # 🆕 점수/defect HUD
│  │  └─ CaptureControls.tsx           # 🆕 캡처 UI
│  ├─ lib/
│  │  ├─ pose/                         # 🆕 MediaPipe 래핑/특징추출
│  │  │  ├─ mediapipe.ts
│  │  │  ├─ features.ts                # landmarks → joint angles
│  │  │  ├─ segmenter.ts               # rep 경계 검출
│  │  │  └─ normalize.ts               # 50-frame 리샘플
│  │  ├─ coach/                        # 🆕 코칭 로직
│  │  │  ├─ realtimeGuide.ts           # 룰베이스 phase 매칭
│  │  │  ├─ onnxInference.ts           # ONNX 호출
│  │  │  ├─ scoring.ts                 # emb 거리 → score
│  │  │  └─ defectMessages.ts          # 라벨 → 한국어
│  │  ├─ baseline/                     # 🆕 baseline 관리
│  │  │  ├─ types.ts
│  │  │  ├─ registry.ts                # JSON 디렉토리 스캔
│  │  │  └─ schema.ts                  # 검증
│  │  └─ supabase.ts                   # (그대로)
│  └─ types/exercise.ts
├─ public/
│  ├─ baselines/                       # 🆕 운동별 baseline JSON
│  └─ models/                          # 🆕 ONNX 모델
├─ ml/                                 # 🆕 Python 학습 파이프라인
│  ├─ data/{raw,processed}/            # gitignore
│  ├─ notebooks/                       # 탐색/시각화
│  ├─ src/
│  │  ├─ dataset.py
│  │  ├─ augment.py
│  │  ├─ models.py
│  │  ├─ train_siamese.py
│  │  ├─ train_defect.py
│  │  └─ export_onnx.py
│  └─ requirements.txt
└─ docs/superpowers/specs/             # 본 문서
```

### 모듈 경계 원칙
- `lib/pose/` — 순수 함수 (MediaPipe I/O 변환). 테스트 가능.
- `lib/coach/` — 룰베이스와 모델 inference **분리**. 모델 없이도 룰베이스 단독 동작 가능(= MVP 안전망).
- `lib/baseline/` — JSON 스키마 1군데서 관리. 운동 추가는 JSON 추가만.
- `ml/` — 앱과 완전 분리된 Python 환경. ONNX 파일만이 인터페이스.

## 5. 데이터 모델

### 5.1 Baseline JSON (`public/baselines/<id>.json`)

```jsonc
{
  "id": "pushup_standard",
  "exercise_family": "pushup",
  "variation": "standard",
  "display_name_ko": "표준 푸쉬업",
  "camera_view": "front",                  // front | side
  "target_muscles": ["chest_mid", "triceps"],
  "joints_used": [
    "elbow_left", "elbow_right",
    "shoulder_left", "shoulder_right",
    "hip_left", "hip_right",
    "body_line"
  ],
  "rep_length_frames": 50,
  "trajectory": {                          // 50 × joints_used
    "elbow_left":  [170, 168, /* ... */ 88, /* ... */ 170],
    "body_line":   [178, 178, /* ... */ 178, /* ... */ 178]
    // 나머지 관절 동일 형식
  },
  "embedding": [0.12, -0.34, /* ... */],   // Siamese encoder 사전계산 128-d
  "phase_anchors": { "top": 0.0, "bottom": 0.5, "top2": 1.0 },
  "rule_thresholds": {                     // 모델 없을 때 폴백
    "elbow_top_min": 155,
    "elbow_bottom_max": 95,
    "body_line_min": 165
  },
  "captured_by": "team_member_A",
  "captured_at": "2026-05-25",
  "version": 1
}
```

**핵심:** `trajectory`(원본)와 `embedding`(모델 출력)을 **둘 다** 저장 → 모델 가용성과 무관하게 점수화 가능.

### 5.2 Rep 캡처 데이터 (`ml/data/raw/*.json`)

```jsonc
{
  "session_id": "uuid",
  "subject": "team_A",
  "exercise_family": "pushup",
  "variation": "standard",
  "quality_label": "good",                 // good | bad_*
  "defects": ["hip_sag", "elbow_flare"],   // 다중라벨, good이면 []
  "camera_view": "front",
  "captured_at": "2026-05-25T14:30:00",
  "frames": [
    {
      "t_ms": 0,
      "landmarks_2d": [[0.5, 0.4, 0.95], /* ... 33개 */],
      "landmarks_world": [[0.0, 0.1, 0.0], /* ... 33개 */]
    }
    // ... (rep 동안 모든 프레임)
  ]
}
```

### 5.3 Augmentation 전략

| 기법 | 적용 |
|---|---|
| 시간축 워핑 | 0.7~1.3배 속도 |
| 각도 노이즈 | ±2° Gaussian |
| 좌우 미러링 | 좌우 대칭 운동만 (pushup ✓, lunge ✗) |
| 프레임 dropout | 5% 프레임 마스킹 후 보간 |
| Body 스케일 | world coord × 0.9~1.1 |

목표 데이터셋: 운동 3종 × variation 2~3개 × 시연자 3~4명 × (good 10rep + bad 5rep) × aug 5배 ≈ **2,000~3,000 rep**.

## 6. 모델 아키텍처

**입력:** `[B, T=50, J=7~10]` (rep × 프레임 × 관절각도)

### Siamese Encoder
```
Conv1D(64, k=5) → BN → ReLU
Conv1D(128, k=3) → BN → ReLU → MaxPool
Conv1D(256, k=3) → BN → ReLU → GlobalAvgPool
FC(128) → L2 normalize
→ 128-d embedding
```
Loss: Triplet loss (anchor=baseline, positive=same-variation good rep, negative=bad rep 또는 다른 variation)

### Defect Classifier
Siamese encoder의 backbone을 공유한 multi-task head:
```
shared backbone (frozen 또는 fine-tune)
→ FC(64) → ReLU → FC(N_defects) → Sigmoid
```
Loss: BCE (multi-label)

N_defects (운동별):
- pushup: `["hip_sag", "hip_pike", "elbow_flare", "shallow_rom", "asymmetric"]`
- squat: `["knee_valgus", "heel_raise", "back_round", "shallow_depth", "lean_forward"]`
- benchpress: 데이터 수집 시점에 정의 (Phase 3로 이연)

**모델 크기 목표:** ONNX 양자화 후 < 500KB.

## 7. UX / 화면 흐름

### 7.1 메뉴
BottomNav: `Workout / Leaderboard / Capture / Profile`
Capture 탭은 env flag(`NEXT_PUBLIC_ENABLE_CAPTURE`)로 dev/team에서만 노출.

### 7.2 Workout 흐름
1. `/workout` — 운동 카탈로그 (registry 기반 동적 메뉴)
2. Variation 선택 (해당 family의 baseline 목록)
3. `/workout/[exercise]` — 운동 화면

### 7.3 운동 화면 상태
| 상태 | UX |
|---|---|
| detecting | 사용자 frame in 대기 |
| preparing | 시작 자세 1.5초 유지 + **baseline ghost overlay 페이드인** |
| active | 실시간 코칭 (7.4) |
| completed | 결과 카드 (7.5) |

### 7.4 active 중 실시간 피드백 (룰베이스, 매 프레임)
- **관절별 색상 skeleton**: 현재 phase 기댓값 대비 deviation으로 녹/황/적 분류
- **baseline ghost overlay**: trajectory를 현재 frame에 투영 (토글 가능)
- **Phase bar**: top ↔ bottom 위치 시각화
- **토스트 hint**: 가장 큰 결함 1개 한국어 메시지

모델 호출은 **rep 종료 시에만** (30fps에 ONNX 호출 부담 회피).

### 7.5 결과 화면
- 총 reps / 평균 점수
- Rep별 점수 막대 그래프
- 자주 발생한 defect 목록
- "리더보드로 가기" / "한 번 더" 액션

### 7.6 Capture 모드
- 운동/시연자/품질 라벨 (good 또는 defect 다중선택)
- 녹화 → 자동 rep segment → JSON 다운로드 → `ml/data/raw/`에 push

## 8. MVP 단계

### Phase 0 — 기반 정비 (3~4일)
- MediaPipe `full` 모델 + `worldLandmarks`
- `PoseDetector.tsx` → `lib/pose/`로 분리
- `[exercise]` dynamic route 전환
- Exercise registry 구조
- `/capture` 라우트 + UI 골격

산출물: 기존 기능 그대로 + 새 코드 구조.

### Phase 1 — 데이터 파이프라인 + 룰베이스 코칭 (1주)
- `/capture`로 데이터 수집 시작 (운동 3종 × 시연자 2~3명)
- Baseline JSON 스키마 + 검증
- **표준 푸쉬업 baseline 1개** 수기 시드
- `realtimeGuide.ts` 룰베이스 phase 매칭
- `SkeletonOverlay` 색상 피드백
- `FormHud` DTW 기반 점수
- Supabase 확장: `rep_scores jsonb`, `defects jsonb`

**여기까지가 진짜 MVP** — 모델 없이도 데모/제출 가능.

### Phase 2 — 학습 파이프라인 + ONNX 추론 (1~2주)
- `ml/` Python 환경 셋업
- `dataset.py` + augmentation
- `models.py` Siamese + Defect
- 학습 스크립트
- `export_onnx.py` + baseline embedding 사전계산
- `onnxInference.ts` 래퍼
- Rep 종료 시 ONNX 호출 → 룰베이스 결과 교체
- **룰베이스 vs 모델 비교 평가** (보고서 핵심)

### Phase 3 — 확장 + 다듬기
- 푸쉬업 variation 2개 추가
- 스쿼트 baseline 1개
- 벤치프레스 측면 카메라 (시간 되면)
- UX polish + 보고서 작성

### Stretch (수업 외)
- 본인 baseline 등록 모드 (개인화)
- 좌우 대칭 분석
- PWA / 누적 통계

## 9. 위험 요소 및 완화

| 위험 | 영향 | 완화 |
|---|---|---|
| 데이터 부족으로 학습 부진 | Phase 2 모델 성능 저조 | 룰베이스 폴백 항상 유지 |
| MediaPipe full 모델 모바일 부담 | 렉/끊김 | mobile UA 감지 시 lite 자동 |
| ONNX-Web GPU 제한 | inference 속도 | 모델 < 500KB, rep 종료 시에만 호출 |
| 벤치프레스 측면 카메라 데이터 부족 | variation 추가 어려움 | Phase 3로 이연, MVP는 푸쉬업 중심 |
| 시연자 자세 신뢰성 | baseline 품질 ↓ | 팀 리뷰 후 채택, `captured_by` 추적 |
| 수업 평가 기준 모호 | 스코프 폭주 | Phase 1 = 마지노선, Phase 2 = 차별점, Phase 3 = 욕심 |

## 10. Out of Scope (명시적 제외)

- 트레이너 자격증/의학적 처방 수준의 자세 평가
- 다중 사용자 동시 트래킹
- 운동 영양/식단/일정 관리
- 운동학(kinesiology) 도메인 메뉴 (타겟 근육별 추천 등) — future work
- iOS/Android 네이티브 앱 (PWA로 우회)
