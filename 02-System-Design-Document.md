# System Design Document
## EventSnap — Event Photo Sharing Platform

---

## 1. Architecture Overview

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   React     │◄────►│   FastAPI (API)   │◄────►│   PostgreSQL     │
│  Frontend   │      │   (async)         │      │  (users, events, │
└─────────────┘      └────────┬─────────┘      │  photos, matches)│
                               │                 └─────────────────┘
                               │
                     ┌─────────▼─────────┐
                     │   Redis + Celery   │
                     │  (async workers)   │
                     └─────────┬─────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
      ┌───────────────┐ ┌─────────────┐ ┌───────────────┐
      │   AWS S3       │ │ AWS         │ │  Retention     │
      │ (photo storage)│ │ Rekognition │ │  cleanup job   │
      └───────────────┘ └─────────────┘ └───────────────┘
                               │
                     ┌─────────▼─────────┐
                     │  CloudFront (CDN)  │
                     │  signed URL access │
                     └────────────────────┘
```

## 2. Component Responsibilities

| Component | Responsibility |
|---|---|
| React frontend | Auth UI, event creation/join, upload UI, gallery views, live updates via WebSocket |
| FastAPI backend | REST API, auth, business logic, enqueues async jobs, issues signed URLs |
| PostgreSQL | Source of truth for users, events, membership, photo metadata, match results |
| Redis + Celery | Job queue for face processing and retention cleanup; keeps upload requests fast |
| AWS S3 | Durable photo storage, organized per event |
| AWS Rekognition | Face indexing (`IndexFaces`) and matching (`SearchFacesByImage`) per event "Collection" |
| CloudFront | CDN + signed URLs so photos aren't publicly guessable via raw S3 links |

## 3. Data Model

```sql
users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  face_registered BOOLEAN DEFAULT FALSE,
  rekognition_face_id VARCHAR NULL,  -- only if opted in
  created_at TIMESTAMP DEFAULT NOW()
);

events (
  id UUID PRIMARY KEY,
  host_id UUID REFERENCES users(id),
  name VARCHAR NOT NULL,
  event_date DATE NOT NULL,
  pin_code VARCHAR(8) UNIQUE NOT NULL,
  retention_days INT NOT NULL,
  rekognition_collection_id VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

event_members (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  user_id UUID REFERENCES users(id),
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

photos (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  uploader_id UUID REFERENCES users(id),
  s3_key VARCHAR NOT NULL,
  file_hash VARCHAR NOT NULL,      -- for duplicate detection
  processed BOOLEAN DEFAULT FALSE,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

photo_face_matches (
  id UUID PRIMARY KEY,
  photo_id UUID REFERENCES photos(id),
  user_id UUID REFERENCES users(id),
  confidence FLOAT NOT NULL,
  status VARCHAR DEFAULT 'pending',  -- pending | confirmed | rejected
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 4. Key API Endpoints

```
POST   /auth/signup                  { email, password, name, face_photo? }
POST   /auth/login

POST   /events                       { name, event_date, retention_days }
POST   /events/join                  { pin_code }
GET    /events/{id}/members
DELETE /events/{id}/members/{user_id}

POST   /events/{id}/photos           (multipart upload)
GET    /events/{id}/photos           (full gallery)
GET    /events/{id}/photos/mine      (auto-filtered for current user)

POST   /photo-matches/{id}/confirm
POST   /photo-matches/{id}/reject

DELETE /users/me/face-data           (full deletion request)
POST   /events/{id}/retention/extend
```

## 5. Core Workflows

### 5.1 Guest Signup + Face Registration
1. Guest submits email/password/name (+ optional face photo)
2. If face photo provided: backend uploads temp image to S3, calls Rekognition per-event `IndexFaces` **only after joining an event** (face is indexed into that event's Collection, not globally)
3. Temp image deleted immediately after embedding is generated
4. `face_registered = true`, `rekognition_face_id` stored

### 5.2 Photo Upload + Matching
1. Guest uploads photo → API stores to S3, writes `photos` row (`processed=false`), returns 202 immediately
2. Celery worker picks up job: checks `file_hash` for duplicates → skips if duplicate
3. Calls Rekognition `SearchFacesByImage` against the event's Collection
4. For each match ≥ threshold: creates `photo_face_matches` row (`status=pending` if confidence is borderline, `confirmed` if high-confidence)
5. Marks `photos.processed = true`
6. Pushes a WebSocket event to connected clients in that event ("new photo available")

### 5.3 Late Join Retroactive Scan
1. When a guest joins an event and registers their face, enqueue a job that runs `SearchFacesByImage` against all *already uploaded* photos in that event's Collection
2. Same matching/confidence logic as 5.2 applies

### 5.4 Retention Cleanup
1. Daily scheduled Celery Beat task queries events where `expires_at - now() <= 3 days` → sends warning notification to host
2. Daily task queries events where `expires_at <= now()` → deletes all S3 objects, deletes Rekognition Collection, cascades DB deletes

### 5.5 Data Deletion Request
1. User requests deletion → backend deletes their `rekognition_face_id` from every event Collection they're part of, deletes all `photo_face_matches` rows referencing them, deletes their face data
2. Their uploaded *photos* remain (they're event content, not personal data) unless they also request those removed

## 6. Security & Privacy Design

- **Signed URLs only**: all photo access goes through CloudFront signed URLs with short expiry — no public S3 bucket access
- **PIN protection**: rate-limited join attempts (e.g., 5 attempts/hour per IP) to prevent brute-forcing short PINs
- **Consent-first face storage**: face registration is opt-in per event registration flow; guests can use the platform without it
- **Data minimization**: raw face images are never persisted — only Rekognition's face vectors (which AWS stores, not raw images) are kept
- **Right to deletion**: implemented as a real pipeline (Section 5.5), not just a UI toggle

## 7. Scalability Considerations

- Upload endpoint is decoupled from processing (async queue) so upload latency stays low regardless of processing backlog
- Rekognition Collections are scoped per-event, keeping face search space small and fast even with many total platform users
- CloudFront caches frequently viewed gallery images, reducing S3 read load
- Horizontal scaling: FastAPI instances behind a load balancer; Celery workers scaled independently based on queue depth

## 8. Deployment Architecture

```
Docker Compose (local dev): FastAPI + PostgreSQL + Redis + Celery worker + Celery beat

Production (AWS):
  - ECS Fargate: API service + Celery worker service (separate task definitions)
  - RDS PostgreSQL (managed)
  - ElastiCache Redis (managed)
  - S3 + CloudFront
  - Rekognition (serverless, no infra to manage)
  - Application Load Balancer in front of ECS API service
```
