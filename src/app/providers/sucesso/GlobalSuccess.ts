import { Injectable, Injector} from '@angular/core';
import {ToastrService} from 'ngx-toastr';
@Injectable({
  providedIn: 'root'
})
export class  GlobalSuccess {
  constructor(private injector : Injector) {
  }
  handleSuccess(message: string): void {
    const toastr = this.injector.get(ToastrService)
    toastr.success(message, 'Sucesso',{
      closeButton: true,
      extendedTimeOut: 5000,
      progressBar: true,
      disableTimeOut: 'extendedTimeOut',
      tapToDismiss: false,
    });


  }
}
