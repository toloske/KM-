
import React, { useMemo, useState } from 'react';
import { 
  Truck, 
  MapPin, 
  Fuel, 
  TrendingUp, 
  BarChart3, 
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Download,
  Info,
  Maximize2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, Legend, ScatterChart, Scatter, ZAxis, ReferenceLine
} from 'recharts';
import { parseData } from './data';
import { VehicleData, ModelAnalysis, SVCAnalysis, GlobalStats } from './types';

// Components
const StatCard = ({ title, value, subtitle, icon: Icon, colorClass, trend }: any) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2.5 rounded-xl ${colorClass}`}>
        <Icon size={20} className="text-white" />
      </div>
      {trend && (
        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${trend > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
          {trend > 0 ? `+${trend}% GAP` : `${trend}% GAP`}
        </span>
      )}
    </div>
    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
    <h3 className="text-2xl font-black text-slate-800 mt-1">{value}</h3>
    <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>
  </div>
);

const App: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSVC, setSelectedSVC] = useState('Todos');
  const [selectedModel, setSelectedModel] = useState('Todos');

  const rawData: VehicleData[] = useMemo(() => {
    return parseData().map(v => ({
      ...v,
      fuelGap: v.idealAvg > 0 ? ((v.actualAvg - v.idealAvg) / v.idealAvg) * 100 : 0
    })) as VehicleData[];
  }, []);

  const svcs = useMemo(() => ['Todos', ...new Set(rawData.map(v => v.svc))].sort(), [rawData]);
  const models = useMemo(() => ['Todos', ...new Set(rawData.map(v => v.model))].sort(), [rawData]);

  const filteredData = useMemo(() => {
    return rawData.filter(v => {
      const matchSearch = v.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          v.model.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSVC = selectedSVC === 'Todos' || v.svc === selectedSVC;
      const matchModel = selectedModel === 'Todos' || v.model === selectedModel;
      return matchSearch && matchSVC && matchModel;
    });
  }, [rawData, searchTerm, selectedSVC, selectedModel]);

  const stats: GlobalStats = useMemo(() => {
    const totalDist = filteredData.reduce((acc, curr) => acc + curr.distanceKm, 0);
    const validActuals = filteredData.filter(v => v.actualAvg > 0);
    const avgActual = validActuals.length > 0 ? validActuals.reduce((acc, curr) => acc + curr.actualAvg, 0) / validActuals.length : 0;
    const avgIdeal = validActuals.reduce((acc, curr) => acc + curr.idealAvg, 0) / validActuals.length;
    const totalGap = avgIdeal > 0 ? ((avgActual - avgIdeal) / avgIdeal) * 100 : 0;

    return {
      fleetCount: filteredData.length,
      totalDistance: totalDist,
      fleetAvgKm: filteredData.length > 0 ? totalDist / filteredData.length : 0,
      fleetAvgFuelActual: avgActual,
      fleetAvgFuelIdeal: avgIdeal,
      totalFuelGap: totalGap
    };
  }, [filteredData]);

  const modelAnalysis = useMemo(() => {
    const groups: Record<string, VehicleData[]> = {};
    filteredData.forEach(v => {
      if (!groups[v.model]) groups[v.model] = [];
      groups[v.model].push(v);
    });

    return Object.entries(groups).map(([model, items]) => {
      const totalKm = items.reduce((acc, v) => acc + v.distanceKm, 0);
      const fuels = items.filter(v => v.actualAvg > 0).map(v => v.actualAvg);
      const avgF = fuels.length > 0 ? fuels.reduce((a, b) => a + b, 0) / fuels.length : 0;
      const avgI = items.reduce((a, b) => a + b.idealAvg, 0) / items.length;
      return {
        model,
        count: items.length,
        avgKm: totalKm / items.length,
        totalKm,
        avgFuelActual: avgF,
        avgFuelIdeal: avgI,
        efficiencyScore: avgI > 0 ? (avgF / avgI) * 100 : 0
      };
    }).sort((a, b) => b.totalKm - a.totalKm);
  }, [filteredData]);

  const scatterData = useMemo(() => {
    return filteredData.filter(v => v.actualAvg > 0).map(v => ({
      name: v.vehicle,
      km: v.distanceKm,
      efficiency: v.actualAvg,
      ideal: v.idealAvg
    }));
  }, [filteredData]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Sidebar Filters */}
      <aside className="w-72 bg-white border-r border-slate-200 p-6 flex flex-col sticky top-0 h-screen">
        <div className="flex items-center space-x-3 mb-10">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
            <BarChart3 className="text-white" size={24} />
          </div>
          <h1 className="font-black text-xl text-slate-800 tracking-tight">FleetIntel</h1>
        </div>

        <div className="space-y-6 flex-1">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-widest">Busca Rápida</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Placa ou modelo..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-widest">Filtrar por SVC</label>
            <select 
              className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedSVC}
              onChange={(e) => setSelectedSVC(e.target.value)}
            >
              {svcs.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-widest">Filtrar por Modelo</label>
            <select 
              className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100">
          <button className="w-full flex items-center justify-center space-x-2 bg-slate-800 text-white py-3 rounded-xl hover:bg-slate-900 transition-colors font-bold text-sm">
            <Download size={16} />
            <span>Exportar Relatório</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Análise de Frota</h2>
            <p className="text-slate-500 font-medium">Performance Unificada (Sem Elétricos)</p>
          </div>
          <div className="flex space-x-3">
             <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center space-x-2 border border-emerald-100">
               <CheckCircle2 size={16} />
               <span>Dados atualizados hoje</span>
             </div>
          </div>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Ativos na Frota" 
            value={stats.fleetCount} 
            subtitle="Veículos em operação"
            icon={Truck}
            colorClass="bg-indigo-600"
          />
          <StatCard 
            title="Média de Rodagem" 
            value={`${stats.fleetAvgKm.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} km`}
            subtitle="Distância p/ veículo"
            icon={TrendingUp}
            colorClass="bg-blue-500"
          />
          <StatCard 
            title="Média Eficiência" 
            value={`${stats.fleetAvgFuelActual.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} km/l`}
            subtitle="Real vs Meta"
            icon={Fuel}
            trend={stats.totalFuelGap.toFixed(1)}
            colorClass="bg-amber-500"
          />
          <StatCard 
            title="Distância Total" 
            value={`${(stats.totalDistance / 1000).toFixed(1)}k km`}
            subtitle="Acumulado do período"
            icon={MapPin}
            colorClass="bg-emerald-500"
          />
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Scatter Chart: KM vs Efficiency */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 flex items-center space-x-2">
                <Info size={18} className="text-indigo-500" />
                <span>Eficiência vs. Quilometragem</span>
              </h3>
              <Maximize2 size={16} className="text-slate-300 cursor-pointer" />
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis type="number" dataKey="km" name="KM" unit="km" axisLine={false} tick={{fontSize: 12, fill: '#94A3B8'}} />
                  <YAxis type="number" dataKey="efficiency" name="KM/L" unit="km/l" axisLine={false} tick={{fontSize: 12, fill: '#94A3B8'}} />
                  <ZAxis type="category" dataKey="name" name="Veículo" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                  <ReferenceLine y={stats.fleetAvgFuelIdeal} stroke="#F43F5E" strokeDasharray="3 3" label={{ position: 'right', value: 'Ideal', fill: '#F43F5E', fontSize: 10 }} />
                  <Scatter name="Veículos" data={scatterData} fill="#6366F1" fillOpacity={0.6} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-4 text-[11px] text-slate-400 leading-relaxed italic">
              Cada ponto representa um veículo. Veículos abaixo da linha tracejada vermelha estão operando abaixo da meta de eficiência estabelecida.
            </p>
          </div>

          {/* Model Ranking Chart */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center space-x-2">
              <BarChart3 size={18} className="text-blue-500" />
              <span>Participação por Modelo (Total KM)</span>
            </h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modelAnalysis.slice(0, 5)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="model" type="category" width={120} tick={{fontSize: 10, fontWeight: 700, fill: '#475569'}} axisLine={false} />
                  <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{borderRadius: '12px', border: 'none'}} />
                  <Bar dataKey="totalKm" fill="#3B82F6" radius={[0, 10, 10, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Detailed Data Table */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center">
            <h3 className="font-black text-slate-800 tracking-tight">Detalhamento Operacional</h3>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              {filteredData.length} Veículos Filtrados
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identificação</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">SVC</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Rodagem</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Consumo Real</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">GAP (%)</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredData.slice(0, 20).map((v, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-8 py-4">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{v.vehicle}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase truncate max-w-[180px]">{v.model}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-black">{v.svc}</span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-slate-700">{v.distanceKm.toLocaleString('pt-BR')} km</span>
                        <div className="w-16 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-indigo-400" style={{ width: `${Math.min((v.distanceKm / 20000) * 100, 100)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <span className="text-sm font-black text-slate-800">{v.actualAvg > 0 ? `${v.actualAvg.toFixed(2)} km/l` : '--'}</span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <span className={`text-xs font-bold ${v.fuelGap < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {v.fuelGap !== 0 ? `${v.fuelGap.toFixed(1)}%` : '--'}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex justify-center">
                        {v.fuelGap < -15 ? (
                          <AlertTriangle size={18} className="text-rose-400" />
                        ) : v.actualAvg > 0 ? (
                          <CheckCircle2 size={18} className="text-emerald-400" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-slate-200" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredData.length > 20 && (
              <div className="bg-slate-50 p-4 text-center">
                <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-tighter flex items-center justify-center mx-auto space-x-1">
                  <span>Ver todos os {filteredData.length} registros</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
