import {ErrorHandler, Injectable, Injector} from '@angular/core';
import {ToastrService} from 'ngx-toastr';
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private injector : Injector) {
  }
  handleError(error: any): void {
    const toastr = this.injector.get(ToastrService)
    console.error('An error occurred:', error);
    toastr.error("status code: "+error.status, error.error);
  }
}
