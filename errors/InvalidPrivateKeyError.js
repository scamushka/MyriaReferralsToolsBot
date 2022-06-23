export default class InvalidPrivateKeyError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidPrivateKeyError';
  }
}
