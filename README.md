# Founder

> A platform for turning ideas into collaborative projects.

Founder is a platform designed to help people **share ideas, find suitable co-founders, build teams, and develop projects together**.

The goal is to create an environment where an idea can evolve from an initial concept into a real, collaborative project.

---

## 🚀 Vision

Founder aims to connect people with ideas, skills, and resources to build meaningful products together.

The platform focuses on:

- 💡 Idea discovery
- 👥 Co-founder matching
- 🧑‍💻 Team building
- 🤝 Collaboration
- 📈 Project development
- ⭐ Trust and reputation

---

## 🏗️ Tech Stack

### Backend

- [NestJS](https://nestjs.com/)
- TypeScript
- Prisma ORM
- PostgreSQL
- Supabase

### Frontend

- Next.js
- React
- TypeScript

### Development

- Git
- GitHub
- Docker _(planned)_

---

## 📦 Project Structure

```text
founder/
├── backend/
│   ├── src/
│   ├── prisma/
│   └── ...
│
├── frontend/
│   ├── app/
│   ├── components/
│   └── ...
│
├── .gitignore
└── README.md
```

---

## 🔐 Core Modules

The platform is being designed around independent business domains.

```text
Auth
User
Account
Project
Idea
Team
Collaboration
Reputation
Notification
```

The architecture is intended to keep domains loosely coupled so that individual features can evolve independently.

---

## 🗄️ Database

Founder uses **PostgreSQL** as its primary relational database.

Development and production databases are planned to use **Supabase PostgreSQL**.

Prisma is used as the ORM and database toolkit.

```text
NestJS
   ↓
Prisma
   ↓
PostgreSQL
   ↓
Supabase
```

---

## 🔑 Authentication

Authentication is being designed as a separate domain from user profile management.

Conceptually:

```text
Auth
 │
 ├── Register
 ├── Login
 ├── Logout
 ├── Refresh Token
 └── Password Management

User
 │
 └── Profile & User Information

Account
 │
 └── Authentication Credentials / Providers
```

This separation allows authentication mechanisms and user profile information to evolve independently.

---

## 🧑‍🤝‍🧑 Platform Concept

A user may participate in the platform in different roles:

```text
User
 │
 ├── Founder
 ├── Co-founder
 ├── Contributor
 └── Collaborator
```

Projects can define their own team structure, roles, and collaboration requirements.

---

## ⭐ Trust & Reputation

One of the core concepts of Founder is establishing trust between people.

Potential reputation signals include:

- Project contributions
- Completed collaborations
- Skills and experience
- Peer feedback
- Project outcomes
- Community activity

The reputation system is intended to help users make better decisions when selecting collaborators.

---

## 🛠️ Development

### Requirements

- Node.js
- npm
- Git
- Supabase account

PostgreSQL does not need to be installed locally when using Supabase PostgreSQL.

### Install

```bash
git clone <repository-url>

cd founder

npm install
```

### Environment Variables

Create a `.env` file:

```env
DATABASE_URL="your-supabase-postgresql-connection-string"
```

Never commit `.env` to Git.

Use `.env.example` to document required environment variables.

---

## 🗃️ Prisma

Validate the Prisma schema:

```bash
npx prisma validate
```

Generate Prisma Client:

```bash
npx prisma generate
```

Create a migration:

```bash
npx prisma migrate dev --name init
```

Open Prisma Studio:

```bash
npx prisma studio
```

---

## 🚧 Project Status

Founder is currently in the **early development stage**.

### Current focus

- [x] Project initialization
- [x] NestJS configuration
- [x] Prisma configuration
- [x] Supabase PostgreSQL connection
- [ ] Database schema
- [ ] Authentication
- [ ] User management
- [ ] Account management
- [ ] Project management
- [ ] Co-founder matching
- [ ] Reputation system
- [ ] Collaboration features

---

## 🗺️ Roadmap

### Phase 1 — Foundation

- Project architecture
- Database architecture
- Authentication
- User & Account
- API standards
- Validation
- Error handling

### Phase 2 — Project & Idea

- Create idea
- Publish idea
- Project lifecycle
- Project members
- Roles & permissions

### Phase 3 — Collaboration

- Co-founder discovery
- Skill matching
- Team formation
- Project collaboration

### Phase 4 — Trust

- Reputation
- Contribution history
- Reviews
- Verification

### Phase 5 — Platform

- Notifications
- Search
- Recommendations
- Analytics
- AI-assisted features

---

## 📌 Architecture Principles

Founder follows several principles:

- Domain-oriented architecture
- Separation of authentication and user information
- Strong typing with TypeScript
- Database migrations through Prisma
- Environment-based configuration
- Secure handling of credentials
- Modular and maintainable backend architecture

---

## 📄 License

This project is currently under development.

License information will be added later.
