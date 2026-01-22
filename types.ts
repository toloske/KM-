
export interface VehicleData {
  vehicle: string;
  svc: string;
  model: string;
  fuelType: string;
  distanceKm: number;
  dailyAvg90Days: number;
  meliKm: number;
  idealAvg: number;
  actualAvg: number;
  fuelUsed: number;
  group: string;
  fuelGap: number; // Diferença entre real e ideal
}

export interface ModelAnalysis {
  model: string;
  count: number;
  avgKm: number;
  avgFuelActual: number;
  avgFuelIdeal: number;
  totalKm: number;
  efficiencyScore: number;
}

export interface SVCAnalysis {
  svc: string;
  count: number;
  avgKm: number;
  avgFuelActual: number;
  fuelGapAvg: number;
}

export interface GlobalStats {
  fleetCount: number;
  totalDistance: number;
  fleetAvgKm: number;
  fleetAvgFuelActual: number;
  fleetAvgFuelIdeal: number;
  totalFuelGap: number;
}
