const swaggerUi = require('swagger-ui-express');

const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Sofia Hotel Management API',
    version: '1.0.0',
    description: 'Backend API for Sofia Hotel Management Platform',
  },
  servers: [
    {
      url: '/api',
      description: 'API base path',
    },
  ],
  paths: {
    '/v1/rooms': {
      get: {
        summary: 'List rooms (public or admin with Bearer)',
        tags: ['Rooms'],
        responses: { 200: { description: 'OK' } },
      },
      post: {
        summary: 'Create room (ADMIN)',
        tags: ['Rooms'],
        security: [{ BearerAuth: [] }],
        responses: { 201: { description: 'Created' } },
      },
    },
    '/v1/plans': {
      get: {
        summary: 'List plans',
        tags: ['Plans'],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/v1/optional-activities': {
      get: {
        summary: 'Global optional activities catalog',
        tags: ['OptionalActivities'],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/v1/reservations': {
      get: {
        summary: 'List reservations (RBAC)',
        tags: ['Reservations'],
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'OK' } },
      },
      post: {
        summary: 'Create reservation (idempotent)',
        tags: ['Reservations'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'Idempotency-Key',
            in: 'header',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: { 201: { description: 'Created' }, 200: { description: 'Idempotent replay' } },
      },
    },
    '/v1/inventory/items': {
      get: {
        summary: 'List inventory items',
        tags: ['Inventory'],
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'OK' } },
      },
      post: {
        summary: 'Create inventory item',
        tags: ['Inventory'],
        security: [{ BearerAuth: [] }],
        responses: { 201: { description: 'Created' } },
      },
    },
    '/v1/inventory/movements': {
      post: {
        summary: 'Apply stock movement (idempotent)',
        tags: ['Inventory'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'Idempotency-Key', in: 'header', required: true, schema: { type: 'string' } },
        ],
        responses: { 201: { description: 'Created' }, 200: { description: 'Idempotent replay' } },
      },
    },
    '/v1/suppliers': {
      get: {
        summary: 'List suppliers',
        tags: ['Suppliers'],
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'OK' } },
      },
      post: {
        summary: 'Create supplier',
        tags: ['Suppliers'],
        security: [{ BearerAuth: [] }],
        responses: { 201: { description: 'Created' } },
      },
    },
    '/v1/users': {
      get: {
        summary: 'List users (ADMIN)',
        tags: ['Users'],
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/v1/users/me': {
      get: {
        summary: 'Current user profile',
        tags: ['Users'],
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/v1/business-config': {
      get: {
        summary: 'Business configuration',
        tags: ['BusinessConfig'],
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'OK' } },
      },
      put: {
        summary: 'Update business configuration',
        tags: ['BusinessConfig'],
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/v1/reports/occupancy': {
      get: {
        summary: 'Occupancy report',
        tags: ['Reports'],
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/v1/reports/revenue': {
      get: {
        summary: 'Revenue report (preliminary)',
        tags: ['Reports'],
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/v1/reports/reservations': {
      get: {
        summary: 'Reservations detail report',
        tags: ['Reports'],
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/v1/reports/inventory': {
      get: {
        summary: 'Inventory movements report',
        tags: ['Reports'],
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/health': {
      get: {
        summary: 'Health Check',
        tags: ['System'],
        responses: {
          200: {
            description: 'Service is up',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'UP' },
                        timestamp: { type: 'string', format: 'date-time' },
                        database: { type: 'string', example: 'CONNECTED' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'NOT_FOUND' },
              message: { type: 'string' },
              details: { nullable: true },
            },
          },
        },
      },
    },
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};

function swaggerSetup(app) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

module.exports = swaggerSetup;
