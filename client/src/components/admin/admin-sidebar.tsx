import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Package,
  FileText,
  MessageSquare,
  DollarSign,
  UserCheck,
  TruckIcon,
  Users,
  Building2,
  Compass,
  Flag,
  Send,
  RefreshCw,
  MapPin,
  Camera,
  TrendingUp,
  LogOut,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  counts: {
    pendingRequests: number;
    pendingOffers: number;
    activeContracts: number;
    totalMessages: number;
    unpaidRequests: number;
    pendingTransporters: number;
    emptyReturns: number;
    totalReports: number;
  };
  onLogout: () => void;
}

export function AdminSidebar({ activeSection, onSectionChange, counts, onLogout }: AdminSidebarProps) {
  // Opérations sections
  const operationsSections = [
    { id: "requests", label: "Demandes", icon: Package, badge: counts.pendingRequests },
    { id: "contracts", label: "Contrats", icon: FileText, badge: counts.activeContracts },
    { id: "messages", label: "Messages", icon: MessageSquare, badge: counts.totalMessages },
    { id: "to-pay", label: "Paiements", icon: DollarSign, badge: counts.unpaidRequests },
    { id: "validation", label: "Validation", icon: UserCheck, badge: counts.pendingTransporters },
    { id: "empty-returns", label: "Retours", icon: TruckIcon, badge: counts.emptyReturns },
  ];

  // Gestion sections
  const gestionSections = [
    { id: "drivers", label: "Transporteurs", icon: TruckIcon },
    { id: "clients", label: "Clients", icon: Users },
    { id: "coordinators", label: "Coordinateurs", icon: Compass },
    { id: "reports", label: "Signalements", icon: Flag, badge: counts.totalReports },
    { id: "communications", label: "Communications", icon: Send },
  ];

  // Configuration sections
  const configurationSections = [
    { id: "cities", label: "Villes", icon: MapPin },
    { id: "stats", label: "Statistiques", icon: TrendingUp },
  ];

  return (
    <Sidebar>
      <SidebarContent>
        {/* Opérations Group */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[#17cfcf] font-bold">Opérations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {operationsSections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <SidebarMenuItem key={section.id}>
                    <SidebarMenuButton
                      onClick={() => onSectionChange(section.id)}
                      isActive={isActive}
                      className={isActive ? 'bg-[#17cfcf]/10 text-[#17cfcf]' : ''}
                      data-testid={`sidebar-${section.id}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{section.label}</span>
                      {section.badge && section.badge > 0 ? (
                        <Badge className="ml-auto bg-[#17cfcf] text-white animate-pulse">
                          {section.badge}
                        </Badge>
                      ) : null}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Gestion Group */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[#17cfcf] font-bold">Gestion</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {gestionSections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <SidebarMenuItem key={section.id}>
                    <SidebarMenuButton
                      onClick={() => onSectionChange(section.id)}
                      isActive={isActive}
                      className={isActive ? 'bg-[#17cfcf]/10 text-[#17cfcf]' : ''}
                      data-testid={`sidebar-${section.id}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{section.label}</span>
                      {section.badge && section.badge > 0 ? (
                        <Badge className="ml-auto bg-[#17cfcf] text-white animate-pulse">
                          {section.badge}
                        </Badge>
                      ) : null}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Configuration Group */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[#17cfcf] font-bold">Configuration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {configurationSections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <SidebarMenuItem key={section.id}>
                    <SidebarMenuButton
                      onClick={() => onSectionChange(section.id)}
                      isActive={isActive}
                      className={isActive ? 'bg-[#17cfcf]/10 text-[#17cfcf]' : ''}
                      data-testid={`sidebar-${section.id}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{section.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with logout */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onLogout}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
