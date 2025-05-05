import pool from "../config/database";
import { MeasureRow } from "../types/database";
import { PoolConnection, ResultSetHeader } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

export class MeasureRepository {
  static async findByUuid(
    uuid: string, 
    conn?: PoolConnection
  ): Promise<MeasureRow | null> {
    const [rows] = await (conn || pool).query<MeasureRow[]>(
      "SELECT * FROM measures WHERE measure_uuid = ? FOR UPDATE",
      [uuid]
    );
    return rows[0] || null;
  }

  static async findExistingMeasure(
    customerCode: string,
    measureType: string,
    measureDate: Date,
    conn?: PoolConnection
  ): Promise<boolean> {
    const [rows] = await (conn || pool).query<MeasureRow[]>(
      `SELECT 1 FROM measures 
       WHERE customer_code = ? 
       AND measure_type = ? 
       AND DATE(measure_datetime) = DATE(?)
       LIMIT 1`,
      [customerCode, measureType, measureDate]
    );
    return rows.length > 0;
  }

  static async confirmMeasure(
    uuid: string, 
    confirmedValue: number,
    confirmedBy: string,
    conn?: PoolConnection
  ): Promise<void> {
    await (conn || pool).query(
      `UPDATE measures 
       SET confirmed_value = ?, is_confirmed = TRUE, confirmed_by = ? 
       WHERE measure_uuid = ?`,
      [confirmedValue, confirmedBy, uuid]
    );
  }

  static async createMeasure(
    measureData: Omit<MeasureRow, 'measure_uuid' | 'created_at' | 'is_confirmed'>
  ): Promise<{
    measure_uuid: string;
    image_url: string;
  }> {
    const measure_uuid = uuidv4();
    const image_url = `https://storage.example.com/${measure_uuid}.jpg`;
    
    await pool.query(
      `INSERT INTO measures 
       (measure_uuid, customer_code, measure_datetime, measure_type, 
        initial_value, image_url) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        measure_uuid,
        measureData.customer_code,
        measureData.measure_datetime,
        measureData.measure_type,
        measureData.initial_value,
        image_url
      ]
    );

    return { measure_uuid, image_url };
  }

  static async findMeasureByUuid(
    uuid: string, 
    conn?: PoolConnection
  ): Promise<MeasureRow | null> {
    // Implementação idêntica ao findByUuid para manter consistência
    return this.findByUuid(uuid, conn);
  }
}