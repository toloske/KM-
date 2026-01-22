
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
  Maximize2,
  Droplets
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, Legend, ScatterChart, Scatter, ZAxis, ReferenceLine
} from 'recharts';
import { parseData } from './data';
import { VehicleData, GlobalStats } from './types';

// Extended interface for local calculations
interface VehicleDataExtended extends VehicleData {
  estimatedFuelLiters: number;
  fuelWasteLiters: number;
}

const StatCard = ({ title, value, subtitle, icon: Icon, colorClass, trend }: any) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2.5 rounded-xl ${colorClass}`}>
        <Icon size={20} className="text-white" />
      </div>
      {trend !== undefined && (
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

  const rawData: VehicleDataExtended[] = useMemo(() => {
    return parseData().map(v => {
      const estimatedFuel = v.idealAvg > 0 ? v.distanceKm / v.idealAvg : 0;
      return {
        ...v,
        fuelGap: v.idealAvg > 0 ? ((v.actualAvg - v.idealAvg) / v.idealAvg) * 100 : 0,
        estimatedFuelLiters: estimatedFuel,
        fuelWasteLiters: v.fuelUsed - estimatedFuel
      };
    }) as VehicleDataExtended[];
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

  const stats = useMemo(() => {
    const totalDist = filteredData.reduce((acc, curr) => acc + curr.distanceKm, 0);
    const totalActualFuel = filteredData.reduce((acc, curr) => acc + curr.fuelUsed, 0);
    const totalEstimatedFuel = filteredData.reduce((acc, curr) => acc + curr.estimatedFuelLiters, 0);
    
    const validActuals = filteredData.filter(v => v.actualAvg > 0);
    const avgActual = validActuals.length > 0 ? validActuals.reduce((acc, curr) => acc + curr.actualAvg, 0) / validActuals.length : 0;
    const avgIdeal = validActuals.reduce((acc, curr) => acc + curr.idealAvg, 0) / validActuals.length;
    const totalGap = avgIdeal > 0 ? ((avgActual - avgIdeal) / avgIdeal) * 100 : 0;

    return {
      fleetCount: filteredData.length,
      totalDistance: totalDist,
      fleetAvgKm: filteredData.length > 0 ? totalDist / filteredData.length : 0,
      fleetAvgFuelActual: avgActual,
      totalFuelUsed: totalActualFuel,
      totalEstimatedFuel: totalEstimatedFuel,
      totalFuelGap: totalGap,
      fuelWasteTotal: totalActualFuel - totalEstimatedFuel
    };
  }, [filteredData]);

  const modelAnalysis = useMemo(() => {
    const groups: Record<string, VehicleDataExtended[]> = {};
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
          <h1 className="font-black text-xl text-slate-800 tracking-tight">FROTA TRANSMANÁ</h1>
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
              className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
              value={selectedSVC}
              onChange={(e) => setSelectedSVC(e.target.value)}
            >
              {svcs.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-widest">Filtrar por Modelo</label>
            <select 
              className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
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
            <span>Exportar BI</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Análise de Performance</h2>
            <p className="text-slate-500 font-medium">Relatório Estratégico de Combustível</p>
          </div>
          <div className="flex space-x-3">
             <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center space-x-2 border border-emerald-100">
               <CheckCircle2 size={16} />
               <span>Monitoramento em Tempo Real</span>
             </div>
          </div>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Abastecido (L)" 
            value={`${stats.totalFuelUsed.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} L`} 
            subtitle="Consumo Real Acumulado"
            icon={Droplets}
            colorClass="bg-indigo-600"
          />
          <StatCard 
            title="Consumo Estimado (L)" 
            value={`${stats.totalEstimatedFuel.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} L`}
            subtitle="Baseado no KM/L Ideal"
            icon={Info}
            colorClass="bg-blue-500"
          />
          <StatCard 
            title="Desvio de Combustível" 
            value={`${stats.fuelWasteTotal.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} L`}
            subtitle="Litragem Acima da Meta"
            icon={Fuel}
            trend={stats.totalFuelGap.toFixed(1)}
            colorClass="bg-rose-500"
          />
          <StatCard 
            title="Distância Total" 
            value={`${(stats.totalDistance / 1000).toFixed(1)}k km`}
            subtitle="Rodagem da Seleção"
            icon={TrendingUp}
            colorClass="bg-emerald-500"
          />
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 flex items-center space-x-2">
                <BarChart3 size={18} className="text-indigo-500" />
                <span>Eficiência por Modelo (KM/L)</span>
              </h3>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modelAnalysis.slice(0, 6)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="model" axisLine={false} tick={{fontSize: 10, fill: '#64748B'}} />
                  <YAxis axisLine={false} tick={{fontSize: 10, fill: '#64748B'}} />
                  <Tooltip contentStyle={{borderRadius: '12px', border: 'none'}} />
                  <Legend verticalAlign="top" align="right" />
                  <Bar name="Real" dataKey="avgFuelActual" fill="#6366F1" radius={[4, 4, 0, 0]} />
                  <Bar name="Ideal" dataKey="avgFuelIdeal" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 flex items-center space-x-2">
                <Info size={18} className="text-blue-500" />
                <span>Dispersão: Rodagem vs Eficiência</span>
              </h3>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis type="number" dataKey="km" name="KM" unit="km" axisLine={false} tick={{fontSize: 10, fill: '#94A3B8'}} />
                  <YAxis type="number" dataKey="efficiency" name="KM/L" unit="km/l" axisLine={false} tick={{fontSize: 10, fill: '#94A3B8'}} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Veículos" data={scatterData} fill="#6366F1" fillOpacity={0.6} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Detailed Data Table */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <div>
              <h3 className="font-black text-slate-800 tracking-tight">Detalhamento Volumétrico (Litros)</h3>
              <p className="text-xs text-slate-400 font-medium">Análise de consumo real versus expectativa técnica</p>
            </div>
            <div className="flex space-x-2">
              <span className="text-[10px] font-bold text-slate-500 border border-slate-200 px-3 py-1 rounded-full bg-white">
                {filteredData.length} UNIDADES
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-100">
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Veículo / Modelo</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">SVC</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">KM Rodado</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right bg-slate-50/30">L Estimado</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right bg-indigo-50/30 text-indigo-600">L Real</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Desvio (L)</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Eficiência</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredData.slice(0, 30).map((v, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-all group">
                    <td className="px-8 py-4">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{v.vehicle}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase truncate max-w-[150px]">{v.model}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[9px] font-bold">{v.svc}</span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <span className="text-xs font-bold text-slate-600">{v.distanceKm.toLocaleString('pt-BR')}</span>
                    </td>
                    <td className="px-8 py-4 text-right bg-slate-50/30">
                      <span className="text-xs font-medium text-slate-500">{v.estimatedFuelLiters.toFixed(1)} L</span>
                    </td>
                    <td className="px-8 py-4 text-right bg-indigo-50/30">
                      <span className="text-xs font-black text-indigo-700">{v.fuelUsed.toFixed(1)} L</span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <span className={`text-xs font-bold ${v.fuelWasteLiters > 5 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {v.fuelWasteLiters > 0 ? `+${v.fuelWasteLiters.toFixed(1)}` : v.fuelWasteLiters.toFixed(1)} L
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex justify-center items-center space-x-2">
                        <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${v.actualAvg >= v.idealAvg ? 'bg-emerald-500' : 'bg-rose-400'}`} 
                            style={{ width: `${Math.min((v.actualAvg / (v.idealAvg || 1)) * 100, 100)}%` }} 
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">{v.actualAvg.toFixed(1)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredData.length > 30 && (
              <div className="bg-white p-4 border-t border-slate-50 text-center">
                <button className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors flex items-center justify-center mx-auto space-x-1">
                  <span>Exibindo 30 de {filteredData.length} registros</span>
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
