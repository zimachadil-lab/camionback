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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Menu, User, LogOut, Package, Star, Receipt, CreditCard, HelpCircle, MessageCircle, Truck, Plus, CornerUpLeft } from "lucide-react";
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
  onCreateRequest?: () => void;
  onAnnounceReturn?: () => void;
}

export function Header({ user, onLogout, onCreateRequest, onAnnounceReturn }: HeaderProps) {
  const [location, navigate] = useLocation();
  const [showContactDialog, setShowContactDialog] = useState(false);
  const { t, i18n } = useTranslation();

  const getMenuItems = () => {
    if (user.role === "client") {
      return [
        { label: t('header.client.orders'), icon: Package, href: "/", priority: "primary" },
        { label: t('header.client.howItWorks'), icon: HelpCircle, href: "/how-it-works-client", priority: "secondary" },
        { label: t('header.client.contact'), icon: MessageCircle, onClick: () => setShowContactDialog(true), priority: "secondary" },
      ];
    } else if (user.role === "transporteur") {
      return [
        { label: t('header.transporter.dashboard'), icon: Package, href: "/", priority: "primary" },
        { label: t('header.transporter.profile'), icon: User, href: "/transporter/profile", priority: "primary" },
        { label: t('header.transporter.payments'), icon: Receipt, href: "/transporter/payments", priority: "secondary" },
        { label: t('header.transporter.ratings'), icon: Star, href: "/transporter/ratings", priority: "secondary" },
        { label: t('header.transporter.rib'), icon: CreditCard, href: "/transporter/rib", priority: "secondary" },
        { label: t('header.transporter.howItWorks'), icon: HelpCircle, href: "/how-it-works-transporter", priority: "secondary" },
        { label: t('header.transporter.contact'), icon: MessageCircle, onClick: () => setShowContactDialog(true), priority: "secondary" },
      ];
    } else if (user.role === "admin") {
      return [
        { label: t('header.admin.dashboard'), icon: Package, href: "/", priority: "primary" },
        { label: t('header.admin.contact'), icon: MessageCircle, onClick: () => setShowContactDialog(true), priority: "secondary" },
      ];
    } else if (user.role === "coordinateur") {
      return [
        { label: t('header.coordinator.dashboard'), icon: Package, href: "/", priority: "primary" },
        { label: t('header.coordinator.users'), icon: User, href: "/coordinator/users", priority: "primary" },
        { label: t('header.coordinator.contact'), icon: MessageCircle, onClick: () => setShowContactDialog(true), priority: "secondary" },
      ];
    }
    return [];
  };

  const menuItems = getMenuItems();
  const primaryLinks = menuItems.filter(item => item.priority === "primary");
  const secondaryLinks = menuItems.filter(item => item.priority === "secondary");

  const getUserInitials = () => {
    if (user.role === "client" && user.clientId) {
      return user.clientId.substring(0, 2).toUpperCase();
    }
    if (user.name) {
      const names = user.name.split(" ");
      if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase();
      }
      return user.name.substring(0, 2).toUpperCase();
    }
    return user.role.substring(0, 2).toUpperCase();
  };

  const getRoleColor = () => {
    switch (user.role) {
      case "client":
        return "bg-blue-500";
      case "transporteur":
        return "bg-emerald-500";
      case "admin":
        return "bg-purple-500";
      case "coordinateur":
        return "bg-amber-500";
      default:
        return "bg-primary";
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6 max-w-screen-2xl mx-auto">
        {/* Left Section: Logo + Brand */}
        <div 
          onClick={() => navigate("/")}
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity min-w-fit"
          data-testid="link-home"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-[#17cfcf] to-[#0ea5a5] shadow-md">
            <Truck className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="font-bold text-lg leading-none">{t('header.brand')}</span>
            <span className="text-xs text-muted-foreground leading-none mt-0.5">Logistics</span>
          </div>
        </div>

        {/* Center Section: Desktop Navigation - Primary Links Only */}
        <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center px-8 overflow-x-auto">
          {primaryLinks.map((item, idx) => {
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
                <span className="hidden xl:inline">{item.label}</span>
              </Button>
            );
          })}
        </nav>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-3 min-w-fit">
          {/* New Request Button - Client Only */}
          {user.role === "client" && onCreateRequest && (
            <Button
              onClick={onCreateRequest}
              size="icon"
              variant="default"
              className="bg-gradient-to-br from-[#17cfcf] to-[#0ea5a5] hover:from-[#15b8b8] hover:to-[#0c8f8f] text-white shadow-md"
              data-testid="button-new-request-header"
            >
              <Package className="w-5 h-5" />
            </Button>
          )}

          {/* Announce Return Button - Transporter Only */}
          {user.role === "transporteur" && onAnnounceReturn && (
            <Button
              onClick={onAnnounceReturn}
              size="icon"
              variant="default"
              className="bg-gradient-to-br from-[#00d4b2] to-[#00b396] hover:from-[#00c0a6] hover:to-[#009d84] text-white shadow-md"
              data-testid="button-announce-return-header"
            >
              <CornerUpLeft className="w-5 h-5" />
            </Button>
          )}
          
          {/* Notifications & Messages Group */}
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
          </div>

          <Separator orientation="vertical" className="h-8 hidden md:block" />

          {/* Language Selector */}
          <LanguageSelector userId={user.id} />

          <Separator orientation="vertical" className="h-8 hidden md:block" />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative rounded-full hover-elevate"
                data-testid="button-user-menu"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className={`${getRoleColor()} text-white font-semibold text-sm flex items-center justify-center`}>
                    {user.role === "client" ? (
                      <User className="h-5 w-5" />
                    ) : (
                      getUserInitials()
                    )}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div dir={i18n.dir()}>
                <DropdownMenuLabel>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className={`${getRoleColor()} text-white font-semibold flex items-center justify-center`}>
                        {user.role === "client" ? (
                          <User className="h-5 w-5" />
                        ) : (
                          getUserInitials()
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">
                        {user.role === "client" && user.clientId 
                          ? user.clientId 
                          : user.name || "Utilisateur"}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Navigation - All Links (Primary + Secondary) */}
                <div>
                {/* Primary Links */}
                {primaryLinks.map((item, idx) => {
                  const Icon = item.icon;
                  const testId = `nav-menu-${item.label.toLowerCase().replace(/\s+/g, "-")}`;
                  return (
                    <DropdownMenuItem
                      key={item.href || idx}
                      onClick={() => item.onClick ? item.onClick() : item.href && navigate(item.href)}
                      className="gap-3 cursor-pointer py-2.5"
                      data-testid={testId}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </DropdownMenuItem>
                  );
                })}
                
                {/* Secondary Links */}
                {secondaryLinks.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    {secondaryLinks.map((item, idx) => {
                      const Icon = item.icon;
                      const testId = `nav-menu-${item.label.toLowerCase().replace(/\s+/g, "-")}`;
                      return (
                        <DropdownMenuItem
                          key={item.href || idx}
                          onClick={() => item.onClick ? item.onClick() : item.href && navigate(item.href)}
                          className="gap-3 cursor-pointer py-2.5"
                          data-testid={testId}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </DropdownMenuItem>
                      );
                    })}
                  </>
                )}
                <DropdownMenuSeparator />
              </div>

                {/* Logout */}
                <DropdownMenuItem
                  onClick={onLogout}
                  className="gap-3 cursor-pointer text-destructive focus:text-destructive hover:bg-destructive/10 transition-all duration-200 font-medium py-2.5"
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t('header.userMenu.logout')}</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ContactWhatsAppDialog open={showContactDialog} onOpenChange={setShowContactDialog} />
    </header>
  );
}
