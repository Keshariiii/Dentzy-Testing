"use client";

import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/dropdown-14-utils/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-14-utils/dropdown-menu";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";

export default function Dropdown14() {
  const themeContext = useTheme();
  const theme = themeContext?.theme || "system";
  const setTheme: (theme: string) => void = (themeContext?.setTheme as any) || (() => {});

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="icon-sm" aria-label="Toggle theme">
            <SunIcon className="dark:hidden h-4 w-4" />
            <MoonIcon className="hidden dark:block h-4 w-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={theme} onValueChange={(val) => setTheme(val)}>
          <DropdownMenuRadioItem value="light">
            <SunIcon className="mr-2 h-4 w-4" />
            Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <MoonIcon className="mr-2 h-4 w-4" />
            Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <MonitorIcon className="mr-2 h-4 w-4" />
            System
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
