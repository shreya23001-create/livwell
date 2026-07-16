import {
  Component, Input, Output, EventEmitter,
  AfterViewInit, OnDestroy, OnChanges, SimpleChanges,
  ViewChild, ElementRef, forwardRef, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import Quill from 'quill';

@Component({
  selector: 'app-rich-editor',
  standalone: true,
  imports: [CommonModule],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => RichEditorComponent),
    multi: true
  }],
  template: `
    <div class="re-wrap">
      <div class="re-toolbar">
        <button type="button" class="re-btn" (mousedown)="fmt($event,'bold')" title="Bold"><b>B</b></button>
        <button type="button" class="re-btn re-italic" (mousedown)="fmt($event,'italic')" title="Italic"><i>I</i></button>
        <button type="button" class="re-btn re-underline" (mousedown)="fmt($event,'underline')" title="Underline"><u>U</u></button>
        <span class="re-sep"></span>
        <button type="button" class="re-btn" (mousedown)="fmtList($event,'ordered')" title="Ordered list">1.</button>
        <button type="button" class="re-btn" (mousedown)="fmtList($event,'bullet')" title="Bullet list">•—</button>
        <span class="re-sep"></span>
        <button type="button" class="re-btn" (mousedown)="fmtHeader($event,2)" title="Heading">H2</button>
        <button type="button" class="re-btn" (mousedown)="fmtHeader($event,3)" title="Sub-heading">H3</button>
        <span class="re-sep"></span>
        <button type="button" class="re-btn" (mousedown)="insertLink($event)" title="Link">🔗</button>
        <button type="button" class="re-btn" (mousedown)="insertTable($event)" title="Insert Table">⊞</button>
        <button type="button" class="re-btn re-del-table" (mousedown)="deleteTable($event)" title="Delete Table" [class.re-del-table--active]="hasAnyTable()">🗑</button>
        <button type="button" class="re-btn" (mousedown)="clearFmt($event)" title="Clear">✕</button>
      </div>
      <div #editorEl class="re-editor"></div>
    </div>
  `,
  styles: [`
    .re-wrap {
      border: 1.5px solid #e5e7eb; border-radius: 0.5rem; overflow: hidden; background: #fff;
      &:focus-within { border-color: #1a5c3a; }
    }
    .re-toolbar {
      display: flex; align-items: center; gap: 2px; padding: 6px 8px;
      background: #f9fafb; border-bottom: 1px solid #e5e7eb; flex-wrap: wrap;
    }
    .re-btn {
      padding: 3px 8px; border: 1px solid transparent; border-radius: 4px;
      background: none; cursor: pointer; font-size: 0.8rem; color: #374151;
      line-height: 1.4; min-width: 28px; text-align: center;
      &:hover { background: #e5e7eb; }
      &.active { background: #dcfce7; color: #1a5c3a; border-color: #bbf7d0; }
      &.re-del-table { color: #9ca3af; pointer-events: none; opacity: 0.5; }
      &.re-del-table--active { color: #dc2626; pointer-events: auto; opacity: 1; &:hover { background: #fee2e2; } }
    }
    .re-italic { font-style: italic; }
    .re-underline { text-decoration: underline; }
    .re-sep { width: 1px; height: 18px; background: #e5e7eb; margin: 0 3px; }
    .re-editor {
      padding: 10px 12px; min-height: 130px; font-size: 0.875rem;
      color: #111827; font-family: inherit; outline: none;
    }
    :host ::ng-deep .re-editor p { margin: 0 0 0.4em; }
    :host ::ng-deep .re-editor h2 { font-size: 1.1rem; font-weight: 700; margin: 0.5em 0 0.25em; }
    :host ::ng-deep .re-editor h3 { font-size: 0.95rem; font-weight: 700; margin: 0.5em 0 0.25em; }
    :host ::ng-deep .ql-editor ul,
    :host ::ng-deep .ql-editor ol { padding-left: 1.5em !important; margin: 0.25em 0; }

    /* Quill bullet list — data-list="bullet" */
    :host ::ng-deep .ql-editor li[data-list="bullet"] {
      list-style-type: disc !important;
      display: list-item !important;
    }
    :host ::ng-deep .ql-editor li[data-list="bullet"]::before {
      content: none !important;
    }

    /* Quill ordered list — data-list="ordered" */
    :host ::ng-deep .ql-editor li[data-list="ordered"] {
      list-style-type: decimal !important;
      display: list-item !important;
    }
    :host ::ng-deep .ql-editor li[data-list="ordered"]::before {
      content: none !important;
    }

    /* Counter reset for ordered lists */
    :host ::ng-deep .ql-editor ol { counter-reset: list-0; }
    :host ::ng-deep .ql-editor li[data-list="ordered"] { counter-increment: list-0; }
    :host ::ng-deep .re-editor a { color: #1a5c3a; text-decoration: underline; }
    :host ::ng-deep .ql-editor table { width: 100%; border-collapse: collapse; margin: 0.75em 0; }
    :host ::ng-deep .ql-editor th,
    :host ::ng-deep .ql-editor td { border: 1px solid #d1d5db; padding: 0.4rem 0.6rem; text-align: left; min-width: 60px; }
    :host ::ng-deep .ql-editor th { background: #f0fdf4; font-weight: 700; }
    :host ::ng-deep .ql-editor { padding: 0; min-height: 130px; }
    :host ::ng-deep .ql-editor.ql-blank::before { color: #9ca3af; font-style: normal; left: 0; }
    :host ::ng-deep .ql-container { border: none; font-size: 0.875rem; font-family: inherit; }
  `]
})
export class RichEditorComponent implements AfterViewInit, OnChanges, OnDestroy, ControlValueAccessor {
  @ViewChild('editorEl') editorEl!: ElementRef;
  @Input() placeholder = 'Write something…';
  @Input() initialValue = '';
  @Output() valueChange = new EventEmitter<string>();

