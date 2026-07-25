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

  @CreatedAt
  enrolledAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

}
