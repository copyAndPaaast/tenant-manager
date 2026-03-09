import Router from './Router.js';
import Dashboard from '../components/Dashboard.js';
import BuildingsList from '../components/BuildingsList.js';
import BuildingForm from '../components/BuildingForm.js';
import FlatsList from '../components/FlatsList.js';
import FlatForm from '../components/FlatForm.js';
import TenantsList from '../components/TenantsList.js';
import TenantForm from '../components/TenantForm.js';
import ContractorsList from '../components/ContractorsList.js';
import ContractorForm from '../components/ContractorForm.js';
import ExpensesList from '../components/ExpensesList.js';
import ExpenseForm from '../components/ExpenseForm.js';
import SettlementForm from '../components/SettlementForm.js';
import Admin from '../components/Admin.js';
import i18n from './i18n.js';

const routes = {
    '/': Dashboard,
    '/buildings': BuildingsList,
    '/buildings/new': BuildingForm,
    '/buildings/:id/edit': BuildingForm,
    '/flats': FlatsList,
    '/flats/new': FlatForm,
    '/flats/:id/edit': FlatForm,
    '/tenants': TenantsList,
    '/tenants/new': TenantForm,
    '/tenants/:id/edit': TenantForm,
    '/contractors': ContractorsList,
    '/contractors/new': ContractorForm,
    '/contractors/:id/edit': ContractorForm,
    '/expenses': ExpensesList,
    '/expenses/new': ExpenseForm,
    '/expenses/:id/edit': ExpenseForm,
    '/buildings/:id/settlements/new': SettlementForm,
    '/buildings/:id/settlements/:id/edit': SettlementForm,
    '/admin': Admin,
};

function renderNavigation() {
    const sidebarNav = document.getElementById('sidebar-nav');
    const topBarControls = document.getElementById('top-bar-controls');

    if (sidebarNav) {
        sidebarNav.innerHTML = `
            <a href="/" data-link>${i18n.t('nav_dashboard')}</a>
            <a href="/buildings" data-link>${i18n.t('nav_buildings')}</a>
            <a href="/flats" data-link>${i18n.t('nav_flats')}</a>
            <a href="/tenants" data-link>${i18n.t('nav_tenants')}</a>
            <a href="/contractors" data-link>${i18n.t('nav_contractors')}</a>
            <a href="/expenses" data-link>${i18n.t('nav_expenses')}</a>
        `;
    }

    if (topBarControls) {
        const currentLocale = i18n.getLocale();
        const otherLocale = currentLocale === 'de' ? 'en' : 'de';

        topBarControls.innerHTML = `
            <a href="/admin" data-link class="top-bar-link">${i18n.t('nav_admin')}</a>
            <button id="langToggle" class="btn btn-secondary" style="font-size: 0.8rem; padding: 6px 12px;">
                ${otherLocale.toUpperCase()}
            </button>
        `;

        document.getElementById('langToggle').addEventListener('click', () => {
            i18n.setLocale(otherLocale);
        });
    }
}

function applyLogo(logoUrl) {
    const brand = document.getElementById('sidebar-brand');
    if (!brand) return;
    if (logoUrl) {
        brand.innerHTML = `<img src="${logoUrl}" alt="Logo">`;
    } else {
        brand.textContent = 'Tenant Manager';
    }
}

async function loadLogo() {
    try {
        const res = await fetch('/api/settings/logo');
        if (res.ok) {
            const data = await res.json();
            applyLogo(data.value);
        }
    } catch (e) { /* no logo set */ }
}

// Expose so Admin page can refresh after upload
window._applyLogo = applyLogo;

// Initial navigation render
renderNavigation();
loadLogo();

// Start routing
const rootElement = document.getElementById('app');
const appRouter = new Router(routes, rootElement);
appRouter.init();
