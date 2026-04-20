# Elementa ⚛️

**Elementa** is a premium, high-fidelity educational platform designed for Edexcel IGCSE students. It transforms the learning experience through intelligent progress tracking, high-definition video walkthroughs, and a centralized hub for past paper mastery.

![Project Status](https://img.shields.io/badge/Status-Production--Ready-success)
![Tech Stack](https://img.shields.io/badge/Stack-Node.js%20%7C%20PostgreSQL%20%7C%20Vanilla%20JS-blue)
![Hosting](https://img.shields.io/badge/Hosting-Render%20%7C%20Neon-orange)

## ✨ Core Features

### 🎓 Student Experience
- **Personalized Dashboard**: Real-time progress synchronization with "Recently Watched" and "Next Up" intelligent suggestions.
- **Multi-Subject Ecosystem**: Native support for **Physics, Math, Biology, and Chemistry** with custom-tailored resource pipelines.
- **Intelligent Video Library**: Automatic duration detection, playback memory, and integrated teacher insights.
- **Vault Access**: A comprehensive repository of Past Papers, Marking Schemes, and Model Answers.

### 🛡️ Admin Command Center
- **Accounts Hub**: Full CRUD suite for managing student and administrative accounts with secure password hashing.
- **Insights Hub**: A dual-column, high-density dashboard for content management and assignment oversight.
- **Protected Operations**: Level-based access control (RBAC) ensuring administrative tools are secured via server-side middleware.

### 🍱 Premium UI/UX
- **Modern Aesthetic**: Glassmorphism-inspired design with a focus on dark-mode legibility and smooth transitions.
- **Responsive Navigation**: A robust mobile navigation system optimized for high-performance learning on any device.
- **SEO Ready**: Custom metadata and Open Graph tags for optimized search visibility and professional social sharing.

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), Tailwind CSS (Grid-optimized), Material Symbols.
- **Backend**: Node.js, Express.js.
- **Database**: **PostgreSQL (Neon)** for robust, scalable relational data persistence.
- **Security**: JWT (JSON Web Tokens) with Secure, HttpOnly cookie management and `bcryptjs` hashing.

## 🚀 Local Deployment

1. **Clone & Install**:
   ```bash
   git clone https://github.com/yvs1n/elementa.git
   cd elementa
   npm install
   ```

2. **Environment Configuration**:
   Create a `.env` file in the root with:
   ```env
   DATABASE_URL=your_postgresql_url
   JWT_SECRET=your_secure_secret
   PORT=3000
   ```

3. **Initialize Ecosystem**:
   ```bash
   node setupDB.js
   ```

4. **Launch Platform**:
   ```bash
   npm start
   ```

---
*Developed with excellence by [Yassin Ragab](https://yassinr.me)*
