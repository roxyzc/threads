import { UserRoles } from 'src/app/entities/user.entity';
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: UserRoles[]) => SetMetadata('roles', roles);
