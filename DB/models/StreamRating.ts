import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
} from 'sequelize-typescript';


@Table({
  tableName: 'stream_ratings',
  underscored: true,
  timestamps: false,
})
export class StreamRating extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  streamId!: string;

  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  participantId!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  filledDays!: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
  })
  disciplinePercent!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  rank?: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  calculatedAt!: Date;


}
