import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'neu-badge',
  template: `<span class="inline-block px-3 py-1 rounded-full text-xs font-semibold shadow-neu-sm bg-neu" [class]="tone()"><ng-content /></span>`,
})
export class NeuBadge {
  kind = input<'ok' | 'warn' | 'danger'>('ok');
  tone = computed(() => ({ ok: 'text-emerald-600', warn: 'text-amber-600', danger: 'text-danger' })[this.kind()]);
}
