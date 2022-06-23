export default class InvalidEmailError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidEmailError';
  }
}
