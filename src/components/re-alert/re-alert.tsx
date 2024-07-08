import { Component, h, Prop, State } from '@stencil/core';

@Component({
  tag: 're-alert',
  styleUrl: 're-alert.scss',
  shadow: false,
})
export class ReAlert {
  @State() isVisible: boolean = true;

  @Prop() message: string;
  @Prop() type: 'success' | 'warning' | 'error' | 'info' = 'info';

  dismissAlert = () => {
    this.isVisible = false;
  }

  render() {
    return (
      this.isVisible && (
        <div class={`alert ${this.type}`}>
          <span>{this.message}</span>
          <button class="close-btn" onClick={this.dismissAlert}>&times;</button>
        </div>
      )
    );
  }
}
