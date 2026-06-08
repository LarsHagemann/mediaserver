import { RouterProvider } from "react-router";
import { router } from "./app/router";
import { useEffect } from "react";
import i18n from "i18next";
import { useAppSelector } from "./app/store";
import { selectLanguage } from "./app/persistent.slice";

export function App() {
  const language = useAppSelector(selectLanguage);

  useEffect(() => {
    i18n.changeLanguage(language as string);
  }, [language]);

  return <RouterProvider router={router} />;
}
