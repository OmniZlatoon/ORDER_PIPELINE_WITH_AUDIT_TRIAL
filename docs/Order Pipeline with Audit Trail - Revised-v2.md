**ORDER PIPELINE
WITH AUDIT TRAIL**

**A Web\-Based Online Bookstore Order Processing System**

**PROJECT DESIGN & IMPLEMENTATION DOCUMENT  \|  THREE\-DAY CORE BUILD**

# **PROJECT TITLE**

Design and Implementation of a Web\-Based Online Bookstore with an Auditable Order Processing Pipeline Using Template Method, Decorator and Observer Design Patterns\.

# **PROBLEM STATEMENT**

An online bookstore must process every customer order through a dependable sequence of business operations\. These operations include validating the order, checking stock availability, calculating the correct amount, processing payment, confirming the order and completing the transaction\. When the sequence is not controlled centrally, individual operations may be executed in the wrong order or skipped\. This can lead to incorrect order states, inaccurate stock handling and uncertainty about the point at which a transaction failed\.

The bookstore also needs a reliable processing history\. Without an audit trail, an administrator may know that an order failed but may not know which stage failed, when it failed or what had already been completed\. In addition, services such as shipping and customer email need to react to successful order completion without being tightly coupled to the core order\-processing class\.

# **PROPOSED SOLUTION**

Develop a focused web\-based bookstore using React for the frontend, Java Spring Boot for the backend and MySQL for persistent storage\. The backend will execute each order through a fixed six\-stage pipeline using the Template Method pattern\. The Decorator pattern will wrap each processing operation and record its STARTED, SUCCESS or FAILED outcome in MySQL\. The Observer pattern will notify two independent components—ShippingObserver and EmailObserver—when an order has completed successfully\.

The React application will allow a customer to select books and submit an order\. It will also provide an Order Processing Monitor that displays the status and timestamps of the six stages, the audit history and the outcomes of the shipping and email observers\. For the three\-day build, payment, shipping and email delivery will be simulated\. The central deliverable is a working, testable order pipeline rather than a production\-scale e\-commerce platform\.

# **10\-POINT PROJECT AGENDA**

The agenda is arranged in implementation order\. The sections below explain the required modules in detail so the team can understand what each component must do and how the components work together\.

1. Project Scope and Core Objective
1. Functional Requirements and Success Criteria
1. System Architecture and Recommended Technology Stack
1. MySQL Database Schema and Key Fields
1. The Three Required Design Patterns
1. End\-to\-End Order Processing Workflow
1. React Frontend: Minimum Screens and Backend API
1. Order Processing Monitor — Key Demonstration Feature
1. Testing Strategy and Expected Project Output
1. Evaluator Presentation and Final System Analyst Recommendations

# **1\. PROJECT SCOPE AND CORE OBJECTIVE**

The application is a compact online bookstore used to demonstrate a reliable and observable order\-processing workflow\. A customer views a small catalogue, selects one or more books, specifies quantities and submits an order\. The Spring Boot backend receives the request, creates the order and executes the six processing stages in a predefined sequence\. Each stage is audited, and successful completion triggers the shipping and email observers\.

## **Core objective**

Demonstrate how Template Method, Decorator and Observer can cooperate in a full\-stack application: Template Method controls the order of operations, Decorator records what happens during each operation, and Observer notifies dependent components after successful completion\.

## **What the three\-day version must include**

- A small book catalogue loaded from MySQL, with each book showing its title, author, price and available stock\.
- A simple order form that captures the customer's name and email address, selected books and quantities\.
- Backend validation of customer details, selected items and quantities before processing continues\.
- An order pipeline containing exactly six named stages, executed in the required order\.
- Persistent storage of the customer, order, order items, audit events and notification outcomes\.
- A React result page that shows whether the order succeeded or failed and provides access to its processing timeline\.
- Two observer components: one representing shipping notification and one representing email notification\.

Do not add real card payments, courier API integration, a complete customer account system, advanced stock reservation, analytics or a complex administration portal to the three\-day version\. These features are not needed to prove the required design patterns and would distract the team from the central pipeline\.

# **2\. FUNCTIONAL REQUIREMENTS AND SUCCESS CRITERIA**

Functional requirements describe what the application must do\. Acceptance evidence describes what the team should be able to demonstrate to prove that each requirement works\.

