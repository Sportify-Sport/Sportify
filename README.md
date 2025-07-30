# Sportify – Sports Community Platform 🏃‍♂️⚽🏀

A modern, full‑stack solution for organizing and discovering local sports groups and events. Sportify combines a React Native mobile app, a React‑based admin dashboard, and an ASP.NET Core 6 backend—featuring AI‑driven recommendations, real‑time notifications, robust security, and participation certificates.

---

## 🌟 Key Features

### 1. Authentication & User Management
- Secure registration/login using JWT (access + refresh tokens)
- Bcrypt-based password hashing on the server
- Forgot password with email code verification
- Guest mode with limited access
- Profile editing with image upload (camera or gallery)
- Email validation required for full access

### 2. Groups & Events
- Create and manage groups, handle join requests
- Add event admins, attach images, track participants
- Events with or without teams (e.g. marathon vs tournaments)
- Event viewers vs players separation
- Smart matching: join only if age/gender/requirements match
- Participation certificate as downloadable/shareable PDF
- Add event to calendar, navigate to event location with Maps

### 3. AI‑Powered Event Recommendations
- Hugging Face model (all-MiniLM-L6-v2) converted to ONNX
- Runs via Microsoft.ML.OnnxRuntime on the backend
- Uses profile data + bio to recommend relevant events
- Returns top-ranked events that match user interests

### 4. Real‑Time Notifications & Logs
- Expo Push Notifications to participants and admins
- Role updates, new join requests, event changes, etc.
- Notification inbox with Read All and Delete features
- Links from each notification to event or group details
- System logging of all key actions for audit trails

### 5. Smart Search & UX Performance
- Advanced filtering by city, sport, date, gender, and level
- Infinite scrolling and pagination
- Client-side caching for static data
- AbortController used to cancel overlapping queries

### 6. Admin Web Dashboard (React)
- Global Admin: full control over city organizers and sports
- City Organizer: manage city-wide events and groups
- Manage sports: add/edit/delete sport types with images
- Manage organizers: add/delete using gov.il city API
- City logs: track all user/admin actions per city

---

## 🏗️ Technical Architecture

- Backend: ASP.NET Core 6 REST API
- Database: Microsoft SQL Server with stored procedures
- Mobile: React Native with Expo SDK
- Admin UI: React.js + Tailwind + CSS
- ML: ONNX Runtime (.NET), Sentence Transformers
- Logging: Serilog structured logs
- Notifications: Expo + Async delivery
- Security: JWT, HTTPS, Role-based access, input validation

---

## 🔐 Security & Reliability

- Dual token strategy: Access + Refresh tokens
- Bcrypt hashing for all passwords
- Email validation before accessing key features
- Role-based access control (User, Admin, Organizer)
- Stored procedures for all DB operations
- IP tracking and code expiration for password resets
- Logs and real-time alerts for admin activities

---

## 📊 Performance Highlights

- Indexing & stored procedures for fast DB access
- IMemoryCache with thread safety (SemaphoreSlim)
- 90% DB load reduction for static data (cities/sports)
- Sub-100ms latency for cached operations
- Lazy loading for large participant lists
- Caching with TTLs for location and gov.il API queries

---

## 🧠 Technologies Used

- ASP.NET Core 6 (C#)
- Microsoft SQL Server
- React Native (Expo)
- React.js (Admin Panel)
- Hugging Face all-MiniLM-L6-v2 (converted to ONNX)
- Microsoft.ML.OnnxRuntime
- MailKit / MimeKit
- Serilog
- Newtonsoft.Json
- System.IdentityModel.Tokens.Jwt
- IMemoryCache
- Axios + AbortController
- Expo SDK: expo-sharing, expo-print, expo-calendar, expo-location
- JWT, Bcrypt, PDF Generator, Image Upload, Search Filters
- NPM Libraries via official registry (https://www.npmjs.com/)

---

## 📌 Summary

Sportify is a production-ready, modular, and secure platform that helps cities, schools, teams, and everyday sports lovers manage and discover events efficiently. With built-in AI recommendations, a complete real-time notification system, admin dashboards, and high performance across the stack, it creates an all-in-one hub for sport-based social engagement.
