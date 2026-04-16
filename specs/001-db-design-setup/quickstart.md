# Quickstart: DB Design & Project Setup (Semana 1)

## Prerequisites
- Node.js 20+
- PostgreSQL 14+
- Knex.js CLI (`npm install -g knex`)

## Environment Setup
1. Create a `.env` file in `backend/`:
   ```env
   DATABASE_URL=postgres://user:password@localhost:5432/hotel
   NODE_ENV=development
   PORT=3000
   ```
2. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

## Database Initialization
1. Create the database:
   ```bash
   createdb hotel
   ```
2. Run migrations:
   ```bash
   knex migrate:latest
   ```
3. (Optional) Run seeds:
   ```bash
   knex seed:run
   ```

## Running the API
```bash
npm start
```
The API will be available at `http://localhost:3000`.
Health check: `GET /api/health`
