import Component from '../js/Component.js';

export default class ExpenseForm extends Component {
    constructor(props) {
        super(props);
        this.isEdit = props.params && props.params[0] && props.params[0] !== 'new';
        this.expenseId = this.isEdit ? props.params[0] : null;

        this.state = {
            loading: true,
            saving: false,
            saved: false,
            error: null,
            buildings: [],
            flats: [],
            contractors: [],
            expenseHistory: [],
            editingHistoryId: null,
            expense: {
                title: '',
                description: '',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                flat_id: '',
                building_id: '',
                contractor_id: '',
                frequency: 'One-time',
                payment_method: 'Manual',
                recurring_config: null,
                billable: 0,
                category_id: ''
            },
            categories: []
        };
    }

    async postRender() {
        if (!this.state.loading) {
            const form = document.getElementById('expenseForm');
            if (form) form.addEventListener('submit', this.handleSubmit.bind(this));

            const addExpenseHistoryForm = document.getElementById('addExpenseHistoryForm');
            if (addExpenseHistoryForm) addExpenseHistoryForm.addEventListener('submit', this.handleAddHistory.bind(this));

            document.querySelectorAll('.delete-history-btn').forEach(btn => {
                btn.addEventListener('click', this.handleDeleteHistory.bind(this));
            });

            const frequencySelect = document.getElementById('frequency');
            if (frequencySelect) {
                frequencySelect.addEventListener('change', (e) => {
                    this.setState({
                        expense: { ...this.state.expense, frequency: e.target.value }
                    });
                });
            }

            document.querySelectorAll('.edit-history-btn').forEach(btn => {
                btn.addEventListener('click', (e) => this.setState({ editingHistoryId: e.target.dataset.id }));
            });

            document.querySelectorAll('.cancel-history-btn').forEach(btn => {
                btn.addEventListener('click', () => this.setState({ editingHistoryId: null }));
            });

            document.querySelectorAll('.save-history-btn').forEach(btn => {
                btn.addEventListener('click', this.handleSaveHistory.bind(this));
            });

            return;
        }

        try {
            // Fetch everything we might need for dropdowns
            const [bRes, fRes, cRes, catRes] = await Promise.all([
                fetch('/api/buildings'),
                fetch('/api/flats'),
                fetch('/api/contractors'),
                fetch('/api/expense_categories')
            ]);

            const buildings = await bRes.ok ? await bRes.json() : [];
            const flats = await fRes.ok ? await fRes.json() : [];
            const contractors = await cRes.ok ? await cRes.json() : [];
            const categories = await catRes.ok ? await catRes.json() : [];

            let expense = this.state.expense;
            let expenseHistory = [];

            if (this.isEdit) {
                const [expRes, histRes] = await Promise.all([
                    fetch(`/api/expenses/${this.expenseId}`),
                    fetch(`/api/expense_history?expense_id=${this.expenseId}`)
                ]);

                if (!expRes.ok) throw new Error(this.t('error_fetch_expense'));
                expense = await expRes.json();

                if (histRes.ok) {
                    expenseHistory = await histRes.json();
                }

                if (expense.recurring_config) {
                    try {
                        expense.recurring_config = JSON.parse(expense.recurring_config);
                    } catch (e) {
                        expense.recurring_config = {};
                    }
                }
            }

            this.setState({
                buildings,
                flats,
                contractors,
                categories,
                expense,
                expenseHistory,
                loading: false
            });
        } catch (err) {
            this.setState({
                error: err.message,
                loading: false
            });
        }
    }

