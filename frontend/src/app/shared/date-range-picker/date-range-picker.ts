import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  signal,
  ViewChild,
} from '@angular/core';
import {
  addDays,
  addMonths,
  buildMonthGrid,
  CalendarDay,
  formatMonthYear,
  formatShort,
  formatShortWithYear,
  fromIsoDate,
  isAfterDay,
  isSameDay,
  isWithinRange,
  startOfDay,
  startOfMonth,
  startOfYear,
  toIsoDate,
} from '../../core/utils/date-range.util';

export type PresetKey = 'TODAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'YTD' | 'CUSTOM';

interface Preset {
  key: PresetKey;
  label: string;
}

/** Matches reports.ts's own SEARCH_DEBOUNCE_MS pattern - editing Start then End is one logical range change, not two. */
const HEADER_INPUT_DEBOUNCE_MS = 300;

const PRESETS: Preset[] = [
  { key: 'TODAY', label: 'Today' },
  { key: 'LAST_7_DAYS', label: 'Last 7 Days' },
  { key: 'THIS_MONTH', label: 'This Month' },
  { key: 'YTD', label: 'Year to Date' },
  { key: 'CUSTOM', label: 'Custom Range' },
];

/**
 * Dual-month range picker for Sales Reports (security-qa-audit-2026-09-25.md,
 * Ticket 3), replacing the two bare `<input type="date">` fields. Emits a
 * complete, already-normalized (start <= end, both <= today) range on every
 * change - the host component (Reports) just re-runs its query on
 * `rangeChange`, same as it did on the old Apply button.
 */
@Component({
  selector: 'app-date-range-picker',
  standalone: false,
  styleUrl: './date-range-picker.css',
  templateUrl: './date-range-picker.html',
})
export class DateRangePicker implements OnChanges {
  @Input() from = '';
  @Input() to = '';
  @Output() rangeChange = new EventEmitter<{ from: string; to: string }>();

  readonly presets = PRESETS;
  readonly weekdayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  readonly today = startOfDay(new Date());
  readonly todayIso = toIsoDate(this.today);

  readonly isOpen = signal(false);
  readonly leftMonth = signal(startOfMonth(this.today));
  readonly rangeStart = signal<Date | null>(null);
  readonly rangeEnd = signal<Date | null>(null);
  readonly hoverDay = signal<Date | null>(null);
  readonly activePreset = signal<PresetKey | null>(null);

