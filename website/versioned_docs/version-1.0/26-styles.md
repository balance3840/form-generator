---
title: "Styles"
sidebar_position: 26
---

You can overwrite default input fields style. For example:

```css
                 
.input__label {
  font-size: 20px !important;
  color: blue;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}
.submit-container__button {
  background-color: blue !important;
}
```

### Default styling

#### Form generator

```css
.input__description {
  color: #6c757d;
  font-size: 13px;
  margin: 0;
}
.re-form-generator {
  width: calc(100% - 40px);
  border: 1px solid #000 3b;
  padding: 20px;
  border-radius: 20px;
  background: #fff;
  /* Rounded sliders */
}
.re-form-generator .select-input {
  position: relative;
  appearance: none;
  -webkit-appearance: none;
  width: 100%;
  font-size: 14px;
  height: 44px;
  padding: 0.675em 6em 0.675em 1em;
  background-color: #fff;
  border: 1px solid #caced1;
  border-radius: 0.25rem;
  color: #000;
  cursor: pointer;
}
.re-form-generator .select-input::after, .re-form-generator .select-input::before {
  content: "";
  position: absolute;
  right: 1rem;
  pointer-events: none;
}
.re-form-generator .select-input::before {
  border-left: 0.3rem solid transparent;
  border-right: 0.3rem solid transparent;
  border-bottom: 0.3rem solid black;
  top: 40%;
}
.re-form-generator .select-input::after {
  border-left: 0.3rem solid transparent;
  border-right: 0.3rem solid transparent;
  border-top: 0.3rem solid black;
  top: 55%;
}
.re-form-generator .group-title {
  font-size: 24px;
  padding-bottom: 6px;
  margin-bottom: 20px;
  border-bottom: 1px solid #cbd5e1;
}
.re-form-generator textarea {
  resize: none;
  height: 90px;
  font-size: 14px;
  line-height: 17px;
  color: #252733;
  background: #fafafa;
  padding: 12px;
  border: 1px solid #e3e8eb;
  border-radius: 5px;
  width: 100%;
  font-size: 14px;
  color: #252733;
  box-sizing: border-box;
  font-family: inherit;
}
.re-form-generator .input-text, .re-form-generator .input-email, .re-form-generator .input-date, .re-form-generator .input-number, .re-form-generator .select-input {
  background: #fafafa;
  padding: 12px;
  border: 1px solid #e3e8eb;
  border-radius: 5px;
  width: 100%;
  font-size: 14px;
  color: #252733;
  box-sizing: border-box;
  font-family: inherit;
  height: 43px;
}
.re-form-generator .input-text.input-checkbox, .re-form-generator .input-email.input-checkbox, .re-form-generator .input-date.input-checkbox, .re-form-generator .input-number.input-checkbox, .re-form-generator .select-input.input-checkbox {
  height: 18px;
  width: 18px;
  background-color: #eee;
  margin: 0;
}
.re-form-generator .row-container {
  display: flex;
  gap: 10px;
  flex-grow: 12;
}
@media (max-width: 768px) {
  .re-form-generator .row-container {
    display: block;
  }
}
.re-form-generator .row-container .col-1 {
  width: calc((100% / 12) * 1);
}
.re-form-generator .row-container .col-2 {
  width: calc((100% / 12) * 2);
}
.re-form-generator .row-container .col-3 {
  width: calc((100% / 12) * 3);
}
.re-form-generator .row-container .col-4 {
  width: calc((100% / 12) * 4);
}
.re-form-generator .row-container .col-5 {
  width: calc((100% / 12) * 5);
}
.re-form-generator .row-container .col-6 {
  width: calc((100% / 12) * 6);
}
.re-form-generator .row-container .col-7 {
  width: calc((100% / 12) * 7);
}
.re-form-generator .row-container .col-8 {
  width: calc((100% / 12) * 8);
}
.re-form-generator .row-container .col-9 {
  width: calc((100% / 12) * 9);
}
.re-form-generator .row-container .col-10 {
  width: calc((100% / 12) * 10);
}
.re-form-generator .row-container .col-11 {
  width: calc((100% / 12) * 11);
}
.re-form-generator .row-container .col-12 {
  width: calc((100% / 12) * 12);
}
@media (max-width: 768px) {
  .re-form-generator .row-container .col-1 {
    width: 100%;
  }
  .re-form-generator .row-container .col-2 {
    width: 100%;
  }
  .re-form-generator .row-container .col-3 {
    width: 100%;
  }
  .re-form-generator .row-container .col-4 {
    width: 100%;
  }
  .re-form-generator .row-container .col-5 {
    width: 100%;
  }
  .re-form-generator .row-container .col-6 {
    width: 100%;
  }
  .re-form-generator .row-container .col-7 {
    width: 100%;
  }
  .re-form-generator .row-container .col-8 {
    width: 100%;
  }
  .re-form-generator .row-container .col-9 {
    width: 100%;
  }
  .re-form-generator .row-container .col-10 {
    width: 100%;
  }
  .re-form-generator .row-container .col-11 {
    width: 100%;
  }
  .re-form-generator .row-container .col-12 {
    width: 100%;
  }
}
.re-form-generator .input__label {
  font-weight: 700;
  font-size: 14px;
  line-height: 20px;
  margin-bottom: 12px;
  display: inline-block;
}
.re-form-generator .error-message {
  font-size: 12px;
  color: #ff6868;
}
.re-form-generator .switch {
  position: relative;
  display: inline-block;
  width: 45px;
  height: 25px;
}
.re-form-generator .switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.re-form-generator .slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #83888f;
  transition: 0.4s;
  transition: 0.4s;
}
.re-form-generator .slider:before {
  position: absolute;
  content: "";
  height: 21px;
  width: 21px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: 0.4s;
  transition: 0.4s;
}
.re-form-generator input:checked + .slider {
  background-color: #2196f3;
}
.re-form-generator input:checked + .slider:before {
  transform: translateX(20px);
}
.re-form-generator input:focus + .slider {
  box-shadow: 0 0 1px #2196f3;
}
.re-form-generator .slider.round {
  border-radius: 34px;
}
.re-form-generator .slider.round:before {
  border-radius: 50%;
}
.re-form-generator .input-group {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 0 0 16px 0;
  font-weight: 700;
  font-size: 14px;
  line-height: 20px;
}
.re-form-generator .input-group.hasErrors input, .re-form-generator .input-group.hasErrors .multi-select, .re-form-generator .input-group.hasErrors .select-input {
  border: 1.5px solid #ff6868;
  border-radius: 5px;
}
.re-form-generator .input-group.hasErrors .file-field-container {
  border: 1.5px solid #ff6868;
  border-radius: 5px;
}
.re-form-generator .input-group.input-checkbox-container {
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  justify-content: start;
  gap: 0.5rem;
}
.re-form-generator .input-group.input-checkbox-container .input__label {
  margin-bottom: 0px;
  margin-left: 6px;
  font-weight: normal;
}
.re-form-generator .input-group.input-checkbox-container .error-message {
  flex-basis: 100%;
  position: absolute;
  bottom: 0px;
}
.re-form-generator .input-group.input-checkbox-container.hasErrors {
  margin-bottom: 16px;
}
.re-form-generator .input-group.input-checkboxGroup-container .checkboxGroup .label {
  margin-bottom: 0px;
  margin-left: 6px;
  font-weight: normal;
}
.re-form-generator .input-group.two-columns {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
.re-form-generator .submit-container {
  display: flex;
  margin-top: 16px;
}
.re-form-generator .submit-container__button {
  padding: 10px 20px;
  font-size: 16px;
  border: none;
  border-radius: 5px;
  background-color: #2196f3;
  color: #fff;
  cursor: pointer;
  transition: background-color 0.3s ease;
  width: 100%;
}
.re-form-generator .submit-container__button:hover {
  background-color: #1565c0;
}
.re-form-generator .radioGroup {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.re-form-generator .radioGroup-element {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  align-items: center;
}
.re-form-generator .radioGroup-element .label {
  font-weight: normal;
}
.re-form-generator .radioGroup .input-radio {
  padding: 2px;
  margin: 0;
}
.re-form-generator .hidden {
  display: none;
}
.re-form-generator .form-error-message {
  display: flex;
  justify-content: center;
  align-items: center;
}
.re-form-generator .form-error-message__message {
  color: #ff6868;
  font-size: 12px;
  font-weight: 700;
}
```

