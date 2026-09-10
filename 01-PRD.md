# Product Requirements Document (PRD)
## EventSnap — Event Photo Sharing with Automatic Face-Based Delivery

**Version:** 1.0
**Owner:** Aditi Trivedi
**Status:** Draft — Ready for Development

---

## 1. Problem Statement

At events (weddings, birthdays, college fests, corporate meetups), photos are scattered across dozens of guests' phones. There's no easy way for a guest to collect *only the photos they're in*, and hosts have no central, time-bound place to gather event photos without permanently hosting them on a cloud drive.

## 2. Product Vision

A platform where a host creates an event, guests join with a shared PIN, everyone uploads photos, and the platform automatically figures out who's in each photo — so every guest can instantly see and download "photos of me" without scrolling through hundreds of images. Photos auto-expire after a host-defined retention period.

## 3. Target Users

| User type | Description |
|---|---|
| **Host** | Creates and manages an event, controls retention, invites guests via PIN |
| **Guest** | Registers (including a face photo), joins an event via PIN, uploads/views photos |

## 4. Goals & Success Metrics

| Goal | Metric |
|---|---|
| Guests find their own photos with no manual searching | % of uploaded photos correctly auto-tagged (target: >90% precision) |
| Platform is usable at real event scale | Handles 500+ photo uploads per event without failure |
| Data isn't retained beyond its purpose | 100% of photos + face data purged after retention period |
| Product is demo-able / portfolio-ready | Publicly deployed, documented, videoed |

## 5. User Stories

1. As a **host**, I can sign up and create an event with a name, date, and retention period, and receive a unique PIN to share.
2. As a **host**, I can see all guests who joined and revoke a guest's access if needed.
3. As a **guest**, I can sign up by providing my email, password, and a face photo.
4. As a **guest**, I can join an event using a PIN.
5. As a **guest**, I can opt out of face registration and still browse the full event gallery manually.
6. As a **guest**, I can upload photos taken at the event.
7. As a **guest**, I can view a "My Photos" tab showing only photos the platform detected me in.
8. As a **guest**, if a match is uncertain, I can confirm or reject it.
9. As a **guest who joined late**, previously uploaded photos are automatically re-scanned for my face.
10. As a **host**, I receive a warning before photos are auto-deleted, with an option to extend retention.
11. As a **guest**, I can request full deletion of my face data and matched-photo associations at any time.
12. As any user, I only see photos for events I've explicitly joined (no public/guessable access).

## 6. Functional Requirements

- Authentication (signup/login, JWT-based sessions)
- Event creation, PIN generation, PIN-based join flow
- Photo upload to durable object storage
- Asynchronous face detection + matching pipeline
- Per-guest filtered photo view
- Retention configuration + scheduled deletion job with pre-deletion warning
- Consent management and full data-deletion flow
- Manual confirm/reject UI for low-confidence face matches
- Retroactive scan on late join

## 7. Non-Functional Requirements

- **Security:** signed, time-limited URLs for photo access; rate-limited PIN entry; passwords hashed (bcrypt/argon2)
- **Privacy:** raw face images deleted after embedding is generated; explicit consent captured at signup; deletion requests honored within 24 hours
- **Performance:** photo upload response < 1s (processing happens async); face-match pipeline processes a batch of 500 photos within a few minutes
- **Reliability:** duplicate uploads (same photo) detected via hashing and not double-processed
- **Availability:** deployed on managed cloud infrastructure with basic monitoring/logging

## 8. Out of Scope (v1)

- Native mobile apps (web-responsive only)
- Video support (photos only)
- Payment/monetization features
- Multi-language support

## 9. Assumptions & Constraints

- Face recognition accuracy depends on third-party service (AWS Rekognition) — not building a custom ML model
- Solo developer project — timeline assumes incremental delivery, not a full team's velocity
- AWS free-tier/low-cost usage assumed for cost control during development

## 10. Milestones (High Level)

| Phase | Deliverable |
|---|---|
| M1 | Auth + event creation + PIN join flow working end-to-end |
| M2 | Photo upload + gallery (no face matching yet) |
| M3 | Face indexing + matching pipeline integrated |
| M4 | Retention system + privacy/consent + deletion flow |
| M5 | Real-time gallery updates + confidence-confirmation UI |
| M6 | Deployment, documentation, demo video |
