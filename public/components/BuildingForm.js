import Component from '../js/Component.js';
import FileAttachments from './FileAttachments.js';

export default class BuildingForm extends Component {
    constructor(props) {
        super(props);
        this.isEdit = props.params && props.params[0] && props.params[0] !== 'new';
        this.buildingId = this.isEdit ? props.params[0] : null;

        this.state = {
            loading: this.isEdit,
            saving: false,
            saved: false,
            error: null,
            building: {
                address: '',
                description: '',
                total_square_meters: ''
            },
            flats: [],
            settlements: []
        };
    }

    async postRender() {
        if (!this.state.loading) {
            const form = document.getElementById('buildingForm');
            if (form) form.addEventListener('submit', this.handleSubmit.bind(this));

            const fileContainer = document.getElementById('building-file-attachments');
            if (fileContainer && this.buildingId) {
                new FileAttachments('building', this.buildingId).mount(fileContainer);
            }

            return;
        }

        if (this.isEdit && this.state.loading) {
            try {
                const [buildingRes, flatsRes, settlementsRes] = await Promise.all([
                    fetch(`/api/buildings/${this.buildingId}`),
                    fetch(`/api/flats?building_id=${this.buildingId}`),
                    fetch(`/api/settlements/building/${this.buildingId}`)
                ]);

                if (!buildingRes.ok) throw new Error(this.t('error_fetch_building'));

                const building = await buildingRes.json();
                const flats = flatsRes.ok ? await flatsRes.json() : [];
                const settlementsData = settlementsRes.ok ? await settlementsRes.json() : { data: [] };

                this.setState({
                    building,
                    flats,
                    settlements: settlementsData.data || [],
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

    async handleSubmit(e) {
        e.preventDefault();

        const address = document.getElementById('address').value;
        const description = document.getElementById('description').value;
        const total_square_meters = document.getElementById('total_square_meters').value;

        this.setState({ saving: true, error: null });

        try {
            const method = this.isEdit ? 'PUT' : 'POST';
            const url = this.isEdit ? `/api/buildings/${this.buildingId}` : '/api/buildings';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ address, description, total_square_meters })
            });

            if (!response.ok) throw new Error(this.t('error_save_building'));

            const data = await response.json();
            if (!this.isEdit) {
                this.isEdit = true;
                this.buildingId = data.id;
                window.history.replaceState(null, null, `/buildings/${data.id}/edit`);
            }
            this.setState({ saving: false, saved: true });
            setTimeout(() => this.setState({ saved: false }), 2500);
        } catch (err) {
            this.setState({ saving: false, error: err.message });
        }
    }

    render() {
        if (this.state.loading) {
            return `
                <div class="card" style="display: flex; align-items: center; justify-content: center; min-height: 400px;">
                    <div style="text-align: center;">
                        <h2 style="color: var(--text-secondary); font-weight: 500;">${this.t('loading')}</h2>
                    </div>
                </div>
            `;
        }

        return `
            <div>
                <header style="margin-bottom: 32px; display: flex; align-items: center; gap: 16px;">
                    <a href="/buildings" data-link style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; background: var(--surface-color); border: 1px solid var(--border-color); color: var(--text-secondary);">&larr;</a>
                    <div>
                        <h1 style="font-size: 2.25rem; font-weight: 700; letter-spacing: -1px; color: var(--text-primary); margin-bottom: 4px;">${this.isEdit ? this.t('edit_building') : this.t('add_new_building')}</h1>
                        <p style="color: var(--text-secondary); font-size: 1.1rem;">${this.isEdit ? this.t('update_details') : this.t('enter_building_details')}</p>
                    </div>
                </header>

                <div style="display: grid; grid-template-columns: 1fr; gap: 24px; align-items: start;">
                    <div class="card" style="max-width: 600px;">
                        ${this.state.error ? `<div style="padding: 12px; margin-bottom: 20px; background: rgba(239, 68, 68, 0.1); color: var(--error-color); border-radius: var(--border-radius-sm);">${this.state.error}</div>` : ''}
                        
                        <form id="buildingForm">
                            <div class="form-group">
                                <label for="address">${this.t('address_label')}</label>
                                <input type="text" id="address" name="address" class="input-long" required value="${this.state.building.address || ''}" placeholder="${this.t('address_placeholder')}" ${this.state.saving ? 'disabled' : ''}>
                            </div>
                            
                            <div class="form-group">
                                <label for="total_square_meters">${this.t('building_size_label')}</label>
                                <input type="number" step="0.01" id="total_square_meters" name="total_square_meters" class="input-number" value="${this.state.building.total_square_meters || ''}" placeholder="${this.t('size_placeholder')}" ${this.state.saving ? 'disabled' : ''}>
                                <small style="color: var(--text-secondary); margin-top: 4px; display: block;">${this.t('building_size_desc')}</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="description">${this.t('description_label')}</label>
                                <textarea id="description" name="description" rows="4" class="input-long" placeholder="${this.t('description_placeholder')}" ${this.state.saving ? 'disabled' : ''}>${this.state.building.description || ''}</textarea>
                            </div>
                            
                            ${this.isEdit ? `<div id="building-file-attachments"></div>` : ''}

                            <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; align-items: center;">
                                ${this.state.saved ? `<span style="color: var(--success-color); font-weight: 500; font-size: 0.9rem;">✓ Gespeichert</span>` : ''}
                                <a href="/buildings" data-link class="btn btn-secondary">${this.t('cancel')}</a>
                                <button type="submit" class="btn btn-primary" ${this.state.saving ? 'disabled' : ''}>
                                    ${this.state.saving ? this.t('saving') : this.t('save_building')}
                                </button>
                            </div>
                        </form>
                    </div>

                    ${this.isEdit ? `
                        <div class="card" style="max-width: 800px; padding: 0; overflow: hidden;">
                            <div style="padding: 24px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <h2 style="font-size: 1.25rem; font-weight: 600;">${this.t('flats_in_building')}</h2>
                                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 4px;">${this.t('flats_list_subtitle')}</p>
                                </div>
                                <a href="/flats/new" data-link class="btn btn-primary" style="font-size: 0.8rem; padding: 6px 12px;">${this.t('add_flat_btn')}</a>
                            </div>
                            ${!this.state.flats || this.state.flats.length === 0 ? `<div style="padding: 24px;"><p style="color: var(--text-secondary);">${this.t('no_flats_building')}</p></div>` : `
                                <table>
                                    <thead>
                                        <tr>
                                            <th>${this.t('name_number_label')}</th>
                                            <th>${this.t('location_label')}</th>
                                            <th>${this.t('size_label')}</th>
                                            <th style="text-align: right;">${this.t('actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${this.state.flats.map(f => `
                                            <tr>
                                                <td><strong>${f.name_number}</strong></td>
                                                <td>${f.location_in_building || '-'}</td>
                                                <td>${f.square_meters ? f.square_meters + ' ' + this.t('sqm') : '-'}</td>
                                                <td style="text-align: right;">
                                                    <a href="/flats/${f.id}/edit" data-link class="btn btn-action">${this.t('view_edit')}</a>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                    <tfoot>
                                        <tr style="background: rgba(241, 245, 249, 0.5); font-weight: 600;">
                                            <td colspan="2">${this.t('sum_flats')}</td>
                                            <td colspan="2" style="color: var(--primary-color);">${this.state.building.flats_sqm_sum ? Number(this.state.building.flats_sqm_sum).toFixed(2) : '0.00'} ${this.t('sqm')}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            `}
                        </div>
                    ` : ''}

                    ${this.isEdit ? `
                        <div class="card" style="max-width: 800px; padding: 0; overflow: hidden; margin-top: 24px;">
                            <div style="padding: 24px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <h2 style="font-size: 1.25rem; font-weight: 600;">Nebenkostenabrechnungen</h2>
                                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 4px;">Zusammenstellungen umlagefähiger Kosten.</p>
                                </div>
                                <a href="/buildings/${this.buildingId}/settlements/new" data-link class="btn btn-primary" style="font-size: 0.8rem; padding: 6px 12px;">+ Abrechnung</a>
                            </div>
                            ${!this.state.settlements || this.state.settlements.length === 0 ? `<div style="padding: 24px;"><p style="color: var(--text-secondary);">Keine Abrechnungen für dieses Gebäude gefunden.</p></div>` : `
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Jahr / Titel</th>
                                            <th>Datum</th>
                                            <th>Status</th>
                                            <th style="text-align: right;">Aktionen</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${this.state.settlements.map(s => `
                                            <tr>
                                                <td><strong>${s.year}</strong></td>
                                                <td>${s.date ? new Date(s.date).toLocaleDateString() : '-'}</td>
                                                <td><span style="display: inline-block; padding: 4px 8px; border-radius: 4px; background: ${s.status === 'Draft' ? 'var(--warning-color)' : 'var(--success-color)'}; color: white; font-size: 0.8rem;">${s.status || 'Draft'}</span></td>
                                                <td style="text-align: right;">
                                                    <a href="/buildings/${this.buildingId}/settlements/${s.id}/edit" data-link class="btn btn-action">Bearbeiten</a>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            `}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
}
