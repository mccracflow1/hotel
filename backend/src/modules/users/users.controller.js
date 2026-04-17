'use strict';

const usersService = require('./users.service');
const { createUserSchema, updateUserSchema, patchMeSchema, patchUserStatusSchema } = require('./users.schema');
const { ValidationError } = require('../../middlewares/error-handler');

function validate(schema, data) {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) throw new ValidationError(error.message, error.details);
  return value;
}

async function listUsers(req, res, next) {
  try {
    const result = await usersService.listUsers();
    return res.status(200).json(result);
  } catch (e) {
    return next(e);
  }
}

async function createUser(req, res, next) {
  try {
    const body = validate(createUserSchema, req.body);
    const result = await usersService.createUser(body, req.user);
    return res.status(201).json(result);
  } catch (e) {
    return next(e);
  }
}

async function updateUser(req, res, next) {
  try {
    const body = validate(updateUserSchema, req.body);
    const result = await usersService.updateUser(req.params.id, body, req.user);
    return res.status(200).json(result);
  } catch (e) {
    return next(e);
  }
}

async function patchUserStatus(req, res, next) {
  try {
    const body = validate(patchUserStatusSchema, req.body);
    const result = await usersService.patchUserStatus(req.params.id, body, req.user);
    return res.status(200).json(result);
  } catch (e) {
    return next(e);
  }
}

async function getMe(req, res, next) {
  try {
    const result = await usersService.getMe(req.user.id);
    return res.status(200).json(result);
  } catch (e) {
    return next(e);
  }
}

async function patchMe(req, res, next) {
  try {
    const body = validate(patchMeSchema, req.body);
    const result = await usersService.patchMe(req.user.id, body);
    return res.status(200).json(result);
  } catch (e) {
    return next(e);
  }
}

module.exports = {
  listUsers,
  createUser,
  updateUser,
  patchUserStatus,
  getMe,
  patchMe,
};
