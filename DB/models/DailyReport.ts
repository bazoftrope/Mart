import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';


@Table({
  tableName: 'daily_reports',
  underscored: true,
  timestamps: true,
})
export class DailyReport extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  enrollmentId!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  dayNumber!: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  })
  totalCalories!: number;

  @CreatedAt
  filledAt!: Date;

  @UpdatedAt
  updatedAt!: Date;


}
