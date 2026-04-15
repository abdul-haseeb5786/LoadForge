# LoadForge - API Load Testing Tool

LoadForge is a full-stack monorepo application engineered securely in Angular 17 and NestJS. It executes highly concurrent real-time API load benchmarking.

## Prerequisites
- Node.js (v18+)
- Local Redis Server (port 6379)
- MongoDB Database

## Environment Setup
First, copy the environments in the `backend`.

**backend/.env**
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/loadforge
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=your_google_id
GOOGLE_CLIENT_SECRET=your_google_secret
GITHUB_CLIENT_ID=your_github_id
GITHUB_CLIENT_SECRET=your_github_secret
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:4200
```

**frontend/src/environments/environment.ts**
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  socketUrl: 'http://localhost:3000'
};
```

## Running Dev Servers

In terminal 1 (Backend):
```bash
cd backend
npm install
npm run start:dev
```

In terminal 2 (Frontend):
```bash
cd frontend
npm install
npm start
```

## Running Production Build

Build the frontend:
```bash
cd frontend
npm run build
```

Build the backend:
```bash
cd backend
npm run build
npm run start:prod
```
