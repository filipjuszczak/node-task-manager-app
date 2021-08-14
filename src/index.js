const express = require('express');
const chalk = require('chalk');
const USER_ROUTER = require('./routers/user');
const TASK_ROUTER = require('./routers/task');
require('./db/mongoose.js');

const app = express();
const PORT = process.env.PORT;

// automatically parses incoming JSON to an object
app.use(express.json());

// register routers
app.use(USER_ROUTER);
app.use(TASK_ROUTER);

// starting server
app.listen(PORT, () => {
  const message = chalk.green.inverse(`Server is up on port ${PORT}!`);
  console.log(message);
});