  @ViewChild('wrapper') private wrapper?: ElementRef<HTMLElement>;
  private headerInputDebounceHandle?: ReturnType<typeof setTimeout>;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['from'] || changes['to']) {
      const start = fromIsoDate(this.from) ?? this.today;
      const end = fromIsoDate(this.to) ?? this.today;
      this.rangeStart.set(start);
      this.rangeEnd.set(end);
      this.leftMonth.set(startOfMonth(start));
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isOpen() && !this.wrapper?.nativeElement.contains(event.target as Node)) {
      this.isOpen.set(false);
    }
  }

  get rightMonth(): Date {
    return addMonths(this.leftMonth(), 1);
  }

  get leftMonthLabel(): string {
    return formatMonthYear(this.leftMonth());
  }

  get rightMonthLabel(): string {
    return formatMonthYear(this.rightMonth);
  }

  get leftDays(): CalendarDay[] {
    return buildMonthGrid(this.leftMonth());
  }

  get rightDays(): CalendarDay[] {
    return buildMonthGrid(this.rightMonth);
  }

  get triggerLabel(): string {
    const start = this.rangeStart();
    const end = this.rangeEnd();
    if (!start || !end) {
      return 'Select date range';
    }
    if (isSameDay(start, end)) {
      return formatShortWithYear(start);
    }
    return `${formatShort(start)} – ${formatShortWithYear(end)}`;
  }

  toggle(): void {
    this.isOpen.update((open) => !open);
  }

  prevMonth(): void {
    this.leftMonth.update((m) => addMonths(m, -1));
  }

  nextMonth(): void {
    this.leftMonth.update((m) => addMonths(m, 1));
  }

  isFutureDay(day: Date): boolean {
    return isAfterDay(day, this.today);
  }

  isRangeStart(day: Date): boolean {
    const start = this.rangeStart();
    return !!start && isSameDay(day, start);
  }

  isRangeEnd(day: Date): boolean {
    const end = this.rangeEnd();
    return !!end && isSameDay(day, end);
  }

  /** Includes the live hover preview while a start is picked but no end yet - lets the user see the range they're about to commit to. */
  isInRange(day: Date): boolean {
    const start = this.rangeStart();
    const end = this.rangeEnd() ?? this.hoverDay();
    if (!start || !end) {
      return false;
    }
    return isWithinRange(
      day,
      isAfterDay(start, end) ? end : start,
      isAfterDay(start, end) ? start : end,
    );
  }

  onDayHover(day: Date): void {
    if (this.rangeStart() && !this.rangeEnd()) {
      this.hoverDay.set(day);
    }
  }

  /**
   * Two-click range selection: first click starts a fresh range (clearing
   * any previous end), second click completes it - auto-swapped so the
   * emitted range always satisfies startDate <= endDate (business rule 1)
   * regardless of click order. A future day is inert (business rule 2).
   */
  selectDay(day: Date): void {
    if (this.isFutureDay(day)) {
      return;
    }
    this.activePreset.set(null);
    const start = this.rangeStart();
    const end = this.rangeEnd();
    if (!start || (start && end)) {
      this.rangeStart.set(day);
      this.rangeEnd.set(null);
      this.hoverDay.set(null);
      return;
    }
    const finalStart = isAfterDay(start, day) ? day : start;
    const finalEnd = isAfterDay(start, day) ? start : day;
    this.rangeStart.set(finalStart);
    this.rangeEnd.set(finalEnd);
    this.hoverDay.set(null);
    this.emitRange(finalStart, finalEnd);
  }

  applyPreset(key: PresetKey): void {
    this.activePreset.set(key);
    if (key === 'CUSTOM') {
      // Just drops into manual picking mode - no computed range of its own.
      return;
    }
    let start: Date;
    const end = this.today;
    switch (key) {
      case 'TODAY':
        start = this.today;
        break;
      case 'LAST_7_DAYS':
        start = addDays(this.today, -6);
        break;
      case 'THIS_MONTH':
        start = startOfMonth(this.today);
        break;
      case 'YTD':
        start = startOfYear(this.today);
        break;
    }
    this.rangeStart.set(start);
    this.rangeEnd.set(end);
    this.leftMonth.set(startOfMonth(start));
    this.emitRange(start, end);
  }

  goToToday(): void {
    this.applyPreset('TODAY');
  }

  /** Header inputs let someone type/pick a date directly rather than click through months. Same start<=end normalization as calendar clicks. */
  onStartInput(value: string): void {
    const day = fromIsoDate(value);
    // [max] on the <input> only constrains the native picker's own calendar
    // UI, not what a typed/pasted value delivers via `change` - same future-
    // day guard as onEndInput() and selectDay() enforce.
    if (!day || this.isFutureDay(day)) {
      return;
    }
    this.activePreset.set(null);
    const end = this.rangeEnd() ?? day;
    const finalEnd = isAfterDay(day, end) ? day : end;
    this.rangeStart.set(day);
    this.rangeEnd.set(finalEnd);
    this.leftMonth.set(startOfMonth(day));
    this.emitRangeDebounced(day, finalEnd);
  }

  onEndInput(value: string): void {
    const day = fromIsoDate(value);
    if (!day || this.isFutureDay(day)) {
      return;
    }
    this.activePreset.set(null);
    const start = this.rangeStart() ?? day;
    const finalStart = isAfterDay(start, day) ? day : start;
    this.rangeStart.set(finalStart);
    this.rangeEnd.set(day);
    this.emitRangeDebounced(finalStart, day);
  }

  close(): void {
    this.isOpen.set(false);
  }

  trackByTime(_index: number, day: CalendarDay): number {
    return day.date.getTime();
  }

  startIso(): string {
    const start = this.rangeStart();
    return start ? toIsoDate(start) : '';
  }

  endIso(): string {
    const end = this.rangeEnd();
    return end ? toIsoDate(end) : '';
  }

  private emitRange(start: Date, end: Date): void {
    this.rangeChange.emit({ from: toIsoDate(start), to: toIsoDate(end) });
  }

  /**
   * Editing Start then End is one logical range change, not two - without
   * this, each header <input>'s own `change` event fired its own emit,
   * doubling the report/search requests the old single "Apply" button used
   * to send for a manual two-field edit.
   */
  private emitRangeDebounced(start: Date, end: Date): void {
    clearTimeout(this.headerInputDebounceHandle);
    this.headerInputDebounceHandle = setTimeout(
      () => this.emitRange(this.rangeStart() ?? start, this.rangeEnd() ?? end),
      HEADER_INPUT_DEBOUNCE_MS,
    );
  }
}
