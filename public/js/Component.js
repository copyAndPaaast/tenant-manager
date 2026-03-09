import i18n from './i18n.js';

export default class Component {
    constructor(props = {}) {
        this.props = props;
        this.state = {};
        this.t = i18n.t.bind(i18n);
        this.fCurrency = i18n.formatCurrency.bind(i18n);
        this.fDate = i18n.formatDate.bind(i18n);
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.update();
    }

    mount(container) {
        this.container = container;
        this.update();
    }

    update() {
        if (!this.container) return;

        // Simple rendering by updating innerHTML
        // For more advanced usage, you might use a diffing logic or lit-html
        this.container.innerHTML = this.render();
        this.postRender();
    }

    // Override down the line to add event listeners, setup plugins, etc.
    postRender() {
        // E.g. this.container.querySelector('button').addEventListener(...)
    }

    // Must be implemented by child classes
    // Should return a HTML string representing the view
    render() {
        return `<div></div>`;
    }
}
