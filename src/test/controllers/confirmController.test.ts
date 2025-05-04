import { describe, it } from '@jest/globals';
import { confirmHandler } from '../../controllers/confirmController';

describe('ConfirmController', () => {
  it('deve existir a função confirmHandler', () => {
    expect(confirmHandler).toBeDefined();
    expect(typeof confirmHandler).toBe('function');
  });
});