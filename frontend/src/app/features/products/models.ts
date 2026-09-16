import { SelectOption } from '../../shared/ui';

// Espejo de los records del paquete product/ del backend.
export type Concentration = 'EDP' | 'EDT' | 'PARFUM' | 'EDC' | 'BODY_MIST';
export type Presentation = 'BOTTLE' | 'DECANT' | 'SAMPLE';
export type Gender = 'MASCULINE' | 'FEMININE' | 'UNISEX';

export const CONCENTRATION_LABELS: Record<Concentration, string> = {
  EDP: 'EDP',
  EDT: 'EDT',
  PARFUM: 'Parfum',
  EDC: 'EDC',
  BODY_MIST: 'Body mist',
};
export const PRESENTATION_LABELS: Record<Presentation, string> = {
  BOTTLE: 'Frasco',
  DECANT: 'Decant',
  SAMPLE: 'Muestra',
};
export const GENDER_LABELS: Record<Gender, string> = {
  MASCULINE: 'Masculino',
  FEMININE: 'Femenino',
  UNISEX: 'Unisex',
};

export const toOptions = <K extends string>(labels: Record<K, string>): SelectOption[] =>
  (Object.entries(labels) as [K, string][]).map(([value, label]) => ({ value, label }));

export interface ProductResponse {
  id: number;
  sku: string;
  brandId: number;
  brand: string;
  name: string;
  concentration: Concentration;
  presentation: Presentation;
  sizeMl: number;
  gender: Gender | null;
  fragranceFamily: string | null;
  costPrice: number;
  salePrice: number;
  currentStock: number;
  minStock: number;
  belowMinimum: boolean;
  active: boolean;
}

export interface ProductRequest {
  sku: string;
  brandId: number;
  name: string;
  concentration: Concentration;
  presentation: Presentation;
  sizeMl: number;
  gender: Gender | null;
  fragranceFamily: string | null;
  costPrice: string; // string: el back lo parsea a BigDecimal, no a double
  salePrice: string;
  minStock: number;
}

export interface ProductSummary {
  activeCount: number;
  belowMinimumCount: number;
}

export interface BrandResponse {
  id: number;
  name: string;
}

export interface BrandRequest {
  name: string;
}
