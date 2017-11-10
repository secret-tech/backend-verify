export class InvalidParametersException extends Error {
  constructor(public details: any) {
    super(details);
    this.name = 'Invalid request';
  }
}

export class NotFoundException extends Error {

}
