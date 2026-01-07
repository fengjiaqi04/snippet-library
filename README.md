Snippet Library

A full-stack code snippet management web app that allows users to securely create, search, and manage reusable code snippets with authentication and syntax highlighting.

Built with React, Node.js, Express, PostgreSQL, and JWT authentication.


🛠 Tech Stack
Frontend

React (Vite)

Tailwind CSS

Prism.js (syntax highlighting)

Backend

Node.js

Express

PostgreSQL


🚀 Getting Started (Local Setup)
1️⃣ Clone the repository
git clone https://github.com/fengjiaqi04/snippet-library.git
cd snippet-library

2️⃣ Backend setup
cd server
npm install


Create a .env file:

PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/snippet_library
JWT_SECRET=your_secret_key
CLIENT_ORIGIN=http://localhost:5173


Start the server:

npm run dev


Server runs at:
👉 http://localhost:3000

3️⃣ Frontend setup
cd client
npm install
npm run dev


Frontend runs at:
👉 http://localhost:5173

🔐 Authentication Flow

User registers or logs in

Backend issues a JWT token

Token stored in localStorage

Token sent via Authorization: Bearer <token>

Protected routes validate token before access



📈 What This Project Demonstrates

Full-stack system design

REST API development

Authentication & authorization

Database schema design

Future improvements:
"Search" is not implemented yet
More aesthetically pleasant UI
Sorting by tags
