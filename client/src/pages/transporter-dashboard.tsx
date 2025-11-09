import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, ListFilter, Package, Phone, CheckCircle, MapPin, MessageSquare, Image as ImageIcon, Clock, Calendar, Flag, Edit, TruckIcon } from "lucide-react";
import { Header } from "@/components/layout/header";
import { RequestCard } from "@/components/transporter/request-card";
// OfferForm removed - new workflow uses interest-based matching instead of price offers
import { InteractiveCalendar } from "@/components/transporter/interactive-calendar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChatWindow } from "@/components/chat/chat-window";
import { PhotoGalleryDialog } from "@/components/transporter/photo-gallery-dialog";
import { StoriesBar } from "@/components/ui/stories-bar";
import { LoadingTruck } from "@/components/ui/loading-truck";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { format, isSameDay, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { useTranslation } from 'react-i18next';
import { getCategoryConfig } from "@/lib/goods-category-config";

// REMOVED: Referent system no longer used - transporter validation is now done directly by admin
// const referenceSchema = z.object({
//   referenceName: z.string().min(2, "Nom complet requis (min. 2 caractères)"),
//   referencePhone: z.string().regex(/^\+212[0-9]{9}$/, "Format: +212XXXXXXXXX"),
//   referenceRelation: z.enum(["Client", "Transporteur", "Autre"], {
//     required_error: "Type de relation requis",
//   }),
// });

export default function TransporterDashboard() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading, logout } = useAuth();
  const { t, i18n } = useTranslation();
  
  // Create dynamic Zod schemas with useMemo
  const reportSchema = useMemo(() => z.object({
    description: z.string().min(10, t('transporterDashboard.validation.descriptionMin')),
    type: z.string().min(1, t('transporterDashboard.validation.problemTypeRequired')),
  }), [t]);

  const editOfferSchema = useMemo(() => z.object({
    amount: z.coerce.number().min(1, t('transporterDashboard.validation.amountMin')),
    pickupDate: z.string().min(1, t('transporterDashboard.validation.pickupDateRequired')),
    loadType: z.enum(["return", "shared"], {
      required_error: t('transporterDashboard.validation.loadTypeRequired'),
    }),
  }), [t]);
  const [selectedCity, setSelectedCity] = useState("allCities");
  const [searchQuery, setSearchQuery] = useState("");
  // Removed offerDialogOpen - new workflow uses interest buttons instead of offer form
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<{ id: string; name: string; role: string } | null>(null);
  const [chatRequestId, setChatRequestId] = useState<string>("");
  const [photoGalleryOpen, setPhotoGalleryOpen] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [selectedReferenceId, setSelectedReferenceId] = useState("");
  const [clientDetailsOpen, setClientDetailsOpen] = useState(false);
  const [selectedClientDetails, setSelectedClientDetails] = useState<any>(null);
  const [announceReturnOpen, setAnnounceReturnOpen] = useState(false);
  const [returnFromCity, setReturnFromCity] = useState("");
  const [returnToCity, setReturnToCity] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportRequestId, setReportRequestId] = useState<string>("");
  const [editOfferDialogOpen, setEditOfferDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [notValidatedDialogOpen, setNotValidatedDialogOpen] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);

  const { toast } = useToast();

  // Public share link handling - now uses interest-based workflow
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestId = params.get('request');
    if (requestId) {
      // With new workflow, transporters can simply scroll to and click "Je suis intéressé"
      // No need to open a separate dialog
      toast({
        title: t('transporterDashboard.dialogs.sharedOrder.title'),
        description: t('transporterDashboard.dialogs.sharedOrder.description'),
      });
      // Clean URL after processing
      window.history.replaceState({}, '', '/transporter-dashboard');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize edit offer form when offer is selected
  useEffect(() => {
    if (selectedOffer && editOfferDialogOpen) {
      editOfferForm.reset({
        amount: selectedOffer.amount.toString(),
        pickupDate: selectedOffer.pickupDate ? new Date(selectedOffer.pickupDate).toISOString().split('T')[0] : "",
        loadType: selectedOffer.loadType || "return",
      });
    }
  }, [selectedOffer, editOfferDialogOpen]);

  const handleLogout = () => {
    logout();
  };

  const handleAnnounceReturn = () => {
    // Check if transporter is validated
    if (user!.status === "validated") {
      // Allow access to announce return form
      setAnnounceReturnOpen(true);
    } else {
      // Show blocking dialog for non-validated transporters
      setNotValidatedDialogOpen(true);
    }
  };

  // Fetch available requests (qualified and published for matching)
  const { data: requests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ["/api/transporter/available-requests", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const response = await fetch(`/api/transporter/available-requests`);
      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }
      return response.json();
    },
  });

  // Fetch transporter's interests with availability dates
  const { data: myInterests = [], isLoading: interestsLoading } = useQuery({
    queryKey: ["/api/transporter/my-interests", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const response = await fetch(`/api/transporter/my-interests`);
      if (!response.ok) {
        throw new Error('Failed to fetch interests');
      }
      return response.json();
    },
  });

  // Note: myOffers query removed - new workflow uses interest-based matching instead

  const { data: acceptedRequests = [], isLoading: acceptedLoading } = useQuery({
    queryKey: ["/api/requests/accepted", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const response = await fetch(`/api/requests?accepted=true&transporterId=${user!.id}`);
      return response.json();
    },
    refetchInterval: 5000,
  });

  // Filter accepted requests by selected calendar date
  const filteredAcceptedRequests = useMemo(() => {
    if (!selectedCalendarDate) return acceptedRequests;

    return acceptedRequests.filter((request: any) => {
      const requestDate = request.pickupDate || request.deliveryDate;
      if (!requestDate) return false;
      
      try {
        return isSameDay(parseISO(requestDate), selectedCalendarDate);
      } catch (error) {
        return false;
      }
    });
  }, [acceptedRequests, selectedCalendarDate]);

  // handleMakeOffer removed - new workflow uses express interest instead

  const handleChat = (clientId: string, clientIdentifier: string, requestId: string) => {
    if (!requestId) {
      console.error('Cannot open chat: requestId is missing');
      return;
    }
    setSelectedClient({ id: clientId, name: clientIdentifier || "Client", role: "client" });
    setChatRequestId(requestId);
    setChatOpen(true);
  };

  const handleViewPhotos = (photos: string[], referenceId: string) => {
    setSelectedPhotos(photos);
    setSelectedReferenceId(referenceId);
    setPhotoGalleryOpen(true);
  };

  const handleViewClientDetails = (request: any) => {
    // Client info now comes from enriched request.client object
    setSelectedClientDetails({
      ...request,
      clientPhone: request.client?.phoneNumber || t('shared.labels.notAvailable'),
      clientName: request.client?.name || t('shared.labels.client'),
    });
    setClientDetailsOpen(true);
  };

  // Fetch cities from API
  const { data: cities = [], isLoading: citiesLoading } = useQuery({
    queryKey: ["/api/cities"],
    queryFn: async () => {
      const response = await fetch("/api/cities");
      return response.json();
    },
  });

  // REMOVED: Referent system no longer used - transporter validation is now done directly by admin
  // const { data: transporterReference, isLoading: referenceLoading } = useQuery<{
  //   id: string;
  //   transporterId: string;
  //   referenceName: string;
  //   referencePhone: string;
  //   referenceRelation: string;
  //   status: string;
  //   rejectionReason?: string | null;
  //   validatedBy?: string | null;
  //   validatedAt?: string | null;
  //   createdAt: string;
  // } | null>({
  //   queryKey: [`/api/transporter-references/${user?.id}`],
  //   enabled: !!user && user.role === "transporteur",
  // });

  // REMOVED: Referent system no longer used
  // const submitReferenceMutation = useMutation({
  //   mutationFn: async (data: { referenceName: string; referencePhone: string; referenceRelation: string }) => {
  //     return await apiRequest("POST", "/api/transporter-references", {
  //       transporterId: user!.id,
  //       ...data,
  //     });
  //   },
  //   onSuccess: () => {
  //     toast({
  //       title: "Succès",
  //       description: "Votre référence a été enregistrée. Notre équipe vous contactera pour validation.",
  //     });
  //     queryClient.invalidateQueries({ queryKey: [`/api/transporter-references/${user!.id}`] });
  //     referenceForm.reset();
  //   },
  //   onError: (error: any) => {
  //     toast({
  //       variant: "destructive",
  //       title: "Erreur",
  //       description: error.message || "Échec de l'enregistrement de la référence",
  //     });
  //   },
  // });

  const markForBillingMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return await apiRequest("POST", `/api/requests/${requestId}/mark-for-billing`, {
        transporterId: user!.id,
      });
    },
    onSuccess: () => {
      toast({
        title: t('transporterDashboard.toast.markedBilled'),
        description: t('transporterDashboard.toast.markedBilledDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/requests/accepted"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: t('transporterDashboard.toast.billedError'),
        description: t('transporterDashboard.toast.billedErrorDesc'),
      });
    },
  });

  const declineRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return await apiRequest("POST", `/api/requests/${requestId}/decline`, {
        transporterId: user!.id,
      });
    },
    onSuccess: () => {
      toast({
        title: t('transporterDashboard.toast.orderHidden'),
        description: t('transporterDashboard.toast.orderHiddenDesc'),
      });
      // Invalidate new query key with partial matching (TanStack Query v5)
      queryClient.invalidateQueries({ 
        queryKey: ["/api/transporter/available-requests"], 
        exact: false 
      });
      // Keep old key for backward compatibility
      queryClient.invalidateQueries({ queryKey: ["/api/requests"], exact: false });
    },
    onError: (error: any) => {
      // Check if the error is a 404 (request not found/deleted)
      const is404 = error?.message?.includes("404") || error?.message?.includes("not found");
      
      if (is404) {
        toast({
          variant: "destructive",
          title: t('transporterDashboard.toast.requestUnavailable'),
          description: t('transporterDashboard.toast.requestUnavailableDesc'),
        });
        // Invalidate queries to refresh the list
        queryClient.invalidateQueries({ 
          queryKey: ["/api/transporter/available-requests"], 
          exact: false 
        });
        queryClient.invalidateQueries({ queryKey: ["/api/requests"], exact: false });
      } else {
        toast({
          variant: "destructive",
          title: t('transporterDashboard.toast.hideError'),
          description: t('transporterDashboard.toast.hideErrorDesc'),
        });
      }
    },
  });

  const trackViewMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return await apiRequest("POST", `/api/requests/${requestId}/track-view`, {});
    },
  });

  const expressInterestMutation = useMutation({
    mutationFn: async ({ requestId, availabilityDate }: { requestId: string; availabilityDate?: Date }) => {
      return await apiRequest("POST", "/api/transporter/express-interest", { 
        requestId,
        interested: true,
        availabilityDate: availabilityDate?.toISOString()
      });
    },
    onSuccess: () => {
      toast({
        title: t('transporterDashboard.toast.interestExpressed'),
        description: t('transporterDashboard.toast.interestExpressedDesc'),
      });
      // Invalidate queries to refresh both tabs and move the card automatically
      queryClient.invalidateQueries({ 
        queryKey: ["/api/transporter/available-requests"], 
        exact: false 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/requests"], 
        exact: false 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/transporter/my-interests"], 
        exact: false 
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: t('transporterDashboard.toast.interestError'),
        description: t('transporterDashboard.toast.interestErrorDesc'),
      });
    },
  });

  const withdrawInterestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return await apiRequest("POST", "/api/transporter/express-interest", { 
        requestId,
        interested: false 
      });
    },
    onSuccess: () => {
      toast({
        title: t('transporterDashboard.toast.interestWithdrawn'),
        description: t('transporterDashboard.toast.interestWithdrawnDesc'),
      });
      // Invalidate queries to refresh both tabs and move the card automatically
      queryClient.invalidateQueries({ 
        queryKey: ["/api/transporter/available-requests"], 
        exact: false 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/requests"], 
        exact: false 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/transporter/my-interests"], 
        exact: false 
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: t('transporterDashboard.toast.withdrawError'),
        description: t('transporterDashboard.toast.withdrawErrorDesc'),
      });
    },
  });

  const announceReturnMutation = useMutation({
    mutationFn: async (data: { fromCity: string; toCity: string; returnDate: string }) => {
      return await apiRequest("POST", "/api/empty-returns", {
        transporterId: user!.id,
        ...data,
      });
    },
    onSuccess: () => {
      toast({
        title: t('transporterDashboard.toast.returnAnnounced'),
        description: t('transporterDashboard.toast.returnAnnouncedDesc'),
      });
      setAnnounceReturnOpen(false);
      // Reset form fields
      setReturnFromCity("");
      setReturnToCity("");
      setReturnDate("");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: t('transporterDashboard.toast.returnError'),
        description: t('transporterDashboard.toast.returnErrorDesc'),
      });
    },
  });

  const reportForm = useForm({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      description: "",
      type: "",
    },
  });

  const editOfferForm = useForm({
    resolver: zodResolver(editOfferSchema),
    defaultValues: {
      amount: "",
      pickupDate: "",
      loadType: "return" as const,
    },
  });

  // REMOVED: Referent system no longer used
  // const referenceForm = useForm({
  //   resolver: zodResolver(referenceSchema),
  //   defaultValues: {
  //     referenceName: "",
  //     referencePhone: "+212",
  //     referenceRelation: "Client" as const,
  //   },
  // });

  const updateOfferMutation = useMutation({
    mutationFn: async (data: { offerId: string; amount: number; pickupDate: string; loadType: string }) => {
      return await apiRequest("PATCH", `/api/offers/${data.offerId}`, {
        amount: data.amount,
        pickupDate: data.pickupDate,
        loadType: data.loadType,
      });
    },
    onSuccess: () => {
      toast({
        title: t('transporterDashboard.toast.offerUpdated'),
        description: t('transporterDashboard.toast.offerUpdatedDesc'),
      });
      setEditOfferDialogOpen(false);
      editOfferForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: t('transporterDashboard.toast.offerError'),
        description: t('transporterDashboard.toast.offerErrorDesc'),
      });
    },
  });

  const createReportMutation = useMutation({
    mutationFn: async (data: { requestId: string; description: string; type: string }) => {
      // Get the request to find the client ID
      const request = [...requests, ...acceptedRequests].find((r: any) => r.id === data.requestId);
      const clientId = request?.clientId || "";
      
      return await apiRequest("POST", "/api/reports", {
        requestId: data.requestId,
        reporterId: user!.id,
        reporterType: "transporter",
        reportedUserId: clientId,
        reason: data.type,
        details: data.description,
      });
    },
    onSuccess: () => {
      toast({
        title: t('transporterDashboard.toast.reportSent'),
        description: t('transporterDashboard.toast.reportSentDesc'),
      });
      setShowReportDialog(false);
      reportForm.reset();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: t('transporterDashboard.toast.reportError'),
        description: t('transporterDashboard.toast.reportErrorDesc'),
      });
    },
  });

  // Early return if auth is loading or user is null
  if (authLoading || !user) {
    return <LoadingTruck />;
  }

  const handleOpenReportDialog = (requestId: string) => {
    setReportRequestId(requestId);
    reportForm.reset();
    setShowReportDialog(true);
  };

  const handleSubmitReport = (data: any) => {
    if (reportRequestId) {
      createReportMutation.mutate({
        requestId: reportRequestId,
        description: data.description,
        type: data.type,
      });
    }
  };

  const handleDeclineRequest = (requestId: string) => {
    if (confirm(t('transporterDashboard.labels.hideConfirm'))) {
      declineRequestMutation.mutate(requestId);
    }
  };

  const filteredRequests = requests
    .filter((req: any) => {
      // Exclude requests declined by this transporter
      const notDeclined = !req.declinedBy || !req.declinedBy.includes(user.id);
      // Exclude requests where transporter has already expressed interest
      const notInterested = !req.transporterInterests?.includes(user.id);
      const cityMatch: boolean = selectedCity === "allCities" || 
                       req.fromCity === selectedCity || 
                       req.toCity === selectedCity;
      return notDeclined && notInterested && cityMatch;
    })
    .sort((a: any, b: any) => {
      // Sort by most recent first
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Note: offerCounts removed - new workflow uses interest-based matching

  if (requestsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingTruck size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        user={user! as { id: string; name?: string; role: string; clientId?: string }}
        onLogout={handleLogout}
      />
      
      <StoriesBar userRole="transporter" />
      
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="py-4 flex items-center justify-between flex-wrap gap-3">
          <Button
            onClick={handleAnnounceReturn}
            size="default"
            className="gap-2 bg-[#00d4b2] hover:bg-[#00d4b2] border border-[#00d4b2]"
            data-testid="button-announce-return"
          >
            <TruckIcon className="h-4 w-4" />
            {t('header.transporter.announceReturn')}
          </Button>
          <div className="flex-1" />
        </div>
      </div>
      
      {/* Account pending validation message - Simplified without referent system */}
      {user.status === "pending" && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500 p-4 mx-4 mt-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                ⏳ {t('transporterDashboard.dialogs.notValidated.title')}
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                {t('transporterDashboard.dialogs.notValidated.description')}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="container mx-auto p-4 md:p-6 max-w-7xl space-y-6">
        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full max-w-3xl grid-cols-3">
            <TabsTrigger value="available" data-testid="tab-available">
              <Search className="mr-2 h-4 w-4" />
              {t('transporterDashboard.tabs.available')}
            </TabsTrigger>
            <TabsTrigger value="interested" data-testid="tab-interested">
              <Package className="mr-2 h-4 w-4" />
              {t('transporterDashboard.tabs.myInterests')}
            </TabsTrigger>
            <TabsTrigger value="to-process" data-testid="tab-to-process">
              <CheckCircle className="mr-2 h-4 w-4" />
              {t('transporterDashboard.tabs.accepted')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="mt-6 space-y-6">
            <div className="flex justify-center">
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-full sm:w-64" data-testid="select-city-filter">
                  <ListFilter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="allCities">{t('transporterDashboard.filters.allCities')}</SelectItem>
                  {citiesLoading ? (
                    <div className="p-2 text-sm text-muted-foreground">{t('common.loading')}</div>
                  ) : (
                    cities.map((city: any) => (
                      <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {filteredRequests.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredRequests.map((request: any) => {
                  // Check if transporter has expressed interest
                  const isInterested = request.transporterInterests?.includes(user.id) || false;
                  const isPending = expressInterestMutation.isPending || withdrawInterestMutation.isPending;
                  
                  return (
                    <RequestCard
                      key={request.id}
                      request={request}
                      userStatus={user.status}
                      onDecline={handleDeclineRequest}
                      onTrackView={() => trackViewMutation.mutate(request.id)}
                      // New interest-based props
                      isInterested={isInterested}
                      onExpressInterest={(id, date) => expressInterestMutation.mutate({ requestId: id, availabilityDate: date })}
                      onWithdrawInterest={(id) => withdrawInterestMutation.mutate(id)}
                      isPendingInterest={isPending}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {t('transporterDashboard.noRequests')}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="interested" className="mt-6 space-y-6">
            {interestsLoading ? (
              <div className="flex justify-center py-12">
                <LoadingTruck />
              </div>
            ) : myInterests.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {myInterests.map((interest: any) => {
                  const requestDate = interest.requestDate ? new Date(interest.requestDate) : null;
                  const availabilityDate = interest.availabilityDate ? new Date(interest.availabilityDate) : null;
                  const datesMatch = requestDate && availabilityDate && 
                    requestDate.toDateString() === availabilityDate.toDateString();

                  return (
                    <Card key={interest.interestId} className="overflow-hidden hover-elevate border-2">
                      <div className="bg-gradient-to-r from-[#17cfcf] to-[#13b3b3] p-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-white text-sm">{interest.goodsType}</h3>
                          <Badge className="bg-slate-900/90 text-white border-0 font-mono text-xs">
                            {interest.referenceId}
                          </Badge>
                        </div>
                      </div>

                      <CardContent className="p-4 space-y-3">
                        {/* Trajet */}
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-semibold">
                            {interest.fromCity} → {interest.toCity}
                          </span>
                        </div>

                        {/* Date proposée avec badge de couleur */}
                        <div className="space-y-2 pt-2 border-t">
                          <p className="text-xs font-medium text-muted-foreground">📅 {t('transporterDashboard.labels.proposedDate')}</p>
                          <div className="flex items-center gap-2">
                            <Badge 
                              className={`${datesMatch 
                                ? 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700' 
                                : 'bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700'
                              } text-white border-0 text-xs font-medium`}
                            >
                              {availabilityDate ? format(availabilityDate, "dd MMMM yyyy", { locale: i18n.language === 'ar' ? undefined : fr }) : t('transporterDashboard.labels.notSpecified')}
                            </Badge>
                            {datesMatch ? (
                              <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ {t('transporterDashboard.labels.matches')}</span>
                            ) : (
                              <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">⚠ {t('transporterDashboard.labels.different')}</span>
                            )}
                          </div>
                          {requestDate && (
                            <p className="text-xs text-muted-foreground">
                              {t('transporterDashboard.labels.clientDate')}: {format(requestDate, "dd MMMM yyyy", { locale: i18n.language === 'ar' ? undefined : fr })}
                            </p>
                          )}
                        </div>

                        {/* Prix si disponible */}
                        {interest.transporterAmount && (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-[#00ff88]/10 to-transparent border-l-4 border-[#00ff88]">
                            <span className="text-xs font-medium text-muted-foreground">{t('shared.labels.amount')}</span>
                            <span className="text-lg font-bold text-[#00ff88] ml-auto">
                              {Math.floor(interest.transporterAmount).toLocaleString()} Dhs
                            </span>
                          </div>
                        )}

                        {/* Client */}
                        {interest.client && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground">{t('shared.labels.client')} : {interest.client.name}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {t('transporterDashboard.noInterests')}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {t('transporterDashboard.browseAvailable')}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="to-process" className="mt-6 space-y-6">
            {/* Interactive Calendar */}
            {acceptedRequests.length > 0 && (
              <InteractiveCalendar
                requests={acceptedRequests}
                selectedDate={selectedCalendarDate}
                onDateSelect={setSelectedCalendarDate}
              />
            )}

            {/* Display message when date is selected but no requests match */}
            {selectedCalendarDate && filteredAcceptedRequests.length === 0 && acceptedRequests.length > 0 && (
              <Card>
                <CardContent className="py-8 text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Aucune commande prévue pour le {format(selectedCalendarDate, "d MMMM yyyy", { locale: fr })}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCalendarDate(null)}
                    className="mt-4"
                    data-testid="button-clear-date-filter-empty"
                  >
                    Voir toutes les commandes
                  </Button>
                </CardContent>
              </Card>
            )}

            {filteredAcceptedRequests.length > 0 ? (
              <div className="space-y-4">
                {filteredAcceptedRequests.map((request: any) => {
                  // Client info comes from request object in new workflow
                  const isMarkedForBilling = request.paymentStatus === "awaiting_payment";
                  const categoryConfig = getCategoryConfig(request.goodsType, t);

                  return (
                    <Card key={request.id} className="hover-elevate">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold">{request.referenceId}</h3>
                              {isMarkedForBilling && (
                                <Badge variant="default" className="bg-orange-600">
                                  En attente de paiement client
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {request.fromCity} → {request.toCity}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewClientDetails(request)}
                              className="gap-2"
                              data-testid={`button-view-client-${request.id}`}
                            >
                              <Phone className="h-4 w-4" />
                              Voir les détails
                            </Button>
                            {!isMarkedForBilling && request.status !== "completed" && request.paymentStatus !== "paid" && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => markForBillingMutation.mutate(request.id)}
                                disabled={markForBillingMutation.isPending}
                                className="gap-2"
                                data-testid={`button-mark-billing-${request.id}`}
                              >
                                <CheckCircle className="h-4 w-4" />
                                {t('transporterDashboard.actions.markForBilling')}
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleOpenReportDialog(request.id)}
                              data-testid={`button-report-${request.id}`}
                              className="gap-2"
                            >
                              <Flag className="h-4 w-4" />
                              <span className="hidden sm:inline">{t('transporterDashboard.actions.report')}</span>
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">{t('shared.labels.goodsType')}</p>
                              <p className="font-medium">{categoryConfig.label}</p>
                            </div>
                            {request.estimatedWeight && (
                              <div>
                                <p className="text-muted-foreground">{t('shared.labels.estimatedWeight')}</p>
                                <p className="font-medium">{request.estimatedWeight}</p>
                              </div>
                            )}
                          </div>

                          {request.pickupDate && (
                            <div className="bg-primary/5 border border-primary/20 rounded-md p-3 mt-3">
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {t('shared.labels.missionDate')}
                              </p>
                              <p className="text-base font-semibold text-primary mt-1">
                                {format(new Date(request.pickupDate), "EEEE d MMMM yyyy", { locale: i18n.language === 'ar' ? undefined : fr })}
                              </p>
                            </div>
                          )}
                          
                          {request.description && (
                            <div>
                              <p className="text-sm text-muted-foreground">{t('shared.labels.description')}</p>
                              <p className="text-sm">{request.description}</p>
                            </div>
                          )}
                          
                          {request.photos && request.photos.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewPhotos(request.photos, request.referenceId)}
                              className="gap-2"
                              data-testid={`button-view-request-photos-${request.id}`}
                            >
                              <ImageIcon className="w-4 h-4" />
                              {t('transporterDashboard.actions.viewPhotos')} ({request.photos.length})
                            </Button>
                          )}
                        </div>

                        {request.clientId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleChat(request.clientId, request.clientName || t('shared.labels.client'), request.id)}
                            className="gap-2 w-full sm:w-auto bg-[#00cc88] hover:bg-[#00cc88]/90 text-white border-[#00cc88]"
                            data-testid={`button-chat-request-${request.id}`}
                            style={{ textShadow: "0 1px 1px rgba(0,0,0,0.2)" }}
                          >
                            <MessageSquare className="w-4 w-4" />
                            {t('transporterDashboard.actions.sendMessage')}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Aucune commande à traiter
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* OfferForm removed - new workflow uses interest buttons in RequestCard */}

      {selectedClient && (
        <ChatWindow
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          otherUser={selectedClient}
          currentUserId={user.id}
          currentUserRole="transporter"
          requestId={chatRequestId}
        />
      )}

      <PhotoGalleryDialog
        open={photoGalleryOpen}
        onClose={() => setPhotoGalleryOpen(false)}
        photos={selectedPhotos}
        referenceId={selectedReferenceId}
      />

      <Dialog open={clientDetailsOpen} onOpenChange={setClientDetailsOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">{t('transporterDashboard.dialogs.clientDetails.title')}</DialogTitle>
          </DialogHeader>
          {selectedClientDetails && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('shared.labels.order')}</p>
                <p className="font-semibold text-lg">{selectedClientDetails.referenceId}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">{t('transporterDashboard.dialogs.clientDetails.phone')}</p>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  <a 
                    href={`tel:${selectedClientDetails.clientPhone}`} 
                    className="font-semibold text-primary hover:underline text-lg"
                    data-testid="link-client-phone-details"
                  >
                    {selectedClientDetails.clientPhone}
                  </a>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-2">{t('shared.labels.route')}</p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <p className="font-medium">
                    {selectedClientDetails.fromCity} → {selectedClientDetails.toCity}
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setClientDetailsOpen(false)}
                className="w-full"
                data-testid="button-close-client-details"
              >
                {t('transporterDashboard.dialogs.clientDetails.close')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Announce Empty Return Dialog */}
      <Dialog open={announceReturnOpen} onOpenChange={setAnnounceReturnOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('transporterDashboard.dialogs.announceReturn.title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('transporterDashboard.dialogs.announceReturn.fromCity')}</label>
              <Select value={returnFromCity} onValueChange={setReturnFromCity}>
                <SelectTrigger data-testid="select-return-from-city">
                  <SelectValue placeholder={t('transporterDashboard.dialogs.announceReturn.selectFromCity')} />
                </SelectTrigger>
                <SelectContent>
                  {citiesLoading ? (
                    <div className="p-2 text-sm text-muted-foreground">{t('common.loading')}</div>
                  ) : (
                    cities.map((city: any) => (
                      <SelectItem key={city.id} value={city.name}>
                        {city.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">{t('transporterDashboard.dialogs.announceReturn.toCity')}</label>
              <Select value={returnToCity} onValueChange={setReturnToCity}>
                <SelectTrigger data-testid="select-return-to-city">
                  <SelectValue placeholder={t('transporterDashboard.dialogs.announceReturn.selectToCity')} />
                </SelectTrigger>
                <SelectContent>
                  {citiesLoading ? (
                    <div className="p-2 text-sm text-muted-foreground">{t('common.loading')}</div>
                  ) : (
                    cities.map((city: any) => (
                      <SelectItem key={city.id} value={city.name}>
                        {city.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">{t('transporterDashboard.dialogs.announceReturn.availabilityDate')}</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="pl-10"
                  data-testid="input-return-date"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setAnnounceReturnOpen(false)}
                className="flex-1"
                data-testid="button-cancel-return"
              >
                {t('common.actions.cancel')}
              </Button>
              <Button
                onClick={() => {
                  if (!returnFromCity || !returnToCity || !returnDate) {
                    toast({
                      variant: "destructive",
                      title: t('common.toast.error'),
                      description: t('transporterDashboard.dialogs.announceReturn.fillAllFields'),
                    });
                    return;
                  }
                  announceReturnMutation.mutate({
                    fromCity: returnFromCity,
                    toCity: returnToCity,
                    returnDate,
                  });
                }}
                disabled={announceReturnMutation.isPending}
                className="flex-1 bg-[#00d4b2] hover:bg-[#00d4b2] border border-[#00d4b2]"
                data-testid="button-submit-return"
              >
                {announceReturnMutation.isPending ? t('transporterDashboard.dialogs.announceReturn.announcing') : t('transporterDashboard.dialogs.announceReturn.announce')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Offer Dialog */}
      <Dialog open={editOfferDialogOpen} onOpenChange={(open) => {
        setEditOfferDialogOpen(open);
        if (!open) {
          editOfferForm.reset();
          setSelectedOffer(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('transporterDashboard.dialogs.editOffer.title')}</DialogTitle>
            <DialogDescription>
              {t('transporterDashboard.dialogs.editOffer.description')}
            </DialogDescription>
          </DialogHeader>
          <Form {...editOfferForm}>
            <form 
              onSubmit={editOfferForm.handleSubmit((data) => {
                if (!selectedOffer) return;
                const amount = typeof data.amount === 'number' ? data.amount : Number(data.amount);
                updateOfferMutation.mutate({
                  offerId: selectedOffer.id,
                  amount,
                  pickupDate: data.pickupDate,
                  loadType: data.loadType,
                });
              })}
              className="space-y-4"
            >
              <FormField
                control={editOfferForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('transporterDashboard.dialogs.editOffer.amount')} <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={t('transporterDashboard.dialogs.editOffer.amountPlaceholder')}
                        data-testid="input-edit-amount"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editOfferForm.control}
                name="pickupDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('transporterDashboard.dialogs.editOffer.pickupDate')} <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        data-testid="input-edit-pickup-date"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editOfferForm.control}
                name="loadType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('transporterDashboard.dialogs.editOffer.loadType')} <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-load-type">
                          <SelectValue placeholder={t('transporterDashboard.dialogs.editOffer.selectLoadType')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="return">{t('shared.loadTypes.return')}</SelectItem>
                        <SelectItem value="shared">{t('shared.loadTypes.shared')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditOfferDialogOpen(false);
                    editOfferForm.reset();
                    setSelectedOffer(null);
                  }}
                  data-testid="button-cancel-edit-offer"
                >
                  {t('common.actions.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={updateOfferMutation.isPending}
                  data-testid="button-submit-edit-offer"
                >
                  {updateOfferMutation.isPending ? t('transporterDashboard.dialogs.editOffer.updating') : t('transporterDashboard.dialogs.editOffer.submit')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('transporterDashboard.dialogs.report.title')}</DialogTitle>
            <DialogDescription>
              {t('transporterDashboard.dialogs.report.description')}
            </DialogDescription>
          </DialogHeader>
          <Form {...reportForm}>
            <form onSubmit={reportForm.handleSubmit(handleSubmitReport)} className="space-y-4">
              <FormField
                control={reportForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('transporterDashboard.dialogs.report.problemType')} <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-report-type">
                          <SelectValue placeholder={t('transporterDashboard.dialogs.report.selectType')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="no-show">{t('transporterDashboard.dialogs.report.types.noShow')}</SelectItem>
                        <SelectItem value="payment">{t('transporterDashboard.dialogs.report.types.payment')}</SelectItem>
                        <SelectItem value="communication">{t('transporterDashboard.dialogs.report.types.communication')}</SelectItem>
                        <SelectItem value="incorrect-info">{t('transporterDashboard.dialogs.report.types.incorrectInfo')}</SelectItem>
                        <SelectItem value="damaged-goods">{t('transporterDashboard.dialogs.report.types.damagedGoods')}</SelectItem>
                        <SelectItem value="other">{t('transporterDashboard.dialogs.report.types.other')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={reportForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('transporterDashboard.dialogs.report.detailedDescription')} <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('transporterDashboard.dialogs.report.descriptionPlaceholder')}
                        className="resize-none h-32"
                        data-testid="textarea-report-description"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowReportDialog(false)}
                  data-testid="button-cancel-report"
                >
                  {t('common.actions.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={createReportMutation.isPending}
                  data-testid="button-submit-report"
                >
                  {createReportMutation.isPending ? t('transporterDashboard.dialogs.report.submitting') : t('transporterDashboard.dialogs.report.submit')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Account Not Validated Dialog */}
      <Dialog open={notValidatedDialogOpen} onOpenChange={setNotValidatedDialogOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Flag className="h-5 w-5 text-amber-600" />
              {t('transporterDashboard.dialogs.notValidated.title')}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              {t('transporterDashboard.dialogs.notValidated.message1')}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {t('transporterDashboard.dialogs.notValidated.message2')}
            </p>
            <p className="text-muted-foreground leading-relaxed flex items-center gap-2">
              <TruckIcon className="h-4 w-4 text-[#00d4b2]" />
              {t('transporterDashboard.dialogs.notValidated.thanks')}
            </p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setNotValidatedDialogOpen(false)}
              className="w-full"
              data-testid="button-close-not-validated"
            >
              {t('common.actions.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
