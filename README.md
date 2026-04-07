# 📸 GMinsta – Mini Social Media Application

A full-stack social media application built with **Node.js**, **Express**, and **MongoDB**.

---

## 🚀 Features

- ✅ User Registration & Login (with hashed passwords)
- ✅ User Profile (bio, followers, following, post grid)
- ✅ Create Posts (image + text)
- ✅ View Feed (all posts, newest first)
- ✅ Like / Dislike Posts
- ✅ Comments on Posts
- ✅ Real-time style Chat / Messaging
- ✅ MongoDB Database Integration
- ✅ Session-based Authentication

---

## 📁 Project Structure

```
GMinsta/
├── models/
│   ├── User.js
│   ├── Post.js
│   ├── Comment.js
│   └── Message.js
├── routes/
│   ├── authRoutes.js
│   ├── postRoutes.js
│   ├── commentRoutes.js
│   └── chatRoutes.js
├── public/
│   ├── css/style.css
│   ├── js/main.js
│   └── images/         ← uploaded post images stored here
├── views/
│   ├── login.html
│   ├── register.html
│   ├── home.html
│   ├── profile.html
│   └── chat.html
├── app.js
├── package.json
├── .env
└── README.md
```

---

## ⚙️ Setup & Run Instructions

### Step 1 – Prerequisites

Make sure you have installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB Community Server](https://www.mongodb.com/try/download/community)
- [VS Code](https://code.visualstudio.com/)

### Step 2 – Install MongoDB

1. Download and install MongoDB Community Server
2. Start MongoDB service:
   - **Windows**: It starts automatically as a service, OR run:
     ```
     net start MongoDB
     ```
   - **Mac**:
     ```bash
     brew services start mongodb-community
     ```
   - **Linux**:
     ```bash
     sudo systemctl start mongod
     ```

### Step 3 – Open Project in VS Code

1. Open VS Code
2. Go to **File → Open Folder** → select the `GMinsta` folder
3. Open the integrated terminal: **View → Terminal** (or `Ctrl + `` ` ``)

### Step 4 – Install Dependencies

In the VS Code terminal, run:

```bash
npm install
```

### Step 5 – Configure Environment

The `.env` file is already set up with defaults:
```
MONGO_URI=mongodb://localhost:27017/gminsta
SESSION_SECRET=gminsta_super_secret_key_2026
PORT=3000
```
No changes needed for local development.

### Step 6 – Run the Application

```bash
# Normal start
npm start

# Development mode (auto-restart on file changes)
npm run dev
```

### Step 7 – Open in Browser

Visit: **http://localhost:3000**

---

## 🗃️ MongoDB Collections

### users
```json
{
  "_id": "ObjectId",
  "username": "ABC",
  "email": "abc@gmail.com",
  "password": "hashed_password",
  "bio": "I love coding",
  "profilePic": "default-avatar.png",
  "followers": [],
  "following": []
}
```

### posts
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "caption": "Hello from GMinsta!",
  "image": "post.jpg",
  "likes": [],
  "dislikes": [],
  "createdAt": "2026-03-25"
}
```

### comments
```json
{
  "_id": "ObjectId",
  "postId": "ObjectId",
  "userId": "ObjectId",
  "commentText": "Awesome post!",
  "createdAt": "2026-03-25"
}
```

### messages
```json
{
  "_id": "ObjectId",
  "senderId": "ObjectId",
  "receiverId": "ObjectId",
  "messageText": "Hi, how are you?",
  "sentAt": "2026-03-25"
}
```

---

## 🔗 API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | /auth/register | Register new user |
| POST | /auth/login | Login user |
| GET | /auth/logout | Logout |
| GET | /auth/me | Get current user |
| GET | /auth/users | Get all users |
| PUT | /auth/profile | Update bio |
| POST | /auth/follow/:id | Follow/Unfollow user |
| POST | /posts | Create post |
| GET | /posts/feed | Get all posts |
| GET | /posts/user/:id | Get user posts |
| POST | /posts/:id/like | Like post |
| POST | /posts/:id/dislike | Dislike post |
| DELETE | /posts/:id | Delete post |
| POST | /comments | Add comment |
| GET | /comments/:postId | Get comments |
| DELETE | /comments/:id | Delete comment |
| POST | /chat | Send message |
| GET | /chat/:otherId | Get conversation |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | express-session + bcryptjs |
| File Upload | Multer |
| Frontend | HTML5 + CSS3 + Vanilla JS |

---

## ❓ Troubleshooting

**MongoDB not connecting?**
- Make sure MongoDB service is running
- Check `MONGO_URI` in `.env`

**Port already in use?**
- Change `PORT=3000` to `PORT=3001` in `.env`

**npm install fails?**
- Make sure Node.js is installed: `node --version`
- Try: `npm install --legacy-peer-deps`