| **ID** | **Functional requirement** | **Acceptance evidence** |
| --- | --- | --- |
| **FR\-01** | A customer can view available books and submit an order\. | The catalogue is returned from MySQL and a submitted order with its items is saved\. |
| **FR\-02** | The backend executes the six order stages in the defined sequence\. | The monitor and audit history show the six stages in the correct order\. |
| **FR\-03** | Every executed stage is recorded by the audit decorator\. | MySQL contains audit records with order ID, step name, execution status, message and timestamp\. |
| **FR\-04** | A successfully completed order notifies shipping and email observers\. | Exactly one shipping outcome and one email outcome are recorded for the completion event\. |
| **FR\-05** | A user or administrator can inspect an order result and its audit timeline\. | The React monitor displays the order status, stages, timestamps and observer outcomes\. |
| **FR\-06** | A failed stage stops later stages and is recorded\. | The failed stage has a FAILED audit event; later stages and completion observers are not executed\. |

## **Definition of a successful demonstration**

For one successful test order, all six stages must complete in sequence, audit information must be persisted, and each observer must be invoked once\. For a failure test, the pipeline must stop at the failing stage, the failure must remain visible in the audit trail, and neither completion observer may be triggered\.

# **3\. SYSTEM ARCHITECTURE AND RECOMMENDED TECHNOLOGY STACK**

Use a three\-tier architecture\. Each tier has a distinct responsibility, and communication must pass through the backend API\. The React frontend must never connect directly to MySQL\.

| **Layer** | **Technology** | **Detailed responsibility** |
| --- | --- | --- |
| **Frontend** | React, JavaScript, CSS | Displays the book catalogue, captures customer/order information, submits requests to the API and presents the order result and processing monitor\. |
| **Backend** | Java, Spring Boot | Exposes REST endpoints, validates requests, coordinates the order pipeline, implements the three patterns and applies business rules\. |
| **Database** | MySQL | Stores customers, books, orders, order items, audit logs and notification outcomes with relational constraints\. |
| **Persistence** | Spring Data JPA / Hibernate | Maps Java entities to MySQL tables and provides repository operations for creating, retrieving and updating records\. |
| **Testing** | JUnit 5, Mockito, Spring Boot Test | Tests individual processing steps, verifies observer invocation counts and checks integration with persistence\. |
| **API verification** | Postman | Allows the team to submit requests and inspect API responses independently of the React interface\. |
| **Version control** | Git and GitHub | Stores the shared codebase and supports collaboration, change tracking and integration\. |

## **High\-level architecture**

| **CUSTOMER / ADMIN**<br>**       \|**<br>**       v**<br>**REACT FRONTEND**<br>(Book Catalogue, Order Form, Processing Monitor)<br>**       \|**<br>\| HTTP / JSON through REST API<br>**       v**<br>**JAVA SPRING BOOT BACKEND**<br>Controllers and Request/Response DTOs<br>**       \|**<br>Order Service<br>**       \|**<br>Template Method \- fixed six\-stage pipeline<br>**       \|**<br>Decorator \- audit each executed stage<br>**       \|**<br>Observer \- publish completion notifications<br>**       \|**<br>Spring Data JPA Repositories<br>**       \|**<br>**       v**<br>**MYSQL DATABASE**<br>Customers \| Books \| Orders \| Order Items<br>Audit Logs \| Notifications |
| --- |

## **Recommended backend organization**

Keep controllers thin\. A controller should receive an HTTP request, validate its basic shape, call the appropriate service and return a response\. It should not contain the six\-stage business workflow\.

- controller: REST controllers such as BookController and OrderController\.
- dto: request and response objects, such as CreateOrderRequest and OrderResponse\.
- entity: JPA entities representing Customer, Book, Order, OrderItem, AuditLog and Notification\.
- repository: Spring Data JPA interfaces for database access\.
- service: order orchestration, inventory checks, total calculation, payment simulation and audit persistence\.
- pattern\.template: the base order\-processing template and its concrete bookstore implementation\.
- pattern\.decorator: the OrderStep abstraction and AuditDecorator\.
- pattern\.observer: the completion event, publisher and observer/listener implementations\.

A single Spring Boot application is sufficient for this project\. Microservices, distributed message brokers and separate deployment environments are unnecessary for the three\-day core build\.

# **4\. MYSQL DATABASE SCHEMA AND KEY FIELDS**

The database must preserve the information needed to reconstruct an order and explain how it was processed\. Use MySQL with the InnoDB storage engine, primary keys, foreign keys, NOT NULL constraints where appropriate and timestamps\. Use DECIMAL for monetary values rather than FLOAT or DOUBLE\.

## **4\.1 Customers table**

Purpose: stores the basic identity details supplied by the customer placing an order\. A customer can place multiple orders\. A full login or password\-management module is not required for this short build\.

| **Field** | **Suggested type** | **Rules / explanation** |
| --- | --- | --- |
| **customer\_id** | BIGINT | Primary key; auto\-increment identifier\. |
| **full\_name** | VARCHAR(120) | NOT NULL; customer's display name\. |
| **email** | VARCHAR(190) | NOT NULL; customer's email address\. Consider a unique constraint only if the implementation treats each email as one customer\. |
| **created\_at** | DATETIME | NOT NULL; timestamp when the customer record was created\. |

