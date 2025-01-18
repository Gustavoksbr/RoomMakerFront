import {ToastrService} from 'ngx-toastr';
import {Injectable} from '@angular/core';
@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerPersonalizado {
    constructor(private toastr : ToastrService) {
    }
    handleError(error:ErrorPersonalizado) {
      console.error('An error occurred:', error);
      this.toastr.error("status code: "+error.status, error.error);
    }
}

export interface ErrorPersonalizado{
  status: string;
  error: string;
}
