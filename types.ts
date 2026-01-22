
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
  fuelGap: number; 
  estimatedFuelLiters?: number;
  fuelWasteLiters?: number;
  financialImpact?: number; // Custo do desvio em R$
  fuelPriceUsed?: number;   // Preço do litro considerado
}

export interface GlobalStats {
  fleetCount: number;
  totalDistance: number;
  fleetAvgKm: number;
  fleetAvgFuelActual: number;
  fleetAvgFuelIdeal: number;
  totalFuelUsed: number;
  totalEstimatedFuel: number;
  totalFuelGap: number;
  fuelWasteTotal: number;
  totalFinancialImpact: number; // Prejuízo total em R$
}
