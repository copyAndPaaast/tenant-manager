import Component from '../js/Component.js';

export default class FlatsList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            flats: [],
            buildings: [],
            buildingsMap: {},
            currentTenantByFlat: {},
            selectedBuildingId: 'all',
            loading: true,
            error: null
        };
    }

    async postRender() {
        const buildingSelect = document.getElementById('flatsBuildingSelect');
        if (buildingSelect) {
            buildingSelect.addEventListener('change', (e) => {
                this.setState({ selectedBuildingId: e.target.value });
            });
        }

        if (!this.state.loading) return;

        try {
            const [flatsRes, buildingsRes, leasesRes, tenantsRes] = await Promise.all([
                fetch('/api/flats'),
                fetch('/api/buildings'),
                fetch('/api/leases'),
                fetch('/api/tenants')
            ]);

            if (!flatsRes.ok || !buildingsRes.ok) throw new Error(this.t('error_fetch_data'));

            const flats = await flatsRes.json();
            const buildings = await buildingsRes.json();
            const leases = leasesRes.ok ? await leasesRes.json() : [];
            const tenants = tenantsRes.ok ? await tenantsRes.json() : [];

            const buildingsMap = {};
            buildings.forEach(b => buildingsMap[b.id] = b.address);

            const tenantsMap = {};
            tenants.forEach(t => tenantsMap[t.id] = t);

            const currentTenantByFlat = {};
            leases.forEach(l => {
                if (!l.move_out_date && l.tenant_id && l.flat_id) {
                    currentTenantByFlat[l.flat_id] = tenantsMap[l.tenant_id];
                }
            });

            const selectedBuildingId = buildings.length === 1 ? String(buildings[0].id) : 'all';

            this.setState({
                flats,
                buildings,
                buildingsMap,
                currentTenantByFlat,
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
                        <h2 style="color: var(--text-secondary); font-weight: 500;">${this.t('loading_flats')}</h2>
                    </div>`;
        }

        if (this.state.error) {
            return `<div class="card"><h2 style="color: var(--error-color);">${this.t('error')}</h2><p>${this.state.error}</p></div>`;
        }

        const displayFlats = this.state.selectedBuildingId === 'all'
            ? this.state.flats
            : this.state.flats.filter(f => String(f.building_id) === this.state.selectedBuildingId);

        const showBuildingCol = this.state.selectedBuildingId === 'all';

        const tableRows = displayFlats.map(f => {
            const tenant = this.state.currentTenantByFlat[f.id];
            return `
            <tr>
                <td><strong>${f.name_number}</strong></td>
                ${showBuildingCol ? `<td>${this.state.buildingsMap[f.building_id] || this.t('unknown_building')}</td>` : ''}
                <td>${f.location_in_building || '-'}</td>
                <td>${f.square_meters ? f.square_meters + ' ' + this.t('sqm') : '-'}</td>
                <td>${tenant ? `<a href="/tenants/${tenant.id}/edit" data-link style="color: var(--primary-color); text-decoration: none; font-weight: 500;">${tenant.first_name} ${tenant.last_name}</a>` : '<span style="color: var(--text-secondary);">-</span>'}</td>
                <td style="text-align: right;">
                    <a href="/flats/${f.id}/edit" data-link class="btn btn-action">${this.t('edit')}</a>
                </td>
            </tr>
        `;
        }).join('');

        const buildingSelect = `
            <select id="flatsBuildingSelect" class="input-medium" style="min-width: 220px; font-weight: 600; padding: 10px; border-radius: var(--border-radius-sm); border: 1px solid var(--primary-color); background: rgba(99, 102, 241, 0.05); color: var(--primary-color);">
                <option value="all" ${this.state.selectedBuildingId === 'all' ? 'selected' : ''}>🌍 Alle Gebäude</option>
                ${this.state.buildings.map(b => `<option value="${b.id}" ${String(this.state.selectedBuildingId) === String(b.id) ? 'selected' : ''}>🏢 ${b.address || 'Unbekannt'}</option>`).join('')}
            </select>
        `;

        const emptyState = `
            <div style="text-align: center; padding: 40px 0;">
                <p style="color: var(--text-secondary); margin-bottom: 20px;">${this.t('no_flats')}</p>
                <a href="/flats/new" data-link class="btn btn-primary">${this.t('add_first_flat')}</a>
            </div>
        `;

        return `
            <div>
                <header style="margin-bottom: 32px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                    <div>
                        <h1 style="font-size: 2.25rem; font-weight: 700; letter-spacing: -1px; color: var(--text-primary); margin-bottom: 8px;">${this.t('flats_title')}</h1>
                        <p style="color: var(--text-secondary); font-size: 1.1rem;">${this.t('manage_flats_subtitle')}</p>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        ${this.state.buildings.length > 1 ? buildingSelect : ''}
                        ${this.state.flats.length > 0 ? `<a href="/flats/new" data-link class="btn btn-primary">${this.t('add_flat_btn')}</a>` : ''}
                    </div>
                </header>

                <div class="card" style="padding: 0; overflow: hidden;">
                    ${displayFlats.length === 0 ? emptyState : `
                        <table>
                            <thead>
                                <tr>
                                    <th>${this.t('name_number_label')}</th>
                                    ${showBuildingCol ? `<th>${this.t('building')}</th>` : ''}
                                    <th>${this.t('location_label')}</th>
                                    <th>${this.t('size_label')}</th>
                                    <th>${this.t('tenant')}</th>
                                    <th style="text-align: right;">${this.t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRows}
                            </tbody>
                        </table>
                    `}
                </div>
            </div>
        `;
    }
}
