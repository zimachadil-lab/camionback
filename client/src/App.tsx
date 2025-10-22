import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PushNotificationProvider } from "@/components/push-notification-provider";
import { PWAInstallButton } from "@/components/pwa-install-button";
import Home from "@/pages/home";
import NotificationsPage from "@/pages/notifications-page";
import MessagesPage from "@/pages/messages-page";
import SelectRole from "@/pages/select-role";
import CompleteProfile from "@/pages/complete-profile";
import AdminDashboard from "@/pages/admin-dashboard";
import ClientDashboard from "@/pages/client-dashboard";
import TransporterDashboard from "@/pages/transporter-dashboard";
import TransporterPayments from "@/pages/transporter-payments";
import TransporterRatings from "@/pages/transporter-ratings";
import TransporterProfile from "@/pages/transporter-profile";
import MyRib from "@/pages/my-rib";
import HowItWorksClient from "@/pages/how-it-works-client";
import HowItWorksTransporter from "@/pages/how-it-works-transporter";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Home} />
      <Route path="/select-role" component={SelectRole} />
      <Route path="/complete-profile" component={CompleteProfile} />
      <Route path="/admin-dashboard" component={AdminDashboard} />
      <Route path="/client-dashboard" component={ClientDashboard} />
      <Route path="/transporter-dashboard" component={TransporterDashboard} />
      <Route path="/notifications" component={NotificationsPage} />
      <Route path="/messages" component={MessagesPage} />
      <Route path="/transporter/payments" component={TransporterPayments} />
      <Route path="/transporter/ratings" component={TransporterRatings} />
      <Route path="/transporter/profile" component={TransporterProfile} />
      <Route path="/transporter/rib" component={MyRib} />
      <Route path="/how-it-works-client" component={HowItWorksClient} />
      <Route path="/how-it-works-transporter" component={HowItWorksTransporter} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <PushNotificationProvider>
          <Toaster />
          <Router />
          <PWAInstallButton />
        </PushNotificationProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
