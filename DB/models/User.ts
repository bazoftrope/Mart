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


export type UserRole = 'mentor' | 'participant' | 'admin';
export type UserSex = 'male' | 'female';

@Table({
  tableName: 'users',
  underscored: true,
  timestamps: true,
})
export class User extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  email!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  passwordHash!: string;

  @Column({
    type: DataType.ENUM('mentor', 'participant', 'admin'),
    allowNull: false,
  })
  role!: UserRole;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'Europe/Moscow',
  })
  timezone!: string;

  @Column({
    type: DataType.ENUM('male', 'female'),
    allowNull: true,
  })
  sex!: UserSex | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  heightCm!: number | null;

  @Column({
    type: DataType.DECIMAL(5, 1),
    allowNull: true,
  })
  weightKg!: number | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  age!: number | null;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

}
