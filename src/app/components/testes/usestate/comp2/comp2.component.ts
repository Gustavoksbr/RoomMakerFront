import {Component, Output, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';


@Component({
  selector: 'app-comp2',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './comp2.component.html',
  styleUrl: './comp2.component.scss'
})
export class Comp2Component {
  public text: string = 'aaa';

  private text2: string = 'bbb';

  public text3 = signal('ccc');
  public setText2 = (newText2: Event) => {
    const inputElement = newText2.target as HTMLInputElement;
    this.text2 = inputElement.value
  }
  public getText2 = () => {
    return this.text2;
  }


}
