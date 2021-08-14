const express = require('express');
const auth = require('../middleware/auth');
const Task = require('../models/task');
const {
  CREATED_CODE,
  BAD_REQUEST_CODE,
  NOT_FOUND_CODE,
  INTERNAL_SERVER_ERROR_CODE,
} = require('../config');

// create new router
const router = new express.Router();

// fetch all tasks
// GET /tasks?completed=true
// GET /tasks?limit=10&skip=10
// GET /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
  const match = {};
  const sort = {};

  if (req.query.completed) {
    match.completed = req.query.completed === 'true';
  }

  if (req.query.sortBy) {
    const [prop, order] = req.query.sortBy.split(':');
    sort[prop] = order === 'asc' ? 1 : -1;
  }

  const options = {
    limit: parseInt(req.query.limit),
    skip: parseInt(req.query.skip),
    sort,
  };

  try {
    await req.user
      .populate({
        path: 'tasks',
        match,
        options,
      })
      .execPopulate();

    res.send(req.user.tasks);
  } catch (err) {
    res.status(INTERNAL_SERVER_ERROR_CODE).send();
  }
});

// fetch task by id
router.get('/tasks/:id', auth, async (req, res) => {
  const { id: _id } = req.params;
  const { _id: owner } = req.user;

  try {
    const task = await Task.findOne({ _id, owner });

    if (!task) {
      return res.status(NOT_FOUND_CODE).send();
    }

    res.send(task);
  } catch (err) {
    res.status(NOT_FOUND_CODE).send();
  }
});

// add new task
router.post('/tasks', auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id,
  });

  try {
    await task.save();
    res.status(CREATED_CODE).send(task);
  } catch (err) {
    res.status(BAD_REQUEST_CODE).send(err);
  }
});

// update task by id
router.patch('/tasks/:id', auth, async (req, res) => {
  const { id: _id } = req.params;
  const { _id: owner } = req.user;
  const updates = Object.keys(req.body);

  const allowedUpdates = ['description', 'completed'];
  const isValidOperation = updates.every((update) => {
    return allowedUpdates.includes(update);
  });

  if (!isValidOperation) {
    return res.status(BAD_REQUEST_CODE).send({ error: 'Invalid updates!' });
  }

  try {
    const task = await Task.findOne({ _id, owner });

    if (!task) {
      return res.status(NOT_FOUND_CODE).send();
    }

    updates.forEach((property) => (task[property] = req.body[property]));

    await task.save();

    res.send(task);
  } catch (err) {
    res.status(BAD_REQUEST_CODE).send(err);
  }
});

// delete task by id
router.delete('/tasks/:id', auth, async (req, res) => {
  const { id: _id } = req.params;
  const { _id: owner } = req.user;

  try {
    const task = await Task.findOneAndDelete({ _id, owner });

    if (!task) {
      return res.status(NOT_FOUND_CODE).send();
    }

    res.send(task);
  } catch (err) {
    res.status(INTERNAL_SERVER_ERROR_CODE).send();
  }
});

module.exports = router;
