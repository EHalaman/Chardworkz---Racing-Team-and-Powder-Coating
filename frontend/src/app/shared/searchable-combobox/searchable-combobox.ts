import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  signal,
} from '@angular/core';

export interface ComboboxOption {
  id: number;
  label: string;
  /** Shown inline next to the label, e.g. a brand tag - matches Inventory's existing "name · brand" pattern. */
  sublabel?: string;
  /** Shown right-aligned in the dropdown row, e.g. a formatted price - kept as a plain string so callers own formatting. */
  meta?: string;
}

/**
 * Generic searchable single-select dropdown, extracted after this codebase's
 * 3rd/4th near-identical hand-rolled instance (Inventory's Receive Stock
 * product picker, Reports' cashier filter, now Products' package-builder
 * Labor field and a service-package edit form) - the same search/dropdown/
 * keyboard-nav/click-outside behavior each one already reimplemented from
 * scratch. A null id clears the selection (matches a plain native
 * `<select><option value="">— None —</option>` escape hatch some call sites need).
 */
@Component({
  selector: 'app-searchable-combobox',
  standalone: false,
  styleUrl: './searchable-combobox.css',
  templateUrl: './searchable-combobox.html',
})
export class SearchableCombobox implements OnChanges {
  @Input() options: ComboboxOption[] = [];
  @Input() placeholder = 'Search…';
  @Input() selectedId: number | null = null;
  @Input() noneLabel: string | null = null;
  @Output() selectedIdChange = new EventEmitter<number | null>();

  readonly searchTerm = signal('');
  readonly isOpen = signal(false);
  readonly highlightedIndex = signal(0);

  @ViewChild('wrapper') private wrapper?: ElementRef<HTMLElement>;

  /**
   * Guarded by `!isOpen()`: the host passes `options` as a fresh array from a
   * plain getter (e.g. Products' `laborComboboxOptions`), so its reference
   * changes on *every* change detection tick, not just real data changes -
   * without this guard, ngOnChanges fired mid-keystroke and reset searchTerm
   * back to '' on every character typed, silently defeating the search
   * filter (results always showed the unfiltered list). Skipping the reset
   * while the dropdown is open means active typing is never interrupted;
   * selectedId/options changes made while the combobox is closed (e.g.
   * Products' startEditPackage prefill) still resolve normally.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['selectedId'] || changes['options']) && !this.isOpen()) {
      const match = this.options.find((o) => o.id === this.selectedId);
      this.searchTerm.set(match ? this.displayLabel(match) : '');
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node;
    if (this.isOpen() && !this.wrapper?.nativeElement.contains(target)) {
      this.isOpen.set(false);
    }
  }

  get results(): ComboboxOption[] {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.options;
    }
    return this.options.filter(
      (o) =>
        o.label.toLowerCase().includes(term) || (o.sublabel ?? '').toLowerCase().includes(term),
    );
  }

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
    this.highlightedIndex.set(0);
    this.isOpen.set(true);
    if (!value && this.selectedId !== null) {
      this.selectedIdChange.emit(null);
    }
  }

  open(): void {
    this.isOpen.set(true);
  }

  select(option: ComboboxOption): void {
    this.searchTerm.set(this.displayLabel(option));
    this.isOpen.set(false);
    this.selectedIdChange.emit(option.id);
  }

  selectNone(): void {
    this.searchTerm.set('');
    this.isOpen.set(false);
    this.selectedIdChange.emit(null);
  }

  onKeydown(event: KeyboardEvent): void {
    const results = this.results;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.isOpen.set(true);
      this.highlightedIndex.update((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.highlightedIndex.update((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const option = results[this.highlightedIndex()];
      if (option) {
        this.select(option);
      }
    } else if (event.key === 'Escape') {
      this.isOpen.set(false);
    }
  }

  private displayLabel(option: ComboboxOption): string {
    return option.sublabel ? `${option.label} · ${option.sublabel}` : option.label;
  }
}
