import type { User } from "@prisma/client";

export const toPublicUser = (user: User) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  displayName: user.displayName,
  avatarUrl: user.avatarUrl
});
