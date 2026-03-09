import Component from '../js/Component.js';
import FileAttachments from './FileAttachments.js';

export default class ContractorForm extends Component {
    constructor(props) {
        super(props);
        this.isEdit = props.params && props.params[0] && props.params[0] !== 'new';
        this.contractorId = this.isEdit ? props.params[0] : null;

        this.state = {
            loading: this.isEdit,
            saving: false,
            saved: false,
            error: null,
            expenses: [],
            editingExpenseId: null,
            contractor: {
                name: '',
                specialty: '',
                phone: '',
                email: '',
                description: ''
            }
        };
    }

    async postRender() {
        if (!this.state.loading) {
            const form = document.getElementById('contractorForm');
            if (form) form.addEventListener('submit', this.handleSubmit.bind(this));

            const addExpenseForm = document.getElementById('addExpenseForm');
            if (addExpenseForm) addExpenseForm.addEventListener('submit', this.handleAddExpense.bind(this));

            document.querySelectorAll('.delete-exp-btn').forEach(btn => {
                btn.addEventListener('click', this.handleDeleteExpense.bind(this));
            });
            document.querySelectorAll('.edit-exp-btn').forEach(btn => {
                btn.addEventListener('click', (e) => this.setState({ editingExpenseId: e.target.dataset.id }));
            });
            document.querySelectorAll('.cancel-exp-btn').forEach(btn => {
                btn.addEventListener('click', () => this.setState({ editingExpenseId: null }));
            });
            document.querySelectorAll('.save-exp-btn').forEach(btn => {
                btn.addEventListener('click', this.handleSaveExpense.bind(this));
            });

            const fileContainer = document.getElementById('contractor-file-attachments');
            if (fileContainer && this.contractorId) {
                new FileAttachments('contractor', this.contractorId).mount(fileContainer);
            }

            return;
        }

        if (this.isEdit && this.state.loading) {
            try {
                const [contractorRes, expensesRes, buildingsRes, flatsRes] = await Promise.all([
                    fetch(`/api/contractors/${this.contractorId}`),
                    fetch(`/api/expenses?contractor_id=${this.contractorId}`),
                    fetch('/api/buildings'),
                    fetch('/api/flats')
                ]);

                if (!contractorRes.ok) throw new Error(this.t('error_fetch_contractor'));

                const contractor = await contractorRes.json();
                const expenses = expensesRes.ok ? await expensesRes.json() : [];
                const buildings = buildingsRes.ok ? await buildingsRes.json() : [];
                const flats = flatsRes.ok ? await flatsRes.json() : [];

                this.setState({
                    contractor,
                    expenses,
                    buildings,
                    flats,
                    loading: false
                });
            } catch (err) {
                this.setState({
                    error: err.message,
                    loading: false
                });
            }
        }
    }
    async handleSaveExpense(e) {
        const id = e.target.dataset.id;
        const original = this.state.expenses.find(exp => exp.id == id);
        const payload = {
            ...original,
            description: document.getElementById(`edit_exp_desc_${id}`).value,
            amount: document.getElementById(`edit_exp_amount_${id}`).value,
            date: document.getElementById(`edit_exp_date_${id}`).value
        };
        try {
            const res = await fetch(`/api/expenses/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error(this.t('error_update_expense'));
            this.setState({ editingExpenseId: null, loading: true });
            this.postRender();
        } catch (err) {
            alert(err.message);
        }
    }

    async handleDeleteExpense(e) {
        if (!confirm(this.t('are_you_sure'))) return;
        const id = e.target.dataset.id;
        try {
            const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(this.t('error_delete_expense'));
            this.setState({ loading: true });
            this.postRender();
        } catch (err) {
            alert(err.message);
        }
    }

    async handleAddExpense(e) {
        e.preventDefault();
        const payload = {
            contractor_id: this.contractorId,
            description: document.getElementById('new_exp_desc').value,
            amount: document.getElementById('new_exp_amount').value,
            date: document.getElementById('new_exp_date').value,
            frequency: 'One-time',
            payment_method: 'Manual',
            building_id: document.getElementById('new_exp_building').value || null,
            flat_id: document.getElementById('new_exp_flat').value || null
        };

        try {
            const res = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error(this.t('error_log_expense'));

            this.setState({ loading: true });
            this.postRender();
        } catch (err) {
            alert(err.message);
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        const payload = {
            name: document.getElementById('name').value,
            specialty: document.getElementById('specialty').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            description: document.getElementById('description').value
        };

        this.setState({ saving: true, error: null });

        try {
            const method = this.isEdit ? 'PUT' : 'POST';
            const url = this.isEdit ? `/api/contractors/${this.contractorId}` : '/api/contractors';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(this.t('error_save_contractor'));

            const data = await response.json();
            if (!this.isEdit) {
                this.isEdit = true;
                this.contractorId = data.id;
                window.history.replaceState(null, null, `/contractors/${data.id}/edit`);
            }
            this.setState({ saving: false, saved: true });
            setTimeout(() => this.setState({ saved: false }), 2500);
        } catch (err) {
            this.setState({ saving: false, error: err.message });
        }
    }

    render() {
        if (this.state.loading) {
            return `<div class="card" style="display: flex; align-items: center; justify-content: center; min-height: 400px;">
                        <h2 style="color: var(--text-secondary); font-weight: 500;">${this.t('loading')}</h2>
                    </div>`;
        }

        const historySection = this.isEdit ? `
            <div class="card" style="margin-top: 24px; max-width: 800px; padding: 0; overflow: hidden;">
                <div style="padding: 24px; border-bottom: 1px solid var(--border-color);">
                    <h2 style="font-size: 1.25rem; font-weight: 600;">${this.t('work_history_expenses')}</h2>
                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 4px;">${this.t('log_payments_services')}</p>
                </div>
                ${this.state.expenses.length === 0 ? `<div style="padding: 24px;"><p style="color: var(--text-secondary);">${this.t('no_past_expenses')}</p></div>` : `
                    <table>
                        <thead>
                            <tr>
                                <th>${this.t('date')}</th>
                                <th>${this.t('description_label')}</th>
                                <th>${this.t('amount')}</th>
                                <th style="text-align: right;">${this.t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.state.expenses.map(e => {
            const isEditing = this.state.editingExpenseId == e.id;
            if (isEditing) {
                return `
                    <tr>
                        <td><input type="date" id="edit_exp_date_${e.id}" value="${e.date}" class="table-input input-date"></td>
                        <td><textarea id="edit_exp_desc_${e.id}" class="table-input" rows="2">${e.description}</textarea></td>
                        <td><input type="number" step="0.01" id="edit_exp_amount_${e.id}" value="${e.amount}" class="table-input input-number"></td>
                        <td style="text-align: right; white-space: nowrap;">
                            <button class="btn btn-sm btn-success save-exp-btn" data-id="${e.id}" style="margin-right: 4px;">${this.t('save')}</button>
                            <button class="btn btn-sm btn-secondary cancel-exp-btn">${this.t('cancel')}</button>
                        </td>
                    </tr>
                `;
            }
            return `
                                <tr>
                                    <td style="white-space: nowrap;">${e.date}</td>
                                    <td>${e.description}</td>
                                    <td><strong>€${Number(e.amount).toFixed(2)}</strong></td>
                                    <td style="text-align: right; white-space: nowrap;">
                                        <button class="btn btn-sm btn-action edit-exp-btn" data-id="${e.id}" style="margin-right: 4px;">${this.t('edit')}</button>
                                        <button class="btn btn-sm btn-danger delete-exp-btn" data-id="${e.id}">${this.t('delete')}</button>
                                    </td>
                                </tr>
                            `;
        }).join('')}
                        </tbody>
                    </table>
                `}
                <div style="padding: 24px; background: rgba(248, 250, 252, 0.4); border-top: 1px solid var(--border-color);">
                    <h3 style="font-size: 0.9rem; margin-bottom: 16px; font-weight: 600; text-transform: uppercase; color: var(--text-secondary);">${this.t('log_new_work_expense')}</h3>
                    <form id="addExpenseForm" style="display: grid; grid-template-columns: 1fr 2fr 1fr 1fr auto; gap: 16px; align-items: end;">
                        <div class="form-group" style="margin-bottom: 0;">
                            <label for="new_exp_date">${this.t('date')}</label>
                            <input type="date" id="new_exp_date" class="input-date" required value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label for="new_exp_desc">${this.t('work_description')}</label>
                            <textarea id="new_exp_desc" required placeholder="${this.t('repair_maintenance_placeholder')}" style="height: 40px; min-height: 40px;"></textarea>
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label for="new_exp_amount">${this.t('amount')} (€)</label>
                            <input type="number" step="0.01" id="new_exp_amount" class="input-number" required placeholder="0.00">
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label for="new_exp_building">${this.t('nav_buildings')} (Opt)</label>
                            <select id="new_exp_building">
                                <option value="">${this.t('none')}</option>
                                ${this.state.buildings?.map(b => `<option value="${b.id}">${b.address}</option>`).join('')}
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary">${this.t('log')}</button>
                        <input type="hidden" id="new_exp_flat" value="">
                    </form>
                </div>
            </div>
        ` : '';

        return `
            <div>
                <header style="margin-bottom: 32px; display: flex; align-items: center; gap: 16px;">
                    <a href="/contractors" data-link style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; background: var(--surface-color); border: 1px solid var(--border-color); color: var(--text-secondary);">&larr;</a>
                    <div>
                        <h1 style="font-size: 2.25rem; font-weight: 700; letter-spacing: -1px; color: var(--text-primary); margin-bottom: 4px;">${this.isEdit ? this.t('edit_contractor') : this.t('add_new_contractor')}</h1>
                        <p style="color: var(--text-secondary); font-size: 1.1rem;">${this.isEdit ? this.t('update_details') : this.t('enter_building_details')}</p>
                    </div>
                </header>

                <div style="display: grid; grid-template-columns: 1fr; gap: 24px; align-items: start;">
                    <div class="card" style="max-width: 800px;">
                        ${this.state.error ? `<div style="padding: 12px; margin-bottom: 20px; background: rgba(239, 68, 68, 0.1); color: var(--error-color); border-radius: var(--border-radius-sm);">${this.state.error}</div>` : ''}
                        
                        <form id="contractorForm">
                            <div class="form-group">
                                <label for="name">${this.t('company_individual_name')}</label>
                                <input type="text" id="name" class="input-long" required value="${this.state.contractor.name || ''}" placeholder="${this.t('contractor_example_placeholder')}" ${this.state.saving ? 'disabled' : ''}>
                            </div>
                            
                            <div class="form-group">
                                <label for="description">${this.t('supplier_description')}</label>
                                <textarea id="description" class="input-long" rows="4" placeholder="${this.t('services_notes_placeholder')}" ${this.state.saving ? 'disabled' : ''}>${this.state.contractor.description || ''}</textarea>
                            </div>

                            <div class="form-group">
                                <label for="specialty">${this.t('specialty')}</label>
                                <textarea id="specialty" class="input-long" rows="2" placeholder="${this.t('specialty_example_placeholder')}" ${this.state.saving ? 'disabled' : ''}>${this.state.contractor.specialty || ''}</textarea>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                                <div class="form-group">
                                    <label for="email">${this.t('email')}</label>
                                    <input type="email" id="email" class="input-medium" value="${this.state.contractor.email || ''}" placeholder="${this.t('email_placeholder')}" ${this.state.saving ? 'disabled' : ''}>
                                </div>
                                
                                <div class="form-group">
                                    <label for="phone">${this.t('phone')}</label>
                                    <input type="tel" id="phone" class="input-medium" value="${this.state.contractor.phone || ''}" placeholder="${this.t('phone_placeholder')}" ${this.state.saving ? 'disabled' : ''}>
                                </div>
                            </div>
                            
                            ${this.isEdit ? `<div id="contractor-file-attachments"></div>` : ''}

                            <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; align-items: center;">
                                ${this.state.saved ? `<span style="color: var(--success-color); font-weight: 500; font-size: 0.9rem;">✓ Gespeichert</span>` : ''}
                                <a href="/contractors" data-link class="btn btn-secondary">${this.t('cancel')}</a>
                                <button type="submit" class="btn btn-primary" ${this.state.saving ? 'disabled' : ''}>
                                    ${this.state.saving ? this.t('saving') : this.t('save_contractor')}
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
