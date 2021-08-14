const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const auth = require('../middleware/auth');
const User = require('../models/user');
const {
  CREATED_CODE,
  BAD_REQUEST_CODE,
  INTERNAL_SERVER_ERROR_CODE,
  NOT_FOUND_CODE,
  FILE_SIZE_IN_BYTES,
} = require('../config');

// create new router
const router = new express.Router();

// add new user
router.post('/users', async (req, res) => {
  const user = new User(req.body);

  try {
    await user.save();

    const token = await user.generateAuthToken();

    res.status(CREATED_CODE).send({ user, token });
  } catch (err) {
    res.status(BAD_REQUEST_CODE).send(err);
  }
});

// login user
router.post('/users/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findByCredentials(email, password);
    const token = await user.generateAuthToken();

    res.send({ user, token });
  } catch (err) {
    res.status(BAD_REQUEST_CODE).send();
  }
});

// user profile
router.get('/users/me', auth, async (req, res) => {
  res.send(req.user);
});

// logout user from one session
router.post('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });

    await req.user.save();

    res.send();
  } catch (err) {
    res.status(INTERNAL_SERVER_ERROR_CODE).send();
  }
});

// logout user from all sessions
router.post('/users/logoutall', auth, async (req, res) => {
  try {
    req.user.tokens = [];

    await req.user.save();

    res.send();
  } catch (err) {
    res.status(INTERNAL_SERVER_ERROR_CODE).send();
  }
});

// update user
router.patch('/users/me', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'email', 'password', 'age'];
  const isValidOperation = updates.every((update) => {
    return allowedUpdates.includes(update);
  });

  if (!isValidOperation) {
    return res.status(BAD_REQUEST_CODE).send({ error: 'Invalid updates!' });
  }

  try {
    updates.forEach((property) => (req.user[property] = req.body[property]));

    await req.user.save();

    res.send(req.user);
  } catch (err) {
    res.status(BAD_REQUEST_CODE).send(err);
  }
});

// support for file upload
const upload = multer({
  limits: { fileSize: FILE_SIZE_IN_BYTES },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Please upload an image file!'));
    }

    // accept file
    cb(undefined, true);
  },
});

// upload user profile picture
router.post(
  '/users/me/avatar',
  auth,
  upload.single('avatar'),
  async (req, res) => {
    const currBuffer = req.file.buffer;

    const resizeProps = { width: 250, height: 250 };
    const formattedBuffer = await sharp(currBuffer)
      .resize(resizeProps)
      .png()
      .toBuffer();

    req.user.avatar = formattedBuffer;
    await req.user.save();

    res.send();
  },
  (err, req, res, next) => {
    res.status(BAD_REQUEST_CODE).send({ error: err.message });
  },
);

// delete user profile picture
router.delete('/users/me/avatar', auth, async (req, res) => {
  req.user.avatar = undefined;

  try {
    await req.user.save();
    res.send();
  } catch (err) {
    res.status(BAD_REQUEST_CODE).send();
  }
});

// get user profile picture by id
router.get('/users/:id/avatar', async (req, res) => {
  const { id: _id } = req.params;

  try {
    const user = await User.findById(_id);

    if (!user || !user.avatar) {
      throw new Error('No user or avatar found!');
    }

    res.set('Content-Type', 'image/png');
    res.send(user.avatar);
  } catch (err) {
    res.status(NOT_FOUND_CODE).send({ error: err.message });
  }
});

// delete user
router.delete('/users/me', auth, async (req, res) => {
  try {
    await req.user.remove();

    res.send(req.user);
  } catch (err) {
    res.status(INTERNAL_SERVER_ERROR_CODE).send();
  }
});

module.exports = router;
