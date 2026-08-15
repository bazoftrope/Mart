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

export type ConversationMemberRole = 'participant' | 'mentor';

@Table({
  tableName: 'conversation_members',
  underscored: true,
  timestamps: true,
})
export class ConversationMember extends Model {
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
  userId!: string;

  @Column({
    type: DataType.ENUM('participant', 'mentor'),
    allowNull: false,
  })
  role!: ConversationMemberRole;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  lastReadAt!: Date | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  unreadCount!: number;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}
