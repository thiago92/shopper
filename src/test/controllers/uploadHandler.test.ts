import { describe, it, jest } from '@jest/globals';
import { uploadHandler } from '../../controllers/uploadController';

jest.mock('../../services/GeminiService', () => ({
  analyzeImage: jest.fn()
}));

jest.mock('../../repositories/MeasureRepository', () => ({
  createMeasure: jest.fn()
}));

describe('UploadController', () => {
  it('deve existir a função uploadHandler', () => {
    expect(uploadHandler).toBeDefined();
    expect(typeof uploadHandler).toBe('function');
  });
});