## **4\.2 Books table**

Purpose: stores the catalogue and the current stock level\. The backend must retrieve the authoritative price and stock quantity from this table rather than trusting values submitted by the browser\.

| **Field** | **Suggested type** | **Rules / explanation** |
| --- | --- | --- |
| **book\_id** | BIGINT | Primary key; auto\-increment identifier\. |
| **title** | VARCHAR(200) | NOT NULL; title of the book\. |
| **author** | VARCHAR(150) | NOT NULL; author or credited creator\. |
| **price** | DECIMAL(10,2) | NOT NULL; current catalogue price\. |
| **stock\_quantity** | INT | NOT NULL; quantity currently available\. Must not be negative\. |
| **created\_at** | DATETIME | NOT NULL; timestamp when the catalogue record was created\. |

## **4\.3 Orders table**

Purpose: stores the overall order record\. It links the order to the customer and records the total amount and current order/payment states\.

| **Field** | **Suggested type** | **Rules / explanation** |
| --- | --- | --- |
| **order\_id** | BIGINT | Primary key; auto\-increment identifier\. |
| **order\_reference** | VARCHAR(40) | NOT NULL and UNIQUE; human\-readable reference shown in the interface\. |
| **customer\_id** | BIGINT | Foreign key referencing customers\.customer\_id; NOT NULL\. |
| **total\_amount** | DECIMAL(10,2) | NOT NULL; total calculated by the backend using database prices\. |
| **order\_status** | VARCHAR(30) | NOT NULL; for example PENDING, PROCESSING, COMPLETED or FAILED\. |
| **payment\_status** | VARCHAR(30) | NOT NULL; for example NOT\_PROCESSED, SUCCESS or FAILED\. |
| **created\_at** | DATETIME | NOT NULL; timestamp when the order was created\. |
| **completed\_at** | DATETIME | Nullable; populated only after successful completion\. |

## **4\.4 Order\_items table**

Purpose: stores the individual books and quantities that belong to an order\. An order can contain many order items\. Each row connects one order to one book\.

| **Field** | **Suggested type** | **Rules / explanation** |
| --- | --- | --- |
| **order\_item\_id** | BIGINT | Primary key; auto\-increment identifier\. |
| **order\_id** | BIGINT | Foreign key referencing orders\.order\_id; NOT NULL\. |
| **book\_id** | BIGINT | Foreign key referencing books\.book\_id; NOT NULL\. |
| **quantity** | INT | NOT NULL; number of copies requested; must be greater than zero\. |
| **unit\_price** | DECIMAL(10,2) | NOT NULL; copy of the book price at the time the order is placed\. |
| **line\_total** | DECIMAL(10,2) | NOT NULL; quantity multiplied by unit\_price\. |

Important: save the unit\_price in the order\_items row when the order is placed\. Do not calculate an old order using the current books\.price value because the catalogue price may change later\.

## **4\.5 Audit\_logs table**

Purpose: stores the execution history of the order pipeline\. This is the database foundation of the audit trail and the main data source for the Order Processing Monitor\.

| **Field** | **Suggested type** | **Rules / explanation** |
| --- | --- | --- |
| **audit\_id** | BIGINT | Primary key; auto\-increment identifier\. |
| **order\_id** | BIGINT | Foreign key referencing orders\.order\_id; identifies the order being audited\. |
| **step\_name** | VARCHAR(80) | NOT NULL; one of the six pipeline stage names\. |
| **execution\_status** | VARCHAR(20) | NOT NULL; STARTED, SUCCESS or FAILED\. |
| **message** | TEXT | Optional explanatory detail, such as 'Stock check passed' or a safe failure explanation\. |
| **created\_at** | DATETIME | NOT NULL; timestamp when the audit event was recorded\. |

For every executed step, the decorator should record STARTED before calling the operation\. If the operation returns normally, it should record SUCCESS\. If the operation throws an exception, it should record FAILED and rethrow the exception\. This gives the system a clear record of both successful and unsuccessful execution\.

## **4\.6 Notifications table**

Purpose: stores the outcome of each observer action\. It allows the monitor and evaluator to verify that shipping and email listeners were triggered\.

