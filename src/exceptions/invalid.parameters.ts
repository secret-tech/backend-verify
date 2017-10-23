export default class InvalidParametersException extends Error {
  constructor(public details: any) {
    super(details);
    this.name = 'Invalid request';
  }
}
