import { Component, input } from '@angular/core';

@Component({
  selector: 'neu-card',
  template: `<div class="bg-neu rounded-neu shadow-neu" [class.p-6]="!compact()" [class.p-4]="compact()"><ng-content /></div>`,
})
export class NeuCard {
  compact = input(false);
}
