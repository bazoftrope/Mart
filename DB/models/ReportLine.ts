import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
} from 'sequelize-typescript';


@Table({
  tableName: 'report_lines',
  underscored: true,
  timestamps: false,
})
export class ReportLine extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  reportId!: string;

  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  productId!: string;

  @Column({
    type: DataType.DECIMAL(8, 2),
    allowNull: false,
  })
  weightGrams!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  lineCalories!: number;


}
