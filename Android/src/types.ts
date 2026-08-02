// Data models — port of DataModel.swift.

export interface FabricType {
  name: string;
  weight: number; // g/m²
  thickness: number; // mm
}

export interface Tube {
  name: string;
  diameter: number; // mm
  thickness?: number | null; // mm
  moment: number; // in^4
  elasticity: number; // psi
  weight: number; // lb/ft
}

export interface BottomBar {
  name: string;
  weightGM: number; // g/m
  weightLbFt: number; // lb/ft
}
