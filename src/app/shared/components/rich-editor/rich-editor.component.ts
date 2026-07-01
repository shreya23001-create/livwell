import {
  Component, Input, Output, EventEmitter,
  AfterViewInit, OnDestroy, OnChanges, SimpleChanges,
  ViewChild, ElementRef, forwardRef
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import Quill from 'quill';

@Component({
  selector: 'app-rich-editor',
  standalone: true,
  imports: [],
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
    :host ::ng-deep .re-editor ul, :host ::ng-deep .re-editor ol { margin: 0.25em 0 0.25em 1.25em; padding: 0; }
    :host ::ng-deep .re-editor a { color: #1a5c3a; text-decoration: underline; }
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
      const html = this.quill.getSemanticHTML();
      const val = html === '<p></p>' ? '' : html;
      this.onChange(val);
      this.valueChange.emit(val);
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
