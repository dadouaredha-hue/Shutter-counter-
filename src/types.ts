export interface ScanResult {
  id: string;
  timestamp: number;
  fileName: string;
  make: string;
  model: string;
  shutterCount: number | null;
  serialNumber: string | null;
  firmware: string | null;
  healthScore: number; // 0 to 100
  estimatedLifespan: number;
}

export type ScanStatus = 'idle' | 'slicing' | 'parsing' | 'success' | 'error';
