import Component from '../js/Component.js';

export default class FlatsList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            flats: [],
            buildingsMap: {},
            loading: true,
            error: null
        };
    }

    async postRender() {
        if (!this.state.loading) return;

        try {
            const [flatsRes, buildingsRes] = await Promise.all([
                fetch('/api/flats'),
                fetch('/api/buildings')
            ]);

            if (!flatsRes.ok || !buildingsRes.ok) throw new Error(this.t('error_fetch_data'));

            const flats = await flatsRes.json();
            const buildings = await buildingsRes.json();

            const buildingsMap = {};
            buildings.forEach(b => buildingsMap[b.id] = b.address);

            this.setState({
                flats,
                buildingsMap,
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

        const tableRows = this.state.flats.map(f => `
            <tr>
                <td><strong>${f.name_number}</strong></td>
                <td>${this.state.buildingsMap[f.building_id] || this.t('unknown_building')}</td>
                <td>${f.location_in_building || '-'}</td>
                <td>${f.square_meters ? f.square_meters + ' ' + this.t('sqm') : '-'}</td>
                <td style="text-align: right;">
                    <a href="/flats/${f.id}/edit" data-link class="btn btn-action">${this.t('edit')}</a>
                </td>
            </tr>
        `).join('');

        const emptyState = `
            <div style="text-align: center; padding: 40px 0;">
                <p style="color: var(--text-secondary); margin-bottom: 20px;">${this.t('no_flats')}</p>
                <a href="/flats/new" data-link class="btn btn-primary">${this.t('add_first_flat')}</a>
            </div>
        `;

        return `
            <div>
                <header style="margin-bottom: 32px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h1 style="font-size: 2.25rem; font-weight: 700; letter-spacing: -1px; color: var(--text-primary); margin-bottom: 8px;">${this.t('flats_title')}</h1>
                        <p style="color: var(--text-secondary); font-size: 1.1rem;">${this.t('manage_flats_subtitle')}</p>
                    </div>
                    ${this.state.flats.length > 0 ? `<a href="/flats/new" data-link class="btn btn-primary">${this.t('add_flat_btn')}</a>` : ''}
                </header>

                <div class="card" style="padding: 0; overflow: hidden;">
                    ${this.state.flats.length === 0 ? emptyState : `
                        <table>
                            <thead>
                                <tr>
                                    <th>${this.t('name_number_label')}</th>
                                    <th>${this.t('building')}</th>
                                    <th>${this.t('location_label')}</th>
                                    <th>${this.t('size_label')}</th>
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
