import Component from '../js/Component.js';
import i18n from '../js/i18n.js';

export default class SettlementForm extends Component {
    constructor(props) {
        super(props);
        this.buildingId = props.params[0];
        this.settlementId = props.params[1] || null;
        this.isEdit = !!this.settlementId;

        this.state = {
            loading: true,
            saving: false,
            saved: false,
            copied: false,
            copiedCalc: false,
            error: null,
            building: null,
            flats: [],
            activeTab: 0,
            flatData: {},
            flatDataLoading: true,
            flatHeatingBills: {},   // flat_id -> number (live-editable)
            settlement: {
                year: new Date().getFullYear() - 1,
                date: new Date().toISOString().split('T')[0],
                status: 'Draft',
                expenses: [],
                flats: []
            }
        };
    }

    async postRender() {
        if (!this.state.loading) {
            this.attachEventListeners();
            return;
        }

        try {
            const [buildingRes, flatsRes] = await Promise.all([
                fetch(`/api/buildings/${this.buildingId}`),
                fetch(`/api/flats?building_id=${this.buildingId}`)
            ]);

            if (!buildingRes.ok) throw new Error('Fehler beim Laden des Gebäudes');

            const building = await buildingRes.json();
            const flats = flatsRes.ok ? await flatsRes.json() : [];

            let settlement = { ...this.state.settlement };

            if (this.isEdit) {
                const settRes = await fetch(`/api/settlements/${this.settlementId}`);
                if (!settRes.ok) throw new Error('Fehler beim Laden der Abrechnung');
                const settData = await settRes.json();
                settlement = settData.data;
            }

            if (!this.isEdit && settlement.expenses.length === 0) {
                settlement.expenses.push({ description: '', amount: '' });
            }

            // Seed heating bills from saved settlement.flats
            const flatHeatingBills = {};
            (settlement.flats || []).forEach(sf => {
                flatHeatingBills[sf.flat_id] = parseFloat(sf.heating_bill) || 0;
            });

            this.setState({ building, flats, settlement, flatHeatingBills, loading: false });

            // Fetch per-flat tenant & rent data in the background
            this.fetchFlatData(flats, settlement.year || (new Date().getFullYear() - 1));

        } catch (err) {
            this.setState({ error: err.message, loading: false });
        }
    }

    async fetchFlatData(flats, year) {
        if (!flats || flats.length === 0) {
            this.setState({ flatDataLoading: false });
            return;
        }

        const flatData = {};

        await Promise.all(flats.map(async (flat) => {
            try {
                const leasesRes = await fetch(`/api/leases?flat_id=${flat.id}`);
                const allLeases = leasesRes.ok ? await leasesRes.json() : [];

                // Filter to leases overlapping the settlement year
                const yearStart = new Date(year, 0, 1);
                const yearEnd = new Date(year, 11, 31);
                const leases = allLeases.filter(l => {
                    const start = new Date(l.move_in_date);
                    const end = l.move_out_date ? new Date(l.move_out_date) : yearEnd;
                    return start <= yearEnd && end >= yearStart;
                });

                const tenants = {};
                const rentHistories = {};

                await Promise.all(leases.map(async (lease) => {
                    const [tenantRes, rentRes] = await Promise.all([
                        fetch(`/api/tenants/${lease.tenant_id}`),
                        fetch(`/api/rent_history?tenant_id=${lease.tenant_id}`)
                    ]);
                    if (tenantRes.ok) tenants[lease.tenant_id] = await tenantRes.json();
                    if (rentRes.ok) rentHistories[lease.tenant_id] = await rentRes.json();
                }));

                flatData[flat.id] = { leases, tenants, rentHistories };
            } catch (e) {
                console.warn(`Could not load data for flat ${flat.id}:`, e);
                flatData[flat.id] = { leases: [], tenants: {}, rentHistories: {} };
            }
        }));

        this.setState({ flatData, flatDataLoading: false });
    }

