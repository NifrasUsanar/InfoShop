import React, { useState } from 'react';
import { Grid } from '@mui/material';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
} from "@/components/ui/Pagination";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

const CustomPagination = ({ refreshTable, setSearchTerms, searchTerms, data }) => {
    const rowsPerPageOptions = [50, 100, 200, 500, 1000];
    const rowsPerPage = searchTerms?.per_page || 50;

    return (
        <>
            <div className="flex items-center justify-end gap-2">
                <div className="flex items-center gap-2">
                    <Label className="whitespace-nowrap">Per page:</Label>
                    <Select
                        name="per_page"
                        value={rowsPerPage.toString()}
                        onValueChange={(value) => {
                            const perPage = +value;
                            const newSearchTerms = { ...searchTerms, per_page: perPage };
                            setSearchTerms(newSearchTerms);
                            refreshTable(window.location.pathname);
                        }}
                    >
                        <SelectTrigger className="w-[85px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                            {rowsPerPageOptions.map((n) => (
                                <SelectItem className="cursor-pointer" key={n} value={n.toString()}>
                                    {n}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {data.from || 0}-{data.to || 0} of {data.total || 0}
                    </span>
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <Button
                                    aria-label="Go to previous page"
                                    size="icon"
                                    variant="ghost"
                                    className="cursor-pointer"
                                    disabled={!data.prev_page_url}
                                    onClick={() => refreshTable(data.prev_page_url)}
                                >
                                    <ChevronLeftIcon className="h-4 w-4" />
                                </Button>
                            </PaginationItem>
                            <PaginationItem>
                                <Button
                                    aria-label="Go to next page"
                                    size="icon"
                                    className="cursor-pointer"
                                    variant="ghost"
                                    disabled={!data.next_page_url}
                                    onClick={() => refreshTable(data.next_page_url)}
                                >
                                    <ChevronRightIcon className="h-4 w-4" />
                                </Button>
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            </div>
            {/* <Grid spacing={1} container>
                {data.links?.map((link, index) => (
                    <Button
                        size='small'
                        sx={{ padding: '4px 8px', minWidth: '5px', borderRadius: "10px" }}
                        key={index}
                        variant={link.active ? "contained" : "text"}
                        onClick={() => {
                            refreshTable(link.url);
                        }}
                    >
                        {link.label.includes('Next') ? (
                            <span>{'>>'}</span>
                        ) : link.label.includes('Previous') ? (
                            <span>{'<<'}</span>
                        ) : (
                            <span dangerouslySetInnerHTML={{ __html: link.label }}></span>
                        )}
                    </Button>
                ))}
            </Grid> */}
        </>
    );
};

export default CustomPagination;
