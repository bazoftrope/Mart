import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  CreatedAt,
} from 'sequelize-typescript';


@Table({
  tableName: 'products',
  underscored: true,
  timestamps: true,
  updatedAt: false,
})
export class Product extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  name!: string;

  @Column({
    type: DataType.DECIMAL(8, 2),
    allowNull: false,
  })
  calories!: number;

  @CreatedAt
  createdAt!: Date;
}