    /**
     * Compute the full balance breakdown for a single flat.
     * Returns null if sqm data is missing.
     */
    computeFlatBalance(flat) {
        const { settlement, building, flatData, flatHeatingBills } = this.state;
        const year = parseInt(settlement.year);

        if (!flat.square_meters || !building.total_square_meters) return null;

        const shareRatio = flat.square_meters / building.total_square_meters;
        const sharePercent = (shareRatio * 100).toFixed(3).replace('.', ',');

        // 1. Per-expense breakdown
        const expenseBreakdown = settlement.expenses
            .filter(e => e.description || e.amount)
            .map(e => {
                const total = parseFloat(e.amount) || 0;
                return { description: e.description, total, share: total * shareRatio };
            });
        const expenseShare = expenseBreakdown.reduce((s, e) => s + e.share, 0);

        // 2. Heating bill from state (live-updated)
        const heatingBill = flatHeatingBills[flat.id] || 0;

        // 3. Prorated upfront payments from rent_history
        const data = flatData?.[flat.id];
        let upfrontPayments = 0;
        let monthBreakdown = [];

        const yearStart = new Date(year, 0, 1);
        const yearEnd = new Date(year, 11, 31);

        if (data?.leases?.length > 0) {
            data.leases.forEach(lease => {
                const leaseStart = new Date(lease.move_in_date);
                const leaseEnd = lease.move_out_date ? new Date(lease.move_out_date) : yearEnd;
                const effectiveStart = leaseStart > yearStart ? leaseStart : yearStart;
                const effectiveEnd = leaseEnd < yearEnd ? leaseEnd : yearEnd;
                if (effectiveStart > effectiveEnd) return;

                const tenantHistory = data.rentHistories?.[lease.tenant_id] || [];

                for (let month = 0; month < 12; month++) {
                    const monthStart = new Date(year, month, 1);
                    const monthEnd = new Date(year, month + 1, 0);
                    if (monthEnd < effectiveStart || monthStart > effectiveEnd) continue;

                    const applicable = tenantHistory
                        .filter(r => {
                            const from = new Date(r.date_from);
                            const to = r.date_to ? new Date(r.date_to) : null;
                            return from <= monthEnd && (!to || to >= monthStart);
                        })
                        .sort((a, b) => new Date(b.date_from) - new Date(a.date_from))[0];

                    if (applicable) {
                        const monthly = Number(applicable.heating) + Number(applicable.maintenance);
                        upfrontPayments += monthly;
                        monthBreakdown.push({
                            month: month + 1,
                            heating: Number(applicable.heating),
                            maintenance: Number(applicable.maintenance)
                        });
                    }
                }
            });
        }

        const balance = expenseShare + heatingBill - upfrontPayments;
        const tenantObj = data?.leases?.length > 0 ? data.tenants?.[data.leases[0].tenant_id] : null;
        const tenantName = tenantObj ? `${tenantObj.first_name} ${tenantObj.last_name}` : null;

        return { sharePercent, shareRatio, expenseBreakdown, expenseShare, heatingBill, upfrontPayments, balance, tenantName, monthBreakdown };
    }

