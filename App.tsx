import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Filters } from './components/Filters';
import { SMSComparisonTable } from './components/SMSComparisonTable';
import { fetchSMSData, filterData, sortData } from './services/smsDataService';
import { DEFAULT_FILTERS } from './types';
import type { SMSRate, SMSDataPackage, FilterState, SortState } from './types';
import { ITEMS_PER_PAGE } from './constants';

/* ── Lazy-loaded pages ──────────────────────────────────────────────── */
const LandingPage = React.lazy(() => import('./components/LandingPage').then(m => ({ default: m.LandingPage })));
const CountryPage = React.lazy(() => import('./components/CountryPage').then(m => ({ default: m.CountryPage })));
const ProviderPage = React.lazy(() => import('./components/ProviderPage').then(m => ({ default: m.ProviderPage })));
const TrendsPage = React.lazy(() => import('./components/TrendsPage').then(m => ({ default: m.TrendsPage })));
const AboutPage = React.lazy(() => import('./components/AboutPage').then(m => ({ default: m.AboutPage })));
const MethodologyPage = React.lazy(() => import('./components/MethodologyPage').then(m => ({ default: m.MethodologyPage })));
const TCOCalculator = React.lazy(() => import('./components/TCOCalculator').then(m => ({ default: m.TCOCalculator })));
const InvoiceAnalysis = React.lazy(() => import('./components/InvoiceAnalysis').then(m => ({ default: m.InvoiceAnalysis })));
const PricingPage = React.lazy(() => import('./components/PricingPage').then(m => ({ default: m.PricingPage })));
const APIPage = React.lazy(() => import('./components/APIPage').then(m => ({ default: m.APIPage })));

/* ── Loading fallback ──────────────────────────────────────────────── */
const PageLoader = () => (
  <div className="flex items-center justify-center py-24">
    <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
  </div>
);

/* ── Comparison page ────────────────────────────────────────────────── */
const ComparisonPage: React.FC<{
  data: SMSRate[];
  isLoading: boolean;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  sort: SortState;
  setSort: React.Dispatch<React.SetStateAction<SortState>>;
  page: number;
  setPage: (p: number) => void;
}> = ({ data, isLoading, filters, setFilters, sort, setSort, page, setPage }) => {
  const filtered = useMemo(() => filterData(data, filters), [data, filters]);
  const sorted = useMemo(() => sortData(filtered, sort), [filtered, sort]);
  const pageCount = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const paginated = sorted.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [filters, setPage]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
          Messaging Price Comparison
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Compare SMS, MMS, WhatsApp &amp; RCS costs across {13} providers for {217}+ countries.
        </p>
      </div>

      <Filters filters={filters} setFilters={setFilters} resultCount={filtered.length} />
      <SMSComparisonTable
        data={paginated}
        totalCount={sorted.length}
        sort={sort}
        setSort={setSort}
        isLoading={isLoading}
        page={page}
        pageCount={pageCount}
        setPage={setPage}
      />
    </div>
  );
};

/* ── App root ───────────────────────────────────────────────────────── */

const App: React.FC = () => {
  const [dataPackage, setDataPackage] = useState<SMSDataPackage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortState>({ field: 'price_usd', direction: 'asc' });
  const [page, setPage] = useState(1);

  const data = dataPackage?.data ?? [];
  const lastUpdated = dataPackage?.lastUpdated ?? null;

  useEffect(() => {
    fetchSMSData()
      .then((pkg) => setDataPackage(pkg))
      .catch((err) => console.error('Failed to load SMS data:', err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col">
        <Header lastUpdated={lastUpdated} />

        <main id="main-content" className="flex-1">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<LandingPage data={data} isLoading={isLoading} />} />
              <Route
                path="/compare"
                element={
                  <ComparisonPage
                    data={data}
                    isLoading={isLoading}
                    filters={filters}
                    setFilters={setFilters}
                    sort={sort}
                    setSort={setSort}
                    page={page}
                    setPage={setPage}
                  />
                }
              />
              <Route path="/trends" element={<TrendsPage data={data} />} />
              <Route path="/country/:iso" element={<CountryPage data={data} />} />
              <Route path="/provider/:slug" element={<ProviderPage data={data} />} />
              <Route
                path="/calculator"
                element={
                  <TCOCalculator
                    data={data}
                    phoneNumbers={dataPackage?.phoneNumbers ?? []}
                    volumeTiers={dataPackage?.volumeTiers ?? []}
                    tenDlcFees={dataPackage?.tenDlcFees ?? []}
                  />
                }
              />
              <Route path="/analyze" element={<InvoiceAnalysis data={data} />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/api-docs" element={<APIPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/methodology" element={<MethodologyPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>

        <Footer />
      </div>
    </ThemeProvider>
  );
};

export default App;