| **Field** | **Suggested type** | **Rules / explanation** |
| --- | --- | --- |
| **notification\_id** | BIGINT | Primary key; auto\-increment identifier\. |
| **order\_id** | BIGINT | Foreign key referencing orders\.order\_id\. |
| **notification\_type** | VARCHAR(20) | NOT NULL; SHIPPING or EMAIL\. |
| **status** | VARCHAR(20) | NOT NULL; for example CREATED, SENT or FAILED\. Use a consistent set of values\. |
| **message** | TEXT | Description of the simulated notification or delivery result\. |
| **attempts** | INT | NOT NULL; number of attempts made\. Start with 1 for the simple implementation\. |
| **created\_at** | DATETIME | NOT NULL; timestamp when the notification record was created\. |
| **sent\_at** | DATETIME | Nullable; populated when the notification is considered successfully sent\. |

## **4\.7 Table relationships**

| **Relationship** | **Meaning** |
| --- | --- |
| **customers 1 — many orders** | One customer may place multiple orders; each order belongs to one customer\. |
| **orders 1 — many order\_items** | One order contains one or more line items\. |
| **books 1 — many order\_items** | A book may appear in many different orders\. |
| **orders 1 — many audit\_logs** | One order accumulates multiple audit events as its stages execute\. |
| **orders 1 — many notifications** | One order may have multiple notification records, including shipping and email outcomes\. |

## **4\.8 Database implementation rules**

- Use foreign keys to prevent order items, audit events or notifications from referring to nonexistent parent records\.
- Index orders\.order\_reference, audit\_logs\.order\_id and notifications\.order\_id because these fields are used frequently when retrieving an order and its history\.
- Use DECIMAL(10,2) for all monetary amounts and calculate totals on the backend\.
- Do not store raw card details or passwords\. Real payment processing and full authentication are outside this build\.
- Treat audit history as append\-only in the application\. Do not provide ordinary edit or delete operations for audit records\.
- Ensure audit failure records are not accidentally lost when the main order transaction rolls back\. For the short build, use a deliberate separate audit transaction or another clearly tested persistence approach\.

# **5\. THE THREE REQUIRED DESIGN PATTERNS**

These three patterns are the core academic and engineering contribution of the project\. They solve three different problems and should not be treated as interchangeable: Template Method controls the order of processing, Decorator adds audit behaviour around each operation, and Observer communicates successful completion to independent subscribers\.

## **5\.1 Template Method — controls the fixed order sequence**

The Template Method pattern defines the skeleton of an algorithm in a base class while allowing concrete subclasses to provide the implementation of individual steps\. In this project, the complete order\-processing algorithm is defined once in a base class called OrderProcessingTemplate\. Its processOrder() method calls the six stages in a fixed sequence\.

The processOrder() method should be declared final in Java\. This prevents a subclass from overriding the method and changing the sequence\. The concrete bookstore processor implements the individual operations, but it does not decide their order\.

| **public** **abstract** **class** **OrderProcessingTemplate** \{<br>**public** **final** **void** processOrder(**Order** order) \{<br>validateOrder(order);<br>checkInventory(order);<br>calculateTotal(order);<br>processPayment(order);<br>confirmOrder(order);<br>completeOrder(order);<br>\}<br>**protected** **abstract** **void** validateOrder(**Order** order);<br>**protected** **abstract** **void** checkInventory(**Order** order);<br>**protected** **abstract** **void** calculateTotal(**Order** order);<br>**protected** **abstract** **void** processPayment(**Order** order);<br>**protected** **abstract** **void** confirmOrder(**Order** order);<br>**protected** **abstract** **void** completeOrder(**Order** order);<br>\} |
| --- |

### **How it works in this project**

- processOrder() is the single entry point for executing the complete order workflow\.
- validateOrder() checks that the customer information and order items are valid\.
- checkInventory() verifies that enough copies of every requested book are available\.
- calculateTotal() calculates line totals and the complete order total using prices retrieved from MySQL\.
- processPayment() runs the simulated payment operation and reports success or failure\.
- confirmOrder() changes the order to a confirmed state after payment succeeds\.
- completeOrder() marks the order as completed and prepares the successful\-completion event\.

If any stage throws a processing exception, Java stops executing the remaining statements in processOrder()\. This means later stages are not called\. The exception should be handled at the service/API boundary so the application can return a meaningful failure response while preserving the audit record\.

### **Why Template Method is appropriate**

The order must follow the same business sequence every time\. Placing the sequence in one final template method prevents accidental reordering in different implementations and makes the workflow easy to test\. The concrete class focuses on how each stage works, while the base class guarantees when each stage runs\.

## **5\.2 Decorator — adds audit logging around each step**

The Decorator pattern attaches additional behaviour to an object without changing the object's original implementation\. In this project, each pipeline operation is represented through a common OrderStep interface\. The actual operation performs its business task\. An AuditDecorator wraps that operation and adds the responsibility of recording its execution in MySQL\.

