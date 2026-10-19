import { Component, EventEmitter, Event, Prop, State, h } from '@stencil/core';

const UPLOAD_ICON = 'M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3';

@Component({
  tag: 're-file-input-field',
  styleUrl: 're-file-input-field.scss',
  shadow: false,
})
export class ReFileInputField {
  @State() isHovered: boolean = false;
  @State() fileInputField: HTMLInputElement;
  @State() selectedFiles: any;
  @Prop() placeholder: string;
  @Prop() textTitle: string;
  @Prop() subTitle: string;
  @Prop() inputAttributes: any;
  @Prop() inputProps: any;
  @Prop() modelKey: string;
  /** Show a thumbnail for every chosen image. */
  @Prop() preview: boolean = false;
  /** A small "add" button instead of the big drop area (use with `preview` for photos). */
  @Prop() compact: boolean = false;
  /** With `compact`: the button spans the whole width (a dashed "add photo" bar). */
  @Prop() block: boolean = false;
  /** Texts of the drop area and the file list: touch title, add more, replace, remove. */
  @Prop() texts: { tap?: string; addMore?: string; replace?: string; remove?: string } = {};
  @Event() selectedFileChanged: EventEmitter<any>;

  private thumbs = new Map<File, string>();

  disconnectedCallback() {
    this.thumbs.forEach(url => URL.revokeObjectURL(url));
    this.thumbs.clear();
  }

  private thumbOf(file: File): string {
    if (!this.thumbs.has(file)) this.thumbs.set(file, URL.createObjectURL(file));
    return this.thumbs.get(file);
  }

  private get multiple(): boolean {
    return !!((this.inputAttributes && this.inputAttributes.multiple) || (this.inputProps && this.inputProps.multiple));
  }

  private get disabled(): boolean {
    return !!(this.inputProps && this.inputProps.disabled);
  }

  private get files(): File[] {
    return this.selectedFiles && this.selectedFiles.length ? Array.from(this.selectedFiles as FileList) : [];
  }

  private setFiles(files: File[]) {
    const dt = new DataTransfer();
    files.forEach(file => dt.items.add(file));
    this.fileInputField.files = dt.files;
    this.selectedFiles = dt.files;
    this.selectedFileChanged.emit({ [this.modelKey]: dt.files });
  }

  // a field that takes several files adds the new ones to the list; otherwise the new file replaces the old one
  private addFiles(picked: File[]) {
    if (!picked.length) return;
    const isSame = (a: File, b: File) => a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
    const next = this.multiple ? [...this.files, ...picked.filter(file => !this.files.some(current => isSame(current, file)))] : picked.slice(0, 1);
    this.setFiles(next);
  }

  private removeFile(e: Event, index: number) {
    e.preventDefault();
    e.stopPropagation();
    const file = this.files[index];
    if (file && this.thumbs.has(file)) {
      URL.revokeObjectURL(this.thumbs.get(file));
      this.thumbs.delete(file);
    }
    this.setFiles(this.files.filter((_, i) => i !== index));
  }

  private openPicker = () => {
    if (!this.disabled) this.fileInputField.click();
  };

  handleFileFieldDragOver(e: DragEvent) {
    e.preventDefault();
    if (!this.disabled) this.isHovered = true;
  }

  handleFileFieldDragLeave(e: DragEvent) {
    e.preventDefault();
    this.isHovered = false;
  }

  handleFileFieldDrop(e: DragEvent) {
    e.preventDefault();
    this.isHovered = false;
    if (!this.disabled && e.dataTransfer) this.addFiles(Array.from(e.dataTransfer.files));
  }

