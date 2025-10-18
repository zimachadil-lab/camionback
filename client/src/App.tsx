import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import NotificationsPage from "@/pages/notifications-page";
import MessagesPage from "@/pages/messages-page";
import SelectRole from "@/pages/select-role";
import CompleteProfile from "@/pages/complete-profile";
import AdminDashboard from "@/pages/admin-dashboard";
import TransporterPayments from "@/pages/transporter-payments";
import TransporterRatings from "@/pages/transporter-ratings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/select-role" component={SelectRole} />
      <Route path="/complete-profile" component={CompleteProfile} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/notifications" component={NotificationsPage} />
      <Route path="/messages" component={MessagesPage} />
      <Route path="/transporter/payments" component={TransporterPayments} />
      <Route path="/transporter/ratings" component={TransporterRatings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