#### File input

```css
        
re-file-input-field .file-field-container {
  width: 100%;
  display: flex;
}
re-file-input-field .file-field-container .file-dropzone {
  width: 100%;
  height: 16rem;
  border: 1px dashed #e3e8eb;
  border-radius: 5px;
  background-color: #fafafa;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s, border-color 0.3s;
}
re-file-input-field .file-field-container .file-dropzone.hover {
  background-color: #e5e7eb;
  border-color: #9ca3af;
}
re-file-input-field .file-field-container .file-dropzone.hover .dropzone-icon, re-file-input-field .file-field-container .file-dropzone.hover .dropzone-text, re-file-input-field .file-field-container .file-dropzone.hover .dropzone-subtext {
  color: #252733;
}
re-file-input-field .file-field-container .file-dropzone:hover {
  background-color: #f9fafb;
}
re-file-input-field .file-field-container .file-dropzone:hover .dropzone-icon {
  color: #9ca3af;
}
re-file-input-field .file-field-container .file-dropzone:hover .dropzone-text, re-file-input-field .file-field-container .file-dropzone:hover .dropzone-subtext {
  color: #6b7280;
}
re-file-input-field .file-field-container .file-dropzone.dark {
  background-color: #374151;
  border-color: #4b5563;
}
re-file-input-field .file-field-container .file-dropzone.dark:hover {
  background-color: #4b5563;
  border-color: #6b7280;
}
re-file-input-field .file-field-container .file-dropzone.dark .dropzone-icon, re-file-input-field .file-field-container .file-dropzone.dark .dropzone-text, re-file-input-field .file-field-container .file-dropzone.dark .dropzone-subtext {
  color: #9ca3af;
}
re-file-input-field .file-field-container .file-dropzone .dropzone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 1.25rem;
  padding-bottom: 1.5rem;
  font-weight: normal;
}
re-file-input-field .file-field-container .file-dropzone .dropzone-icon {
  width: 2rem;
  height: 2rem;
  margin-bottom: 1rem;
  color: #6b7280;
  transition: color 0.3s;
}
re-file-input-field .file-field-container .file-dropzone .dropzone-text {
  margin-bottom: 0.5rem;
  color: #6b7280;
  transition: color 0.3s;
  display: flex;
  gap: 8px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
re-file-input-field .file-field-container .file-dropzone .dropzone-text .file-element {
  display: flex;
  gap: 8px;
  color: #252733;
}
re-file-input-field .file-field-container .file-dropzone .font-bold {
  font-weight: bold;
}
re-file-input-field .file-field-container .file-dropzone .dropzone-subtext {
  font-size: 0.8rem;
  color: #6b7280;
  transition: color 0.3s;
}
re-file-input-field .file-field-container .file-dropzone .remove-file {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #ff6868;
  color: white;
  text-align: center;
  line-height: 20px;
  font-size: 14px;
  font-weight: bold;
}
re-file-input-field .file-field-container .file-dropzone .file-name {
  font-weight: bold;
  max-width: 250px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
```