  cursorInTable = signal(false);
  hasAnyTable = signal(false);

  private quill!: Quill;
  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};
  private pendingValue: string | null = null;

  ngAfterViewInit() {
    this.quill = new Quill(this.editorEl.nativeElement, {
      theme: 'snow',
      placeholder: this.placeholder,
      modules: { toolbar: false }
    });

    const init = this.pendingValue ?? this.initialValue;
    if (init) this.quill.clipboard.dangerouslyPasteHTML(init);

    this.quill.on('text-change', () => {
      const raw = this.quill.getSemanticHTML();
      const html = raw.replace(/<br\s*\/?>/gi, ' ').replace(/\s{2,}/g, ' ');
      const val = html === '<p></p>' ? '' : html;
      this.onChange(val);
      this.valueChange.emit(val);
      this.hasAnyTable.set(!!this.editorEl.nativeElement.querySelector('table'));
    });

    this.quill.on('selection-change', () => {
      const range = this.quill.getSelection();
      if (!range) { this.cursorInTable.set(false); return; }
      const [leaf] = (this.quill as any).getLeaf(range.index);
      const el: HTMLElement | null = leaf?.domNode;
      this.cursorInTable.set(!!el?.closest('table'));
      this.hasAnyTable.set(!!this.editorEl.nativeElement.querySelector('table'));
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialValue'] && this.quill) {
      const newVal = changes['initialValue'].currentValue || '';
      const cur = this.quill.getSemanticHTML();
      if (cur !== newVal) {
        if (newVal) this.quill.clipboard.dangerouslyPasteHTML(newVal);
        else this.quill.setText('');
      }
    } else if (changes['initialValue']) {
      this.pendingValue = changes['initialValue'].currentValue;
    }
  }

  fmt(e: MouseEvent, format: string) {
    e.preventDefault();
    const cur = this.quill.getFormat();
    this.quill.format(format, !cur[format]);
  }

  fmtList(e: MouseEvent, type: string) {
    e.preventDefault();
    const cur = this.quill.getFormat();
    this.quill.format('list', cur['list'] === type ? false : type);
  }

  fmtHeader(e: MouseEvent, level: number) {
    e.preventDefault();
    const cur = this.quill.getFormat();
    this.quill.format('header', cur['header'] === level ? false : level);
  }

  insertLink(e: MouseEvent) {
    e.preventDefault();
    const url = prompt('Enter URL:');
    if (url) {
      const range = this.quill.getSelection();
      if (range) this.quill.format('link', url);
    }
  }

  insertTable(e: MouseEvent) {
    e.preventDefault();
    const rows = parseInt(prompt('Rows (including header):') || '3', 10) || 3;
    const cols = parseInt(prompt('Columns:') || '3', 10) || 3;
    const headerCells = Array.from({ length: cols }, (_, i) =>
      `<td style="background:#f0fdf4;font-weight:700;padding:6px 10px;border:1px solid #d1d5db;">Header ${i + 1}</td>`
    ).join('');
    const bodyCell = `<td style="padding:6px 10px;border:1px solid #d1d5db;">&nbsp;</td>`;
    const bodyRow = Array.from({ length: cols }, () => bodyCell).join('');
    const bodyRows = Array.from({ length: rows - 1 }, () => `<tr>${bodyRow}</tr>`).join('');
    const tableHtml = `<table style="width:100%;border-collapse:collapse;margin:0.75em 0;"><tbody><tr>${headerCells}</tr>${bodyRows}</tbody></table><p><br></p>`;
    const range = this.quill.getSelection(true);
    this.quill.clipboard.dangerouslyPasteHTML(range.index, tableHtml);
  }

  deleteTable(e: MouseEvent) {
    e.preventDefault();
    // Try cursor position first, then fall back to any table in the editor
    let table: HTMLElement | null = null;
    const range = this.quill.getSelection();
    if (range) {
      const [leaf] = (this.quill as any).getLeaf(range.index);
      table = leaf?.domNode?.closest('table') ?? null;
    }
    if (!table) {
      table = this.editorEl.nativeElement.querySelector('table');
    }
    if (!table) return;
    table.remove();
    this.cursorInTable.set(false);
    this.hasAnyTable.set(!!this.editorEl.nativeElement.querySelector('table'));
    const html = this.quill.getSemanticHTML();
    const val = html === '<p></p>' ? '' : html;
    this.onChange(val);
    this.valueChange.emit(val);
  }

  clearFmt(e: MouseEvent) {
    e.preventDefault();
    const range = this.quill.getSelection();
    if (range) this.quill.removeFormat(range.index, range.length);
  }

  writeValue(val: string): void {
    if (this.quill) {
      if (val) this.quill.clipboard.dangerouslyPasteHTML(val);
      else this.quill.setText('');
    } else {
      this.pendingValue = val;
    }
  }

  registerOnChange(fn: (v: string) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  ngOnDestroy() { this.quill?.off('text-change'); }
}
