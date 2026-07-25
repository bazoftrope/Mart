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


export type StreamStatus = 'open' | 'running' | 'finished';

@Table({
  tableName: 'streams',
  underscored: true,
  timestamps: true,
})
export class Stream extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  templateId!: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  startDate!: string;

  @Column({
    type: DataType.ENUM('open', 'running', 'finished'),
    allowNull: false,
    defaultValue: 'open',
  })
  status!: StreamStatus;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

}