#### Multiselect

```css
re-multi-select .multi-select {
  position: relative;
  width: 100%;
  background: #fafafa;
  font-weight: normal;
}
re-multi-select .multi-select__header {
  padding: 10px;
  border: 1px solid #e3e8eb;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  border-radius: 5px;
}
re-multi-select .multi-select__header.disabled {
  pointer-events: none;
  background-color: #ddd;
}
re-multi-select .multi-select__header .selected_options {
  display: flex;
  justify-content: row;
  flex-wrap: wrap;
  gap: 0.5rem;
}
re-multi-select .multi-select__header .selected_options__option {
  background-color: #2196f3;
  border-radius: 5px;
  color: #fff;
  padding: 0rem 0.5rem;
  font-size: 11px;
  font-weight: 400;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}
re-multi-select .multi-select__header .selected_options__option-close {
  padding: 0 0.25rem;
}
re-multi-select .multi-select__options {
  position: absolute;
  width: calc(100% - 2px);
  border: 1px solid #e3e8eb;
  border-top: none;
  max-height: 150px;
  overflow-y: auto;
  background: #fff;
  z-index: 1;
  margin: 0;
  padding: 0;
  border-bottom-left-radius: 5px;
  border-bottom-right-radius: 5px;
}
re-multi-select .multi-select__option {
  padding: 10px;
  cursor: pointer;
}
re-multi-select .multi-select__option.selected {
  background-color: #f0f0f0;
}
re-multi-select .multi-select__option:not(.selected):hover {
  background-color: #2196f3;
  color: #fff;
}
re-multi-select .multi-select__option:last-of-type {
  border-bottom-left-radius: 5px;
  border-bottom-right-radius: 5px;
}
re-multi-select .multi-select .arrow-up::before {
  content: '▲';
}
re-multi-select .multi-select .arrow-down::before {
  content: '▼';
}
re-multi-select .multi-select .arrow {
  font-size: 0.63rem;
  padding: 0 0.25rem;
}
```

