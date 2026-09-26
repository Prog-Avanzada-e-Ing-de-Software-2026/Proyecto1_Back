import { HttpException, HttpStatus } from '@nestjs/common';

export class EntityNotFoundException extends HttpException {
  constructor(entityName: string, id?: number) {
    const subject =
      id === undefined ? entityName : `${entityName} con ID ${id}`;
    super(`${subject}, no existe o fue eliminada`, HttpStatus.NOT_FOUND);
  }
}
