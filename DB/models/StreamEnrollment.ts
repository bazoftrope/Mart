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


export type Goal = 'lose' | 'maintain' | 'gain';

@Table({
  tableName: 'stream_enrollments',
  underscored: true,
  timestamps: true,
})
export class StreamEnrollment extends Model {
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
    type: DataType.ENUM('lose', 'maintain', 'gain'),
    allowNull: false,
    defaultValue: 'maintain',
  })
  goal!: Goal;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  targetCalories!: number | null;

  @CreatedAt
  enrolledAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

}
