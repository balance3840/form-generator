import { Component, EventEmitter, Fragment, Event, Prop, State, h } from '@stencil/core';

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

  handleFileFieldDragOver(e) {
    e.preventDefault();
    this.isHovered = true;
  }

  handleFileFieldDragLeave(e) {
    e.preventDefault();
    this.isHovered = false;
  }

  handleFileFieldDrop(e) {
    e.preventDefault();
    this.isHovered = false;
    const files = e.dataTransfer.files;
    this.fileInputField.files = files;
    this.selectedFiles = files;
    const modelKey = this.modelKey;
    this.selectedFileChanged.emit({
      [modelKey]: files
    });
  }

  handleFileFieldChange(e) {
    e.preventDefault();
    this.isHovered = false;
    const files = e.target.files;
    this.fileInputField.files = files;
    this.selectedFiles = files;
    const modelKey = this.modelKey;
    this.selectedFileChanged.emit({
      [modelKey]: files
    });
  }

  renderSelectedFiles() {
    return (
      <Fragment>
        {Array.from(this.fileInputField.files).map(file => (
          <Fragment>
            <div class="file-element">
              <span class="font-bold file-name">{file.name}</span>
              <div class="remove-file" onClick={e => this.handleFileFieldClick(e, file)}>
                ×
              </div>
            </div>
          </Fragment>
        ))}
      </Fragment>
    )
  }

  /** Thumbnails of the chosen images, each with a remove button. */
  renderThumbs() {
    const files = this.selectedFiles && this.selectedFiles.length ? Array.from(this.selectedFiles as FileList) : [];
    if (!files.length) return null;
    return (
      <div class="file-thumbs">
        {files.map(file => (
          <div class="file-thumb" title={file.name}>
            {file.type.startsWith('image/') ? <img src={this.thumbOf(file)} alt={file.name} /> : <span class="file-thumb-name">{file.name}</span>}
            <button type="button" class="file-thumb-remove" aria-label={`Remove ${file.name}`} onClick={e => this.handleFileFieldClick(e, file)}>
              ×
            </button>
          </div>
        ))}
      </div>
    );
  }

  handleFileFieldClick(e, file: File) {
    e.preventDefault();
    e.stopPropagation();
    const currentFiles = Array.from(this.fileInputField.files);
    const newFileList = currentFiles.filter(currentFile => currentFile.name !== file.name);
    const dt = new DataTransfer()
    newFileList.map(newFile => {
      dt.items.add(newFile);
    })
    this.fileInputField.files = dt.files;
    this.selectedFiles = dt.files;
    const modelKey = this.modelKey;
    this.selectedFileChanged.emit({
      [modelKey]: dt.files
    });
  }

  render() {
    let dropzoneClass = 'file-dropzone ';
    this.isHovered ? dropzoneClass += 'hover' : '';
    if (this.compact) {
      return (
        <div class={`file-compact ${this.block ? 'is-block' : ''}`}>
          {this.preview && this.renderThumbs()}
          <button type="button" class="file-compact-btn" onClick={() => this.fileInputField.click()}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>{this.textTitle || 'Add file'}</span>
          </button>
          <input class="hidden" ref={el => (this.fileInputField = el)} onChange={e => this.handleFileFieldChange(e)} {...this.inputAttributes} {...this.inputProps} />
        </div>
      );
    }
    return (
      <div class="file-wrap">
      <div class="file-field-container" onClick={(e: any) => {
        if (e.target.className === 'remove-file') {
          e.preventDefault();
          return;
        }
        this.fileInputField.click();
      }}>
        <label
          htmlFor="dropzone-file"
          class={dropzoneClass}
          onDragOver={e => this.handleFileFieldDragOver(e)}
          onDragLeave={e => this.handleFileFieldDragLeave(e)}
          onDrop={e => this.handleFileFieldDrop(e)}
        >
          <div class="dropzone-content">
            <svg
              class="dropzone-icon"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 16"
            >
              <path
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width={2}
                d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
              />
            </svg>
            <p class="dropzone-text">
              <Fragment>
                {this.selectedFiles && this.selectedFiles.length ?
                  this.renderSelectedFiles() : (
                    <Fragment>
                      <span class="font-bold file-name">{this.textTitle || 'Click to upload'}</span> 
                      <span class="file-description">{this.subTitle || 'or drag and drop'}</span>
                    </Fragment>
                  )}
              </Fragment>
            </p>
            <p class="dropzone-subtext">{this.placeholder || 'Documents'}</p>
          </div>
          <input
            class="hidden"
            ref={el => this.fileInputField = el}
            onChange={e => this.handleFileFieldChange(e)}
            {...this.inputAttributes}
            {...this.inputProps}
          />
        </label>
      </div>
      {this.preview && this.renderThumbs()}
      </div>
    );
  }

}
