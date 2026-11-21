import type { SupplierHotel, SupplierId } from '../domain/types';

const supplierA: SupplierHotel[] = [
  { hotelId: 'a1', name: 'Holtin', price: 6000, city: 'delhi', commissionPct: 10 },
  { hotelId: 'a2', name: 'Radison', price: 5900, city: 'delhi', commissionPct: 13 },
  { hotelId: 'a3', name: 'Taj Palace', price: 12500, city: 'delhi', commissionPct: 12 },
  { hotelId: 'a4', name: 'Leela Residency', price: 9800, city: 'delhi', commissionPct: 11 },
  { hotelId: 'a5', name: 'Ibis Aerocity', price: 3800, city: 'delhi', commissionPct: 9 },
  { hotelId: 'a6', name: 'Trident', price: 14200, city: 'mumbai', commissionPct: 12 },
  { hotelId: 'a7', name: 'Sea Breeze', price: 7100, city: 'mumbai', commissionPct: 10 },
  { hotelId: 'a8', name: 'Holtin', price: 6400, city: 'mumbai', commissionPct: 10 },
];

const supplierB: SupplierHotel[] = [
  { hotelId: 'b1', name: 'Holtin', price: 5340, city: 'delhi', commissionPct: 20 },
  { hotelId: 'b2', name: 'Radison', price: 6200, city: 'delhi', commissionPct: 15 },
  { hotelId: 'b3', name: 'Taj Palace', price: 11900, city: 'delhi', commissionPct: 14 },
  { hotelId: 'b4', name: 'Lemon Tree', price: 4500, city: 'delhi', commissionPct: 10 },
  { hotelId: 'b5', name: 'Bloom Hotel', price: 2900, city: 'delhi', commissionPct: 8 },
  { hotelId: 'b6', name: 'Trident', price: 13500, city: 'mumbai', commissionPct: 15 },
  { hotelId: 'b7', name: 'Marine Plaza', price: 8800, city: 'mumbai', commissionPct: 11 },
  { hotelId: 'b8', name: 'Sea Breeze', price: 7350, city: 'mumbai', commissionPct: 9 },
];

export const catalogs: Record<SupplierId, SupplierHotel[]> = { supplierA, supplierB };

export const supplierLabels: Record<SupplierId, string> = {
  supplierA: 'Supplier A',
  supplierB: 'Supplier B',
};
