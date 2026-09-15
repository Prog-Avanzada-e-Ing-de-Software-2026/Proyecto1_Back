import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MonetarioColumn } from 'src/modules/common/decorators/monetario-column.decorator';
import { MotivoCambioPrecio } from '../../enums/motivo-cambio-precio.enum';
import { Producto } from './producto.entity';

@Entity('cambio_precio')
export class CambioPrecio {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Producto, (producto) => producto.cambiosPrecio, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;

  @MonetarioColumn()
  precioAnterior: number;

  @MonetarioColumn()
  precioNuevo: number;

  @Column({ type: 'timestamp' })
  fecha: Date;

  @Column({ type: 'varchar', length: 255 })
  motivo: MotivoCambioPrecio;
}