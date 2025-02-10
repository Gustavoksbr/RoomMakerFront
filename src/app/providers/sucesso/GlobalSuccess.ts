import {ErrorHandler, Injectable, Injector} from '@angular/core';
import {AuthService} from '../../services/auth.service';
import {ToastrService} from 'ngx-toastr';
@Injectable({
  providedIn: 'root'
})
export class  GlobalSuccess {
  constructor(private injector : Injector) {
  }
  handleSuccess(message: string): void {
    const toastr = this.injector.get(ToastrService)
    console.log('Sucesso');
    toastr.success(message, 'Sucesso');
  }
}