The decorator must surround the real operation rather than replace it\. Before the wrapped operation begins, it records STARTED\. If the operation completes normally, it records SUCCESS\. If the operation throws an exception, the decorator records FAILED and then rethrows the same exception so the Template Method pipeline stops\.

| **public** **interface** **OrderStep** \{<br>**void** execute(**Order** order);<br>\}<br>**public** **class** **AuditDecorator** **implements** **OrderStep** \{<br>**private** **final** **OrderStep** wrapped;<br>**private** **final** **AuditService** auditService;<br>**public** **AuditDecorator**(<br>**OrderStep** wrapped,<br>**AuditService** auditService) \{<br>this\.wrapped = wrapped;<br>this\.auditService = auditService;<br>\}<br>**@Override**<br>**public** **void** execute(**Order** order) \{<br>auditService\.record(order, "STARTED");<br>**try** \{<br>wrapped\.execute(order);<br>auditService\.record(order, "SUCCESS");<br>\} **catch** (**RuntimeException** ex) \{<br>auditService\.record(order, "FAILED");<br>**throw** ex;<br>\}<br>\}<br>\} |
| --- |

### **How it works in this project**

- Each business operation is made available through the common OrderStep abstraction\.
- The AuditDecorator receives the real operation and an AuditService responsible for persisting audit records\.
- When execute(order) is called, the decorator first writes a STARTED audit event with the order ID and stage name\.
- The decorator then calls wrapped\.execute(order), which performs the actual business operation\.
- If the operation succeeds, the decorator writes a SUCCESS event\.
- If the operation fails, the decorator writes a FAILED event and rethrows the exception\. The pipeline therefore knows that it must stop\.
- The six operations must be decorated individually so every stage has an audit trail\.

Persist the audit events in MySQL\. Printing messages to the console is useful during development but does not satisfy the requirement for a persistent audit trail\. Each record should identify the order, the stage, the execution status, a useful message and the time of the event\.

### **Why Decorator is appropriate**

Audit logging is additional behaviour that should apply consistently to every stage\. Without the decorator, the team might copy audit\-writing code into all six business methods, making the code repetitive and easy to implement inconsistently\. The decorator centralizes this behaviour while leaving each operation focused on its business responsibility\.

## **5\.3 Observer — notifies shipping and email components**

The Observer pattern defines a one\-to\-many relationship between an event publisher and its subscribers\. When the publisher announces an event, registered observers receive it and perform their own actions\. The publisher does not need to know the internal details of each observer\.

In this project, the event is OrderCompleted\. The two observers are ShippingObserver and EmailObserver\. The order\-processing service publishes the completion event only after the order has completed successfully and the database transaction has committed\. The observers then create their respective notification records\.

| **public** **interface** **OrderObserver** \{<br>**void** onOrderCompleted(**Order** order);<br>\}<br>*// Registered observers:*<br>*// 1\. ShippingObserver*<br>*// 2\. EmailObserver*<br>*// After successful order commit:*<br>publisher\.notifyObservers(order); |
| --- |

### **How it works in this project**

- ShippingObserver listens for OrderCompleted and creates a SHIPPING notification record for the order\.
- EmailObserver listens for OrderCompleted and creates an EMAIL notification record for the order\.
- The two observers are independent subscribers\. The order processor does not contain shipping\-specific or email\-specific implementation details\.
- The notification records are stored in MySQL so the React monitor can show what happened\.
- For the three\-day build, these actions are simulated\. The shipping observer can record that a shipment request was created, while the email observer can record that a confirmation email was prepared or sent\.
- The event must not be published if validation, inventory checking or payment fails\.
- Each observer should be invoked once for a successful completion event\. Add a simple idempotency check or unique constraint if needed to prevent duplicate notification records\.

In Spring Boot, the observers can be implemented as event listeners\. A transaction\-aware listener such as one configured to run after commit is suitable for ensuring that notifications are not triggered for an order transaction that later rolls back\.

### **Why Observer is appropriate**

Shipping and email are separate activities that depend on successful order completion\. The Observer pattern allows the application to add or change subscribers without placing their implementation inside the order\-processing algorithm\. This reduces coupling and makes it easier to test each notification component independently\.

# **6\. END\-TO\-END ORDER PROCESSING WORKFLOW**

The complete workflow begins when the customer submits the order form in React\. The frontend sends the selected book IDs, quantities and customer details to Spring Boot\. The backend retrieves authoritative prices and stock information from MySQL, creates the order and executes the Template Method pipeline\. Each stage is wrapped by the audit decorator\.

## **The six stages in execution order**

