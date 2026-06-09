import { RouterProvider } from "react-router";
import { useEffect } from "react";
import i18n from "i18next";
import { useAppSelector } from "./app/store";
import { selectLanguage } from "./app/persistent.slice";
import type { createAppRouter } from "./app/router";

type AppProps = {
  router: ReturnType<typeof createAppRouter>;
};

export function App({ router }: AppProps) {
  const language = useAppSelector(selectLanguage);

  useEffect(() => {
    i18n.changeLanguage(language as string);
  }, [language]);

  return <RouterProvider router={router} />;
}
