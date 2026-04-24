import { USER_SEX } from '@social-chat/domain';

export class User {
  id?: string;
  fullName: string;
  email: string;
  phone?: string;
  sex: USER_SEX;
  avatarUrl?: string;
  interests: string[];
  hasCompletedOnboarding: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface CreateUserInput {
  id: string;
  email: string;
  fullName: string;
}

export interface UpdateProfileInput {
  fullName?: string;
  phone?: string;
  sex?: USER_SEX;
  avatarUrl?: string;
  interests?: string[];
}