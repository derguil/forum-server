export type SafeUser = {
  id: number;
  username: string;
  email: string;
  createdAt: Date;
  profileImageKey: string | null;
  profileImageUrl: string | null;
};