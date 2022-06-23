export default class HttpServerStatusError extends Error {
  constructor(message) {
    super(message);
    this.name = 'HttpServerStatusError';
  }
}
