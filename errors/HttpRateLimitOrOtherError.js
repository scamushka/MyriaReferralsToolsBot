export default class HttpRateLimitOrOtherError extends Error {
  constructor(message) {
    super(message);
    this.name = 'HttpRateLimitOrOtherError';
  }
}
