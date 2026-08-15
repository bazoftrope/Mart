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

export type ConversationType = 'mentor_pair' | 'group';

@Table({
  tableName: 'conversations',
  underscored: true,
  timestamps: true,
})
export class Conversation extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column({
    type: DataType.ENUM('mentor_pair', 'group'),
    allowNull: false,
  })
  type!: ConversationType;

  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  streamId!: string | null;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}
