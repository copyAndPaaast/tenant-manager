import Component from '../js/Component.js';
import FileAttachments from './FileAttachments.js';

export default class FlatForm extends Component {
    constructor(props) {
        super(props);
        this.isEdit = props.params && props.params[0] && props.params[0] !== 'new';
        this.flatId = this.isEdit ? props.params[0] : null;

        this.state = {
            loading: true,
            saving: false,
            saved: false,
            error: null,
            buildings: [],
            tenantsMap: {},
            protocols: [],
            leases: [],
            editingLeaseId: null,
            editingProtocolId: null,
            flat: {
                building_id: '',
                name_number: '',
                location_in_building: '',
                square_meters: '',
                description: ''
            }
        };
    }

    async postRender() {
        if (!this.state.loading) {
            // Re-attach event listeners after subsequent renders
            const form = document.getElementById('flatForm');
            if (form) form.addEventListener('submit', this.handleSubmit.bind(this));

            const addLeaseForm = document.getElementById('addLeaseForm');
            if (addLeaseForm) addLeaseForm.addEventListener('submit', this.handleAddLease.bind(this));

            const addProtocolForm = document.getElementById('addProtocolForm');
            if (addProtocolForm) addProtocolForm.addEventListener('submit', this.handleAddProtocol.bind(this));

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

            const fileContainer = document.getElementById('flat-file-attachments');
            if (fileContainer && this.flatId) {
                new FileAttachments('flat', this.flatId).mount(fileContainer);
            }

            document.getElementById('deleteFlatBtn')?.addEventListener('click', async () => {
                if(!confirm(this.t('are_you_sure'))) return;
                try {
                    const res = await fetch(`/api/flats/${this.flatId}`, { method: 'DELETE' });
                    if (!res.ok) throw new Error('Error deleting element');
                    window.location.href = '/flats';
                } catch (e) { alert(e.message); }
            });

            return;
        }

        try {
            const buildingsRes = await fetch('/api/buildings');
            if (!buildingsRes.ok) throw new Error(this.t('error_fetch_buildings'));
            const buildings = await buildingsRes.json();

            let flat = this.state.flat;
            let protocols = [];
            let leases = [];
            let tenantsMap = {};

            if (this.isEdit) {
                const [flatRes, protocolsRes, leasesRes, tenantsRes] = await Promise.all([
                    fetch(`/api/flats/${this.flatId}`),
                    fetch(`/api/protocols?flat_id=${this.flatId}`),
                    fetch(`/api/leases?flat_id=${this.flatId}`),
                    fetch('/api/tenants')
                ]);

                if (!flatRes.ok) throw new Error(this.t('error_fetch_flat'));
                flat = await flatRes.json();

                if (protocolsRes.ok) protocols = await protocolsRes.json();
                if (leasesRes.ok) leases = await leasesRes.json();

                if (tenantsRes.ok) {
                    const tenants = await tenantsRes.json();
                    tenants.forEach(t => tenantsMap[t.id] = `${t.first_name} ${t.last_name}`);
                }
            }

            this.setState({
                buildings,
                flat,
                protocols,
                leases,
                tenantsMap,
                loading: false
            });
        } catch (err) {
            this.setState({
                error: err.message,
                loading: false
            });
        }
    }

