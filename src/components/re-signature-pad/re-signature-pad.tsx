import { Component, Event, EventEmitter, Prop, Watch, h } from '@stencil/core';

/** A box to sign in with a finger, pen or mouse. The answer is the signature as a PNG data URL (empty when cleared). */
@Component({
  tag: 're-signature-pad',
  styleUrl: 're-signature-pad.scss',
  shadow: false,
})
export class ReSignaturePad {
  /** The answer key the form stores the signature under. */
  @Prop() modelKey: string;
  /** The current signature (PNG data URL), or empty. */
  @Prop() value: string = '';
  @Prop() disabled: boolean = false;
  /** Height of the box in pixels. */
  @Prop() height: number = 160;
  @Prop() texts: { hint?: string; clear?: string } = {};

  @Event() signatureChanged: EventEmitter<any>;

  private canvas: HTMLCanvasElement;
  private drawing = false;
  private dirty = false;
  private last: { x: number; y: number } = null;

  componentDidLoad() {
    this.setup();
  }

  @Watch('value')
  onValue() {
    // cleared from outside (e.g. the form was reset)
    if (!this.value && this.dirty) this.clearCanvas();
    else if (this.value && !this.dirty) this.paint(this.value);
  }

  private setup() {
    if (!this.canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.max(1, Math.round(rect.width * ratio));
    this.canvas.height = Math.max(1, Math.round(this.height * ratio));
    const ctx = this.canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = getComputedStyle(this.canvas).color || '#111';
    if (this.value) this.paint(this.value);
  }

  private paint(src: string) {
    const ctx = this.canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      const ratio = window.devicePixelRatio || 1;
      ctx.drawImage(img, 0, 0, this.canvas.width / ratio, this.canvas.height / ratio);
      this.dirty = true;
    };
    img.src = src;
  }

  private point(e: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  private start = (e: PointerEvent) => {
    if (this.disabled) return;
    e.preventDefault();
    this.canvas.setPointerCapture(e.pointerId);
    this.drawing = true;
    this.last = this.point(e);
    const ctx = this.canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(this.last.x, this.last.y, 0.6, 0, Math.PI * 2);
    ctx.stroke();
  };

  private move = (e: PointerEvent) => {
    if (!this.drawing) return;
    const ctx = this.canvas.getContext('2d');
    const p = this.point(e);
    ctx.beginPath();
    ctx.moveTo(this.last.x, this.last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    this.last = p;
    this.dirty = true;
  };

  private end = () => {
    if (!this.drawing) return;
    this.drawing = false;
    this.signatureChanged.emit({ [this.modelKey]: this.dirty ? this.canvas.toDataURL('image/png') : '' });
  };

  private clearCanvas() {
    const ctx = this.canvas.getContext('2d');
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();
    this.dirty = false;
  }

  private clear = () => {
    this.clearCanvas();
    this.signatureChanged.emit({ [this.modelKey]: '' });
  };

  render() {
    const signed = !!this.value;
    return (
      <div class={`sig ${this.disabled ? 'is-disabled' : ''}`}>
        <div class="sig-box" style={{ height: `${this.height}px` }}>
          <canvas
            ref={el => (this.canvas = el)}
            class="sig-canvas"
            style={{ height: `${this.height}px` }}
            onPointerDown={this.start}
            onPointerMove={this.move}
            onPointerUp={this.end}
            onPointerCancel={this.end}
            aria-label={this.texts.hint || 'Sign here'}
          ></canvas>
          {!signed && !this.dirty && <span class="sig-hint">{this.texts.hint || 'Sign here'}</span>}
          <span class="sig-line" aria-hidden="true"></span>
        </div>
        {signed && !this.disabled && (
          <button type="button" class="sig-clear" onClick={this.clear}>
            {this.texts.clear || 'Clear'}
          </button>
        )}
      </div>
    );
  }
}
