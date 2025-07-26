/**
 * Basic test to verify Jest setup is working correctly
 */

describe('Jest Setup', () => {
  it('should be able to run basic tests', () => {
    expect(true).toBe(true);
  });

  it('should have access to testing utilities', () => {
    expect(jest).toBeDefined();
    expect(expect).toBeDefined();
  });

  it('should handle async operations', async () => {
    const asyncOperation = () => Promise.resolve('test');
    const result = await asyncOperation();
    expect(result).toBe('test');
  });
});