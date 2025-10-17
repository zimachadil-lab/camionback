import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, User, Plus, LogOut, FileText, Clock, Receipt, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  user: {
    id: string;
    name?: string;
    role: string;
  };
  onNewRequest?: () => void;
  onLogout: () => void;
}

export function Header({ user, onNewRequest, onLogout }: HeaderProps) {
  const [location, navigate] = useLocation();

  const getMenuItems = () => {
    if (user.role === "client") {
      return [
        { label: "Mes commandes", icon: Package, href: "/" },
      ];
    } else if (user.role === "transporter") {
      return [
        { label: "Tableau de bord", icon: Package, href: "/" },
      ];
    } else if (user.role === "admin") {
      return [
        { label: "Tableau de bord", icon: Package, href: "/" },
      ];
    }
    return [];
  };

  const menuItems = getMenuItems();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-6">
          <div 
            onClick={() => navigate("/")}
            className="flex items-center gap-2 font-bold text-xl hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              C
            </div>
            <span className="hidden sm:inline">CamionBack</span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Button
                  key={item.href}
                  onClick={() => navigate(item.href)}
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-2"
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {user.role === "client" && onNewRequest && (
            <Button
              onClick={onNewRequest}
              size="default"
              className="gap-2"
              data-testid="button-new-request-header"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nouvelle demande</span>
              <span className="sm:hidden">Nouveau</span>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="button-user-menu">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">{user.name || "Utilisateur"}</span>
                  <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <div className="md:hidden">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const testId = `nav-mobile-${item.label.toLowerCase().replace(/\s+/g, "-")}`;
                  return (
                    <DropdownMenuItem
                      key={item.href}
                      onClick={() => navigate(item.href)}
                      className="gap-2 cursor-pointer"
                      data-testid={testId}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
              </div>

              <DropdownMenuItem
                onClick={onLogout}
                className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
