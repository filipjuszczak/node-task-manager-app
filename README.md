# A Node.js/Express task manager app.

**APP DOES NOT CONTAIN GUI!**

App is based on Express. It uses MongoDB to store data about users and their tasks.

**Features:**
- user can:
  - register an account by providing an email and password (app checks for potential email duplication in database before user is stored; passwords are hashed before getting stored),
  - upload an avatar image (max. size is 1 MB; app checks if uploaded file is an actual image; app crops the image before storing it in database),
  - manage their tasks (add, edit, complete, search, filter etc.),
  - edit their profile (change e-mail, password, avatar image),
  - logout from one as well as all devices they have logged on,
  - delete their account and all related tasks.
  
- app uses JWT package to generate tokens to authenticate users (unauthenticated users cannot perform most of available actions).
