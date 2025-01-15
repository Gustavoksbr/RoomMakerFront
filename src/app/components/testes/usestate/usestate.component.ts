import {Component, computed, Input, Signal} from '@angular/core';
import {Comp1Component} from './comp1/comp1.component';
import {Comp2Component} from './comp2/comp2.component';
import {FormsModule} from '@angular/forms';
@Component({
  selector: 'app-usestate',
  standalone: true,
  imports: [
    Comp1Component,
    Comp2Component,
    FormsModule
  ],
  templateUrl: './usestate.component.html',
  styleUrl: './usestate.component.scss'
})
export class UsestateComponent {
public count = 0;
private setCount = (newCount: number) => {
  this.count = newCount;
}
public increment = () => {
  this.setCount(this.count + 1);
}
public decrement = () => {
  this.setCount(this.count - 1);
}
private reset = () => {
  this.setCount(0);
}
}
