import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOnTheScreen(): R;
      toHaveDisplayValue(value: string | RegExp | (string | RegExp)[]): R;
      toHaveProp(prop: string, value?: any): R;
      toHaveStyle(style: object | object[]): R;
      toHaveTextContent(text: string | RegExp): R;
    }
  }
}