    /** Render the content inside a flat's tab panel */
    renderFlatTab(flat) {
        const { settlement, building, flatDataLoading, flatHeatingBills } = this.state;
        const heatingBillValue = flatHeatingBills[flat.id] ?? '';
        const fmt = (n) => i18n.formatCurrency(n);

        const warnings = [];
        if (!flat.square_meters) warnings.push('Wohnungsgröße (m²) ist nicht definiert. Bitte in der Wohnungsverwaltung ergänzen.');
        if (!building.total_square_meters) warnings.push('Gesamtgebäudegröße (m²) ist nicht definiert. Bitte im Gebäude ergänzen.');

        // Heating bill input — always shown at the top
        const heatingInputBlock = `
            <div class="form-group" style="max-width: 320px; margin-bottom: 24px;">
                <label for="heating_bill_${flat.id}">Heizkostenabrechnung (Heizölgesellschaft)</label>
                <div style="position: relative;">
                    <input
                        type="number" step="0.01"
                        id="heating_bill_${flat.id}"
                        class="input-number heating-bill-input"
                        value="${heatingBillValue}"
                        placeholder="0,00"
                        style="padding-right: 32px; width: 100%;"
                    >
                    <span style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); pointer-events: none;">€</span>
                </div>
                <small style="color: var(--text-secondary);">Wert aus der Heizkostenabrechnung des Versorgers. Wird beim Speichern übernommen.</small>
            </div>`;

        if (warnings.length > 0) {
            return heatingInputBlock + warnings.map(w => `
                <div style="padding: 12px 16px; background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234,179,8,0.3); border-radius: var(--border-radius-sm); color: #92400e; font-size: 0.9rem; margin-bottom: 8px;">
                    ⚠️ ${w}
                </div>`).join('');
        }

        if (flatDataLoading) {
            return heatingInputBlock + `<p style="color: var(--text-secondary);">Mieterdaten werden geladen...</p>`;
        }

        const calc = this.computeFlatBalance(flat);
        if (!calc) return heatingInputBlock + `<p style="color: var(--text-secondary);">Berechnung nicht möglich.</p>`;

        const balancePositive = calc.balance >= 0;

        return `
            ${heatingInputBlock}

            <!-- Tenant name + share percent badge -->
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 8px;">
                <div>
                    ${calc.tenantName
                ? `<span style="font-size: 0.82rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">Mieter</span><br><strong style="font-size: 1.05rem;">${calc.tenantName}</strong>`
                : `<span style="padding: 8px 12px; background: rgba(234,179,8,0.08); border-radius: var(--border-radius-sm); font-size:0.88rem; color:#92400e;">⚠️ Kein Mieter für dieses Abrechnungsjahr gefunden.</span>`
            }
                </div>
                <div style="text-align: right;">
                    <span style="font-size: 0.82rem; color: var(--text-secondary); display: block;">Kostenanteil</span>
                    <span style="font-size: 1.4rem; font-weight: 700; color: var(--primary-color);">${calc.sharePercent} %</span>
                    <span style="font-size: 0.8rem; color: var(--text-secondary); display: block;">${flat.square_meters} m² / ${building.total_square_meters} m²</span>
                </div>
            </div>

            <!-- Per-expense breakdown -->
            <div style="margin-bottom: 20px;">
                <div style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); margin-bottom: 8px;">Umlagefähige Kosten (Anteil ${calc.sharePercent} %)</div>
                <table style="width:100%; border-collapse: collapse; font-size: 0.92rem;">
                    <thead>
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <th style="padding: 6px 0; text-align: left; font-weight: 500; color: var(--text-secondary);">Position</th>
                            <th style="padding: 6px 0; text-align: right; font-weight: 500; color: var(--text-secondary);">Gesamt</th>
                            <th style="padding: 6px 0; text-align: right; font-weight: 500; color: var(--text-secondary);">Anteil</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${calc.expenseBreakdown.map((e, i, arr) => `
                            <tr style="border-bottom: ${i < arr.length - 1 ? '1px solid var(--border-color)' : '2px solid var(--border-color)'}; ">
                                <td style="padding: 8px 0; color: var(--text-primary);">${e.description || '—'}</td>
                                <td style="padding: 8px 0; text-align: right; color: var(--text-secondary);">${fmt(e.total)}</td>
                                <td style="padding: 8px 0; text-align: right; font-weight: 500;">${fmt(e.share)}</td>
                            </tr>
                        `).join('')}
                        <tr style="background: rgba(241,245,249,0.6);">
                            <td style="padding: 8px 0; font-weight: 600;">Summe Nebenkosten</td>
                            <td></td>
                            <td style="padding: 8px 0; text-align: right; font-weight: 700;">${fmt(calc.expenseShare)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Summary table -->
            <table style="width:100%; border-collapse: collapse; font-size: 0.95rem;">
                <tbody>
                    <tr style="border-bottom: 1px solid var(--border-color);">
                        <td style="padding: 10px 0; color: var(--text-secondary);">Nebenkosten-Anteil</td>
                        <td style="padding: 10px 0; text-align: right;">+ ${fmt(calc.expenseShare)}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid var(--border-color);">
                        <td style="padding: 10px 0; color: var(--text-secondary);">Heizkosten lt. Abrechnung</td>
                        <td style="padding: 10px 0; text-align: right;">+ ${fmt(calc.heatingBill)}</td>
                    </tr>
                    <tr style="border-bottom: 2px solid var(--border-color);">
                        <td style="padding: 10px 0; color: var(--text-secondary);">Vorauszahlungen (NK + HK, ${calc.monthBreakdown.length} Monate)</td>
                        <td style="padding: 10px 0; text-align: right; color: var(--success-color);">− ${fmt(calc.upfrontPayments)}</td>
                    </tr>
                    <tr style="background: ${balancePositive ? 'rgba(239,68,68,0.06)' : 'rgba(34,197,94,0.06)'}; ">
                        <td style="padding: 14px 12px; font-weight: 700; font-size: 1.05rem;">
                            ${balancePositive ? '💸 Nachzahlung' : '✅ Guthaben'}
                        </td>
                        <td style="padding: 14px 12px; text-align: right; font-weight: 700; font-size: 1.2rem; color: ${balancePositive ? 'var(--error-color)' : 'var(--success-color)'}">
                            ${fmt(Math.abs(calc.balance))}
                        </td>
                    </tr>
                </tbody>
            </table>
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color);">
                <button
                    type="button"
                    class="copy-flat-calc-btn"
                    style="display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: ${this.state.copiedCalc ? 'rgba(34,197,94,0.12)' : 'var(--surface-color)'}; color: ${this.state.copiedCalc ? '#16a34a' : 'var(--text-secondary)'}; border: 1px solid ${this.state.copiedCalc ? '#86efac' : 'var(--border-color)'}; border-radius: var(--border-radius-sm); cursor: pointer; font-size: 0.875rem; font-weight: 500; transition: all 0.2s;"
                >
                    ${this.state.copiedCalc ? `<span>✓</span> Kopiert!` : `<span style="font-size:1rem;">📋</span> In Zwischenablage`}
                </button>
            </div>`;
    }

