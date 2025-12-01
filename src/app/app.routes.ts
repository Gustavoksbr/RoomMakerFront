import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import {AuthGuard} from './guards/auth.guard';
import {ListarSalasComponent} from './components/salas/listar-salas/listar-salas.component';
import {EntrarSalaComponent} from './components/salas/entrar-sala/entrar-sala.component';
import {CriarSalaComponent} from './components/salas/criar-sala/criar-sala.component';
import {SuasSalasComponent} from './components/salas/suas-salas/suas-salas.component';
import {ForgetComponent} from './components/auth/forget/forget.component';



export  const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: '',
    redirectTo: 'default',
    pathMatch: 'full',
  },
  {
    path: 'default',
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'salas', pathMatch: 'full' },
    ],
  },
  {path:'salas', component: ListarSalasComponent, canActivate: [AuthGuard]},
  {path:"salas/:usernameDono/:nomeSala", component: EntrarSalaComponent, canActivate: [AuthGuard]},
  {path:"criar-sala", component: CriarSalaComponent, canActivate: [AuthGuard]},
  {path:"suas-salas", component: SuasSalasComponent, canActivate: [AuthGuard]},
   {path:"forget", component: ForgetComponent},

  {path:'**', redirectTo: 'default', pathMatch: 'full'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
