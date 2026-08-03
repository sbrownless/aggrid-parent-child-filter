import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CatalogSearchService {
  private readonly searchValue = signal('');

  readonly text = this.searchValue.asReadonly();
  readonly normalizedText = computed(() => this.searchValue().trim().toLowerCase());
  readonly hasText = computed(() => this.searchValue().trim().length > 0);

  setText(value: string) {
    this.searchValue.set((value ?? '').trim());
  }

  clear() {
    this.searchValue.set('');
  }
}