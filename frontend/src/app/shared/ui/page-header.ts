import { Component, input } from '@angular/core';

@Component({
  selector: 'page-header',
  template: `
    <div class="flex items-center justify-between gap-4 mb-6">
      <h1 class="text-2xl font-semibold">{{ title() }}</h1>
      <ng-content />
    </div>`,
})
export class PageHeader {
  title = input.required<string>();
}
