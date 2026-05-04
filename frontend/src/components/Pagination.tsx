import ReactPaginate from "react-paginate";
import style from "./Pagination.module.scss";
import { twMerge } from "tailwind-merge";
import { useTranslation } from "react-i18next";
import { useIsMobileScreen } from "../hooks/useIsMobileScreen";

type Props = {
  total: number;
  limit: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export const Pagination = ({
  total,
  limit,
  currentPage,
  onPageChange,
  className,
}: Props) => {
  const { t } = useTranslation();
  const isMobile = useIsMobileScreen();

  if (total < limit) return null;

  return (
    <ReactPaginate
      className={twMerge(
        "flex flex-row gap-2 justify-center",
        style["pagination"],
        className,
      )}
      pageCount={Math.ceil(total / limit)}
      onPageChange={({ selected }) => onPageChange(selected)}
      previousLabel={
        <>
          &lt;{" "}
          <span className="hidden sm:inline">{t("pagination.previous")}</span>
        </>
      }
      nextLabel={
        <>
          <span className="hidden sm:inline">{t("pagination.next")}</span> &gt;
        </>
      }
      forcePage={currentPage}
      pageRangeDisplayed={isMobile ? 2 : 5}
      marginPagesDisplayed={isMobile ? 0 : 2}
    />
  );
};
