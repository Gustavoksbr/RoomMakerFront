import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import {AuthGuard} from './guards/auth.guard';
import {HomeComponent} from './components/home/home.component';
import {ListarSalasComponent} from './components/salas/listar-salas/listar-salas.component';
import {EntrarSalaComponent} from './components/salas/entrar-sala/entrar-sala.component';
import {CriarSalaComponent} from './components/salas/criar-sala/criar-sala.component';
import {HackerComponent} from './components/testes/hacker/hacker.component';
import {SuasSalasComponent} from './components/salas/suas-salas/suas-salas.component';
import {ForgetComponent} from './components/auth/forget/forget.component';
import {GeralComponent} from './components/testes/geral/geral.component';
// import {WsComponent} from './components/testes/ws/ws.component';
// import {Ws2Component} from './components/testes/ws2/ws2.component';
// import {UsestateComponent} from './components/testes/usestate/usestate.component';
// import {ChatTesteComponent} from './components/testes/chat-teste/chat-teste.component';
// import {MultiplecomponentsComponent} from './components/testes/multiplecomponents/multiplecomponents.component';



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
  // { path: '', redirectTo: 'salas', pathMatch: 'full', canActivate: [AuthGuard] },
  // { path: 'protected', component: HomeComponent, canActivate: [AuthGuard] },
  {path:'salas', component: ListarSalasComponent, canActivate: [AuthGuard]},
  {path:"salas/:usernameDono/:nomeSala", component: EntrarSalaComponent, canActivate: [AuthGuard]},
  {path:"criar-sala", component: CriarSalaComponent, canActivate: [AuthGuard]},
  {path:"suas-salas", component: SuasSalasComponent, canActivate: [AuthGuard]},
  // {path:"forget", component: ForgetComponent},


  {path:"testes/geral", component: GeralComponent},
  // {path:"testes/ws", component: WsComponent},
  // {path:"testes/ws2",component:Ws2Component},
  // {path:"testes/useState",component:UsestateComponent},
  // {path:"testes/chatTeste",component:ChatTesteComponent},
  // {path:"testes/ws3", component: MultiplecomponentsComponent}
  // {path:"testes/hacker", component: HackerComponent}
  {path:'**', redirectTo: 'default', pathMatch: 'full'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