| **Sequence** | **Pipeline stage** | **What the stage must do** | **Expected result** |
| --- | --- | --- | --- |
| **1** | Validate Order | Check that the customer name and email are present and valid; ensure the order contains at least one item; verify every quantity is a positive integer\. | The order request is accepted for processing or rejected before later stages run\. |
| **2** | Check Inventory | Retrieve the requested books and compare each requested quantity with the available stock in MySQL\. | Processing continues only if every requested quantity is available\. |
| **3** | Calculate Total | Use the database price for each book; calculate quantity × unit price for each line; add line totals to obtain the order total\. | The order and its items contain accurate backend\-calculated monetary values\. |
| **4** | Process Payment | Run a simulated payment operation\. The simulation should support both success and failure so the team can demonstrate both paths\. | Payment status becomes SUCCESS or FAILED\. A failed payment stops the pipeline\. |
| **5** | Confirm Order | After payment succeeds, update the order to a confirmed state and persist the relevant status\. | The order is confirmed and ready for completion\. |
| **6** | Complete Order | Mark the order as COMPLETED, set completed\_at and prepare the OrderCompleted event for publication after commit\. | The order is complete; after the transaction commits, the observers can be notified\. |

## **Successful processing path**

| **Customer submits order in React**<br>**          \|**<br>**          v**<br>**Spring Boot receives request**<br>**          \|**<br>**          v**<br>**Create order and order items**<br>**          \|**<br>**          v**<br>**Template Method starts**<br>**          \|**<br>**          v**<br>1\. Validate Order<br>2\. Check Inventory<br>3\. Calculate Total<br>4\. Process Payment<br>5\. Confirm Order<br>6\. Complete Order<br>**          \|**<br>**          v**<br>**Decorator records each stage in MySQL**<br>**          \|**<br>**          v**<br>**Order transaction commits successfully**<br>**          \|**<br>**          v**<br>**OrderCompleted event is published**<br>**          \|**<br>**          \+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\+**<br>**          \|                           \|**<br>**          v                           v**<br>**ShippingObserver                EmailObserver**<br>creates SHIPPING                creates EMAIL<br>notification                    notification<br>**          \|                           \|**<br>**          \+\-\-\-\-\-\-\-\-\-\-\-\-\-\+\-\-\-\-\-\-\-\-\-\-\-\-\-\+**<br>**                        \|**<br>**                        v**<br>**React displays completed order,**<br>audit timeline and observer outcomes |
| --- |

## **Failure processing path**

If a stage fails, the pipeline must stop immediately\. For example, if the payment simulation fails, the AuditDecorator records FAILED for Process Payment and rethrows the exception\. The Template Method does not proceed to Confirm Order or Complete Order\. The order is stored or updated with an appropriate failed/payment\-failed state\. The OrderCompleted event is not published, so neither ShippingObserver nor EmailObserver is triggered\.

The same principle applies to earlier failures\. If validation fails, inventory checking and every later stage must not run\. If inventory checking fails, total calculation, payment, confirmation and completion must not run\. The audit history should show the stage that failed and the preceding successful stages\.

Important transaction detail: if the main order transaction is rolled back, an audit record written inside that same transaction may also be rolled back\. The implementation must deliberately preserve the failure audit record—for example, by writing it through a separate transaction—or document and test another appropriate persistence strategy\.

# **7\. REACT FRONTEND: MINIMUM SCREENS AND BACKEND API**

Keep the frontend deliberately small\. Two views are sufficient to demonstrate the complete user journey and the central engineering contribution\.

## **7\.1 Book and Order page**

- Load and display the seeded books from GET /api/books\.
- Show each book's title, author, price and available stock\.
- Allow the customer to select one or more books and enter a quantity for each selected book\.
- Collect the customer's full name and email address\.
- Submit the order to the backend using POST /api/orders\.
- Display validation or processing errors returned by the backend\.

## **7\.2 Order Result / Processing Monitor page**

- Display the order reference and final order status\.
- Display the six processing stages in their defined sequence\.
- Show each stage's execution state and timestamp using data retrieved from the backend\.
- Show the audit events associated with the order\.
- Show whether the shipping and email observers were triggered and whether their notification records were created\.
- Clearly distinguish stages that succeeded, the stage that failed and stages that were not executed\.

## **7\.3 Suggested REST API**

| **Method** | **Endpoint** | **Purpose and expected behaviour** |
| --- | --- | --- |
| **GET** | /api/books | Returns the available book catalogue, including title, author, current price and stock quantity\. |
| **POST** | /api/orders | Accepts customer details and selected book IDs/quantities; creates and processes the order; returns the order reference, status and relevant result information\. |
| **GET** | /api/orders/\{orderId\} | Returns the order summary, customer/order reference, total amount, order status and payment status\. |
| **GET** | /api/orders/\{orderId\}/audit | Returns the audit events for the order in chronological order\. |
| **GET** | /api/orders/\{orderId\}/notifications | Returns the shipping and email notification outcomes for the order\. |

