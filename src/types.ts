// Data models — direct port of the iOS DataModel.swift structs.

export interface FabricType {
  name: string;
  weight: number; // g/m²
  thickness: number; // mm
}

export interface Tube {
  name: string;
  diameter: number; // mm
  thickness: number | null; // mm (optional)
  moment: number; // moment of inertia, cm^4
  elasticity: number; // elastic modulus, psi
  weight: number; // linear weight, kg/m
}

export interface BottomBar {
  name: string;
  weightLbFt: number; // lb/ft
  weightGM: number; // g/m
}
