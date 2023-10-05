import { UserRoles } from 'src/app/entities/user.entity';

export interface TokenPayload {
  userId: string;
  role: UserRoles;
}