The backend must calculate prices and totals\. The frontend may display catalogue prices for the customer's information, but the backend must not trust a client\-submitted total or unit price\. It must retrieve the current book prices from MySQL and calculate the amount itself\.

## **Example order request**

| \{<br>**"customer"**: \{<br>**"fullName"**: "Alex Example",<br>**"email"**: "alex@example\.com"<br>\},<br>**"items"**: \[<br>\{<br>**"bookId"**: **1**,<br>**"quantity"**: **2**<br>\},<br>\{<br>**"bookId"**: **3**,<br>**"quantity"**: **1**<br>\}<br>\]<br>\} |
| --- |

## **Example order response**

| \{<br>**"orderId"**: **104**,<br>**"orderReference"**: "ORD\-2026\-00104",<br>**"orderStatus"**: "COMPLETED",<br>**"paymentStatus"**: "SUCCESS",<br>**"totalAmount"**: **12500\.00**<br>\} |
| --- |

# **8\. ORDER PROCESSING MONITOR — KEY DEMONSTRATION FEATURE**

The Order Processing Monitor is the most important visual feature of the project because it makes the three design patterns observable\. Instead of asking evaluators to infer what happened from source code, the team can submit an order and show the actual processing sequence, audit records and observer outcomes\.

## **What the monitor must display**

| **Monitor component** | **Information to display** | **Why it matters** |
| --- | --- | --- |
| **Order summary** | Order reference, customer, total amount, order status and payment status\. | Shows which order is being inspected and its final outcome\. |
| **Pipeline timeline** | All six stages in the correct order, each with its execution status\. | Demonstrates that Template Method controls the sequence\. |
| **Stage timestamps** | The time each stage started and/or completed, based on stored audit events\. | Shows when processing activity occurred\. |
| **Audit history** | Step name, STARTED/SUCCESS/FAILED status, message and timestamp\. | Demonstrates that Decorator records the execution history persistently\. |
| **Shipping observer** | Whether the observer was triggered and the SHIPPING notification record/status\. | Demonstrates one subscriber responding to successful completion\. |
| **Email observer** | Whether the observer was triggered and the EMAIL notification record/status\. | Demonstrates the second subscriber responding independently\. |

## **Expected successful\-order display**

| **Stage** | **Expected status** | **Suggested display** |
| --- | --- | --- |
| **Validate Order** | SUCCESS | Completed indicator and timestamp |
| **Check Inventory** | SUCCESS | Completed indicator and timestamp |
| **Calculate Total** | SUCCESS | Completed indicator and timestamp |
| **Process Payment** | SUCCESS | Completed indicator and timestamp |
| **Confirm Order** | SUCCESS | Completed indicator and timestamp |
| **Complete Order** | SUCCESS | Completed indicator and timestamp |

Below the timeline, display the audit count and the two observer outcomes\. For example: 'Six processing stages completed'; 'Shipping observer: triggered once — notification record created'; and 'Email observer: triggered once — notification record created'\.

## **Expected failure\-order display**

For a clear failure demonstration, configure the simulated payment operation to fail\. The monitor should show Validate Order, Check Inventory and Calculate Total as successful; Process Payment as failed; and Confirm Order and Complete Order as not executed\. Both observer outcomes must display NOT TRIGGERED\. The failed payment audit event should remain visible\.

Do not treat the monitor as an unrelated dashboard or add unnecessary analytics\. Its purpose is to provide direct evidence of the pipeline sequence, audit trail and observer behaviour\.

# **9\. TESTING STRATEGY AND EXPECTED PROJECT OUTPUT**

Testing must verify both the individual operations and the collaboration between the three patterns\. The most important test is an integration test that submits an order through the Spring Boot application, checks the persisted database records and verifies that the observers are called correctly\.

## **Mandatory successful\-order integration test**

1. Submit a valid order containing one or more books with sufficient stock\.
1. Verify that the order is created and the six pipeline stages execute in the required order\.
1. Verify that the audit history contains the expected stage names and successful outcomes\. If STARTED events are stored, verify those records as well\.
1. Verify that ShippingObserver is invoked exactly once\.
1. Verify that EmailObserver is invoked exactly once\.
1. Verify that exactly one shipping notification and one email notification are persisted for the completion event\.
1. Verify that the final order status is COMPLETED and the payment status is SUCCESS\.

## **Additional test scenarios**

