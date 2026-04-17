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
  tags: [
    { name: 'Payments', description: 'MercadoPago checkout, webhook, reconciliation' },
    { name: 'Media', description: 'Media library and room/plan associations' },
    { name: 'SiteContent', description: 'CMS site sections' },
    { name: 'FAQs', description: 'Landing FAQs' },
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
    '/v1/payments/create': {
      post: {
        summary: 'Create MercadoPago preference + payment_attempt',
        tags: ['Payments'],
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'Idempotency-Key', in: 'header', required: true, schema: { type: 'string' } }],
        responses: { 201: { description: 'Created' }, 503: { description: 'MP not configured' } },
      },
    },
    '/v1/payments/webhook': {
      post: {
        summary: 'MercadoPago webhook (no JWT)',
        tags: ['Payments'],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/v1/payments/reconciliation': {
      get: {
        summary: 'Reconcile payment attempts vs MP',
        tags: ['Payments'],
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/v1/media/upload': {
      post: {
        summary: 'Upload media (multipart image)',
        tags: ['Media'],
        security: [{ BearerAuth: [] }],
        responses: { 201: { description: 'Created' } },
      },
    },
    '/v1/media': {
      get: {
        summary: 'List media library',
        tags: ['Media'],
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/v1/media/{id}': {
      delete: {
        summary: 'Delete unused media',
        tags: ['Media'],
        security: [{ BearerAuth: [] }],
        responses: { 204: { description: 'Deleted' }, 409: { description: 'In use' } },
      },
    },
    '/v1/site-content/public': {
      get: {
        summary: 'Public CMS bundle',
        tags: ['SiteContent'],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/v1/site-content/{section}': {
      get: {
        summary: 'Get site content section (admin)',
        tags: ['SiteContent'],
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'OK' } },
      },
      put: {
        summary: 'Replace site content section',
        tags: ['SiteContent'],
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/v1/faqs': {
      get: {
        summary: 'Public active FAQs',
        tags: ['FAQs'],
        responses: { 200: { description: 'OK' } },
      },
      post: {
        summary: 'Create FAQ',
        tags: ['FAQs'],
        security: [{ BearerAuth: [] }],
        responses: { 201: { description: 'Created' } },
      },
    },
    '/v1/faqs/manage': {
      get: {
        summary: 'List all FAQs (admin)',
        tags: ['FAQs'],
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/v1/faqs/reorder': {
      put: {
        summary: 'Reorder FAQs',
        tags: ['FAQs'],
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
