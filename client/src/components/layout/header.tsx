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
import { CoordinatorNotifications } from "@/components/coordinator/coordinator-notifications";
import { CoordinatorMessaging } from "@/components/coordinator/coordinator-messaging";
import { LanguageSelector } from "@/components/ui/language-selector";
import { useTranslation } from "react-i18next";

interface HeaderProps {
  user: {
    id: string;
    name?: string;
    role: string;
    clientId?: string;
  };
  onLogout: () => void;
}

export function Header({ user, onLogout }: HeaderProps) {
  const [location, navigate] = useLocation();
  const [showContactDialog, setShowContactDialog] = useState(false);
  const { t } = useTranslation();

  const getMenuItems = () => {
    if (user.role === "client") {
      return [
        { label: t('header.client.orders'), icon: Package, href: "/" },
        { label: t('header.client.howItWorks'), icon: HelpCircle, href: "/how-it-works-client" },
        { label: t('header.client.contact'), icon: MessageCircle, onClick: () => setShowContactDialog(true) },
      ];
    } else if (user.role === "transporteur") {
      return [
        { label: t('header.transporter.dashboard'), icon: Package, href: "/" },
        { label: t('header.transporter.profile'), icon: User, href: "/transporter/profile" },
        { label: t('header.transporter.payments'), icon: Receipt, href: "/transporter/payments" },
        { label: t('header.transporter.ratings'), icon: Star, href: "/transporter/ratings" },
        { label: t('header.transporter.rib'), icon: CreditCard, href: "/transporter/rib" },
        { label: t('header.transporter.howItWorks'), icon: HelpCircle, href: "/how-it-works-transporter" },
        { label: t('header.transporter.contact'), icon: MessageCircle, onClick: () => setShowContactDialog(true) },
      ];
    } else if (user.role === "admin") {
      return [
        { label: t('header.admin.dashboard'), icon: Package, href: "/" },
        { label: t('header.admin.contact'), icon: MessageCircle, onClick: () => setShowContactDialog(true) },
      ];
    } else if (user.role === "coordinateur") {
      return [
        { label: t('header.coordinator.dashboard'), icon: Package, href: "/" },
        { label: t('header.coordinator.users'), icon: User, href: "/coordinator/users" },
        { label: t('header.coordinator.contact'), icon: MessageCircle, onClick: () => setShowContactDialog(true) },
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
            <span className="hidden sm:inline">{t('header.brand')}</span>
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
          {user.role === "coordinateur" ? (
            <>
              <CoordinatorNotifications userId={user.id} />
              <CoordinatorMessaging userId={user.id} />
            </>
          ) : (
            <>
              <NotificationBell userId={user.id} />
              <MessagesBadge userId={user.id} />
            </>
          )}
          
          <LanguageSelector userId={user.id} />

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
                {t('header.userMenu.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ContactWhatsAppDialog open={showContactDialog} onOpenChange={setShowContactDialog} />
    </header>
  );
}