    async handleAddLease(e) {
        e.preventDefault();
        const payload = {
            flat_id: this.flatId,
            tenant_id: document.getElementById('new_lease_tenant_id').value,
            move_in_date: document.getElementById('new_lease_move_in').value,
            move_out_date: document.getElementById('new_lease_move_out').value || null
        };

        try {
            const res = await fetch('/api/leases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error(this.t('error_add_lease'));

            // Refresh data
            this.setState({ loading: true });
            this.postRender();
        } catch (err) {
            alert(err.message);
        }
    }

    async handleAddProtocol(e) {
        e.preventDefault();
        const payload = {
            flat_id: this.flatId,
            date: document.getElementById('new_protocol_date').value,
            information: document.getElementById('new_protocol_info').value,
            tenant_id: null // optional mapping for flat-level protocols
        };

        try {
            const res = await fetch('/api/protocols', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error(this.t('error_add_protocol'));

            this.setState({ loading: true });
            this.postRender();
        } catch (err) {
            alert(err.message);
        }
    }

    async handleSaveLease(e) {
        const id = e.target.dataset.id;
        const payload = {
            flat_id: this.flatId,
            tenant_id: document.getElementById(`edit_lease_tenant_${id}`).value,
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
            flat_id: this.flatId,
            date: document.getElementById(`edit_proto_date_${id}`).value,
            information: document.getElementById(`edit_proto_info_${id}`).value,
            tenant_id: null
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
        if (!confirm(this.t('confirm_delete_protocol'))) return;
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
            building_id: document.getElementById('building_id').value,
            name_number: document.getElementById('name_number').value,
            location_in_building: document.getElementById('location_in_building').value,
            square_meters: document.getElementById('square_meters').value,
            description: document.getElementById('description').value
        };

        this.setState({ saving: true, error: null });

        try {
            const method = this.isEdit ? 'PUT' : 'POST';
            const url = this.isEdit ? `/api/flats/${this.flatId}` : '/api/flats';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(this.t('error_save_flat'));

            const data = await response.json();
            if (!this.isEdit) {
                this.isEdit = true;
                this.flatId = data.id;
                window.history.replaceState(null, null, `/flats/${data.id}/edit`);
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

        const buildingOptions = this.state.buildings.map(b =>
            `<option value="${b.id}" ${this.state.flat.building_id == b.id ? 'selected' : ''}>${b.address}</option>`
        ).join('');

        const tenantHistorySection = this.isEdit ? `
            <div class="card" style="margin-top: 24px; max-width: 800px; padding: 0; overflow: hidden;">
                <div style="padding: 24px; border-bottom: 1px solid var(--border-color);">
                    <h2 style="font-size: 1.25rem; font-weight: 600;">${this.t('tenant_history')}</h2>
                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 4px;">${this.t('leases_subtitle')}</p>
                </div>
                ${this.state.leases.length === 0 ? `<div style="padding: 24px;"><p style="color: var(--text-secondary);">${this.t('no_leases')}</p></div>` : `
                    <table>
                        <thead>
                            <tr>
                                <th>${this.t('tenant')}</th>
                                <th>${this.t('move_in_short')}</th>
                                <th>${this.t('move_out_short')}</th>
                                <th style="text-align: right;">${this.t('delete')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.state.leases.map((l, index) => {
            const isEditing = this.state.editingLeaseId == l.id;
            if (isEditing) {
                return `
                    <tr>
                        <td>
                            <select id="edit_lease_tenant_${l.id}" class="table-input input-medium">
                                ${Object.keys(this.state.tenantsMap).map(id => `<option value="${id}" ${l.tenant_id == id ? 'selected' : ''}>${this.state.tenantsMap[id]}</option>`).join('')}
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
                                    <td><strong>${this.state.tenantsMap[l.tenant_id] || this.t('unknown')}</strong></td>
                                    <td>${l.move_in_date ? this.fDate(l.move_in_date) : '-'}</td>
                                    <td>${l.move_out_date ? `<span style="color: var(--text-secondary);">${this.fDate(l.move_out_date)}</span>` : (index === 0 ? `<span style="color: var(--success-color); font-weight: 600;">${this.t('current')}</span>` : '-')}</td>
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
                    <h3 style="font-size: 0.9rem; margin-bottom: 16px; font-weight: 600; text-transform: uppercase;">${this.t('connect_tenant')}</h3>
                    <form id="addLeaseForm" style="display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 16px; align-items: end;">
                        <div class="form-group" style="margin-bottom: 0;">
                            <label for="new_lease_tenant_id">${this.t('tenant')}</label>
                            <select id="new_lease_tenant_id" required>
                                <option value="" disabled selected>${this.t('select_placeholder')}</option>
                                ${Object.keys(this.state.tenantsMap).map(id => `<option value="${id}">${this.state.tenantsMap[id]}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label for="new_lease_move_in">${this.t('move_in_label')}</label>
                            <input type="date" id="new_lease_move_in" class="input-date" required>
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label for="new_lease_move_out">${this.t('move_out_label')}</label>
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
                        <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 4px;">${this.t('protocols_subtitle')}</p>
                    </div>
                </div>
                ${this.state.protocols.length === 0 ? `<div style="padding: 24px;"><p style="color: var(--text-secondary);">${this.t('no_protocols')}</p></div>` : `
                    <table>
                        <thead>
                            <tr>
                                <th>${this.t('date')}</th>
                                <th>${this.t('information')}</th>
                                <th style="text-align: right;">${this.t('delete')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.state.protocols.map(p => {
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
                                    <td style="white-space: nowrap; vertical-align: top;">${this.fDate(p.date)}</td>
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
                            <label for="new_protocol_info">${this.t('notes_info_label')}</label>
                            <textarea id="new_protocol_info" required placeholder="${this.t('describe_issue_placeholder')}" style="height: 40px; min-height: 40px;"></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary">${this.t('log_btn')}</button>
                    </form>
                </div>
            </div>
        ` : '';

        return `
            <div>
                <header style="margin-bottom: 32px; display: flex; align-items: center; gap: 16px;">
                    <a href="/flats" data-link style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; background: var(--surface-color); border: 1px solid var(--border-color); color: var(--text-secondary);">&larr;</a>
                    <div>
                        <h1 style="font-size: 2.25rem; font-weight: 700; letter-spacing: -1px; color: var(--text-primary); margin-bottom: 4px;">${this.isEdit ? this.t('edit_flat') : this.t('add_new_flat')}</h1>
                        <p style="color: var(--text-secondary); font-size: 1.1rem;">${this.isEdit ? this.t('update_details') : this.t('enter_flat_details')}</p>
                    </div>
                </header>

                <div style="display: grid; grid-template-columns: 1fr; gap: 24px; align-items: start;">
                    <div class="card" style="max-width: 800px;">
                        ${this.state.error ? `<div style="padding: 12px; margin-bottom: 20px; background: rgba(239, 68, 68, 0.1); color: var(--error-color); border-radius: var(--border-radius-sm);">${this.state.error}</div>` : ''}
                        
                        <form id="flatForm">
                            <div class="form-group">
                                <label for="building_id">${this.t('building_label')}</label>
                                <select id="building_id" class="input-medium" required ${this.state.saving ? 'disabled' : ''}>
                                    <option value="" disabled ${!this.state.flat.building_id ? 'selected' : ''}>${this.t('select_building_placeholder')}</option>
                                    ${buildingOptions}
                                </select>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                                <div class="form-group">
                                    <label for="name_number">${this.t('name_number_label')}</label>
                                    <input type="text" id="name_number" class="input-medium" required value="${this.state.flat.name_number || ''}" placeholder="${this.t('name_number_placeholder')}" ${this.state.saving ? 'disabled' : ''}>
                                </div>
                                
                                <div class="form-group">
                                    <label for="square_meters">${this.t('size_with_sqm')}</label>
                                    <input type="number" step="0.01" id="square_meters" class="input-number" value="${this.state.flat.square_meters || ''}" placeholder="${this.t('size_placeholder')}" ${this.state.saving ? 'disabled' : ''}>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="location_in_building">${this.t('location_details_label')}</label>
                                <input type="text" id="location_in_building" class="input-long" value="${this.state.flat.location_in_building || ''}" placeholder="${this.t('location_details_placeholder')}" ${this.state.saving ? 'disabled' : ''}>
                            </div>
                            
                            <div class="form-group">
                                <label for="description">${this.t('notes_description_label')}</label>
                                <textarea id="description" class="input-long" rows="3" placeholder="${this.t('optional_details_placeholder')}" ${this.state.saving ? 'disabled' : ''}>${this.state.flat.description || ''}</textarea>
                            </div>
                            
                            ${this.isEdit ? `<div id="flat-file-attachments"></div>` : ''}

                            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--border-color);">
                                <div>
                                    ${this.isEdit ? `<button type="button" class="btn btn-danger" id="deleteFlatBtn">${this.t('delete')}</button>` : ''}
                                </div>
                                <div style="display: flex; gap: 12px; align-items: center;">
                                    ${this.state.saved ? `<span style="color: var(--success-color); font-weight: 500; font-size: 0.9rem;">✓ Gespeichert</span>` : ''}
                                    <a href="/flats" data-link class="btn btn-secondary">${this.t('cancel')}</a>
                                    <button type="submit" class="btn btn-primary" ${this.state.saving ? 'disabled' : ''}>
                                        ${this.state.saving ? this.t('saving') : this.t('save_flat')}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div>
                        ${tenantHistorySection}
                        ${protocolsSection}
                    </div>
                </div>
            </div>
        `;
    }
}
