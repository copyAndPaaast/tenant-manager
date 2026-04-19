import Component from '../js/Component.js';

export default class ExpensesList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            expenses: [],
            buildings: [],
            flats: [],
            loading: true,
            error: null,
            filterYear: new Date().getFullYear(),
            selectedBuildingId: 'all',
            categoriesMap: {}
        };
    }

    async postRender() {
        const yearSelect = document.getElementById('yearFilter');
        if (yearSelect) {
            yearSelect.addEventListener('change', (e) => {
                this.setState({ filterYear: parseInt(e.target.value), loading: true });
                this.postRender();
            });
        }

        const buildingSelect = document.getElementById('expensesBuildingSelect');
        if (buildingSelect) {
            buildingSelect.addEventListener('change', (e) => {
                this.setState({ selectedBuildingId: e.target.value });
            });
        }

        if (!this.state.loading) return;

        try {
            const [expRes, catRes, histRes, buildingsRes, flatsRes] = await Promise.all([
                fetch('/api/expenses'),
                fetch('/api/expense_categories'),
                fetch('/api/expense_history'),
                fetch('/api/buildings'),
                fetch('/api/flats')
            ]);

            if (!expRes.ok) throw new Error(this.t('error_fetch_expenses'));
            const expenses = await expRes.json();
            const categories = catRes.ok ? await catRes.json() : [];
            const history = histRes.ok ? await histRes.json() : [];
            const buildings = buildingsRes.ok ? await buildingsRes.json() : [];
            const flats = flatsRes.ok ? await flatsRes.json() : [];

            const categoriesMap = {};
            categories.forEach(c => categoriesMap[c.id] = c.name);

            const expHistMap = {};
            history.forEach(eh => {
                if (!expHistMap[eh.expense_id]) expHistMap[eh.expense_id] = [];
                expHistMap[eh.expense_id].push(eh);
            });
            Object.values(expHistMap).forEach(arr => arr.sort((a, b) => new Date(a.date_from) - new Date(b.date_from)));

            const selectedBuildingId = buildings.length === 1 ? String(buildings[0].id) : 'all';

            this.setState({
                expenses,
                buildings,
                flats,
                categoriesMap,
                expHistMap,
                selectedBuildingId,
                loading: false
            });
        } catch (err) {
            this.setState({
                error: err.message,
                loading: false
            });
        }
    }

    render() {
        if (this.state.loading) {
            return `<div class="card" style="display: flex; align-items: center; justify-content: center; min-height: 400px;">
                        <h2 style="color: var(--text-secondary); font-weight: 500;">${this.t('loading_expenses')}</h2>
                    </div>`;
        }

        if (this.state.error) {
            return `<div class="card"><h2 style="color: var(--error-color);">${this.t('error')}</h2><p>${this.state.error}</p></div>`;
        }

        // Apply building filter (same logic as dashboard)
        let filteredExpenses = this.state.expenses;
        if (this.state.selectedBuildingId !== 'all') {
            const bIdStr = this.state.selectedBuildingId;
            const flatIdsInBuilding = new Set(
                this.state.flats
                    .filter(f => String(f.building_id) === bIdStr)
                    .map(f => String(f.id))
            );
            filteredExpenses = this.state.expenses.filter(e => {
                const eBId = e.building_id ? String(e.building_id) : null;
                const eFId = e.flat_id ? String(e.flat_id) : null;
                if (eBId === bIdStr) return true;
                if (eFId && flatIdsInBuilding.has(eFId)) return true;
                if (!eBId && !eFId) return true;
                return false;
            });
        }

        const recurring = filteredExpenses.filter(e => e.frequency && e.frequency !== 'One-time');
        const oneTime = filteredExpenses.filter(e => {
            if (!e.frequency || e.frequency === 'One-time') {
                const expenseYear = new Date(e.date).getFullYear();
                return expenseYear === this.state.filterYear;
            }
            return false;
        });

        const calculateRecurringAnnual = (e) => {
            const result = this.calculateAnnualExpense(e, this.state.filterYear, this.state.expHistMap, false);
            return result.total;
        };

        const recurringTotal = recurring.reduce((sum, e) => sum + calculateRecurringAnnual(e), 0);
        const oneTimeTotal = oneTime.reduce((sum, e) => sum + Number(e.amount), 0);

        const currentYear = new Date().getFullYear();
        const years = [];
        for (let y = currentYear - 5; y <= currentYear + 1; y++) years.push(y);

        const buildingSelect = `
            <select id="expensesBuildingSelect" class="input-medium" style="min-width: 220px; font-weight: 600; padding: 10px; border-radius: var(--border-radius-sm); border: 1px solid var(--primary-color); background: rgba(99, 102, 241, 0.05); color: var(--primary-color);">
                <option value="all" ${this.state.selectedBuildingId === 'all' ? 'selected' : ''}>🌍 Alle Gebäude</option>
                ${this.state.buildings.map(b => `<option value="${b.id}" ${String(this.state.selectedBuildingId) === String(b.id) ? 'selected' : ''}>🏢 ${b.address || 'Unbekannt'}</option>`).join('')}
            </select>
        `;

        const renderTable = (list, title, total, isAnnual) => `
            <div class="card" style="padding: 0; overflow: hidden; margin-bottom: 32px; border-top: 4px solid var(--primary-color);">
                <div style="padding: 20px 24px; background: rgba(241, 245, 249, 0.4); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="font-size: 1.25rem; font-weight: 600;">${this.t(title === 'Recurring Expenses' ? 'recurring_expenses' : 'one_time_payments')}</h2>
                    <div style="text-align: right;">
                        <span style="color: var(--text-secondary); font-size: 0.9rem;">${isAnnual ? this.t('total_annual') : this.t('total_sum')}:</span>
                        <strong style="font-size: 1.25rem; color: var(--primary-color); margin-left: 8px;">${this.fCurrency(total)}</strong>
                    </div>
                </div>
                ${list.length === 0 ? `
                    <div style="padding: 40px; text-align: center; color: var(--text-secondary);">${title === 'Recurring Expenses' ? this.t('no_recurring_expenses') : this.t('no_one_time_payments').replace('{year}', this.state.filterYear)}</div>
                ` : `
                    <table>
                        <thead>
                            <tr>
                                <th>${this.t('title')}</th>
                                <th>${this.t('expense_category')}</th>
                                <th>${this.t('amount')}</th>
                                ${isAnnual ? `<th>${this.t('total_annual')}</th>` : ''}
                                <th>${isAnnual ? this.t('recurring') : this.t('date')}</th>
                                <th style="text-align: right;">${this.t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${list.map(e => `
                                <tr>
                                    <td>
                                        <div style="font-weight: 600;">${e.title || this.t('unnamed_expense')}</div>
                                    </td>
                                    <td><span style="font-size: 0.85rem; padding: 4px 8px; background: var(--primary-light); color: var(--primary-color); border-radius: 4px; font-weight: 500;">${this.state.categoriesMap[e.category_id] || this.t('other')}</span></td>
                                    <td>${this.fCurrency(e.amount)} ${isAnnual ? '<span style="color: var(--text-secondary); font-size: 0.8rem; font-weight: normal;">/ ' + this.t(e.frequency.toLowerCase().replace('-', '_')) + '</span>' : ''}</td>
                                    ${isAnnual ? `<td><strong>${this.fCurrency(calculateRecurringAnnual(e))}</strong></td>` : ''}
                                    <td>
                                        ${this.formatTiming(e)}
                                    </td>
                                    <td style="text-align: right;">
                                        <a href="/expenses/${e.id}/edit" data-link class="btn btn-action">${this.t('edit')}</a>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `}
            </div>
        `;

        return `
            <div>
                <header style="margin-bottom: 32px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
                        <div>
                            <h1 style="font-size: 2.25rem; font-weight: 700; letter-spacing: -1px; color: var(--text-primary); margin-bottom: 8px;">${this.t('nav_expenses')}</h1>
                            <p style="color: var(--text-secondary); font-size: 1.1rem;">${this.t('expenses_subtitle')}</p>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            ${this.state.buildings.length > 1 ? buildingSelect : ''}
                            <a href="/expenses/new" data-link class="btn btn-primary">${this.t('add_expense')}</a>
                        </div>
                    </div>
                </header>

                ${renderTable(recurring, "Recurring Expenses", recurringTotal, true)}

                <div class="card" style="padding: 0; overflow: hidden; margin-bottom: 32px; border-top: 4px solid var(--primary-color);">
                    <div style="padding: 20px 24px; background: rgba(241, 245, 249, 0.4); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                        <div style="display: flex; align-items: center; gap: 24px;">
                            <h2 style="font-size: 1.25rem; font-weight: 600;">${this.t('one_time_payments')}</h2>
                            <div style="display: flex; align-items: center; gap: 8px; background: var(--surface-color); padding: 4px 12px; border-radius: 4px; border: 1px solid var(--border-color);">
                                <label for="yearFilter" style="font-weight: 600; font-size: 0.85rem; color: var(--text-secondary);">${this.t('year_label')}</label>
                                <select id="yearFilter" style="padding: 2px 4px; border: none; background: transparent; font-family: inherit; font-size: 0.85rem; font-weight: 600; color: var(--primary-color);">
                                    ${years.reverse().map(y => `<option value="${y}" ${y === this.state.filterYear ? 'selected' : ''}>${y}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <span style="color: var(--text-secondary); font-size: 0.9rem;">${this.t('total_sum')}:</span>
                            <strong style="font-size: 1.25rem; color: var(--primary-color); margin-left: 8px;">€${oneTimeTotal.toFixed(2)}</strong>
                        </div>
                    </div>
                    ${oneTime.length === 0 ? `
                        <div style="padding: 40px; text-align: center; color: var(--text-secondary);">${this.t('no_one_time_payments').replace('{year}', this.state.filterYear)}</div>
                    ` : `
                        <table>
                            <thead>
                                <tr>
                                    <th>${this.t('title')}</th>
                                    <th>${this.t('expense_category')}</th>
                                    <th>${this.t('amount')}</th>
                                    <th>${this.t('date')}</th>
                                    <th style="text-align: right;">${this.t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${oneTime.map(e => `
                                    <tr>
                                        <td>
                                            <div style="font-weight: 600;">${e.title || this.t('unnamed_expense')}</div>
                                        </td>
                                        <td><span style="font-size: 0.85rem; padding: 4px 8px; background: var(--primary-light); color: var(--primary-color); border-radius: 4px; font-weight: 500;">${this.state.categoriesMap[e.category_id] || this.t('other')}</span></td>
                                        <td>€${Number(e.amount).toFixed(2)}</td>
                                        <td>${this.fDate(e.date)}</td>
                                        <td style="text-align: right;">
                                            <a href="/expenses/${e.id}/edit" data-link class="btn btn-action">${this.t('edit')}</a>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `}
                </div>
            </div>
        `;
    }

    formatTiming(e) {
        if (!e.frequency || e.frequency === 'One-time') return e.date;

        let config = {};
        try {
            config = typeof e.recurring_config === 'string' ? JSON.parse(e.recurring_config) : e.recurring_config || {};
        } catch (err) { }

        if (e.frequency === 'Monthly') return `${this.t('monthly')} (${this.t('day_label').replace(' (1-31) *', '')} ${config.day_of_month || '-'})`;
        if (e.frequency === 'Yearly') return `${this.t('yearly')} (${this.getMonthName(config.month)} ${config.day || ''})`;
        if (e.frequency === 'Quarterly') {
            const dates = config.dates || [];
            return `<span title="${dates.map((d, i) => `Q${i + 1}: ${this.getMonthName(d.month)} ${d.day}`).join(', ')}" style="cursor: help; border-bottom: 1px dashed var(--text-secondary);">${this.t('quarterly')} (4 ${this.t('date')})</span>`;
        }
        return this.t(e.frequency.toLowerCase().replace('-', '_'));
    }

    getMonthName(m) {
        return this.t('months_short')[m] || "";
    }
}
