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

    calculateAnnualExpense(exp, year, expHistMap, limitToCurrentMonth = false) {
        let total = 0;
        let billable = 0;
        let unbillable = 0;
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        const monthsToCalculate = (limitToCurrentMonth && year === currentYear) ? currentMonth + 1 : 12;

        const isBillable = exp.billable === 1 || exp.billable === true;

        for (let m = 0; m < monthsToCalculate; m++) {
            const firstOfMonth = new Date(year, m, 1);
            
            const eHist = expHistMap[exp.id] || [];
            const activeExp = eHist.filter(h => new Date(h.date_from) <= firstOfMonth && (!h.date_to || new Date(h.date_to) >= firstOfMonth)).pop();
            const amount = activeExp ? Number(activeExp.amount || 0) : Number(exp.amount || 0);

            let added = false;

            if (!exp.frequency || exp.frequency === 'One-time') {
                const d = new Date(exp.date);
                if (d.getFullYear() === year && d.getMonth() === m) {
                    added = true;
                }
            } else {
                const startDate = new Date(exp.date || new Date());
                const firstOfStart = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

                if (firstOfMonth >= firstOfStart) {
                    if (exp.frequency === 'Monthly') {
                        added = true;
                    } else if (exp.frequency === 'Quarterly') {
                        let config = {};
                        try { config = JSON.parse(exp.recurring_config || '{}'); } catch (e) { }
                        const dates = config.dates;
                        if (dates && dates.length > 0) {
                            if (dates.some(d => parseInt(d.month) - 1 === m)) {
                                added = true;
                            }
                        } else {
                            const startMonth = startDate.getMonth();
                            if ((m + 12 - startMonth) % 3 === 0) {
                                added = true;
                            }
                        }
                    } else if (exp.frequency === 'Yearly') {
                        let config = {};
                        try { config = JSON.parse(exp.recurring_config || '{}'); } catch (e) { }
                        const yearlyMonth = parseInt(config.month || (startDate.getMonth() + 1)) - 1;
                        if (m === yearlyMonth) {
                            added = true;
                        }
                    }
                }
            }

            if (added) {
                total += amount;
                if (isBillable) billable += amount;
                else unbillable += amount;
            }
        }
        return { total, billable, unbillable };
    }
}