    async handleAddHistory(e) {
        e.preventDefault();
        const payload = {
            expense_id: this.expenseId,
            date_from: document.getElementById('new_hist_date').value,
            date_to: document.getElementById('new_hist_date_to').value || null,
            amount: document.getElementById('new_hist_amount').value
        };

        try {
            const res = await fetch('/api/expense_history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error(this.t('error_log_price_change'));

            this.setState({ loading: true });
            this.postRender();
        } catch (err) {
            alert(err.message);
        }
    }

    async handleSaveHistory(e) {
        const id = e.target.dataset.id;
        const payload = {
            expense_id: this.expenseId,
            date_from: document.getElementById(`edit_hist_date_${id}`).value,
            date_to: document.getElementById(`edit_hist_date_to_${id}`).value || null,
            amount: document.getElementById(`edit_hist_amount_${id}`).value
        };

        try {
            const res = await fetch(`/api/expense_history/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error(this.t('error_update_history_entry'));
            this.setState({ editingHistoryId: null, loading: true });
            this.postRender();
        } catch (err) {
            alert(err.message);
        }
    }

    async handleDeleteHistory(e) {
        if (!confirm(this.t('confirm_delete_history'))) return;
        const id = e.target.dataset.id;
        try {
            const res = await fetch(`/api/expense_history/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(this.t('error_delete_history_entry'));
            this.setState({ loading: true });
            this.postRender();
        } catch (err) {
            alert(err.message);
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        const frequency = document.getElementById('frequency').value;
        let recurring_config = null;

        if (frequency === 'Monthly') {
            recurring_config = JSON.stringify({ day_of_month: document.getElementById('day_of_month').value });
        } else if (frequency === 'Quarterly') {
            recurring_config = JSON.stringify({
                dates: [
                    { month: document.getElementById('q1_month').value, day: document.getElementById('q1_day').value },
                    { month: document.getElementById('q2_month').value, day: document.getElementById('q2_day').value },
                    { month: document.getElementById('q3_month').value, day: document.getElementById('q3_day').value },
                    { month: document.getElementById('q4_month').value, day: document.getElementById('q4_day').value }
                ]
            });
        } else if (frequency === 'Yearly') {
            recurring_config = JSON.stringify({
                month: document.getElementById('yearly_month').value,
                day: document.getElementById('yearly_day').value
            });
        }

        const payload = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            amount: document.getElementById('amount').value,
            date: document.getElementById('date') ? document.getElementById('date').value : `${new Date().getFullYear()}-01-01`,
            frequency: frequency,
            payment_method: document.getElementById('payment_method').value,
            flat_id: document.getElementById('flat_id').value || null,
            building_id: document.getElementById('building_id').value || null,
            contractor_id: document.getElementById('contractor_id').value || null,
            recurring_config: recurring_config,
            billable: document.getElementById('billable').checked ? 1 : 0,
            category_id: document.getElementById('category_id').value || null
        };

        this.setState({ saving: true, error: null });

        try {
            const method = this.isEdit ? 'PUT' : 'POST';
            const url = this.isEdit ? `/api/expenses/${this.expenseId}` : '/api/expenses';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(this.t('error_save_expense'));

            const data = await response.json();
            if (!this.isEdit) {
                this.isEdit = true;
                this.expenseId = data.id;
                window.history.replaceState(null, null, `/expenses/${data.id}/edit`);
            }
            this.setState({ saving: false, saved: true });
            setTimeout(() => this.setState({ saved: false }), 2500);
        } catch (err) {
            this.setState({ saving: false, error: err.message });
        }
    }

    getMonthOptions(selected) {
        const months = this.t('months');
        return months.map((m, i) => `<option value="${i + 1}" ${selected == i + 1 ? 'selected' : ''}>${m}</option>`).join('');
    }

    render() {
        if (this.state.loading) {
            return `<div class="card" style="display: flex; align-items: center; justify-content: center; min-height: 400px;">
                        <h2 style="color: var(--text-secondary); font-weight: 500;">${this.t('loading')}</h2>
                    </div>`;
        }

        const buildingOptions = this.state.buildings.map(b =>
            `<option value="${b.id}" ${this.state.expense.building_id == b.id ? 'selected' : ''}>${b.address}</option>`
        ).join('');

        const flatOptions = this.state.flats.map(f => {
            const building = this.state.buildings.find(b => b.id === f.building_id);
            const bName = building ? building.address : this.t('unknown');
            return `<option value="${f.id}" ${this.state.expense.flat_id == f.id ? 'selected' : ''}>${f.name_number} (${bName})</option>`;
        }).join('');

        const contractorOptions = this.state.contractors.map(c =>
            `<option value="${c.id}" ${this.state.expense.contractor_id == c.id ? 'selected' : ''}>${c.name}</option>`
        ).join('');

        const categoryOptions = this.state.categories.map(c =>
            `<option value="${c.id}" ${this.state.expense.category_id == c.id ? 'selected' : ''}>${c.name}</option>`
        ).join('');

        const historySection = this.isEdit ? `
            <div class="card" style="margin-top: 24px; max-width: 800px; padding: 0; overflow: hidden;">
                <div style="padding: 24px; border-bottom: 1px solid var(--border-color);">
                    <h2 style="font-size: 1.25rem; font-weight: 600;">${this.t('price_history')}</h2>
                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 4px;">${this.t('track_price_changes')}</p>
                </div>
                ${this.state.expenseHistory?.length === 0 ? `<div style="padding: 24px;"><p style="color: var(--text-secondary);">${this.t('no_price_history')}</p></div>` : `
                    <table>
                        <thead>
                            <tr>
                                <th>${this.t('date_from')}</th>
                                <th>${this.t('end_date')}</th>
                                <th>${this.t('amount')}</th>
                                <th style="text-align: right;">${this.t('delete')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(this.state.expenseHistory || []).map(r => {
            const isEditing = this.state.editingHistoryId == r.id;
            if (isEditing) {
                return `
                    <tr>
                        <td><input type="date" id="edit_hist_date_${r.id}" value="${r.date_from}" class="table-input"></td>
                        <td><input type="date" id="edit_hist_date_to_${r.id}" value="${r.date_to || ''}" class="table-input"></td>
                        <td style="text-align: right; white-space: nowrap;" colspan="2">
                            <input type="number" step="0.01" id="edit_hist_amount_${r.id}" value="${r.amount}" class="table-input input-number" style="display: inline-block;">
                            <button class="btn btn-sm btn-primary save-history-btn" data-id="${r.id}" style="margin-left: 4px;">${this.t('save')}</button>
                            <button class="btn btn-sm btn-secondary cancel-history-btn" style="margin-left: 4px;">${this.t('cancel')}</button>
                        </td>
                    </tr>
                `;
            }
            return `
                                <tr>
                                    <td>${this.fDate(r.date_from)}</td>
                                    <td>${r.date_to ? this.fDate(r.date_to) : '-'}</td>
                                    <td><strong>${this.fCurrency(r.amount)}</strong></td>
                                    <td style="text-align: right; white-space: nowrap;">
                                        <button class="btn btn-sm btn-action edit-history-btn" data-id="${r.id}" style="margin-right: 4px;">${this.t('edit')}</button>
                                        <button class="btn btn-sm btn-danger delete-history-btn" data-id="${r.id}">${this.t('delete')}</button>
                                    </td>
                                </tr>
                            `;
        }).join('')}
                        </tbody>
                    </table>
                `}
                <div style="padding: 24px; background: rgba(248, 250, 252, 0.4); border-top: 1px solid var(--border-color);">
                    <h3 style="font-size: 0.9rem; margin-bottom: 16px; font-weight: 600; text-transform: uppercase; color: var(--text-secondary);">${this.t('track_new_price')}</h3>
                    <form id="addExpenseHistoryForm" style="display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 16px; align-items: end;">
                        <div class="form-group" style="margin-bottom: 0;">
                            <label for="new_hist_date">${this.t('date_from')}</label>
                            <input type="date" id="new_hist_date" class="input-date" required value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label for="new_hist_date_to">${this.t('end_date')}</label>
                            <input type="date" id="new_hist_date_to" class="input-date">
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label for="new_hist_amount">${this.t('amount')} (€)</label>
                            <input type="number" step="0.01" id="new_hist_amount" class="input-number" required placeholder="0.00">
                        </div>
                        <button type="submit" class="btn btn-primary">${this.t('add')}</button>
                    </form>
                </div>
            </div>
        ` : '';

        return `
            <div>
                <header style="margin-bottom: 32px; display: flex; align-items: center; gap: 16px;">
                    <a href="/expenses" data-link style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; background: var(--surface-color); border: 1px solid var(--border-color); color: var(--text-secondary);">&larr;</a>
                    <div>
                        <h1 style="font-size: 2.25rem; font-weight: 700; letter-spacing: -1px; color: var(--text-primary); margin-bottom: 4px;">${this.isEdit ? this.t('edit_expense') : this.t('add_new_expense')}</h1>
                        <p style="color: var(--text-secondary); font-size: 1.1rem;">${this.isEdit ? this.t('update_details') : this.t('enter_building_details')}</p>
                    </div>
                </header>

                <div style="display: grid; grid-template-columns: 1fr; gap: 24px; align-items: start;">
                    <div class="card" style="max-width: 800px;">
                        ${this.state.error ? `<div style="padding: 12px; margin-bottom: 20px; background: rgba(239, 68, 68, 0.1); color: var(--error-color); border-radius: var(--border-radius-sm);">${this.state.error}</div>` : ''}
                        
                        <form id="expenseForm">
                            <div class="form-group">
                                <label for="title">${this.t('title')} *</label>
                                <input type="text" id="title" class="input-long" required value="${this.state.expense.title || ''}" placeholder="${this.t('repair_sink_placeholder')}" ${this.state.saving ? 'disabled' : ''}>
                            </div>

                            <div class="form-group">
                                <label for="description">${this.t('description_label')}</label>
                                <textarea id="description" class="input-long" style="min-height: 140px;" placeholder="${this.t('description_placeholder')}" ${this.state.saving ? 'disabled' : ''}>${this.state.expense.description || ''}</textarea>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr; gap: 16px;">
                                <div class="form-group">
                                    <label for="amount">${this.t('amount')} (€) *</label>
                                    <div style="display: flex; gap: 16px; align-items: center;">
                                        <input type="number" step="0.01" id="amount" class="input-number" required value="${this.state.expense.amount || ''}" placeholder="0.00" ${this.state.saving ? 'disabled' : ''}>
                                        <div style="display: flex; align-items: center; gap: 8px; user-select: none; cursor: pointer;">
                                            <input type="checkbox" id="billable" ${this.state.expense.billable ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--primary-color);">
                                            <label for="billable" style="margin: 0; font-size: 0.9rem; font-weight: 600; color: var(--text-primary);">${this.t('billable')}</label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr; gap: 16px; margin-top: 16px;">
                                <div style="display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-start; background: rgba(241, 245, 249, 0.4); padding: 20px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color);">
                                    <div class="form-group" style="margin-bottom: 0; min-width: 160px;">
                                        <label for="frequency">${this.t('interval_frequency')}</label>
                                        <select id="frequency" class="input-medium" ${this.state.saving ? 'disabled' : ''}>
                                            <option value="One-time" ${this.state.expense.frequency === 'One-time' ? 'selected' : ''}>${this.t('one_time')}</option>
                                            <option value="Monthly" ${this.state.expense.frequency === 'Monthly' ? 'selected' : ''}>${this.t('monthly')}</option>
                                            <option value="Quarterly" ${this.state.expense.frequency === 'Quarterly' ? 'selected' : ''}>${this.t('quarterly')}</option>
                                            <option value="Yearly" ${this.state.expense.frequency === 'Yearly' ? 'selected' : ''}>${this.t('yearly')}</option>
                                        </select>
                                    </div>

                                    <div id="dynamic-frequency-fields" style="display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start;">
                                        ${this.state.expense.frequency === 'One-time' ? `
                                            <div class="form-group" style="margin-bottom: 0;">
                                                <label for="date">${this.t('date')} *</label>
                                                <input type="date" id="date" class="input-date" required value="${this.state.expense.date || ''}" ${this.state.saving ? 'disabled' : ''}>
                                            </div>
                                        ` : ''}

                                        ${this.state.expense.frequency === 'Monthly' ? `
                                            <div class="form-group" style="margin-bottom: 0;">
                                                <label for="day_of_month">${this.t('day_label')}</label>
                                                <input type="number" id="day_of_month" class="input-short" min="1" max="31" required value="${this.state.expense.recurring_config?.day_of_month || '1'}" ${this.state.saving ? 'disabled' : ''}>
                                            </div>
                                        ` : ''}

                                        ${this.state.expense.frequency === 'Quarterly' ? `
                                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; max-width: 440px;">
                                                ${[1, 2, 3, 4].map(q => `
                                                    <div style="display: flex; gap: 6px; align-items: flex-start;">
                                                        <div class="form-group" style="margin-bottom: 0; flex: 1;">
                                                            <label for="q${q}_month" style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Q${q} ${this.t('month')}</label>
                                                            <select id="q${q}_month" style="width: 100%; min-width: 110px;" ${this.state.saving ? 'disabled' : ''}>
                                                                ${this.getMonthOptions(this.state.expense.recurring_config?.dates?.[q - 1]?.month)}
                                                            </select>
                                                        </div>
                                                        <div class="form-group" style="margin-bottom: 0; width: 65px;">
                                                            <label for="q${q}_day" style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">${this.t('day')}</label>
                                                            <input type="number" id="q${q}_day" min="1" max="31" value="${this.state.expense.recurring_config?.dates?.[q - 1]?.day || '1'}" style="width: 100%;" ${this.state.saving ? 'disabled' : ''}>
                                                        </div>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        ` : ''}

                                        ${this.state.expense.frequency === 'Yearly' ? `
                                            <div style="display: flex; gap: 12px; align-items: flex-end;">
                                                <div class="form-group" style="margin-bottom: 0;">
                                                    <label for="yearly_month">${this.t('month')}</label>
                                                    <select id="yearly_month" style="width: 130px;" ${this.state.saving ? 'disabled' : ''}>
                                                        ${this.getMonthOptions(this.state.expense.recurring_config?.month)}
                                                    </select>
                                                </div>
                                                <div class="form-group" style="margin-bottom: 0;">
                                                    <label for="yearly_day">${this.t('day')}</label>
                                                    <input type="number" id="yearly_day" min="1" max="31" value="${this.state.expense.recurring_config?.day || '1'}" style="width: 70px;" ${this.state.saving ? 'disabled' : ''}>
                                                </div>
                                            </div>
                                        ` : ''}
                                    </div>

                                    <div class="form-group" style="margin-bottom: 0; min-width: 180px;">
                                        <label for="payment_method">${this.t('payment_method_label')}</label>
                                        <select id="payment_method" class="input-medium" ${this.state.saving ? 'disabled' : ''}>
                                            <option value="Manual" ${this.state.expense.payment_method === 'Manual' ? 'selected' : ''}>${this.t('manual_transfer')}</option>
                                            <option value="Auto" ${this.state.expense.payment_method === 'Auto' ? 'selected' : ''}>${this.t('auto_withdrawal')}</option>
                                            <option value="Cash" ${this.state.expense.payment_method === 'Cash' ? 'selected' : ''}>${this.t('cash')}</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <hr style="border: 0; border-top: 1px solid var(--border-color); margin: 24px 0;">
                            
                            <div class="form-group" style="max-width: 400px;">
                                <label for="category_id">${this.t('expense_category')}</label>
                                <select id="category_id" class="input-medium" ${this.state.saving ? 'disabled' : ''}>
                                    <option value="">${this.t('none_specific')}</option>
                                    ${categoryOptions}
                                </select>
                            </div>
                            <p style="color: var(--text-secondary); margin-bottom: 16px; font-weight: 500;">${this.t('link_to_property')}</p>

                             <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
                                <div class="form-group">
                                    <label for="building_id">${this.t('building')}</label>
                                    <select id="building_id" ${this.state.saving ? 'disabled' : ''}>
                                        <option value="">${this.t('none')}</option>
                                        ${buildingOptions}
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label for="flat_id">${this.t('nav_flats')}</label>
                                    <select id="flat_id" ${this.state.saving ? 'disabled' : ''}>
                                        <option value="">${this.t('none')}</option>
                                        ${flatOptions}
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label for="contractor_id">${this.t('nav_contractors')}</label>
                                    <select id="contractor_id" ${this.state.saving ? 'disabled' : ''}>
                                        <option value="">${this.t('none')}</option>
                                        ${contractorOptions}
                                    </select>
                                </div>
                            </div>
                            
                            <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--border-color); align-items: center;">
                                ${this.state.saved ? `<span style="color: var(--success-color); font-weight: 500; font-size: 0.9rem;">✓ Gespeichert</span>` : ''}
                                <a href="/expenses" data-link class="btn btn-secondary">${this.t('cancel')}</a>
                                <button type="submit" class="btn btn-primary" ${this.state.saving ? 'disabled' : ''}>
                                    ${this.state.saving ? this.t('saving') : this.t('save_expense')}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div>
                        ${historySection}
                    </div>
                </div>
            </div>
        `;
    }
}
