import { Pipe, PipeTransform } from '@angular/core';

const people: {[code: number]: string} = {
  1: 'admin'
}

@Pipe({
  name: 'username'
})
export class UsernamePipe implements PipeTransform {

  transform(value: number, ...args: unknown[]): string {
    return people[value];
  }

}
