# Architecture & Workflow Document
## EventSnap — Event Photo Sharing Platform

This document shows how components interact across the platform's key flows. Diagrams are in Mermaid syntax — most Markdown viewers (GitHub, VS Code, Antigravity) render these directly.

---

## 1. High-Level Component Diagram

```mermaid
flowchart LR
    subgraph Client
        A[React Frontend]
    end
    subgraph Backend
        B[FastAPI API]
        C[Celery Workers]
        D[Celery Beat Scheduler]
    end
    subgraph Data
        E[(PostgreSQL)]
        F[(Redis)]
    end
    subgraph AWS
        G[S3 - Photo Storage]
        H[Rekognition]
        I[CloudFront - Signed URLs]
    end

    A <--> B
    B <--> E
    B --> F
    F --> C
    C --> E
    C --> G
    C --> H
    D --> F
    B --> I
    I --> G
    A -. WebSocket .-> B
```

---

## 2. Sequence: Guest Signup + Join Event with Face Registration

```mermaid
sequenceDiagram
    participant U as Guest
    participant F as Frontend
    participant API as FastAPI
    participant DB as PostgreSQL
    participant S3 as S3 (temp)
    participant R as Rekognition

    U->>F: Enter email/password/name
    F->>API: POST /auth/signup
    API->>DB: Create user record
    API-->>F: JWT token

    U->>F: Enter event PIN
    F->>API: POST /events/join {pin}
    API->>DB: Validate PIN, create event_members row

    opt Guest opts into face registration
        U->>F: Upload face photo
        F->>API: POST /events/{id}/face-register
        API->>S3: Store temp image
        API->>R: IndexFaces (event Collection)
        R-->>API: face_id
        API->>DB: Store rekognition_face_id
        API->>S3: Delete temp image
    end

    API-->>F: Join success
```

---

## 3. Sequence: Photo Upload + Async Face Matching

```mermaid
sequenceDiagram
    participant U as Guest
    participant F as Frontend
    participant API as FastAPI
    participant Q as Redis Queue
    participant W as Celery Worker
    participant S3 as S3
    participant R as Rekognition
    participant DB as PostgreSQL
    participant WS as WebSocket clients

    U->>F: Upload photo
    F->>API: POST /events/{id}/photos
    API->>S3: Store photo
    API->>DB: Create photos row (processed=false)
    API-->>F: 202 Accepted (upload confirmed)
    API->>Q: Enqueue face-match job

    Q->>W: Job picked up
    W->>DB: Check file_hash for duplicate
    alt Not duplicate
        W->>R: SearchFacesByImage (event Collection)
        R-->>W: Matched face_ids + confidence
        W->>DB: Insert photo_face_matches rows
        W->>DB: Mark photos.processed = true
        W->>WS: Broadcast "new photo" event
    else Duplicate
        W->>DB: Mark processed, skip matching
    end
```

---

## 4. Sequence: Late Join Retroactive Scan

```mermaid
sequenceDiagram
    participant U as Guest (joins late)
    participant API as FastAPI
    participant Q as Redis Queue
    participant W as Celery Worker
    participant DB as PostgreSQL
    participant R as Rekognition

    U->>API: Register face after event already has photos
    API->>Q: Enqueue retroactive-scan job
    Q->>W: Job picked up
    W->>DB: Fetch all existing photos for event
    loop For each photo
        W->>R: SearchFacesByImage
        R-->>W: Match result
        W->>DB: Insert photo_face_matches if match found
    end
```

---

## 5. Sequence: Retention Cleanup

```mermaid
sequenceDiagram
    participant Beat as Celery Beat (daily)
    participant Q as Redis Queue
    participant W as Celery Worker
    participant DB as PostgreSQL
    participant S3 as S3
    participant R as Rekognition
    participant Host as Host (notified)

    Beat->>Q: Enqueue daily retention check

    Q->>W: Job picked up
    W->>DB: Find events expiring in 3 days
    W->>Host: Send warning notification

    W->>DB: Find events expired (expires_at <= now)
    loop For each expired event
        W->>S3: Delete all event photos
        W->>R: Delete event Collection
        W->>DB: Cascade delete photos + matches
        W->>DB: Mark event as archived
    end
```

---

## 6. Sequence: User-Initiated Face Data Deletion

```mermaid
sequenceDiagram
    participant U as User
    participant API as FastAPI
    participant DB as PostgreSQL
    participant R as Rekognition

    U->>API: DELETE /users/me/face-data
    API->>DB: Find all events where user has rekognition_face_id
    loop For each event
        API->>R: DeleteFaces (remove from Collection)
    end
    API->>DB: Delete photo_face_matches for user
    API->>DB: Clear user's face_registered flag
    API-->>U: Confirmation
```

---

## 7. Deployment Topology

```mermaid
flowchart TB
    subgraph Users
        U1[Host Browser]
        U2[Guest Browser]
    end

    U1 & U2 --> ALB[AWS Application Load Balancer]
    ALB --> ECS_API[ECS Fargate: FastAPI service]
    ECS_API --> RDS[(RDS PostgreSQL)]
    ECS_API --> Redis[(ElastiCache Redis)]
    Redis --> ECS_Worker[ECS Fargate: Celery Worker service]
    ECS_Worker --> RDS
    ECS_Worker --> S3[(S3 Bucket)]
    ECS_Worker --> Rekog[AWS Rekognition]
    U1 & U2 --> CF[CloudFront]
    CF --> S3
```

---

## 8. Build Order (maps to PRD milestones)

1. **M1** — Diagrams §2 minus face registration (auth + PIN join only)
2. **M2** — Diagram §3 minus Rekognition steps (upload + gallery, no matching)
3. **M3** — Full diagram §3 with Rekognition + diagram §2's face registration
4. **M4** — Diagrams §5 and §6 (retention + deletion)
5. **M5** — WebSocket broadcast portion of §3 + confirm/reject UI (F8)
6. **M6** — Diagram §7 (deployment)
