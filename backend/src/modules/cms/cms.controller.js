'use strict';

const cmsService = require('./cms.service');
const { putSectionSchema, createFaqSchema, patchFaqSchema, reorderFaqsSchema } = require('./cms.schema');
const { ValidationError } = require('../../middlewares/error-handler');

function validate(schema, data) {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) throw new ValidationError(error.message, error.details);
  return value;
}

async function getPublicBundle(req, res, next) {
  try {
    const data = await cmsService.getPublicBundle();
    return res.status(200).json({ data });
  } catch (err) {
    return next(err);
  }
}

async function getSection(req, res, next) {
  try {
    const data = await cmsService.getSection(req.params.section);
    return res.status(200).json({ data });
  } catch (err) {
    return next(err);
  }
}

async function putSection(req, res, next) {
  try {
    const body = validate(putSectionSchema, req.body);
    const data = await cmsService.putSection(req.params.section, body.entries, req.user?.id);
    return res.status(200).json({ data });
  } catch (err) {
    return next(err);
  }
}

async function getFaqsPublic(req, res, next) {
  try {
    const data = await cmsService.listFaqsPublic();
    return res.status(200).json({ data });
  } catch (err) {
    return next(err);
  }
}

async function getFaqsManage(req, res, next) {
  try {
    const data = await cmsService.listFaqsManage();
    return res.status(200).json({ data });
  } catch (err) {
    return next(err);
  }
}

async function postFaq(req, res, next) {
  try {
    const body = validate(createFaqSchema, req.body);
    const data = await cmsService.createFaq(body);
    return res.status(201).json({ data });
  } catch (err) {
    return next(err);
  }
}

async function putFaq(req, res, next) {
  try {
    const body = validate(patchFaqSchema, req.body);
    const data = await cmsService.patchFaq(req.params.id, body);
    return res.status(200).json({ data });
  } catch (err) {
    return next(err);
  }
}

async function deleteFaq(req, res, next) {
  try {
    await cmsService.removeFaq(req.params.id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

async function putFaqsReorder(req, res, next) {
  try {
    const body = validate(reorderFaqsSchema, req.body);
    await cmsService.reorderFaqs(body.ids);
    return res.status(200).json({ data: { ok: true } });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getPublicBundle,
  getSection,
  putSection,
  getFaqsPublic,
  getFaqsManage,
  postFaq,
  putFaq,
  deleteFaq,
  putFaqsReorder,
};
