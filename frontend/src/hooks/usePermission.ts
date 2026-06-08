import { api } from "../app/api";

export const usePermission = (action: string): boolean => {
  const { data: identity } = api.useGetMeQuery();
  return identity?.permissions.includes(action) ?? false;
};

export const useIdentity = () => {
  return api.useGetMeQuery();
};
