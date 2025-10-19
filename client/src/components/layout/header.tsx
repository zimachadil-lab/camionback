import { useState } from "react";
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
import { Menu, User, Plus, LogOut, FileText, Clock, Receipt, Package, Star, TruckIcon, CreditCard, HelpCircle, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { MessagesBadge } from "@/components/chat/messages-badge";
import { ContactWhatsAppDialog } from "@/components/contact-whatsapp-dialog";

interface HeaderProps {
  user: {
    id: string;
    name?: string;
    role: string;
    clientId?: string;
  };
  onNewRequest?: () => void;
  onAnnounceReturn?: () => void;
  onLogout: () => void;
}

export function Header({ user, onNewRequest, onAnnounceReturn, onLogout }: HeaderProps) {
  const [location, navigate] = useLocation();
  const [showContactDialog, setShowContactDialog] = useState(false);

  const getMenuItems = () => {
    if (user.role === "client") {
      return [
        { label: "Mes commandes", icon: Package, href: "/" },
        { label: "Comment ça marche", icon: HelpCircle, href: "/how-it-works-client" },
        { label: "Nous contacter", icon: MessageCircle, onClick: () => setShowContactDialog(true) },
      ];
    } else if (user.role === "transporter") {
      return [
        { label: "Tableau de bord", icon: Package, href: "/" },
        { label: "Paiements reçus", icon: Receipt, href: "/transporter/payments" },
        { label: "Mes avis clients", icon: Star, href: "/transporter/ratings" },
        { label: "Mon RIB", icon: CreditCard, href: "/transporter/rib" },
        { label: "Comment ça marche", icon: HelpCircle, href: "/how-it-works-transporter" },
        { label: "Nous contacter", icon: MessageCircle, onClick: () => setShowContactDialog(true) },
      ];
    } else if (user.role === "admin") {
      return [
        { label: "Tableau de bord", icon: Package, href: "/" },
        { label: "Nous contacter", icon: MessageCircle, onClick: () => setShowContactDialog(true) },
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
            {menuItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = item.href && location === item.href;
              return (
                <Button
                  key={item.href || idx}
                  onClick={() => item.onClick ? item.onClick() : item.href && navigate(item.href)}
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

          {user.role === "transporter" && onAnnounceReturn && (
            <Button
              onClick={onAnnounceReturn}
              size="default"
              className="gap-2 bg-[#00d4b2] hover:bg-[#00d4b2] border border-[#00d4b2]"
              data-testid="button-announce-return-header"
            >
              <TruckIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Annoncer un retour</span>
              <span className="sm:hidden">Retour</span>
            </Button>
          )}

          <NotificationBell userId={user.id} />
          <MessagesBadge userId={user.id} />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="button-user-menu">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">
                    {user.role === "client" && user.clientId 
                      ? user.clientId 
                      : user.name || "Utilisateur"}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <div className="md:hidden">
                {menuItems.map((item, idx) => {
                  const Icon = item.icon;
                  const testId = `nav-mobile-${item.label.toLowerCase().replace(/\s+/g, "-")}`;
                  return (
                    <DropdownMenuItem
                      key={item.href || idx}
                      onClick={() => item.onClick ? item.onClick() : item.href && navigate(item.href)}
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
                className="gap-2 cursor-pointer text-destructive focus:text-destructive hover:bg-destructive/10 transition-all duration-200 font-medium"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ContactWhatsAppDialog open={showContactDialog} onOpenChange={setShowContactDialog} />
    </header>
  );
}