    async handleCopyFlatCalc() {
        const activeFlat = this.state.flats[this.state.activeTab];
        if (!activeFlat) return;

        const calc = this.computeFlatBalance(activeFlat);
        if (!calc) return;

        const fmtNum = (n) => n.toFixed(2).replace('.', ',');

        // Build rows: expense breakdown + empty separator + summary
        const rows = [
            ...calc.expenseBreakdown.map(e => [e.description, fmtNum(e.total), fmtNum(e.share)]),
            ['Summe Nebenkosten', '', fmtNum(calc.expenseShare)],
            ['', '', ''],
            ['Heizkosten lt. Abrechnung', '', fmtNum(calc.heatingBill)],
            [`Vorauszahlungen NK+HK (${calc.monthBreakdown.length} Mon.)`, '', '-' + fmtNum(calc.upfrontPayments)],
            [calc.balance >= 0 ? 'Nachzahlung' : 'Guthaben', '', fmtNum(Math.abs(calc.balance))]
        ];

        const tsv = rows.map(r => r.join('\t')).join('\n');

        const htmlRows = rows.map((r, i) => {
            const isSeparator = r.every(c => c === '');
            if (isSeparator) return `<tr><td colspan="3">&nbsp;</td></tr>`;
            return `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`;
        }).join('\n');

        const tableHtml = `<html><body><table>${htmlRows}</table></body></html>`;

        try {
            await navigator.clipboard.write([
                new ClipboardItem({
                    'text/plain': new Blob([tsv], { type: 'text/plain' }),
                    'text/html': new Blob([tableHtml], { type: 'text/html' }),
                })
            ]);
            this.setState({ copiedCalc: true });
            setTimeout(() => this.setState({ copiedCalc: false }), 2500);
        } catch (err) {
            console.error('Clipboard write failed:', err);
            alert('Kopieren fehlgeschlagen.');
        }
    }

