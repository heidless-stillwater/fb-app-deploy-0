"use client";

import {
    LayoutGrid,
    List,
    Rows,
    Columns,
    RectangleHorizontal,
    View as ViewIcon,
  } from "lucide-react"
  
  import { Button } from "@/components/ui/button"
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
  
  export type View = "detail" | "extra-small" | "small" | "medium" | "large";
  
  type ViewSwitcherProps = {
    currentView: View;
    onSelectView: (view: View) => void;
  };
  
  export function ViewSwitcher({ currentView, onSelectView }: ViewSwitcherProps) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <ViewIcon className="h-4 w-4" />
            <span className="sr-only">Change View</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>View As</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={currentView}
            onValueChange={(value) => onSelectView(value as View)}
          >
            <DropdownMenuRadioItem value="detail">
              <List className="mr-2 h-4 w-4" />
              <span>Detail</span>
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="extra-small">
              <LayoutGrid className="mr-2 h-4 w-4" />
              <span>Extra Small Icons</span>
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="small">
              <Rows className="mr-2 h-4 w-4" />
              <span>Small Icons</span>
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="medium">
              <Columns className="mr-2 h-4 w-4" />
              <span>Medium Icons</span>
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="large">
              <RectangleHorizontal className="mr-2 h-4 w-4" />
              <span>Large Icons</span>
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
  