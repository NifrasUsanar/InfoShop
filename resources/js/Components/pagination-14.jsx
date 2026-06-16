"use client";

import { Button } from "@/Components/ui/button";
import { Label } from "@/Components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/Components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import React from "react";

export default function TablePagination() {
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [page] = React.useState(1);
  const TOTAL_ITEMS = 100;

  return (
    <div
      className="tw-:w-full tw-:flex tw-:items-center tw-:justify-between tw-:gap-2">
      <div className="tw-:flex tw-:items-center tw-:gap-2">
        <Label className="tw-:whitespace-nowrap">Rows per page:</Label>
        <Select
          value={rowsPerPage.toString()}
          onValueChange={(rowsPerPage) => setRowsPerPage(+rowsPerPage)}>
          <SelectTrigger className="tw-:w-[65px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="tw-:flex tw-:items-center tw-:gap-2">
        <span className="tw-:text-sm tw-:text-muted-foreground tw-:whitespace-nowrap">
          {(page - 1) * rowsPerPage + 1}-{page * rowsPerPage} of {TOTAL_ITEMS}
        </span>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button
                aria-label="Go to previous page"
                size="icon"
                variant="ghost"
                disabled={page === 1}>
                <ChevronLeftIcon className="tw-:h-4 tw-:w-4" />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                aria-label="Go to next page"
                size="icon"
                variant="ghost"
                disabled={page * rowsPerPage >= TOTAL_ITEMS}>
                <ChevronRightIcon className="tw-:h-4 tw-:w-4" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
