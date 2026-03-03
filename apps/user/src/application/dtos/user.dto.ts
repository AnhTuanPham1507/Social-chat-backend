import { USER_SEX } from '@social-chat/domain';

export class User {
  id?: string;
  fullName: string;
  email: string;
  phone?: string;
  sex: USER_SEX;
  avatarUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface UpdateProfileInput {
  fullName?: string;
  phone?: string;
  sex?: USER_SEX;
  avatarUrl?: string;
}