| **Scenario** | **Expected result** |
| --- | --- |
| **Invalid order** | Validation fails; later stages do not execute; a failure audit event is recorded\. |
| **Insufficient stock** | Inventory stage fails; total calculation, payment and completion do not execute\. |
| **Payment failure** | Payment failure is audited; the order is not completed; neither observer is triggered\. |
| **Successful order** | All six stages succeed; both observers are invoked once; notification records are persisted\. |
| **Repeated completion event** | Duplicate notification side effects are prevented or detected through an idempotency check\. |

## **Expected project deliverables**

- A React frontend containing book selection, order submission and the Order Processing Monitor\.
- A Java Spring Boot backend exposing the required REST endpoints and implementing all three design patterns\.
- A MySQL database containing customers, books, orders, order\_items, audit\_logs and notifications\.
- Persistent audit records for each executed processing stage\.
- Shipping and email notification records created by the observers after successful completion\.
- JUnit 5 / Spring Boot integration tests demonstrating the required success and failure behaviour\.
- A shared Git repository and concise instructions for configuring and running the application\.

# **10\. EVALUATOR PRESENTATION AND FINAL SYSTEM ANALYST RECOMMENDATIONS**

## **10\.1 How to present the project to evaluators**

Present the application as a working product first\. Demonstrate the customer's order journey and the visible results, then explain how the three design patterns produce those results\. This order of presentation helps evaluators understand the problem before hearing the implementation details\.

1. Introduce the problem\. Explain that an order requires a fixed processing sequence, a traceable history and notifications to dependent services after successful completion\.
1. Show the React Book and Order page\. Display the seeded catalogue, select one or more books, enter quantities and provide customer details\.
1. Submit a valid order\. Explain that the React frontend sends the request to Spring Boot and that the backend retrieves the authoritative prices and stock levels from MySQL\.
1. Open the Order Processing Monitor\. Walk through Validate Order, Check Inventory, Calculate Total, Process Payment, Confirm Order and Complete Order in that exact order\.
1. Explain Template Method\. Show that processOrder() defines the fixed algorithm and that the concrete processor supplies the implementation of each stage\.
1. Open the audit history\. Show the STARTED and SUCCESS records for each stage and explain that the AuditDecorator writes these events to MySQL around the real operation\.
1. Show the observer outcomes\. Display the SHIPPING and EMAIL notification records and explain that the Observer pattern allows the two subscribers to react independently to OrderCompleted\.
1. Run a failure scenario\. Use insufficient stock or a simulated payment failure\. Show the failed stage, the stages that did not execute and the fact that neither completion observer was triggered\.
1. Run the integration test\. Show the assertions proving that six stages execute successfully and each observer is invoked exactly once for a successful order\.

## **10\.2 Final recommendations as system analyst**

### **Recommendation 1 — protect the three\-day scope**

Build the order pipeline and proof of operation before adding optional bookstore features\. A small catalogue, simple customer form and simulated external services are enough\. The quality of the pipeline demonstration is more important than the number of screens\.

### **Recommendation 2 — keep the sequence in one Template Method**

The six stages must be defined in one clearly controlled processOrder() method\. Keep it final so subclasses cannot change the sequence\. Do not duplicate the workflow in controllers or frontend code\.

### **Recommendation 3 — apply the audit decorator consistently**

Use a common OrderStep interface and wrap each of the six operations with the audit decorator\. Persist STARTED, SUCCESS and FAILED events in MySQL\. Console messages may help debugging, but they are not a replacement for stored audit history\.

### **Recommendation 4 — publish completion only after commit**

The OrderCompleted event must be published only after the order has been successfully committed to the database\. This prevents shipping and email notifications from being generated for an order whose transaction later fails\. Failed orders must not trigger completion observers\.

### **Recommendation 5 — simulate external integrations transparently**

Use a simulated payment gateway and simulated shipping/email actions\. Make it clear during the presentation that these are controlled demonstrations of the integration points, not live financial or courier services\.

### **Recommendation 6 — make the monitor a core deliverable**

Prioritize the Order Processing Monitor because it provides visible evidence of the six\-stage workflow, the audit trail and both observer outcomes\. It should be implemented and tested before optional interface enhancements\.

### **Recommendation 7 — agree on contracts before parallel work**

Agree on API request/response formats, database table and field names, status values and pipeline stage names before frontend and backend work proceeds in parallel\. This reduces integration problems and prevents different team members from using inconsistent naming\.

## **Closing project direction**

Treat the bookstore as the application and the order pipeline as its central business engine\. React demonstrates how a customer submits an order\. Spring Boot executes the business workflow\. MySQL preserves the order, audit and notification records\. Template Method controls the sequence, Decorator records what happened at each stage, and Observer informs the dependent services after successful completion\. A focused implementation of these responsibilities—with a successful run, a failure run and a working monitor—is the strongest outcome for the three\-day project\.
