import { v4 as uuid } from 'uuid';

export class Controls {

    protected _controlsElement: HTMLFormElement;

    public constructor() {
        const container = document.getElementById('controls-container');
        this._controlsElement = document.createElement('form');
        this._controlsElement.onsubmit = (ev) => {
            ev.preventDefault();
            return false;
        };
        container.appendChild(this._controlsElement);
        const canvas = document.getElementById('webgl-canvas');
        new ResizeObserver(()=>{
            container.style.height = canvas.clientHeight + 'px';
        }).observe(canvas);
    }

    private createGenericRangedInput(
        label: string,
        type: string,
        placeholder = '',
        value?: number,
        description?: string,
        min?: number,
        max?: number,
        step?: number,
        id?: string
    ): HTMLInputElement {
        const rangedInput = this.createGenericInput(
            label, type, placeholder, description, id);
        rangedInput.min = String(min);
        rangedInput.max = String(max);
        rangedInput.step = String(step);
        rangedInput.value = String(value);
        return rangedInput;
    }

    protected createLabel(
        label: string,
        htmlFor: string
    ): HTMLLabelElement {
        const labelElement = document.createElement('label');
        labelElement.htmlFor = htmlFor;
        labelElement.innerText = label;
        this._controlsElement.appendChild(labelElement);
        return labelElement;
    }

    protected createDescription(
        description: string
    ): HTMLElement {
        const smallId = uuid();
        const smallElement = document.createElement('small');
        smallElement.className = 'form-text text-muted';
        smallElement.innerText = description;
        smallElement.id = smallId;
        this._controlsElement.appendChild(smallElement);
        return smallElement;
    }

    protected createInput(
        label: string,
        createMainElement: () => HTMLElement,
        description?: string,
        id?: string
    ): HTMLElement {
        if (!id) {
            id = uuid();
        }

        if(label) {
            this.createLabel(label, id);
        }

        const inputElement = createMainElement();
        inputElement.id = id;
        this._controlsElement.appendChild(inputElement);

        if (description) {
            const smallElement = this.createDescription(description);
            inputElement.setAttribute('aria-describedby', smallElement.id);
        }

        return inputElement;
    }

    public createActionButton(
        label: string,
        description?: string,
        id?: string
    ): HTMLButtonElement {
        const buttonElement = this.createGenericInput(
            undefined, 'button', undefined, description, id);
        buttonElement.value = label;
        buttonElement.classList.add('btn');
        buttonElement.classList.add('btn-primary');

        return buttonElement as HTMLButtonElement;
    }

    public createGenericInput(
        label: string,
        type = 'text',
        placeholder = '',
        description?: string,
        id?: string
    ): HTMLInputElement {
        const createMainElement = (): HTMLInputElement => {
            const inputElement = document.createElement('input');
            inputElement.id = id;
            inputElement.className = 'form-control';
            inputElement.type = type;
            inputElement.placeholder = placeholder;
            this._controlsElement.appendChild(inputElement);
            return inputElement;
        };

        const inputElement =
            this.createInput(label, createMainElement, description, id);

        return inputElement as HTMLInputElement;
    }

    public createSelectListInput(
        label: string,
        options: string[],
        description?: string,
        id?: string
    ): HTMLSelectElement {

        const createMainElement = (): HTMLSelectElement => {
            const selectElement = document.createElement('select');
            selectElement.id = id;
            selectElement.className = 'form-control';
            this._controlsElement.appendChild(selectElement);

            options.forEach( (element) => {
                const optionElement  = document.createElement('option');
                optionElement.innerHTML = element;
                selectElement.appendChild(optionElement);
            });
            return selectElement;
        };

        const inputElement =
            this.createInput(label, createMainElement, description, id);

        return inputElement as HTMLSelectElement;
    }

    public createTextInput(
        label: string,
        placeholder = '',
        description?: string,
        id?: string
    ): HTMLInputElement {
        return this.createGenericInput(
            label, 'text', placeholder, description, id);
    }

    public createColorInput(
        label: string,
        placeholder = '',
        description?: string,
        id?: string
    ): HTMLInputElement {
        return this.createGenericInput(
            label, 'color', placeholder, description, id);
    }

    public createNumberInput(
        label: string,
        placeholder = '',
        value?: number,
        description?: string,
        min?: number,
        max?: number,
        step?: number,
        id?: string
    ): HTMLInputElement {
        return this.createGenericRangedInput(
            label, 'number', placeholder, value, description,
            min, max, step, id);
    }

    public createSliderInput(
        label: string,
        placeholder = '',
        value?: number,
        description?: string,
        min?: number,
        max?: number,
        step?: number,
        id?: string
    ): HTMLInputElement {
        const sliderInput = this.createGenericRangedInput(
            label, 'range', placeholder, value, description,
            min, max, step, id);
        sliderInput.classList.add('custom-range');
        return sliderInput;
    }

    public createFileInput(
        label: string,
        accept?: string,
        multiple = false,
        placeholder = '',
        description?: string,
        id?: string
    ): HTMLInputElement {
        const fileInput = this.createGenericInput(
            label, 'file', placeholder, description, id);
        fileInput.accept = accept;
        fileInput.multiple = multiple;

        const wrapper = document.createElement('div');
        wrapper.classList.add('fileInputWrapper');
        fileInput.parentElement.replaceChild(wrapper, fileInput);

        const button = this.createActionButton('Datei auswählen');
        wrapper.appendChild(button);
        wrapper.appendChild(fileInput);

        button.onclick = () => fileInput.click();
        fileInput.onchange = () => {
            button.value = Array.from(fileInput.files)
                .map((file) => file.name)
                .join('; ');
        };

        return fileInput;
    }
}
