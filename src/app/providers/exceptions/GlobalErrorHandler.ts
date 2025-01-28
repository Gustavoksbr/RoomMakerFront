import {ErrorHandler, Injectable, Injector} from '@angular/core';
import {ToastrService} from 'ngx-toastr';
import {ErrorPersonalizado} from '../../components/home/ErrorHandlerPersonalizado';
@Injectable({
  providedIn: 'root'
})
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private injector : Injector) {
  }
  handleError(error: any): void {
    const toastr = this.injector.get(ToastrService)
    console.error('An error occurred:', error);
    if (error.error && error.status != null) {
      if(error.error instanceof ProgressEvent){
        toastr.error("status code: "+"500","Erro ao tentar se conectar com o servidor");
      }else {
        toastr.error("status code: " + error.status, error.error);
      }
    }
    else{
      toastr.error("Um erro inesperado ocorreu");
    }
  }
}
