
import React, { useMemo, useState } from 'react';
import { 
  Truck, 
  Fuel, 
  TrendingUp, 
  Search,
  Download,
  Droplets,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Target,
  Activity,
  DollarSign,
  LayoutDashboard,
  Wallet,
  Calculator,
  Equal,
  Minus,
  X,
  TrendingDown,
  ShieldCheck,
  Info,
  Calendar,
  Layers,
  MapPin,
  Gauge
} from 'lucide-react';
import { parseData } from './data';
import { VehicleData } from './types';

type SortKeys = 'vehicle' | 'svc' | 'distanceKm' | 'dailyKm' | 'dailyFuel' | 'estimatedFuelLiters' | 'fuelUsed' | 'fuelWasteLiters' | 'actualAvg' | 'financialImpact';
type SortOrder = 'asc' | 'desc';
type TabType = 'performance' | 'financeira';

const TOTAL_DAYS = 92; // Out (31) + Nov (30) + Dez (31) = 92 dias
const FUEL_PRICES = {
  DIESEL: 6.225,
  GASOLINA: 6.34,
  ETANOL: 4.45,
  FLEX: 6.34
};

const StatCard = ({ title, value, subtitle, icon: Icon, colorClass, trend, isCurrency, isPositive }: any) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-xl transition-all duration-300 border-b-4" style={{ borderBottomColor: trend > 10 ? '#e11d48' : 'transparent' }}>
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2.5 rounded-xl ${colorClass}`}>
        <Icon size={20} className="text-white" />
      </div>
      {trend !== undefined && (
        <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${trend > 0 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
          {trend > 0 ? `+${trend}% DESVIO` : `${trend}% EFIC`}
        </span>
      )}
    </div>
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
    <h3 className={`text-2xl font-black mt-1 leading-none ${isCurrency ? (isPositive ? 'text-emerald-600' : 'text-rose-600') : 'text-slate-800'}`}>
      {value}
    </h3>
    <p className="text-[10px] text-slate-400 mt-2 font-medium">{subtitle}</p>
  </div>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('performance');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSVC, setSelectedSVC] = useState('Todos');
  const [selectedModel, setSelectedModel] = useState('Todos');
  const [sortConfig, setSortConfig] = useState<{ key: SortKeys, order: SortOrder }>({ key: 'distanceKm', order: 'desc' });

  const processedData = useMemo(() => {
    return parseData().map(v => {
      const estimatedFuel = v.idealAvg > 0 ? v.distanceKm / v.idealAvg : 0;
      const hasData = v.fuelUsed > 0;
      const fuelWaste = hasData ? (v.fuelUsed - estimatedFuel) : 0;
      const dailyKm = v.distanceKm / TOTAL_DAYS;
      const dailyFuel = v.fuelUsed / TOTAL_DAYS;
      
      let price = FUEL_PRICES.DIESEL;
      const fuelTypeUpper = v.fuelType.toUpperCase();
      if (fuelTypeUpper.includes('FLEX')) price = FUEL_PRICES.FLEX;
      else if (fuelTypeUpper.includes('GASOLINA')) price = FUEL_PRICES.GASOLINA;
      else if (fuelTypeUpper.includes('ETANOL')) price = FUEL_PRICES.ETANOL;

      return {
        ...v,
        dailyKm,
        dailyFuel,
        fuelGap: (hasData && estimatedFuel > 0) ? ((v.fuelUsed - estimatedFuel) / estimatedFuel) * 100 : 0,
        estimatedFuelLiters: estimatedFuel,
        fuelWasteLiters: fuelWaste,
        financialImpact: fuelWaste * price,
        fuelPriceUsed: price,
        isValidForFinance: hasData
      };
    }) as (VehicleData & { dailyKm: number; dailyFuel: number; isValidForFinance: boolean })[];
  }, []);

  const svcs = useMemo(() => ['Todos', ...new Set(processedData.map(v => v.svc))].sort(), [processedData]);
  const models = useMemo(() => ['Todos', ...new Set(processedData.map(v => v.model))].sort(), [processedData]);

  const filteredData = useMemo(() => {
    return processedData.filter(v => {
      const matchSearch = v.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          v.model.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSVC = selectedSVC === 'Todos' || v.svc === selectedSVC;
      const matchModel = selectedModel === 'Todos' || v.model === selectedModel;
      return matchSearch && matchSVC && matchModel;
    }).sort((a, b) => {
      const valA = (a as any)[sortConfig.key] || 0;
      const valB = (b as any)[sortConfig.key] || 0;
      if (sortConfig.order === 'asc') return valA > valB ? 1 : -1;
      return valA < valB ? 1 : -1;
    });
  }, [processedData, searchTerm, selectedSVC, selectedModel, sortConfig]);

  const groupStats = useMemo(() => {
    const byModel = models.filter(m => m !== 'Todos').map(model => {
      const items = processedData.filter(v => v.model === model);
      const totalKm = items.reduce((acc, curr) => acc + curr.distanceKm, 0);
      const totalFuel = items.reduce((acc, curr) => acc + curr.fuelUsed, 0);
      return { 
        name: model, 
        avgDailyKm: totalKm / (items.length * TOTAL_DAYS), 
        avgDailyFuel: totalFuel / (items.length * TOTAL_DAYS),
        count: items.length 
      };
    }).sort((a, b) => b.avgDailyKm - a.avgDailyKm).slice(0, 5);

    const bySVC = svcs.filter(s => s !== 'Todos').map(svc => {
      const items = processedData.filter(v => v.svc === svc);
      const totalKm = items.reduce((acc, curr) => acc + curr.distanceKm, 0);
      const totalFuel = items.reduce((acc, curr) => acc + curr.fuelUsed, 0);
      return { 
        name: svc, 
        avgDailyKm: totalKm / (items.length * TOTAL_DAYS), 
        avgDailyFuel: totalFuel / (items.length * TOTAL_DAYS),
        count: items.length 
      };
    }).sort((a, b) => b.avgDailyKm - a.avgDailyKm).slice(0, 5);

    return { byModel, bySVC };
  }, [processedData, models, svcs]);

  const stats = useMemo(() => {
    const validFinanceData = filteredData.filter(v => v.isValidForFinance);
    const totalDist = filteredData.reduce((acc, curr) => acc + curr.distanceKm, 0);
    const totalActualFuel = filteredData.reduce((acc, curr) => acc + curr.fuelUsed, 0);
    const totalEstimatedFuel = filteredData.reduce((acc, curr) => acc + (curr.estimatedFuelLiters || 0), 0);
    
    const fleetDailyKm = totalDist / (filteredData.length * TOTAL_DAYS);
    const fleetDailyFuel = totalActualFuel / (filteredData.length * TOTAL_DAYS);
    
    const totalWasteLoss = validFinanceData.filter(v => v.financialImpact > 0).reduce((acc, curr) => acc + curr.financialImpact, 0);
    const totalEconomyGain = validFinanceData.filter(v => v.financialImpact < 0).reduce((acc, curr) => acc + Math.abs(curr.financialImpact), 0);
    const totalGap = totalEstimatedFuel > 0 ? ((totalActualFuel - totalEstimatedFuel) / totalEstimatedFuel) * 100 : 0;

    return {
      totalDistance: totalDist,
      totalFuelUsed: totalActualFuel,
      totalEstimatedFuel,
      fuelWasteTotal: totalActualFuel - totalEstimatedFuel,
      fleetDailyKm,
      fleetDailyFuel,
      totalWasteLoss,
      totalEconomyGain,
      totalGap
    };
  }, [filteredData]);

  const handleSort = (key: SortKeys) => {
    setSortConfig(prev => ({
      key,
      order: prev.key === key && prev.order === 'desc' ? 'asc' : 'desc'
    }));
  };

  const SortIcon = ({ col }: { col: SortKeys }) => {
    if (sortConfig.key !== col) return <ArrowUpDown size={12} className="ml-1 opacity-20" />;
    return sortConfig.order === 'desc' ? <ArrowDown size={12} className="ml-1 text-indigo-600" /> : <ArrowUp size={12} className="ml-1 text-indigo-600" />;
  };

  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Sidebar */}
      <aside className="w-80 bg-[#0F172A] p-6 flex flex-col sticky top-0 h-screen text-white shadow-2xl z-50">
        <div className="flex items-center space-x-3 mb-10 pb-6 border-b border-slate-800">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-2.5 rounded-xl shadow-lg">
            <Activity size={24} className="text-white" />
          </div>
          <h1 className="font-black text-xl tracking-tighter leading-none">
            FROTA <br/>
            <span className="text-indigo-400 uppercase">Transmaná</span>
          </h1>
        </div>

        <div className="space-y-8 flex-1 overflow-y-auto no-scrollbar">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase mb-3 block tracking-widest">Busca Rápida</label>
            <div className="relative group">
              <Search className="absolute left-3 top-3.5 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Placa ou modelo..."
                className="w-full pl-10 pr-4 py-3.5 bg-slate-800/40 border border-slate-700/50 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-100"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Unidade SVC</label>
              <select 
                className="w-full p-3.5 bg-slate-800/40 border border-slate-700/50 rounded-xl text-sm text-slate-300 outline-none"
                value={selectedSVC}
                onChange={(e) => setSelectedSVC(e.target.value)}
              >
                {svcs.map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Filtro por Modelo</label>
              <select 
                className="w-full p-3.5 bg-slate-800/40 border border-slate-700/50 rounded-xl text-sm text-slate-300 outline-none"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                {models.map(m => <option key={m} value={m} className="bg-slate-900">{m}</option>)}
              </select>
            </div>
          </div>

          <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
             <div className="flex items-center space-x-2 text-indigo-400 mb-2">
                <Calendar size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Período de Análise</span>
             </div>
             <p className="text-xs font-bold text-slate-300">01 Out 2025 — 31 Dez 2025</p>
             <p className="text-[10px] text-slate-500 mt-1">Base de Cálculo: {TOTAL_DAYS} dias</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
        <header className="mb-10">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Análise de Médias</h2>
              <p className="text-slate-500 font-medium text-base mt-2">Visão diária de rodagem e consumo por ativo.</p>
            </div>
            <div className="flex p-1 bg-white rounded-2xl border border-slate-200 shadow-sm">
               <button onClick={() => setActiveTab('performance')} className={`flex items-center space-x-2 px-6 py-3 rounded-xl text-xs font-black transition-all ${activeTab === 'performance' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}><LayoutDashboard size={14} /><span>PERFORMANCE</span></button>
               <button onClick={() => setActiveTab('financeira')} className={`flex items-center space-x-2 px-6 py-3 rounded-xl text-xs font-black transition-all ${activeTab === 'financeira' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}><Wallet size={14} /><span>FINANCEIRO</span></button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {activeTab === 'performance' ? (
              <>
                <StatCard title="Total Rodado" value={`${stats.totalDistance.toLocaleString('pt-BR')} km`} subtitle="Acumulado no período" icon={TrendingUp} colorClass="bg-slate-900" />
                <StatCard title="Km Médio / Dia" value={`${stats.fleetDailyKm.toFixed(1)} km`} subtitle="Média por veículo" icon={Target} colorClass="bg-indigo-600" />
                <StatCard title="L Médio / Dia" value={`${stats.fleetDailyFuel.toFixed(1)} L`} subtitle="Consumo médio por veículo" icon={Droplets} colorClass="bg-amber-600" />
                <StatCard title="Desvio Litros" value={`${stats.fuelWasteTotal.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} L`} subtitle="Litragem acima da meta" icon={Fuel} trend={stats.totalGap.toFixed(1)} colorClass="bg-rose-600" />
              </>
            ) : (
              <>
                <StatCard title="Prejuízo de Excesso" value={formatCurrency(stats.totalWasteLoss)} subtitle="Impacto dos desvios" icon={TrendingDown} isCurrency={true} isPositive={false} colorClass="bg-rose-600" />
                <StatCard title="Economia Real" value={formatCurrency(stats.totalEconomyGain)} subtitle="Ganho por eficiência" icon={TrendingUp} isCurrency={true} isPositive={true} colorClass="bg-emerald-600" />
                <StatCard title="Saldo Líquido" value={formatCurrency(stats.totalWasteLoss - stats.totalEconomyGain)} subtitle="Resultado financeiro" icon={Wallet} isCurrency={true} isPositive={stats.totalWasteLoss - stats.totalEconomyGain < 0} colorClass="bg-slate-900" />
                <StatCard title="Custo Base" value="R$ 6,22" subtitle="Preço médio combustível" icon={DollarSign} colorClass="bg-indigo-600" />
              </>
            )}
          </div>
        </header>

        {activeTab === 'performance' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            {/* Média por Modelo */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600"><Layers size={20} /></div>
                <h4 className="font-black text-slate-800 text-sm tracking-tight uppercase">Performance Diária por Modelo (Top 5)</h4>
              </div>
              <div className="space-y-8">
                {groupStats.byModel.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <span className="text-xs font-black text-slate-800 uppercase block">{item.name}</span>
                        <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{item.count} veículos</span>
                          <span className="text-amber-600 flex items-center"><Droplets size={10} className="mr-1" /> {item.avgDailyFuel.toFixed(1)} L/dia</span>
                        </div>
                      </div>
                      <span className="text-sm font-black text-indigo-600">{item.avgDailyKm.toFixed(1)} km/dia</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(item.avgDailyKm / 200) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Média por SVC */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600"><MapPin size={20} /></div>
                <h4 className="font-black text-slate-800 text-sm tracking-tight uppercase">Performance Diária por SVC (Top 5)</h4>
              </div>
              <div className="space-y-8">
                {groupStats.bySVC.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <span className="text-xs font-black text-slate-800 uppercase block">{item.name}</span>
                        <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400">
                           <span className="text-emerald-600 flex items-center"><Droplets size={10} className="mr-1" /> {item.avgDailyFuel.toFixed(1)} L/dia</span>
                        </div>
                      </div>
                      <span className="text-sm font-black text-emerald-600">{item.avgDailyKm.toFixed(1)} km/dia</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(item.avgDailyKm / 200) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden border-t-8 transition-all" style={{ borderTopColor: activeTab === 'performance' ? '#4f46e5' : '#e11d48' }}>
          <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-white">
            <div>
              <h3 className="font-black text-slate-900 tracking-tight text-2xl uppercase">
                {activeTab === 'performance' ? 'Métricas de Rodagem Diária' : 'Visão Financeira por Ativo'}
              </h3>
              <p className="text-sm text-slate-400 font-medium mt-1">
                {activeTab === 'performance' ? 'Acompanhamento detalhado de médias por dia e rendimento.' : 'Audit de custos baseado no desvio de consumo.'}
              </p>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th onClick={() => handleSort('vehicle')} className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 cursor-pointer group">
                    <div className="flex items-center">VEÍCULO / MODELO <SortIcon col="vehicle" /></div>
                  </th>
                  <th onClick={() => handleSort('distanceKm')} className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right border-b border-slate-100 cursor-pointer group">
                    <div className="flex items-center justify-end">KM TOTAL <SortIcon col="distanceKm" /></div>
                  </th>
                  <th onClick={() => handleSort('dailyKm')} className="px-8 py-6 text-[10px] font-black text-indigo-600 uppercase tracking-widest text-right border-b border-indigo-100 bg-indigo-50/10 cursor-pointer group">
                    <div className="flex items-center justify-end">KM / DIA <SortIcon col="dailyKm" /></div>
                  </th>
                  
                  {/* Nova Coluna Solicitada: L / DIA */}
                  <th onClick={() => handleSort('dailyFuel')} className="px-8 py-6 text-[10px] font-black text-amber-600 uppercase tracking-widest text-right border-b border-amber-100 bg-amber-50/10 cursor-pointer group">
                    <div className="flex items-center justify-end">L / DIA <SortIcon col="dailyFuel" /></div>
                  </th>

                  {activeTab === 'performance' ? (
                    <>
                      <th onClick={() => handleSort('fuelUsed')} className="px-8 py-6 text-[10px] font-black text-slate-900 uppercase tracking-widest text-right border-b border-slate-100 bg-slate-50/50 cursor-pointer group">
                        <div className="flex items-center justify-end">LITROS REAIS <SortIcon col="fuelUsed" /></div>
                      </th>
                      <th onClick={() => handleSort('fuelWasteLiters')} className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right border-b border-slate-100 cursor-pointer group">
                        <div className="flex items-center justify-end">DESVIO (L) <SortIcon col="fuelWasteLiters" /></div>
                      </th>
                    </>
                  ) : (
                    <>
                      <th onClick={() => handleSort('financialImpact')} className="px-8 py-6 text-[10px] font-black text-rose-600 uppercase tracking-widest text-right border-b border-rose-100 bg-rose-50/20 cursor-pointer group">
                        <div className="flex items-center justify-end">IMPACTO (R$) <SortIcon col="financialImpact" /></div>
                      </th>
                    </>
                  )}

                  <th onClick={() => handleSort('actualAvg')} className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center border-b border-slate-100 cursor-pointer group">
                    <div className="flex items-center justify-center">KM/L REAL <SortIcon col="actualAvg" /></div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.slice(0, 100).map((v, idx) => (
                  <tr key={idx} className="hover:bg-indigo-50/30 transition-all group">
                    <td className="px-10 py-5">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-800 text-sm group-hover:text-indigo-600">{v.vehicle}</span>
                        <div className="flex items-center space-x-2 mt-0.5">
                           <span className="text-[9px] font-bold text-slate-400 uppercase truncate max-w-[140px]">{v.model}</span>
                           <span className="text-[8px] bg-slate-100 text-slate-500 px-1 rounded font-black">SVC: {v.svc}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right font-bold text-slate-600 text-sm">
                      {v.distanceKm.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-8 py-5 text-right bg-indigo-50/10">
                      <span className="text-xs font-black text-indigo-600">{v.dailyKm.toFixed(1)}</span>
                    </td>
                    <td className="px-8 py-5 text-right bg-amber-50/10">
                      <span className="text-xs font-black text-amber-700">{v.dailyFuel.toFixed(1)} <span className="text-[9px] font-medium opacity-70">L</span></span>
                    </td>

                    {activeTab === 'performance' ? (
                      <>
                        <td className="px-8 py-5 text-right bg-slate-50/50 text-xs font-black text-slate-900">
                          {v.fuelUsed.toFixed(1)} L
                        </td>
                        <td className="px-8 py-5 text-right">
                          <span className={`text-xs font-black ${ v.fuelWasteLiters > 5 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {v.fuelWasteLiters > 0 ? `+${v.fuelWasteLiters.toFixed(1)}` : v.fuelWasteLiters.toFixed(1)} L
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-8 py-5 text-right bg-rose-50/20">
                          <span className={`text-sm font-black ${v.financialImpact > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                            {formatCurrency(v.financialImpact)}
                          </span>
                        </td>
                      </>
                    )}

                    <td className="px-10 py-5 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${v.actualAvg >= v.idealAvg ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                          {v.actualAvg.toFixed(2)}
                        </span>
                        <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase">META: {v.idealAvg}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
