# Secure Cloud-Based Question Paper Management System

## 1. Project Title

**Secure Cloud-Based Question Paper Management System**

## 2. Brief Description

This project is a secure web application for managing government and competitive examination question papers.

The main aim of the project is to prevent unauthorized access, modification and early access to question papers before the examination.

The system has different user roles such as Question Setter, Reviewer, Administrator and Examination Controller. The question paper is encrypted before being stored in cloud storage. The system also provides authentication, role-based access control, question paper approval, integrity checking, audit logging and time-based release.

## 3. Technologies / Tools Used

- HTML
- CSS
- JavaScript
- Node.js
- Express.js
- Supabase PostgreSQL
- Supabase Storage
- AES-256-GCM Encryption
- SHA-256 Hashing
- JWT Authentication
- bcrypt
- Role-Based Access Control (RBAC)
- Git
- GitHub
- Visual Studio Code

## 4. Installation and Run Steps

### Prerequisites

Install the following:

- Node.js
- Git
- Supabase account

### Step 1: Clone the Repository

```bash
git clone https://github.com/mounika1621/secure-question-paper-system.git
cd secure-question-paper-system
```
### Step 2: Install Dependencies
```bash
npm install
```
### Step 3: Configure Supabase
```bash
Create a Supabase project.
Open the Supabase SQL Editor and run:
supabase/schema.sql
This creates the required database tables and security policies.
Create a private Supabase Storage bucket named:
question-papers
```
### Step 4: Configure Environment Variables
```bash
Create a file named .env in the project root folder.
```
### Step 5: Generate Encryption Key
```bash
Run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
### Step 6: Create Demo Users
```bash
Question Setter:node scripts/create-user.js "Question Setter" setter@example.com Setter@123 setter
Reviewer:node scripts/create-user.js "Reviewer" reviewer@example.com Reviewer@123 reviewer
Administrator:node scripts/create-user.js "Administrator" admin@example.com Admin@123 admin
Examination Controller:node scripts/create-user.js "Exam Controller" controller@example.com Controller@123 controller
```
### Step 7: Start the Application
```bash
Run:npm start
The application will start at:http://localhost:3000

5. Project Structure
secure-question-paper-system/
│
├── public/
│   ├── app.js
│   ├── index.html
│   └── style.css
│
├── scripts/
│   └── create-user.js
│
├── src/
│   ├── config/
│   │   └── supabase.js
│   │
│   ├── middleware/
│   │   └── auth.js
│   │
│   ├── routes/
│   │   ├── admin.js
│   │   ├── auth.js
│   │   └── papers.js
│   │
│   └── utils/
│       ├── audit.js
│       └── security.js
│
├── supabase/
│   └── schema.sql
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── server.js

6. Modules and Their Purpose
server.js

Main entry point of the application. It starts the Express server.

public/

Contains the frontend files.

index.html - User interface
style.css - Application styling
app.js - Frontend JavaScript and API interaction
scripts/create-user.js

Used to create users with different roles.

src/config/supabase.js

Connects the backend application with Supabase.

src/middleware/auth.js

Handles user authentication and role-based access control.

src/routes/auth.js

Contains login and authentication-related operations.

src/routes/papers.js

Handles question paper operations such as:

Upload
Encryption
Hash generation
Approval
Controlled release
Download
src/routes/admin.js

Handles administrator operations and audit log viewing.

src/utils/security.js

Contains security functions such as AES-256-GCM encryption, decryption and SHA-256 hash generation.

src/utils/audit.js

Records important system activities such as login, upload and approval.

supabase/schema.sql

Contains the SQL commands for creating the required database tables and security policies.

7.Testing Performed

The following features were tested successfully:
User login
Question paper upload
Question paper encryption
SHA-256 hash generation
Reviewer approval
Controller login
Early access blocking
Administrator login
Audit log viewing

8.Working Flow

Question Setter
       ↓
Login
       ↓
Upload Question Paper
       ↓
AES-256-GCM Encryption
       ↓
SHA-256 Hash Generation
       ↓
Private Cloud Storage
       ↓
Reviewer
       ↓
Approve / Reject
       ↓
Approved Question Paper
       ↓
Wait Until Examination Date & Time
       ↓
Examination Controller
       ↓
Release / Download

9.Github repository

https://github.com/mounika1621/secure-question-paper-system

10.Database

The project uses Supabase PostgreSQL as the cloud database.The database structure and security policies are provided in:
supabase/schema.sql
The question papers are stored in a private Supabase Storage bucket named:
question-papers

11.Security

The project uses the following security mechanisms:
Password hashing using bcrypt
JWT-based authentication
Role-Based Access Control
AES-256-GCM encryption
SHA-256 integrity checking
Private cloud storage
Audit logging
Time-based question paper release

```
