# Feature Specification Document
## EventSnap — Event Photo Sharing Platform

Each feature includes scope and acceptance criteria so it can be built and tested independently.

---

## F1. Authentication

**Scope:** Email/password signup and login, JWT session issuance.

**Acceptance Criteria:**
- User can sign up with email, password, name
- Duplicate email is rejected with a clear error
- Password is hashed (bcrypt/argon2) before storage — never stored plain
- Login returns a JWT valid for a defined session length
- Invalid credentials return a generic error (no "email exists" leakage)

---

## F2. Face Registration (Opt-In)

**Scope:** Guests may optionally provide a face photo during event join, used only for that event's matching.

**Acceptance Criteria:**
- Face photo upload is optional — user can skip and still join events
- On submission, image is sent to Rekognition `IndexFaces` for the specific event's Collection
- Raw uploaded image is deleted from temp storage immediately after indexing
- User's `face_registered` flag updates to true per event

---

## F3. Event Creation

**Scope:** Host creates an event with a name, date, and retention period.

**Acceptance Criteria:**
- Host must be authenticated
- Retention period must be a positive integer (days), with a sane max (e.g., 180 days)
- System generates a unique, hard-to-guess PIN (e.g., 8 alphanumeric characters)
- A dedicated Rekognition Collection is created per event at creation time
- `expires_at` is computed and stored at creation

---

## F4. PIN-Based Join

**Scope:** Guest enters a PIN to join an event.

**Acceptance Criteria:**
- PIN entry is rate-limited (e.g., 5 attempts/hour per account/IP)
- Valid PIN adds user to `event_members`
- Invalid PIN returns a generic "invalid code" error (no hints)
- If user has not registered a face yet, they're prompted (optionally) during join

---

## F5. Photo Upload

**Scope:** Any event member can upload photos to the event gallery.

**Acceptance Criteria:**
- Accepts standard image formats (JPEG, PNG); rejects others with a clear error
- File size capped (e.g., 15MB) with clear error on exceeding
- Upload returns immediately (202 Accepted) — processing happens async
- Duplicate photo (same content hash) is detected and not reprocessed
- Uploaded photo appears in the full gallery immediately (matching happens in background)

---

## F6. Face Matching Pipeline

**Scope:** Background job matches uploaded photos against registered guest faces for that event.

**Acceptance Criteria:**
- Runs asynchronously — does not block upload response
- Uses the event-specific Rekognition Collection only (no cross-event matching)
- Matches ≥ high-confidence threshold are auto-confirmed
- Matches in a borderline range are marked `pending` for user confirmation
- Matches below a minimum threshold are discarded
- Handles multiple faces in a single photo — creates a match row per detected/matched face

---

## F7. "My Photos" View

**Scope:** Guest sees only photos they're matched in.

**Acceptance Criteria:**
- Filters photos where a `confirmed` match exists for the current user
- Pending matches shown in a separate "confirm these?" section
- Guest can download their matched photos individually or as a batch (zip)

---

## F8. Match Confirmation UI

**Scope:** For borderline-confidence matches, guest confirms or rejects.

**Acceptance Criteria:**
- Guest sees the photo with a prompt "Is this you?"
- Confirm → match status becomes `confirmed`, photo appears in "My Photos"
- Reject → match status becomes `rejected`, photo does not appear
- Rejected matches are excluded from future re-processing for that photo/user pair

---

## F9. Retroactive Scan on Late Join

**Scope:** When a guest joins/registers face after photos already exist, scan existing photos.

**Acceptance Criteria:**
- Triggered automatically on face registration completion (if event already has photos)
- Runs as a background job, does not block the join flow
- Creates match rows for any hits, following the same confidence rules as F6

---

## F10. Retention & Deletion

**Scope:** Host-configured auto-deletion of event photos.

**Acceptance Criteria:**
- Daily scheduled job flags events expiring within 3 days → notifies host (email/in-app)
- Host can extend retention before expiry (up to the max cap)
- On expiry: all S3 objects for the event are deleted, the Rekognition Collection is deleted, and DB rows (`photos`, `photo_face_matches`) are cascade-deleted
- Event record itself is retained (marked archived) for host's historical reference, without photo data

---

## F11. User Data Deletion Request

**Scope:** Guest can request removal of their face data at any time, independent of event expiry.

**Acceptance Criteria:**
- Request deletes the user's face from every event Collection they're indexed in
- Deletes all `photo_face_matches` rows referencing the user
- Completed within 24 hours (can be synchronous for a v1 given expected scale)
- User is notified on completion

---

## F12. Real-Time Gallery Updates

**Scope:** Connected guests see new photos appear without refreshing.

**Acceptance Criteria:**
- WebSocket connection established per event room on gallery view
- New photo upload broadcasts an event to all connected clients in that event
- Gracefully degrades to manual refresh if WebSocket connection fails

---

## F13. Access Control / Signed URLs

**Scope:** Photos are never publicly accessible by guessing a URL.

**Acceptance Criteria:**
- All photo URLs served to the frontend are CloudFront signed URLs with short expiry (e.g., 15 min)
- Direct S3 bucket access is blocked (private bucket, CloudFront-only access)
- A user not in `event_members` for an event cannot retrieve any signed URLs for it (API-level check)
