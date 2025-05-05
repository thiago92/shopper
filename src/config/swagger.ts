import { Application } from 'express';
const swaggerUi = require('swagger-ui-express');
import path from 'path';

export const setupSwagger = (app: Application) => {
  const swaggerDocument = {
    openapi: '3.0.0',
    info: {
      title: 'API Shopper',
      version: '1.0.0',
      description: 'Documentação completa da API de medições de água e gás',
      contact: {
        name: 'Suporte Técnico',
        email: 'suporte@shopperapi.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:80',
        description: 'Servidor local'
      },
      {
        url: 'https://api.shopper.com/v1',
        description: 'Produção'
      }
    ],
    tags: [
      {
        name: 'Upload',
        description: 'Operações relacionadas ao envio de medições'
      }
    ],
    paths: {
      '/upload': {
        post: {
          tags: ['Upload'],
          summary: 'Envia imagem do medidor para análise',
          description: 'Processa imagem de medidor via Gemini AI e retorna os valores extraídos',
          operationId: 'uploadMeasurement',
          requestBody: {
            description: 'Dados da medição a ser processada',
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UploadRequest'
                },
                examples: {
                    water: {
                      summary: 'Medição de água',
                      value: {
                        contents: [
                          {
                            parts: [
                              {
                                inlineData: {
                                  mimeType: 'image/png',
                                  data: "iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAYAAAA71pVKAAAACXBIWXMAAA7EAAAOxAGVKw4bAAABHklEQVQoz2NgGAWjgP///wzEAQzIAEFKABoBFbAMjAwMDGDA4f///88DCwkJsA2QBaIZf6aBgYGhlZGRkYGBgY8aNjAwMDLxD1AoIBbQBMjFgAyLA8gGSgwYMBAlA1EDmBqgB9gAhiAGZgWf8nQA8QwMiAsgqgVo2AiOABpF1wBWAVDHDdAACsEgVgAqH8CMJAA6QUwzEAaFWDJgYBBgAQCXUZsDBkiuDwAAAABJRU5ErkJggg=="
                                }
                              },
                              {
                                text: "Esta é uma medição de água."
                              }
                            ]
                          }
                        ],
                        customer_code: "cliente-1",
                        measure_datetime: "2024-05-20T14:30:00Z",
                        measure_type: "WATER"
                      }
                    },
                    gas: {
                      summary: 'Medição de gás',
                      value: {
                        contents: [
                          {
                            parts: [
                              {
                                inlineData: {
                                  mimeType: 'image/png',
                                  data: "iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAYAAAA71pVKAAAACXBIWXMAAA7EAAAOxAGVKw4bAAABHklEQVQoz2NgGAWjgP///wzEAQzIAEFKABoBFbAMjAwMDGDA4f///88DCwkJsA2QBaIZf6aBgYGhlZGRkYGBgY8aNjAwMDLxD1AoIBbQBMjFgAyLA8gGSgwYMBAlA1EDmBqgB9gAhiAGZgWf8nQA8QwMiAsgqgVo2AiOABpF1wBWAVDHDdAACsEgVgAqH8CMJAA6QUwzEAaFWDJgYBBgAQCXUZsDBkiuDwAAAABJRU5ErkJggg=="
                                }
                              },
                              {
                                text: "Esta é uma medição de gás."
                              }
                            ]
                          }
                        ],
                        customer_code: "cliente-1",
                        measure_datetime: "2024-05-20T14:30:00Z",
                        measure_type: "GAS"
                      }
                    },
                  }                  
              }
            }
          },
          responses: {
            200: {
              description: 'Medição processada com sucesso',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/UploadResponse'
                  }
                }
              }
            },
            400: {
              description: 'Dados inválidos ou incompletos',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  },
                  examples: {
                    invalidImage: {
                      value: {
                        error_code: "INVALID_DATA",
                        error_description: "Formato de imagem inválido"
                      }
                    },
                    missingField: {
                      value: {
                        error_code: "MISSING_FIELD",
                        error_description: "O campo 'customer_code' é obrigatório"
                      }
                    }
                  }
                }
              }
            },
            409: {
              description: 'Conflito de dados',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ConflictResponse'
                  }
                }
              }
            },
            500: {
              description: 'Erro interno do servidor',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          },
          security: [
            {
              apiKey: []
            }
          ]
        }
      }
    },
    components: {
      schemas: {
        UploadRequest: {
          type: 'object',
          required: ['contents', 'customer_code', 'measure_type'],
          properties: {
            contents: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  parts: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        inlineData: {
                          type: 'object',
                          properties: {
                            mimeType: { type: 'string', example: 'image/png' },
                            data: {
                              type: 'string',
                              description: 'Imagem em base64 (sem cabeçalho data URI)',
                              example: 'iVBORw0KGgoAAAANSUhEUgAA...'
                            }
                          }
                        },
                        text: {
                          type: 'string',
                          description: 'Texto opcional relacionado à imagem',
                          example: 'Esta é uma medição de água.'
                        }
                      }
                    }
                  }
                }
              }
            },
            customer_code: {
              type: 'string',
              description: 'Código único do cliente',
              example: 'cliente-1'
            },
            measure_datetime: {
              type: 'string',
              format: 'date-time',
              description: 'Data e hora da medição (ISO 8601)',
              example: '2024-05-20T14:30:00Z'
            },
            measure_type: {
              type: 'string',
              enum: ['WATER', 'GAS'],
              description: 'Tipo de medição',
              example: 'WATER'
            }
          }
        },        
        UploadResponse: {
          type: 'object',
          properties: {
            image_url: {
              type: 'string',
              format: 'uri',
              description: 'URL temporária da imagem armazenada',
              example: "https://storage.shopperapi.com/medicoes/550e8400.jpg"
            },
            measure_value: {
              type: 'number',
              description: 'Valor numérico da medição',
              example: 150
            },
            measure_uuid: {
              type: 'string',
              format: 'uuid',
              description: 'Identificador único da medição',
              example: "550e8400-e29b-41d4-a716-446655440000"
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error_code: {
              type: 'string',
              description: 'Código do erro',
              example: "INVALID_DATA"
            },
            error_description: {
              type: 'string',
              description: 'Descrição detalhada do erro',
              example: "O campo 'image' é obrigatório"
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Momento em que o erro ocorreu',
              example: "2024-05-20T14:30:00Z"
            }
          }
        },
        ConflictResponse: {
          type: 'object',
          properties: {
            error_code: {
              type: 'string',
              example: "DUPLICATE_MEASURE"
            },
            error_description: {
              type: 'string',
              example: "Já existe uma medição para este cliente no mês atual"
            },
            existing_measure: {
              $ref: '#/components/schemas/UploadResponse'
            }
          }
        }
      },
      securitySchemes: {
        apiKey: {
          type: 'apiKey',
          name: 'x-api-key',
          in: 'header'
        }
      }
    }
  };

  app.use('/api-docs', 
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      customSiteTitle: "API Shopper - Documentação",
      customfavIcon: "/public/favicon.ico",
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info { margin: 20px 0 }
        .swagger-ui .model-box { background: #f8f9fa }
      `,
      swaggerOptions: {
        defaultModelsExpandDepth: 0,
        displayRequestDuration: true,
        docExpansion: 'list',
        filter: true,
        persistAuthorization: true,
        showCommonExtensions: true
      }
    })
  );

  // Rota alternativa para obter o JSON bruto (útil para integrações)
  app.get('/api-docs-json', (req, res) => {
    res.json(swaggerDocument);
  });
};