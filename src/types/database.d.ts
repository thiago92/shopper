export type MeasureRow = {
  measure_uuid: string;
  customer_code: string;
  measure_datetime: Date;
  measure_type: 'WATER' | 'GAS';
  initial_value: number;
  confirmed_value: number | null;
  is_confirmed: boolean;
  image_url: string;
  created_at: Date;
};

export type PartialMeasureRow = Partial<MeasureRow> & {
  measure_uuid: string;
  is_confirmed: boolean;
};