# Online Election Management System

A secure, modern, and production-quality online voting and election management system built with React (Vite) on the frontend, Node.js/Express.js on the backend, and MySQL database.

---

## Features

- **JWT Authentication & bcrypt Hashing** for secure access and credentials storage.
- **Role-Based Access Control (RBAC)** separating Admins, Organizers, Candidates, and Voters.
- **Double Voting Prevention** enforced through unique constraints at the database level and session verification.
- **Visual Analytics Dashboards** displaying real-time turnout, candidate distribution, and logs.
- **Audit Logging** tracking all login attempts, election publications, and votes cast.
- **CSV Data Exporting** for reports (Voters list, Audit logs, and Election results).
- **Candidate Nomination Workflow** including profile photo, Govt ID, and manifesto uploads (Multer).

---

## Directory Structure

```text
online-election-system/
├── client/                 # React.js (Vite) Frontend
│   ├── src/
│   │   ├── components/
│   │   ├── context/        # Authentication Context
│   │   ├── layouts/        # Sidebar & Navbar Layouts
│   │   ├── pages/          # Dashboards, Login, Nomination forms
│   │   └── services/       # Axios API Client
│   └── package.json
│
├── server/                 # Node.js + Express.js Backend
│   ├── config/             # DB Connection pool
│   ├── controllers/        # Express Route Handlers
│   ├── middleware/         # Auth verify, Multer configurations
│   ├── routes/             # API Router definitions
│   ├── uploads/            # Multipart uploaded files (statically served)
│   ├── utils/              # Email & Audit log helper methods
│   └── package.json
│
└── database/
    └── election.sql        # MySQL database schema setup
```

---

## Prerequisite Setup

Before running the application, make sure you have:
1. **Node.js** (v16.0.0 or higher)
2. **npm** (v8.0.0 or higher)
3. **MySQL Server** running locally or remotely.

---

## Installation & Configuration

### 1. Database Setup

1. Log in to your MySQL terminal or database management tool (e.g., phpMyAdmin, DBeaver).
2. Run the SQL script from `database/election.sql` to initialize the database:
   ```bash
   mysql -u root -p < database/election.sql
   ```
   *Note: This creates the database `online_election_db` and seeds a default Admin account.*
   - **Admin Username**: `admin`
   - **Admin Password**: `admin123`

### 2. Backend Server Configuration

1. Navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Copy the environment variables template and customize it:
   ```bash
   cp .env.example .env
   ```
4. Open the `.env` file and set your MySQL username, password, and JWT secret:
   ```ini
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=online_election_db
   JWT_SECRET=your_jwt_secret_here
   ```
5. Start the backend server:
   - For production: `npm start`
   - For development (with hot reload): `npm run dev`

### 3. Frontend Client Configuration

1. Navigate to the `client/` directory:
   ```bash
   cd ../client
   ```
2. Install React dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
4. Access the web interface in your browser at `http://localhost:5173`.

---

## Verification & Manual Testing Scenarios

We recommend verifying the implementation using the following flow:

### Scenario A: Candidate Nomination Submission
1. Navigate to the landing page and click **Apply as Candidate**.
2. Fill out the Nomination Form. Upload mock images/PDF documents for the **Profile Photo**, **Government ID**, and **Manifesto**.
3. Accept the declaration checklist and click **Submit**.
4. Check the backend command line output. You will see a simulated email notification sent to the candidate email confirming receipt.

### Scenario B: Admin Approval & Organizer Provisioning
1. Log in as the Admin (Go to `http://localhost:5173/login`, select the **Admin** tab, enter username `admin` and password `admin123`).
2. Go to the **Nominations** tab. You will see the candidate nomination submitted in Scenario A. Click **Review Details** and choose **Approve**.
3. Go to the **Organizers** tab. Click **Create Organizer**. Set a username, unique number (e.g., `1005247290AB`), and password.

### Scenario C: Organizer Setup & Election Publishing
1. Log out, then log in using the **Organizer** tab (Enter the username, unique number, and password created in Scenario B).
2. Click **Create Election**. Fill in Title, Description, Date timelines, and enter the exact candidate position matching the approved nominee (e.g. `President`).
3. Select the nominee from the checkboxes and click **Create Draft**.
4. On your dashboard, click **Publish** to open the election for public voting.

### Scenario D: Voter Registration & Casting Ballots
1. Log out, then click **Create Account** to register a new voter.
2. Log in using the **Voter** tab.
3. On the voter dashboard under **Elections Portal**, click **Enter Voting Booth** for the active election.
4. Select your candidate, click **Cast Vote**, and click **Yes, Cast Vote** on the confirmation dialog.
5. Try to vote again; notice the button turns to "Ballot Submitted" and prevents duplicates.

---

## Security Implementations

- **SQL Injection Safeguards**: Queries utilize parameterized values via `mysql2/promise` execution pools.
- **Password Protection**: Salting and hashing are handled dynamically using `bcryptjs` with 10 rounds.
- **Double Ballot Prevention**: Enforced at the database layer via unique key indices on `(voter_id, election_id)`.
- **RBAC Guards**: React router and Express routes are verified using JWT payloads verifying token status and claims.
- **File upload validation**: Configured Multer to inspect file extensions (restricting to PDF, DOCX, TXT, PNG, JPG) and limiting uploads to 5MB.