  handleFileFieldChange(e: any) {
    e.preventDefault();
    this.isHovered = false;
    this.addFiles(Array.from((e.target.files || []) as FileList));
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, '')} MB`;
  }

  private extensionOf(file: File): string {
    const parts = file.name.split('.');
    return parts.length > 1 ? parts.pop().slice(0, 4).toUpperCase() : 'FILE';
  }

  private renderFileThumb(file: File) {
    if (file.type.startsWith('image/')) return <img class="file-card-thumb" src={this.thumbOf(file)} alt="" />;
    if (file.type.startsWith('video/')) return <video class="file-card-thumb" src={`${this.thumbOf(file)}#t=0.1`} muted playsinline preload="metadata"></video>;
    return <span class="file-card-thumb file-card-ext">{this.extensionOf(file)}</span>;
  }

  /** One row per chosen file: a preview (or its type), its name and size, and a remove button. */
  renderFileList() {
    const files = this.files;
    if (!files.length) return null;
    return (
      <ul class="file-list">
        {files.map((file, index) => (
          <li class="file-card" key={`${file.name}-${file.size}-${file.lastModified}`}>
            {this.renderFileThumb(file)}
            <span class="file-card-info">
              <span class="file-card-name" title={file.name}>{file.name}</span>
              <span class="file-card-meta">
                {this.formatSize(file.size)}
                {!this.multiple && !this.disabled && (
                  <button type="button" class="file-card-replace" onClick={this.openPicker}>
                    {this.texts.replace || 'Replace'}
                  </button>
                )}
              </span>
            </span>
            {!this.disabled && (
              <button type="button" class="file-card-remove" aria-label={`${this.texts.remove || 'Remove'} ${file.name}`} onClick={e => this.removeFile(e, index)}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            )}
          </li>
        ))}
      </ul>
    );
  }

  /** Thumbnails of the chosen images, each with a remove button. */
  renderThumbs() {
    const files = this.files;
    if (!files.length) return null;
    return (
      <div class="file-thumbs">
        {files.map((file, index) => (
          <div class="file-thumb" title={file.name}>
            {file.type.startsWith('image/') ? <img src={this.thumbOf(file)} alt={file.name} /> : <span class="file-thumb-name">{file.name}</span>}
            <button type="button" class="file-thumb-remove" aria-label={`${this.texts.remove || 'Remove'} ${file.name}`} onClick={e => this.removeFile(e, index)}>
              ×
            </button>
          </div>
        ))}
      </div>
    );
  }

  private renderInput() {
    return (
      <input
        class="hidden"
        ref={el => (this.fileInputField = el)}
        onChange={e => this.handleFileFieldChange(e)}
        {...this.inputAttributes}
        {...this.inputProps}
      />
    );
  }

  render() {
    if (this.compact) {
      return (
        <div class={`file-compact ${this.block ? 'is-block' : ''}`}>
          {this.preview && this.renderThumbs()}
          <button type="button" class="file-compact-btn" onClick={this.openPicker}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>{this.textTitle || 'Add file'}</span>
          </button>
          {this.renderInput()}
        </div>
      );
    }

    const hasFiles = this.files.length > 0;

    return (
      <div
        class={`file-wrap ${this.isHovered ? 'is-dragging' : ''} ${this.disabled ? 'is-disabled' : ''}`}
        onDragOver={e => this.handleFileFieldDragOver(e)}
        onDragLeave={e => this.handleFileFieldDragLeave(e)}
        onDrop={e => this.handleFileFieldDrop(e)}
      >
        {this.renderFileList()}
        {!hasFiles && (
          <button type="button" class="file-dropzone" disabled={this.disabled} onClick={this.openPicker}>
            <span class="file-dropzone-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d={UPLOAD_ICON} />
              </svg>
            </span>
            <span class="file-dropzone-text">
              <span class="file-dropzone-title file-dropzone-title--pointer">{this.textTitle || 'Click to upload'}</span>
              <span class="file-dropzone-title file-dropzone-title--touch">{this.texts.tap || this.textTitle || 'Tap to upload'}</span>
              <span class="file-dropzone-drag">{this.subTitle || 'or drag and drop'}</span>
            </span>
            {this.placeholder && <span class="file-dropzone-hint">{this.placeholder}</span>}
          </button>
        )}
        {hasFiles && this.multiple && !this.disabled && (
          <button type="button" class="file-add-more" onClick={this.openPicker}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            {this.texts.addMore || 'Add more files'}
          </button>
        )}
        {this.renderInput()}
      </div>
    );
  }
}
