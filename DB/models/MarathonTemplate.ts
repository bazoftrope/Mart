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


export type TemplateStatus = 'draft' | 'pending_review' | 'approved';

@Table({
  tableName: 'marathon_templates',
  underscored: true,
  timestamps: true,
})
export class MarathonTemplate extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  mentorId!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  title!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  durationDays!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  introText?: string | null;

  @Column({
    type: DataType.ENUM('draft', 'pending_review', 'approved'),
    allowNull: false,
    defaultValue: 'draft',
  })
  status!: TemplateStatus;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}
