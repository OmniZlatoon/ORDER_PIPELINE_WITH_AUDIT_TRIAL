# Plain-Language Stakeholder Copy Update

This plan removes all technical infrastructure and engineering terms (such as database names, server frameworks, raw API paths, and internal code pattern names) from both the Customer Storefront and Administrator Console, replacing them with clear, stakeholder-friendly captions, status descriptions, and error messages.

## User Review & Critical Decisions

> [!IMPORTANT]
> Confirmed Direction: Based on your guidance, all headings, captions, loading states, and error messages across both the Customer Storefront and Administrator Console will use simple, stakeholder-friendly business language rather than developer terminology.

- **Confirmed Decision 1**: Use plain, stakeholder-friendly terminology on order status, processing steps, activity logs, and notification cards across both interfaces.
- **Confirmed Decision 2**: Keep all live server integration, order processing steps, and stock management behavior unchanged under the hood while updating only user-visible text.

---

## 1. Overview & Core Concept

- **What It Does**: Replaces every developer-oriented phrase (`MySQL`, `Java`, `Spring Boot`, `REST API`, `GET/POST/PUT/DELETE /api/...`, `endpoint`, `VITE_API_BASE_URL`, `AuditDecorator`, `ShippingObserver`, `EmailObserver`, `OrderCompleted`) with clear, everyday business copy that customers, store managers, and stakeholders can immediately understand.
- **Target Audience**: Everyday bookstore shoppers (Customer Storefront) and non-technical store managers or project stakeholders reviewing orders, step-by-step progress, activity records, notifications, and book stock (Administrator Console).
- **Key Value**: Makes demonstrations and daily operations intuitive and polished without exposing technical plumbing in the interface.

---

## 2. User Experience & Copy Strategy

### Key Copy Transformations

- **Storefront & Catalogue**:
  - Replace server/database references (`Live Spring Boot Catalogue`, `MySQL inventory`, `authoritative backend total`) with clear storefront messaging (`Online Book Catalogue`, `Browse available books and track your order every step of the way`, `Estimated total — final total is confirmed when your order is placed`).
- **Checkout & Order Submission**:
  - Replace pipeline/server wording with clear shopping language (`Confirm your selected books and contact details to place your order`).
- **Order Progress, Activity Log & Notifications**:
  - Present the six stages as **Order Progress** (`1. Validate Order`, `2. Check Inventory`, `3. Calculate Total`, `4. Process Payment`, `5. Confirm Order`, `6. Complete Order`) with plain explanations (`Waiting for earlier step`, `Skipped because an earlier step could not be completed`).
  - Present **Order Activity Log** instead of technical decorator descriptions (`Step-by-step record of every action taken on this order`).
  - Present **Delivery & Email Notifications** (`Shipping Notification` and `Email Notification`) with clear outcomes (`Shipping notification: created and queued once`, `Email notification: created and queued once`, or `Not sent — order did not complete`).
- **Administrator Dashboard & Book Stock Management**:
  - Replace raw HTTP/API notices (`GET /api/orders returned 404/405`, `POST /api/books`) with clear operational messages (`Full order list is currently unavailable — search by Order ID or Reference above`, `Unable to add book right now — please check that inventory updates are enabled`).
  - Keep read-only audit and notification tables clearly labeled for compliance and stakeholder review.
- **Loading & Error States**:
  - Replace messages like `Loading books from GET /api/books...` or `Confirm Spring Boot backend is running` with calm, clear messages (`Loading available books...`, `Unable to connect to the bookstore service right now. Please try again in a moment.`).

### Visual Identity & Theme

- Preserves the existing visual design, curved headers, rounded search inputs, card layouts, responsive desktop/mobile grids, and accessible color contrast across both interfaces.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Plain Language Across Both Customer & Admin UIs**
  - *Chosen Approach*: Remove technical jargon from both the Customer Storefront and Administrator Console rather than only from customer screens.
  - *Why*: Store administrators and university project stakeholders benefit from clear operational labels (`Shipping Notification`, `Order Activity Log`, `Book Stock Management`) without needing to decode code class names or HTTP verbs.
  - *Alternatives Considered*: Keeping raw REST endpoints in Admin error banners; passed over because it conflicts with making both UIs easy for stakeholders to understand.
- **Decision 2: Preserve Exact Data & Status Precision**
  - *Chosen Approach*: Keep status badges (`COMPLETED`, `FAILED`, `SUCCESS`, `STARTED`, `NOT EXECUTED`, `CREATED`, `SENT`) and exact timestamps/IDs clearly visible while simplifying surrounding captions.
  - *Why*: Preserves full demonstration fidelity for order success, payment failure, and insufficient stock scenarios while keeping surrounding explanations accessible.

---

## 4. Architecture & Messaging Flow

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    User-Visible Copy Layer (Plain English)              │
│                                                                         │
│   Customer Storefront                 Administrator Console             │
│   ├─ Book Catalogue & Cart            ├─ Operations Dashboard           │
│   ├─ Checkout & Order Placement       ├─ Book Stock Management          │
│   ├─ Order Progress & Notifications   ├─ Order Progress Monitor         │
│   └─ Order Lookup                     └─ Activity Log & Notifications   │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼ (Unchanged Live Data Layer)
┌─────────────────────────────────────────────────────────────────────────┐
│             Existing Service Clients & Error Normalization              │
│   Translates timeouts, network errors, and missing features into        │
│   clear, non-technical stakeholder messages without changing API calls  │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**: All existing hooks, cart state, form validation, and live server requests remain functionally identical; only display captions, loading labels, empty-state copy, footer text, and user-facing error messages are updated.
- **Interactive Mapping**: Every interactive control (catalogue search, view toggle, cart quantity steppers, order submission, order lookup, stock add/update/delete, and log filters) retains its exact behavior while reporting clear plain-English status feedback.
