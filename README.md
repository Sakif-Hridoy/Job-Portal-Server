# Job Portal

A Job Portal web application that allows candidates to view and apply for jobs and enables recruiters to post job listings and manage applications. The platform supports both candidate and recruiter functionalities, but currently, there is no separation between the two roles and also some addtional options like Delete etc is under working.

### Features

---

## Frontend Features

- **Responsive Design:**
  - Fully responsive navigation and most of the website (80%) works across all devices.
  
- **UI Design:**
  - Tailwind CSS for custom styling.
  - DaisyUI for pre-designed components (buttons, inputs, modals).
  
- **Routing:**
  - React Router for client-side routing.
  - Private Route functionality to restrict access to specific pages for authenticated users.

- **Authentication:**
  - Firebase Authentication for user registration, login, and logout.
  - Context API used for managing authentication state across components.
  - Custom hooks like `useAuth` to manage authentication logic.

- **Form Handling:**
  - `FormData` object used for handling large form data input (such as job application forms).

- **Data Fetching:**
  - Axios and Fetch API used for sending and retrieving data.
  - Data is fetched and posted with credentials (tokens) using axios interceptors for secure communication.
  
- **Secure API Requests:**
  - `x-api-key` used in request headers for validating the user and securing the data.
  - Interceptors are used in axios instance to handle unauthorized requests by logging out the user if the token is invalid or expired.

- **User-Based Data:**
  - Context API provides access to user-specific data, such as user applications and posted jobs.
  
- **Validation:**
  - Regex validation for email and password during user registration.

- **Data Display:**
  - Tables used to display job-related data.
  - `map` and `filter` functions used to categorize data and display it accordingly.

---

## Backend Features

- **API and Routes:**
  - Node.js and Express used to create backend APIs for managing job posts, job applications, and user authentication.
  
- **Authentication:**
  - JWT (JSON Web Token) used for secure user authentication.
  - Tokens are stored in HTTP-only cookies to prevent JavaScript access and mitigate XSS attacks.
  
- **Security:**
  - `x-api-key` header used for additional security with a secret key.
  - Middlewares like `verifyToken` and `verifyApiKey` ensure that routes are protected from unauthorized access.
  - Token and email validation to ensure that the authenticated user matches the one in the database.

- **User Sessions:**
  - Tokens are cleared from the browser cookies when a user logs out to maintain session integrity.

- **Database (MongoDB):**
  - MongoDB is used for storing user data, job posts, and applications.
  - Joined collections to show related data (e.g., job application counts).

- **CORS Configuration:**
  - CORS configuration to allow frontend (Netlify) to securely communicate with the backend (Render) using cookies and credentials.

- **Recruiter Features:**
  - A recruiter can view the jobs they have posted.
  - A recruiter can see the applications for their posted jobs and view detailed information about applicants.
  - A recruiter can update the status of applications, such as marking them as "hire," "interview," or "reject."

---

## Deployment Features

- **Frontend:**
  - Deployed on Netlify for seamless static site hosting.
  
- **Backend:**
  - Deployed on Render, a cloud platform for hosting backend services.
  
- **Environment Variables:**
  - API keys and secret keys are stored securely in environment variables for both frontend and backend.

---

## Installation

### Frontend (React)

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/job-portal.git
   cd job-portal
