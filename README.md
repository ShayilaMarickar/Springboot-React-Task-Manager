# 📝 Spring Boot React Task Manager

A full stack Task Manager web application built with **Spring Boot** (backend REST API) and **React** (frontend), featuring dark/light mode toggle and live CRUD operations.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, JavaScript (ES6+) |
| Backend | Spring Boot 3.5, Java 21 |
| Database | H2 In-Memory Database |
| ORM | Spring Data JPA / Hibernate |
| API Style | RESTful HTTP |

---

## ✨ Features

- ✅ Add, complete, and delete tasks in real time
- 🌙 Dark / Light mode toggle
- 🔗 React frontend connected to Spring Boot REST API
- 🗄️ H2 in-memory database with JPA (same code works with Oracle / MySQL)
- 📊 Live task completion counter

---

## 🏗️ Architecture

```
┌─────────────────────┐         HTTP / JSON        ┌──────────────────────────┐
│   React Frontend    │ ◄─────────────────────────► │  Spring Boot Backend     │
│   localhost:3000    │                              │  localhost:8080          │
└─────────────────────┘                              └──────────┬───────────────┘
                                                                │ JPA
                                                     ┌──────────▼───────────────┐
                                                     │   H2 In-Memory Database  │
                                                     │   (tasks table)          │
                                                     └──────────────────────────┘
```

### REST API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Fetch all tasks |
| POST | `/api/tasks` | Create a new task |
| PUT | `/api/tasks/{id}` | Toggle task completion |
| DELETE | `/api/tasks/{id}` | Delete a task |

---

## 🛠️ Local Setup Guide

### Prerequisites

Make sure you have the following installed:

| Tool | Version | Download |
|------|---------|----------|
| Java JDK | 21+ | [adoptium.net](https://adoptium.net) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| Git | Any | [git-scm.com](https://git-scm.com) |

---

### 1. Clone the Repository

```bash
git clone https://github.com/ShayilaMarickar/springboot-react-taskmanager.git
cd springboot-react-taskmanager
```

---

### 2. Run the Backend (Spring Boot)

#### 🐧 Linux / 🍎 macOS

```bash
cd taskmanager-backend
./mvnw spring-boot:run
```

#### 🪟 Windows

```cmd
cd taskmanager-backend
mvnw.cmd spring-boot:run
```

> Backend runs at **http://localhost:8080**
> H2 database console available at **http://localhost:8080/h2-console**
> - JDBC URL: `jdbc:h2:mem:taskdb`
> - Username: `sa`
> - Password: *(leave empty)*

---

### 3. Run the Frontend (React)

Open a **new terminal window** — keep the backend terminal running.

#### 🐧 Linux / 🍎 macOS / 🪟 Windows

```bash
cd taskmanager-frontend
npm install
npm start
```

> Frontend runs at **http://localhost:3000**

---

### 4. Open the App

Go to **http://localhost:3000** in your browser. The React app will automatically connect to the Spring Boot backend.

---

## 📁 Project Structure

```
springboot-react-taskmanager/
│
├── taskmanager-backend/              # Spring Boot REST API
│   ├── src/main/java/
│   │   └── com/taskmanager/
│   │       ├── Task.java             # JPA Entity (maps to DB table)
│   │       ├── TaskRepository.java   # Data access layer (JPA)
│   │       ├── TaskController.java   # REST API endpoints
│   │       └── TaskmanagerBackendApplication.java
│   └── src/main/resources/
│       └── application.properties    # DB and JPA config
│
└── taskmanager-frontend/             # React App
    └── src/
        ├── App.js                    # Main component (all UI + API calls)
        └── index.js                  # React entry point
```

---

## 🗄️ Switching to Oracle / MySQL (Optional)

The backend uses Spring Data JPA — switching databases requires only `application.properties` changes, no Java code changes.

**Oracle example:**
```properties
spring.datasource.url=jdbc:oracle:thin:@localhost:1521:xe
spring.datasource.username=your_username
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=update
```

---

## 🤝 Author

**Shayila Marickar**
- GitHub: [@ShayilaMarickar](https://github.com/ShayilaMarickar)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).