'use strict';

const seasonsService = require('./seasons.service');
const { createSeasonSchema, updateSeasonSchema } = require('./seasons.schema');
const { ValidationError } = require('../../middlewares/error-handler');

function validate(schema, data) {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) throw new ValidationError(error.message, error.details);
  return value;
}

const seasonsController = {
  async findAll(req, res, next) {
    try {
      const temporadas = await seasonsService.findAll();
      return res.status(200).json({ temporadas });
    } catch (err) {
      return next(err);
    }
  },

  async findById(req, res, next) {
    try {
      const season = await seasonsService.findById(req.params.id);
      return res.status(200).json(season);
    } catch (err) {
      return next(err);
    }
  },

  async create(req, res, next) {
    try {
      const data = validate(createSeasonSchema, req.body);
      const season = await seasonsService.create(data);
      return res.status(201).json(season);
    } catch (err) {
      return next(err);
    }
  },

  async update(req, res, next) {
    try {
      const data = validate(updateSeasonSchema, req.body);
      const season = await seasonsService.update(req.params.id, data);
      return res.status(200).json(season);
    } catch (err) {
      return next(err);
    }
  },

  async delete(req, res, next) {
    try {
      await seasonsService.delete(req.params.id);
      return res.status(204).send();
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = seasonsController;