    attachEventListeners() {
        const form = document.getElementById('settlementForm');
        if (form) form.addEventListener('submit', this.handleSubmit.bind(this));

        const addRowBtn = document.getElementById('addExpenseRow');
        if (addRowBtn) {
            addRowBtn.addEventListener('click', () => {
                const updatedSettlement = { ...this.state.settlement };
                updatedSettlement.expenses.push({ description: '', amount: '' });
                this.setState({ settlement: updatedSettlement });
            });
        }

        document.querySelectorAll('.remove-row-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index, 10);
                const updatedSettlement = { ...this.state.settlement };
                updatedSettlement.expenses.splice(index, 1);
                this.setState({ settlement: updatedSettlement });
            });
        });

        document.querySelectorAll('.flat-tab-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index, 10);
                this.setState({ activeTab: index });
            });
        });

        const copyBtn = document.getElementById('copyPreviousBtn');
        if (copyBtn) copyBtn.addEventListener('click', this.handleCopyPreviousYear.bind(this));

        const deleteBtn = document.getElementById('deleteSettlementBtn');
        if (deleteBtn) deleteBtn.addEventListener('click', this.handleDelete.bind(this));

        const copyClipBtn = document.getElementById('copyToClipboardBtn');
        if (copyClipBtn) copyClipBtn.addEventListener('click', this.handleCopyToClipboard.bind(this));

        // Live-recalculate when heating bill changes (on blur/Enter)
        document.querySelectorAll('.heating-bill-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const flatId = parseInt(e.target.id.replace('heating_bill_', ''), 10);
                const val = parseFloat(e.target.value) || 0;
                this.setState({
                    flatHeatingBills: { ...this.state.flatHeatingBills, [flatId]: val }
                });
            });
        });

        document.querySelectorAll('.copy-flat-calc-btn').forEach(btn => {
            btn.addEventListener('click', this.handleCopyFlatCalc.bind(this));
        });
    }

    async handleCopyPreviousYear() {
        try {
            const res = await fetch(`/api/settlements/building/${this.buildingId}`);
            if (!res.ok) throw new Error('Could not fetch previous years');
            const resData = await res.json();
            const settlements = resData.data;

            if (settlements && settlements.length > 0) {
                const prev = settlements.find(s => s.year < this.state.settlement.year);
                if (prev) {
                    const prevRes = await fetch(`/api/settlements/${prev.id}`);
                    if (prevRes.ok) {
                        const prevData = await prevRes.json();
                        const prevExpenses = prevData.data.expenses;
                        if (prevExpenses && prevExpenses.length > 0) {
                            const updatedSettlement = { ...this.state.settlement };
                            const cleanPrevExpenses = prevExpenses.map(e => ({ description: e.description, amount: e.amount }));
                            if (updatedSettlement.expenses.length === 1 && !updatedSettlement.expenses[0].description && !updatedSettlement.expenses[0].amount) {
                                updatedSettlement.expenses = cleanPrevExpenses;
                            } else {
                                updatedSettlement.expenses = [...updatedSettlement.expenses, ...cleanPrevExpenses];
                            }
                            this.setState({ settlement: updatedSettlement });
                            return;
                        }
                    }
                }
            }
            alert('Keine Abrechnung aus dem Vorjahr gefunden.');
        } catch (e) {
            console.error(e);
            alert('Fehler beim Kopieren.');
        }
    }

    async handleCopyToClipboard() {
        const { settlement } = this.state;
        const expenses = settlement.expenses.filter(e => e.description || e.amount);
        const total = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

        const dataRows = expenses.map(e => [
            e.description,
            (parseFloat(e.amount) || 0).toFixed(2).replace('.', ',')
        ]);
        const totalRow = ['Gesamt', total.toFixed(2).replace('.', ',')];
        const allRows = [...dataRows, totalRow];

        const tsv = allRows.map(r => r.join('\t')).join('\n');
        const htmlRows = allRows.map((r) => {
            if (r === totalRow) return `<tr style="font-weight:bold;border-top:2px solid #000;"><td>${r[0]}</td><td>${r[1]}</td></tr>`;
            return `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`;
        }).join('\n');
        const tableHtml = `<html><body><table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse;font-family:Calibri,sans-serif;font-size:11pt;">${htmlRows}</table></body></html>`;

        try {
            await navigator.clipboard.write([
                new ClipboardItem({
                    'text/plain': new Blob([tsv], { type: 'text/plain' }),
                    'text/html': new Blob([tableHtml], { type: 'text/html' }),
                })
            ]);
            this.setState({ copied: true });
            setTimeout(() => this.setState({ copied: false }), 2500);
        } catch (err) {
            console.error('Clipboard write failed:', err);
            alert('Kopieren fehlgeschlagen. Bitte stellen Sie sicher, dass die Seite Clipboard-Berechtigungen hat.');
        }
    }

    async handleDelete() {
        if (!confirm('Möchten Sie diese Abrechnung wirklich löschen? Alle zugehörigen Kosten werden ebenfalls entfernt.')) return;
        try {
            const response = await fetch(`/api/settlements/${this.settlementId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Fehler beim Löschen der Abrechnung');
            window.history.pushState(null, null, `/buildings/${this.buildingId}/edit`);
            window.dispatchEvent(new Event('popstate'));
        } catch (err) {
            this.setState({ error: err.message });
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        const year = document.getElementById('year').value;
        const date = document.getElementById('date').value;
        const status = document.getElementById('status').value;

        const expenses = [];
        document.querySelectorAll('.expense-row').forEach(row => {
            const desc = row.querySelector('.exp-desc').value;
            const amt = row.querySelector('.exp-amt').value;
            if (desc || amt) expenses.push({ description: desc, amount: parseFloat(amt) || 0 });
        });

        // Collect per-flat heating bills from state (kept in sync by change events)
        const flats = this.state.flats.map(flat => ({
            flat_id: flat.id,
            heating_bill: this.state.flatHeatingBills[flat.id] || 0
        }));

        const updatedSettlement = { building_id: this.buildingId, year, date, status, expenses, flats };
        this.setState({ saving: true, error: null });

        try {
            const method = this.isEdit ? 'PUT' : 'POST';
            const url = this.isEdit ? `/api/settlements/${this.settlementId}` : '/api/settlements';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedSettlement)
            });

            if (!response.ok) throw new Error('Fehler beim Speichern der Abrechnung');

            const data = await response.json();
            if (!this.isEdit) {
                this.isEdit = true;
                this.settlementId = data.id || data.data?.id;
                window.history.replaceState(null, null, `/buildings/${this.buildingId}/settlements/${this.settlementId}/edit`);
            }
            this.setState({ saving: false, saved: true });
            setTimeout(() => this.setState({ saved: false }), 2500);
        } catch (err) {
            this.setState({ saving: false, error: err.message });
        }
    }

    render() {
        if (this.state.loading) {
            return `<div class="card" style="display: flex; align-items: center; justify-content: center; min-height: 400px;"><h2>Laden...</h2></div>`;
        }

        const totalExpenses = this.state.settlement.expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
        const activeFlat = this.state.flats[this.state.activeTab];

        return `
            <div>
                <header style="margin-bottom: 32px; display: flex; align-items: center; gap: 16px;">
                    <a href="/buildings/${this.buildingId}/edit" data-link style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; background: var(--surface-color); border: 1px solid var(--border-color); color: var(--text-secondary);">&larr;</a>
                    <div>
                        <h1 style="font-size: 2.25rem; font-weight: 700; letter-spacing: -1px; color: var(--text-primary); margin-bottom: 4px;">${this.isEdit ? 'Abrechnung bearbeiten' : 'Neue Abrechnung'}</h1>
                        <p style="color: var(--text-secondary); font-size: 1.1rem;">${this.state.building.address}</p>
                    </div>
                </header>

                <div class="card" style="max-width: 800px; margin-bottom: 24px;">
                    ${this.state.error ? `<div style="padding: 12px; margin-bottom: 20px; background: rgba(239, 68, 68, 0.1); color: var(--error-color); border-radius: var(--border-radius-sm);">${this.state.error}</div>` : ''}

                    <form id="settlementForm">
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                            <div class="form-group">
                                <label for="year">Abrechnungsjahr</label>
                                <input type="number" id="year" class="input-number" required value="${this.state.settlement.year}" ${this.state.saving ? 'disabled' : ''}>
                            </div>
                            <div class="form-group">
                                <label for="date">Erstellungsdatum</label>
                                <input type="date" id="date" class="input-short" required value="${this.state.settlement.date}" ${this.state.saving ? 'disabled' : ''}>
                            </div>
                            <div class="form-group">
                                <label for="status">Status</label>
                                <select id="status" class="input-short" ${this.state.saving ? 'disabled' : ''}>
                                    <option value="Draft" ${this.state.settlement.status === 'Draft' ? 'selected' : ''}>Entwurf</option>
                                    <option value="Final" ${this.state.settlement.status === 'Final' ? 'selected' : ''}>Final</option>
                                </select>
                            </div>
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 16px;">
                            <h3 style="margin: 0; font-weight: 600;">Umlagefähige Kosten</h3>
                            ${!this.isEdit ? `<button type="button" id="copyPreviousBtn" class="btn btn-secondary btn-sm" style="background: var(--surface-color); color: var(--text-secondary); border-color: var(--border-color);">Aus Vorjahr kopieren</button>` : ''}
                        </div>

                        <div id="expenses-container">
                            ${this.state.settlement.expenses.map((exp, idx) => `
                                <div class="expense-row form-row" style="align-items: center; margin-bottom: 12px; flex-wrap: nowrap;">
                                    <div class="form-group" style="flex: 2; margin-bottom: 0;">
                                        <input type="text" class="input-long exp-desc" placeholder="z.B. Müllabfuhr, Grundsteuer" value="${exp.description}" required>
                                    </div>
                                    <div class="form-group" style="flex: 1; margin-bottom: 0; position: relative;">
                                        <input type="number" step="0.01" class="input-number exp-amt" placeholder="0.00" value="${exp.amount}" required style="padding-right: 32px; width: 100%;">
                                        <span style="position: absolute; right: 12px; top: 10px; color: var(--text-secondary);">€</span>
                                    </div>
                                    <button type="button" class="btn btn-action remove-row-btn" data-index="${idx}" style="color: var(--error-color); margin-bottom: 0;">&times;</button>
                                </div>
                            `).join('')}
                        </div>

                        <div style="margin-top: 12px; margin-bottom: 32px; display: flex; gap: 12px;">
                            <button type="button" id="addExpenseRow" class="btn btn-secondary">+ Weitere Zeile hinzufügen</button>
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 16px; margin-bottom: 24px;">
                            <button
                                type="button"
                                id="copyToClipboardBtn"
                                style="display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: ${this.state.copied ? 'rgba(34,197,94,0.12)' : 'var(--surface-color)'}; color: ${this.state.copied ? '#16a34a' : 'var(--text-secondary)'}; border: 1px solid ${this.state.copied ? '#86efac' : 'var(--border-color)'}; border-radius: var(--border-radius-sm); cursor: pointer; font-size: 0.875rem; font-weight: 500; transition: all 0.2s;"
                            >
                                ${this.state.copied
                ? `<span>✓</span> Kopiert!`
                : `<span style="font-size:1rem;">📋</span> In Zwischenablage (Word/Excel)`
            }
                            </button>
                            <div style="display: flex; align-items: center; gap: 16px;">
                                <span style="font-size: 1.1rem; font-weight: 600; color: var(--text-secondary);">Summe:</span>
                                <span style="font-size: 1.25rem; font-weight: 700;">${totalExpenses.toFixed(2)} €</span>
                            </div>
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                ${this.isEdit ? `<button type="button" id="deleteSettlementBtn" class="btn btn-danger">Abrechnung löschen</button>` : ''}
                            </div>
                            <div style="display: flex; gap: 12px; align-items: center;">
                                ${this.state.saved ? `<span style="color: var(--success-color); font-weight: 500; font-size: 0.9rem;">✓ Gespeichert</span>` : ''}
                                <a href="/buildings/${this.buildingId}/edit" data-link class="btn btn-secondary">Abbrechen</a>
                                <button type="submit" class="btn btn-primary" ${this.state.saving ? 'disabled' : ''}>
                                    ${this.state.saving ? 'Wird gespeichert...' : 'Abrechnung speichern'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                <!-- Per-flat calculation panel -->
                <div class="card" style="max-width: 800px; padding: 0;">
                    <div style="padding: 16px 24px; border-bottom: 1px solid var(--border-color); background: rgba(241, 245, 249, 0.5);">
                        <h3 style="font-weight: 600; margin-bottom: 4px;">Mieter-Abrechnungen</h3>
                        <p style="color: var(--text-secondary); font-size: 0.9rem;">Anteilige Kostenverteilung, Heizkosten und Vorauszahlungen pro Wohnung.</p>
                    </div>

                    <div style="display: flex; overflow-x: auto; border-bottom: 1px solid var(--border-color);">
                        ${this.state.flats.map((flat, idx) => `
                            <button class="flat-tab-btn" data-index="${idx}" style="padding: 12px 24px; background: ${this.state.activeTab === idx ? 'var(--surface-color)' : 'transparent'}; border: none; border-bottom: 2px solid ${this.state.activeTab === idx ? 'var(--primary-color)' : 'transparent'}; cursor: pointer; font-weight: ${this.state.activeTab === idx ? '600' : '400'}; color: ${this.state.activeTab === idx ? 'var(--text-primary)' : 'var(--text-secondary)'}; white-space: nowrap;">
                                ${flat.name_number}
                            </button>
                        `).join('')}
                    </div>

                    <div style="padding: 24px;">
                        ${this.state.flats.length > 0 && activeFlat ? `
                            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 20px;">
                                <h4 style="font-size: 1.05rem; font-weight: 600;">${activeFlat.name_number}</h4>
                                ${activeFlat.square_meters ? `<span style="font-size: 0.9rem; color: var(--text-secondary);">${activeFlat.square_meters} m²</span>` : ''}
                            </div>
                            ${this.renderFlatTab(activeFlat)}
                        ` : `
                            <p style="color: var(--text-secondary);">Keine Wohnungen in diesem Gebäude gefunden.</p>
                        `}
                    </div>
                </div>
            </div>
        `;
    }
}
