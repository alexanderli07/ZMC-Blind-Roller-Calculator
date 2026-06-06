// Data models — port of DataModel.swift.

export interface FabricType {
  name: string;
  weight: number; // g/m²
  thickness: number; // mm
}

export interface Tube {
  name: string;
  diameter: number; // mm
  thickness?: number | null; // mm (optional in the Swift model)
  moment: number; // cm^4
  elasticity: number; // kg/cm² (psi-equivalent constant in the data)
  weight: number; // kg/m
}

export interface BottomBar {
  name: string;
  weightGM: number; // g/m
  weightLbFt: number; // lb/ft
}
