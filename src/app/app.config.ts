import {ApplicationConfig, ErrorHandler, provideZoneChangeDetection} from '@angular/core';
import { provideRouter } from '@angular/router';
import {HTTP_INTERCEPTORS, provideHttpClient} from '@angular/common/http';
import { JwtInterceptor } from './providers/Interceptors/jwt.interceptor';
import { routes } from './app.routes';
import {GlobalErrorHandler} from './providers/exceptions/GlobalErrorHandler';
import {provideToastr} from 'ngx-toastr';
import {provideAnimations} from '@angular/platform-browser/animations';


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    provideHttpClient(),
    {provide: ErrorHandler, useClass: GlobalErrorHandler},
    provideAnimations(),
    provideToastr()
  ]

};
