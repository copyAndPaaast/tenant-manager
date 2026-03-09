import Component from '../js/Component.js';
import FileAttachments from './FileAttachments.js';

export default class TenantForm extends Component {
    constructor(props) {
        super(props);
        this.isEdit = props.params && props.params[0] && props.params[0] !== 'new';
        this.tenantId = this.isEdit ? props.params[0] : null;

        this.state = {
            loading: this.isEdit,
            saving: false,
            saved: false,
            error: null,
            rentHistory: [],
            protocols: [],
            leases: [],
            flatsMap: {},
            editingRentId: null,
            editingLeaseId: null,
            activeTab: 'general',
            tenant: {
                first_name: '',
                last_name: '',
                email: '',
                phone: '',
                iban: '',
                bic: '',
                bank_name: '',
                account_holder: '',
                deposit_amount: '',
                deposit_date: '',
                deposit_notes: ''
            }
        };
    }

    async postRender() {
        if (!this.state.loading) {
            // Re-attach event listeners after subsequent renders
            const form = document.getElementById('tenantForm');
            if (form) form.addEventListener('submit', this.handleSubmit.bind(this));

            const addRentHistoryForm = document.getElementById('addRentHistoryForm');
            if (addRentHistoryForm) addRentHistoryForm.addEventListener('submit', this.handleAddRentHistory.bind(this));

            const addLeaseForm = document.getElementById('addLeaseForm');
            if (addLeaseForm) addLeaseForm.addEventListener('submit', this.handleAddLease.bind(this));

            const addProtocolForm = document.getElementById('addProtocolForm');
            if (addProtocolForm) addProtocolForm.addEventListener('submit', this.handleAddProtocol.bind(this));

            document.querySelectorAll('.delete-rent-btn').forEach(btn => {
                btn.addEventListener('click', this.handleDeleteRentHistory.bind(this));
            });
            document.querySelectorAll('.edit-rent-btn').forEach(btn => {
                btn.addEventListener('click', (e) => this.setState({ editingRentId: e.target.dataset.id }));
            });
            document.querySelectorAll('.cancel-rent-btn').forEach(btn => {
                btn.addEventListener('click', () => this.setState({ editingRentId: null }));
            });
            document.querySelectorAll('.save-rent-btn').forEach(btn => {
                btn.addEventListener('click', this.handleSaveRentHistory.bind(this));
            });

            document.querySelectorAll('.delete-lease-btn').forEach(btn => {
                btn.addEventListener('click', this.handleDeleteLease.bind(this));
            });
            document.querySelectorAll('.edit-lease-btn').forEach(btn => {
                btn.addEventListener('click', (e) => this.setState({ editingLeaseId: e.target.dataset.id }));
            });
            document.querySelectorAll('.cancel-lease-btn').forEach(btn => {
                btn.addEventListener('click', () => this.setState({ editingLeaseId: null }));
            });
            document.querySelectorAll('.save-lease-btn').forEach(btn => {
                btn.addEventListener('click', this.handleSaveLease.bind(this));
            });

            document.querySelectorAll('.delete-protocol-btn').forEach(btn => {
                btn.addEventListener('click', this.handleDeleteProtocol.bind(this));
            });
            document.querySelectorAll('.edit-protocol-btn').forEach(btn => {
                btn.addEventListener('click', (e) => this.setState({ editingProtocolId: e.target.dataset.id }));
            });
            document.querySelectorAll('.cancel-protocol-btn').forEach(btn => {
                btn.addEventListener('click', () => this.setState({ editingProtocolId: null }));
            });
            document.querySelectorAll('.save-protocol-btn').forEach(btn => {
                btn.addEventListener('click', this.handleSaveProtocol.bind(this));
            });

            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.setState({ activeTab: e.target.dataset.tab });
                });
            });

            const fileContainer = document.getElementById('tenant-file-attachments');
            if (fileContainer && this.tenantId) {
                new FileAttachments('tenant', this.tenantId).mount(fileContainer);
            }

            return;
        }

        if (this.isEdit && this.state.loading) {
            try {
                const [tenantRes, rentRes, protocolsRes, leasesRes, flatsRes] = await Promise.all([
                    fetch(`/api/tenants/${this.tenantId}`),
                    fetch(`/api/rent_history?tenant_id=${this.tenantId}`),
                    fetch(`/api/protocols?tenant_id=${this.tenantId}`),
                    fetch(`/api/leases?tenant_id=${this.tenantId}`),
                    fetch('/api/flats')
                ]);

                if (!tenantRes.ok) throw new Error(this.t('error_fetch_tenant'));

                const tenant = await tenantRes.json();
                let rentHistory = rentRes.ok ? await rentRes.json() : [];
                let protocols = protocolsRes.ok ? await protocolsRes.json() : [];
                let leases = leasesRes.ok ? await leasesRes.json() : [];
                let flatsMap = {};

                if (flatsRes.ok) {
                    const flats = await flatsRes.json();
                    flats.forEach(f => flatsMap[f.id] = f.name_number);
                }

                this.setState({
                    tenant,
                    rentHistory,
                    protocols,
                    leases,
                    flatsMap,
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

    async handleAddRentHistory(e) {
        e.preventDefault();
        const payload = {
            tenant_id: this.tenantId,
            date_from: document.getElementById('new_rent_date').value,
            date_to: document.getElementById('new_rent_date_to').value || null,
            base_rent: document.getElementById('new_rent_base').value,
            heating: document.getElementById('new_rent_heating').value,
            maintenance: document.getElementById('new_rent_maintenance').value
        };

        try {
            const res = await fetch('/api/rent_history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error(this.t('error_log_rent_change'));

            this.setState({ loading: true });
            this.postRender();
        } catch (err) {
            alert(err.message);
        }
    }

    async handleAddLease(e) {
        e.preventDefault();
        const payload = {
            tenant_id: this.tenantId,
            flat_id: document.getElementById('new_lease_flat_id').value,
            move_in_date: document.getElementById('new_lease_move_in').value,
            move_out_date: document.getElementById('new_lease_move_out').value || null
        };

        try {
            const res = await fetch('/api/leases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error(this.t('error_connect_flat'));

            this.setState({ loading: true });
            this.postRender();
        } catch (err) {
            alert(err.message);
        }
    }

    async handleAddProtocol(e) {
        e.preventDefault();
        const payload = {
            tenant_id: this.tenantId,
            date: document.getElementById('new_protocol_date').value,
            information: document.getElementById('new_protocol_info').value,
            flat_id: null
        };

        try {
            const res = await fetch('/api/protocols', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error(this.t('error_log_protocol'));

            this.setState({ loading: true });
            this.postRender();
        } catch (err) {
            alert(err.message);
        }
    }

    async handleSaveRentHistory(e) {
        const id = e.target.dataset.id;
        const payload = {
            tenant_id: this.tenantId,
            date_from: document.getElementById(`edit_rent_date_${id}`).value,
            date_to: document.getElementById(`edit_rent_date_to_${id}`).value || null,
            base_rent: document.getElementById(`edit_rent_base_${id}`).value,
            heating: document.getElementById(`edit_rent_heating_${id}`).value,
            maintenance: document.getElementById(`edit_rent_maintenance_${id}`).value
        };
        try {
            const res = await fetch(`/api/rent_history/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error(this.t('error_update_rent'));
            this.setState({ editingRentId: null, loading: true });
            this.postRender();
        } catch (err) {
            alert(err.message);
        }
    }

    async handleSaveLease(e) {
        const id = e.target.dataset.id;
        const payload = {
            tenant_id: this.tenantId,
            flat_id: document.getElementById(`edit_lease_flat_${id}`).value,
            move_in_date: document.getElementById(`edit_lease_in_${id}`).value,
            move_out_date: document.getElementById(`edit_lease_out_${id}`).value || null
        };
        try {
            const res = await fetch(`/api/leases/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error(this.t('error_update_lease'));
            this.setState({ editingLeaseId: null, loading: true });
            this.postRender();
        } catch (err) {
            alert(err.message);
        }
    }

    async handleSaveProtocol(e) {
        const id = e.target.dataset.id;
        const payload = {
            tenant_id: this.tenantId,
            date: document.getElementById(`edit_proto_date_${id}`).value,
            information: document.getElementById(`edit_proto_info_${id}`).value,
            flat_id: null
        };
        try {
            const res = await fetch(`/api/protocols/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error(this.t('error_update_protocol'));
            this.setState({ editingProtocolId: null, loading: true });
            this.postRender();
        } catch (err) {
            alert(err.message);
        }
    }

    async handleDeleteRentHistory(e) {
        if (!confirm(this.t('confirm_delete_rent'))) return;
        const id = e.target.dataset.id;
        try {
            const res = await fetch(`/api/rent_history/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(this.t('error_delete_rent'));
            this.setState({ loading: true });
            this.postRender();
        } catch (err) {
            alert(err.message);
        }
    }

    async handleDeleteLease(e) {
        if (!confirm(this.t('confirm_delete_lease'))) return;
        const id = e.target.dataset.id;
        try {
            const res = await fetch(`/api/leases/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(this.t('error_delete_lease'));
            this.setState({ loading: true });
            this.postRender();
        } catch (err) {
            alert(err.message);
        }
    }

    async handleDeleteProtocol(e) {
        if (!confirm(this.t('are_you_sure'))) return;
        const id = e.target.dataset.id;
        try {
            const res = await fetch(`/api/protocols/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(this.t('error_delete_protocol'));
            this.setState({ loading: true });
            this.postRender();
        } catch (err) {
            alert(err.message);
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        const payload = {
            first_name: document.getElementById('first_name').value,
            last_name: document.getElementById('last_name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            iban: document.getElementById('iban')?.value || '',
            bic: document.getElementById('bic')?.value || '',
            bank_name: document.getElementById('bank_name')?.value || '',
            account_holder: document.getElementById('account_holder')?.value || '',
            deposit_amount: document.getElementById('deposit_amount')?.value || '',
            deposit_date: document.getElementById('deposit_date')?.value || '',
            deposit_notes: document.getElementById('deposit_notes')?.value || ''
        };

        this.setState({ saving: true, error: null });

        try {
            const method = this.isEdit ? 'PUT' : 'POST';
            const url = this.isEdit ? `/api/tenants/${this.tenantId}` : '/api/tenants';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(this.t('error_save_tenant'));

            const data = await response.json();
            if (!this.isEdit) {
                this.isEdit = true;
                this.tenantId = data.id;
                window.history.replaceState(null, null, `/tenants/${data.id}/edit`);
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

        const rentHistorySection = this.isEdit ? `
            <div class="card" style="margin-top: 24px; max-width: 800px; padding: 0; overflow: hidden;">
                <div style="padding: 24px; border-bottom: 1px solid var(--border-color);">
                    <h2 style="font-size: 1.25rem; font-weight: 600;">${this.t('rent_history')}</h2>
                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 4px;">${this.t('track_rent_changes')}</p>
                </div>
                ${this.state.rentHistory?.length === 0 ? `<div style="padding: 24px;"><p style="color: var(--text-secondary);">${this.t('no_rent_history')}</p></div>` : `
                    <table>
                        <thead>
                            <tr>
                                <th>${this.t('date_from')}</th>
                                <th>${this.t('end_date')}</th>
                                <th>${this.t('base_rent')}</th>
                                <th>${this.t('heating')}</th>
                                <th>${this.t('maintenance')}</th>
                                <th>${this.t('total')}</th>
                                <th style="text-align: right;">${this.t('delete')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(this.state.rentHistory || []).map(r => {
            const isEditing = this.state.editingRentId == r.id;
            if (isEditing) {
                return `
                    <tr>
                        <td colspan="6">
                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr; gap: 8px;">
                                <input type="date" id="edit_rent_date_${r.id}" value="${r.date_from}" class="table-input input-date" placeholder="Gültig ab">
                                <input type="date" id="edit_rent_date_to_${r.id}" value="${r.date_to || ''}" class="table-input input-date" placeholder="Gültig bis (opt.)">
                                <input type="number" step="0.01" id="edit_rent_base_${r.id}" value="${r.base_rent}" class="table-input input-number">
                                <input type="number" step="0.01" id="edit_rent_heating_${r.id}" value="${r.heating}" class="table-input input-number">
                                <input type="number" step="0.01" id="edit_rent_maintenance_${r.id}" value="${r.maintenance}" class="table-input input-number">
                            </div>
                        </td>
                        <td style="text-align: right; white-space: nowrap;">
                            <button class="btn btn-sm btn-success save-rent-btn" data-id="${r.id}" style="margin-right: 4px;">${this.t('save')}</button>
                            <button class="btn btn-sm btn-secondary cancel-rent-btn">${this.t('cancel')}</button>
                        </td>
                    </tr>
                `;
            }
            const total = Number(r.base_rent) + Number(r.heating) + Number(r.maintenance);
            return `
                                <tr>
                                    <td>${r.date_from}</td>
                                    <td>${r.date_to ? r.date_to : `<span style="color: var(--success-color); font-weight: 600; font-size: 0.8rem;">Aktuell</span>`}</td>
                                    <td>€${Number(r.base_rent).toFixed(2)}</td>
                                    <td>€${Number(r.heating).toFixed(2)}</td>
                                    <td>€${Number(r.maintenance).toFixed(2)}</td>
                                    <td><strong>€${total.toFixed(2)}</strong></td>
                                    <td style="text-align: right; white-space: nowrap;">
                                        <button class="btn btn-sm btn-action edit-rent-btn" data-id="${r.id}" style="margin-right: 4px;">${this.t('edit')}</button>
                                        <button class="btn btn-sm btn-danger delete-rent-btn" data-id="${r.id}">${this.t('delete')}</button>
                                    </td>
                                </tr>
                                `;
        }).join('')}
                        </tbody>
                    </table>
                `}
                <div style="padding: 24px; background: rgba(248, 250, 252, 0.4); border-top: 1px solid var(--border-color);">
                    <h3 style="font-size: 0.9rem; margin-bottom: 16px; font-weight: 600; text-transform: uppercase; color: var(--text-secondary);">${this.t('new_rent_entry')}</h3>
                    <form id="addRentHistoryForm" style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr auto; gap: 16px; align-items: end;">
                        <div class="form-group" style="margin-bottom: 0;">
                            <label for="new_rent_date">${this.t('date_from')}</label>
                            <input type="date" id="new_rent_date" class="input-date" required value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label for="new_rent_date_to">${this.t('end_date')} (Opt.)</label>
                            <input type="date" id="new_rent_date_to" class="input-date">
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label for="new_rent_base">${this.t('base_rent')} (€)</label>
                            <input type="number" step="0.01" id="new_rent_base" class="input-number" required placeholder="0.00">
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label for="new_rent_heating">${this.t('heating')} (€)</label>
                            <input type="number" step="0.01" id="new_rent_heating" class="input-number" required placeholder="0.00">
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label for="new_rent_maintenance">${this.t('maintenance')} (€)</label>
                            <input type="number" step="0.01" id="new_rent_maintenance" class="input-number" required placeholder="0.00">
                        </div>
                        <button type="submit" class="btn btn-primary">${this.t('add')}</button>
                    </form>
                </div>
            </div>
        ` : '';

        const leasesSection = this.isEdit ? `
            <div class="card" style="margin-top: 24px; max-width: 800px; padding: 0; overflow: hidden;">
                <div style="padding: 24px; border-bottom: 1px solid var(--border-color);">
                    <h2 style="font-size: 1.25rem; font-weight: 600;">${this.t('leases_flats')}</h2>
                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 4px;">${this.t('flats_associated')}</p>
                </div>
                ${this.state.leases?.length === 0 ? `<div style="padding: 24px;"><p style="color: var(--text-secondary);">${this.t('no_leases_found')}</p></div>` : `
                    <table>
                        <thead>
                            <tr>
                                <th>${this.t('nav_flats')}</th>
                                <th>${this.t('move_in')}</th>
                                <th>${this.t('move_out')}</th>
                                <th style="text-align: right;">${this.t('delete')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(this.state.leases || []).map(l => {
            const isEditing = this.state.editingLeaseId == l.id;
            if (isEditing) {
                return `
                    <tr>
                        <td>
                            <select id="edit_lease_flat_${l.id}" class="table-input input-medium">
                                ${Object.keys(this.state.flatsMap).map(id => `<option value="${id}" ${l.flat_id == id ? 'selected' : ''}>${this.state.flatsMap[id]}</option>`).join('')}
                            </select>
                        </td>
                        <td><input type="date" id="edit_lease_in_${l.id}" value="${l.move_in_date}" class="table-input input-date"></td>
                        <td><input type="date" id="edit_lease_out_${l.id}" value="${l.move_out_date || ''}" class="table-input input-date"></td>
                        <td style="text-align: right; white-space: nowrap;">
                            <button class="btn btn-sm btn-success save-lease-btn" data-id="${l.id}" style="margin-right: 4px;">${this.t('save')}</button>
                            <button class="btn btn-sm btn-secondary cancel-lease-btn">${this.t('cancel')}</button>
                        </td>
                    </tr>
                `;
            }
            return `
                                <tr>
                                    <td><strong>${this.state.flatsMap[l.flat_id] || this.t('unknown')}</strong></td>
                                    <td>${l.move_in_date || '-'}</td>
                                    <td>${l.move_out_date ? `<span style="color: var(--text-secondary);">${l.move_out_date}</span>` : `<span style="color: var(--success-color); font-weight: 600;">${this.t('current_tenant')}</span>`}</td>
                                    <td style="text-align: right; white-space: nowrap;">
                                        <button class="btn btn-sm btn-action edit-lease-btn" data-id="${l.id}" style="margin-right: 4px;">${this.t('edit')}</button>
                                        <button class="btn btn-sm btn-danger delete-lease-btn" data-id="${l.id}">${this.t('delete')}</button>
                                    </td>
                                </tr>
                            `;
        }).join('')}
                        </tbody>
                    </table>
                `}
                <div style="padding: 24px; background: rgba(248, 250, 252, 0.4); border-top: 1px solid var(--border-color);">
                    <h3 style="font-size: 0.9rem; margin-bottom: 16px; font-weight: 600; text-transform: uppercase;">${this.t('terminate_connect_flat')}</h3>
                    <form id="addLeaseForm" style="display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 16px; align-items: end;">
                        <div class="form-group" style="margin-bottom: 0;">
                            <label for="new_lease_flat_id">${this.t('nav_flats')}</label>
                            <select id="new_lease_flat_id" required>
                                <option value="" disabled selected>${this.t('select_placeholder')}</option>
                                ${Object.keys(this.state.flatsMap).map(id => `<option value="${id}">${this.state.flatsMap[id]}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label for="new_lease_move_in">${this.t('move_in')}</label>
                            <input type="date" id="new_lease_move_in" class="input-date" required>
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label for="new_lease_move_out">${this.t('move_out')} (Opt)</label>
                            <input type="date" id="new_lease_move_out" class="input-date">
                        </div>
                        <button type="submit" class="btn btn-primary">${this.t('add')}</button>
                    </form>
                </div>
            </div>
        ` : '';

        const protocolsSection = this.isEdit ? `
            <div class="card" style="margin-top: 24px; max-width: 800px; padding: 0; overflow: hidden;">
                <div style="padding: 24px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h2 style="font-size: 1.25rem; font-weight: 600;">${this.t('protocols')}</h2>
                        <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 4px;">${this.t('interactions_logs')}</p>
                    </div>
                </div>
                ${this.state.protocols?.length === 0 ? `<div style="padding: 24px;"><p style="color: var(--text-secondary);">${this.t('no_protocol_entries')}</p></div>` : `
                    <table>
                        <thead>
                            <tr>
                                <th>${this.t('date')}</th>
                                <th>${this.t('information')}</th>
                                <th style="text-align: right;">${this.t('delete')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(this.state.protocols || []).map(p => {
            const isEditing = this.state.editingProtocolId == p.id;
            if (isEditing) {
                return `
                    <tr>
                        <td style="vertical-align: top;"><input type="date" id="edit_proto_date_${p.id}" value="${p.date}" class="table-input input-date"></td>
                        <td><textarea id="edit_proto_info_${p.id}" class="table-input" rows="2">${p.information}</textarea></td>
                        <td style="text-align: right; white-space: nowrap; vertical-align: top;">
                            <button class="btn btn-sm btn-success save-protocol-btn" data-id="${p.id}" style="margin-right: 4px;">${this.t('save')}</button>
                            <button class="btn btn-sm btn-secondary cancel-protocol-btn">${this.t('cancel')}</button>
                        </td>
                    </tr>
                `;
            }
            return `
                                <tr>
                                    <td style="white-space: nowrap; vertical-align: top;">${p.date}</td>
                                    <td>${p.information}</td>
                                    <td style="text-align: right; vertical-align: top; white-space: nowrap;">
                                        <button class="btn btn-sm btn-action edit-protocol-btn" data-id="${p.id}" style="margin-right: 4px;">${this.t('edit')}</button>
                                        <button class="btn btn-sm btn-danger delete-protocol-btn" data-id="${p.id}">${this.t('delete')}</button>
                                    </td>
                                </tr>
                            `;
        }).join('')}
                        </tbody>
                    </table>
                `}
                <div style="padding: 24px; background: rgba(248, 250, 252, 0.4); border-top: 1px solid var(--border-color);">
                    <h3 style="font-size: 0.9rem; margin-bottom: 16px; font-weight: 600; text-transform: uppercase;">${this.t('add_protocol_entry')}</h3>
                    <form id="addProtocolForm" style="display: grid; grid-template-columns: 1fr 3fr auto; gap: 16px; align-items: end;">
                        <div class="form-group" style="margin-bottom: 0;">
                            <label for="new_protocol_date">${this.t('date')}</label>
                            <input type="date" id="new_protocol_date" class="input-date" required value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label for="new_protocol_info">${this.t('information')}</label>
                            <textarea id="new_protocol_info" required placeholder="${this.t('describe_issue_placeholder')}" style="height: 40px; min-height: 40px;"></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary">${this.t('log')}</button>
                    </form>
                </div>
            </div>
        ` : '';

        const tabs = [
            { id: 'general', label: this.t('general_info') },
            { id: 'financial', label: this.t('bank_deposit') },
            { id: 'leases', label: this.t('leases_rent'), hideIfNew: true }
        ];

        return `
            <div>
                <header style="margin-bottom: 32px; display: flex; align-items: center; gap: 16px;">
                    <a href="/tenants" data-link style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; background: var(--surface-color); border: 1px solid var(--border-color); color: var(--text-secondary);">&larr;</a>
                    <div>
                        <h1 style="font-size: 2.25rem; font-weight: 700; letter-spacing: -1px; color: var(--text-primary); margin-bottom: 4px;">${this.isEdit ? this.t('edit_tenant') : this.t('add_new_tenant')}</h1>
                        <p style="color: var(--text-secondary); font-size: 1.1rem;">${this.isEdit ? this.t('update_details') : this.t('enter_building_details')}</p>
                    </div>
                </header>

                <div style="margin-bottom: 24px; border-bottom: 1px solid var(--border-color); display: flex; gap: 32px;">
                    ${tabs.filter(t => !t.hideIfNew || this.isEdit).map(t => `
                        <button class="tab-btn ${this.state.activeTab === t.id ? 'active' : ''}" 
                                data-tab="${t.id}"
                                style="background: none; border: none; padding: 12px 4px; font-weight: 600; cursor: pointer; color: ${this.state.activeTab === t.id ? 'var(--primary-color)' : 'var(--text-secondary)'}; border-bottom: 2px solid ${this.state.activeTab === t.id ? 'var(--primary-color)' : 'transparent'}; transition: all 0.2s;">
                            ${t.label}
                        </button>
                    `).join('')}
                </div>

                <div style="max-width: 800px;">
                    ${this.state.error ? `<div style="padding: 12px; margin-bottom: 20px; background: rgba(239, 68, 68, 0.1); color: var(--error-color); border-radius: var(--border-radius-sm);">${this.state.error}</div>` : ''}
                    
                    <form id="tenantForm">
                        <div id="general-panel" style="display: ${this.state.activeTab === 'general' ? 'block' : 'none'};">
                            <div class="card">
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                                    <div class="form-group">
                                        <label for="first_name">${this.t('first_name')}</label>
                                        <input type="text" id="first_name" class="input-medium" required value="${this.state.tenant.first_name || ''}" placeholder="${this.t('john_placeholder')}" ${this.state.saving ? 'disabled' : ''}>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="last_name">${this.t('last_name')}</label>
                                        <input type="text" id="last_name" class="input-medium" required value="${this.state.tenant.last_name || ''}" placeholder="${this.t('doe_placeholder')}" ${this.state.saving ? 'disabled' : ''}>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label for="email">${this.t('email')}</label>
                                    <input type="email" id="email" class="input-medium" value="${this.state.tenant.email || ''}" placeholder="${this.t('email_placeholder')}" ${this.state.saving ? 'disabled' : ''}>
                                </div>
                                
                                <div class="form-group">
                                    <label for="phone">${this.t('phone')}</label>
                                    <input type="tel" id="phone" class="input-medium" value="${this.state.tenant.phone || ''}" placeholder="${this.t('phone_placeholder')}" ${this.state.saving ? 'disabled' : ''}>
                                </div>
                            </div>
                            <div style="margin-top: 24px;">
                                ${protocolsSection}
                            </div>
                        </div>

                        <div id="financial-panel" style="display: ${this.state.activeTab === 'financial' ? 'block' : 'none'};">
                            <div class="card" style="margin-bottom: 24px;">
                                <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 16px;">${this.t('bank_account_info')}</h3>
                                <div class="form-group">
                                    <label for="account_holder">${this.t('account_holder')}</label>
                                    <input type="text" id="account_holder" class="input-medium" value="${this.state.tenant.account_holder || ''}" placeholder="${this.t('full_name_placeholder')}" ${this.state.saving ? 'disabled' : ''}>
                                </div>
                                <div class="form-group">
                                    <label for="bank_name">${this.t('bank_name')}</label>
                                    <input type="text" id="bank_name" class="input-medium" value="${this.state.tenant.bank_name || ''}" placeholder="${this.t('bank_example_placeholder')}" ${this.state.saving ? 'disabled' : ''}>
                                </div>
                                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 16px;">
                                    <div class="form-group">
                                        <label for="iban">${this.t('iban')}</label>
                                        <input type="text" id="iban" class="input-medium" value="${this.state.tenant.iban || ''}" placeholder="${this.t('iban_placeholder')}" ${this.state.saving ? 'disabled' : ''}>
                                    </div>
                                    <div class="form-group">
                                        <label for="bic">${this.t('bic')}</label>
                                        <input type="text" id="bic" class="input-medium" value="${this.state.tenant.bic || ''}" placeholder="${this.t('bic_placeholder')}" ${this.state.saving ? 'disabled' : ''}>
                                    </div>
                                </div>
                            </div>

                            <div class="card">
                                <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 16px;">${this.t('rental_deposit')}</h3>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                                    <div class="form-group">
                                        <label for="deposit_amount">${this.t('deposit_amount')} (€)</label>
                                        <input type="number" step="0.01" id="deposit_amount" class="input-number" value="${this.state.tenant.deposit_amount || ''}" placeholder="0.00" ${this.state.saving ? 'disabled' : ''}>
                                    </div>
                                    <div class="form-group">
                                        <label for="deposit_date">${this.t('deposit_date')}</label>
                                        <input type="date" id="deposit_date" class="input-date" value="${this.state.tenant.deposit_date || ''}" ${this.state.saving ? 'disabled' : ''}>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="notes">${this.t('notes')}</label>
                                    <textarea id="notes" class="input-long" rows="4" placeholder="${this.t('description_placeholder')}" ${this.state.saving ? 'disabled' : ''}>${this.state.tenant.notes || ''}</textarea>
                                </div>
                            </div>
                        </div>

                        ${this.isEdit ? `
                            <div id="leases-panel" style="display: ${this.state.activeTab === 'leases' ? 'block' : 'none'};">
                                ${leasesSection}
                                ${rentHistorySection}
                            </div>
                        ` : ''}

                        ${this.isEdit ? `<div id="tenant-file-attachments"></div>` : ''}

                        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; align-items: center;">
                            ${this.state.saved ? `<span style="color: var(--success-color); font-weight: 500; font-size: 0.9rem;">✓ Gespeichert</span>` : ''}
                            <a href="/tenants" data-link class="btn btn-secondary">${this.t('cancel')}</a>
                            <button type="submit" class="btn btn-primary" ${this.state.saving ? 'disabled' : ''}>
                                ${this.state.saving ? this.t('saving') : this.t('save_tenant')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }
}