#### Country select

```css
        
re-form-generator re-country-select .country-select-input-wrapper {
  position: relative;
  width: 100%;
  height: 43px;
}
re-form-generator re-country-select .country-select-input-wrapper .dropdown-container {
  position: absolute;
  width: 100%;
  max-height: 300px;
  background: #fff;
}
re-form-generator re-country-select .country-select-input-wrapper .dropdown-container::-webkit-scrollbar {
  display: none;
}
re-form-generator re-country-select .country-select-input-wrapper .dropdown-container .selected-country-wrapper {
  position: relative;
  font-size: 14px;
  font-weight: normal;
  width: 100%;
  height: 100%;
  pointer-events: none;
  display: block;
}
re-form-generator re-country-select .country-select-input-wrapper .dropdown-container .selected-country-wrapper .selected-flag {
  transform: translateY(-50%) scale(0.8);
  width: 24px;
  position: absolute;
  left: 10px;
  top: 20px;
  display: block;
}
re-form-generator re-country-select .country-select-input-wrapper .dropdown-container .selected-country-wrapper .selected-country-value {
  position: absolute;
  top: 11px;
  left: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
  width: -webkit-fill-available;
  text-wrap: nowrap;
  margin-right: 5px;
  display: block;
}
re-form-generator re-country-select .country-select-input-wrapper .dropdown-container .selected-country-wrapper.hidden {
  display: none;
}
re-form-generator re-country-select .country-select-input-wrapper .country-search {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #e3e8eb;
  padding: 10px;
  text-indent: 26px;
  border-radius: 5px;
  height: 43px;
  font-family: unset;
  text-indent: 26px;
  background: #fafafa;
}
re-form-generator re-country-select .country-select-input-wrapper .country-search input::placeholder {
  font-family: unset;
}
re-form-generator re-country-select .country-select-input-wrapper .country-search.no-indent {
  text-indent: 0px;
}
re-form-generator re-country-select .country-select-input-wrapper input::placeholder {
  font-family: 'Times-Roman';
}
re-form-generator re-country-select .country-select-input-wrapper .dropdown {
  position: absolute;
  top: 40px;
  width: 100%;
  border: 1px solid #e3e8eb;
  background-color: white;
  overflow-y: auto;
  display: none;
}
re-form-generator re-country-select .country-select-input-wrapper .dropdown-item {
  padding: 10px;
  cursor: pointer;
  border: 0.5px solid #e3e8eb;
  border-top: 0px;
  background: #fff;
  font-weight: normal;
}
re-form-generator re-country-select .country-select-input-wrapper .dropdown-item:last-of-type {
  border-bottom: 0px;
}
re-form-generator re-country-select .country-select-input-wrapper .dropdown-item:hover {
  background: #f0f0f0;
}
re-form-generator re-country-select .country-select-input-wrapper .flag {
  width: 20px;
  height: 15px;
  margin-right: 10px;
}
re-form-generator re-country-select .country-select-input-wrapper .country-select-dropdown-wrapper {
  overflow-y: scroll;
  max-height: 200px;
  border-bottom: 1px solid #e3e8eb;
  border-bottom-left-radius: 5px;
  border-bottom-right-radius: 5px;
}
re-form-generator re-country-select .country-select-input-wrapper .country-select-dropdown-wrapper::-webkit-scrollbar {
  display: none;
}
```
