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
  tableName: 'messages',
  underscored: true,
  timestamps: true,
})
export class Message extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  conversationId!: string;

  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  senderId!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  text!: string;

  @CreatedAt
  createdAt!: Date;
}
