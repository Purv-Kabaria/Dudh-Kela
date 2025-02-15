"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  MapPin,
  Upload,
  ArrowLeft,
  Users,
  Calendar,
  Star,
  Settings,
  LogOut,
  ChevronDown,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { auth } from "@/lib/firebase";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { getCityFromPincode } from "@/lib/utils/pincode";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "firebase/auth";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import emailjs from "@emailjs/browser";
import { Badge } from "@/components/ui/badge";

const AVAILABLE_SERVICES = [
  "Ceiling Fan Cleaning",
  "Glass Shelf Installation",
  "Exhaust Fan Cleaning",
  "Gas Stove Cleaning",
  "Kitchen Sink Cleaning",
  "Fan Installation",
  "Shower Filter Installation",
  "Drawer Channel Replacement (One Set)",
  "Microwave Cleaning",
  "3 Ceiling Fan Cleaning",
  "Fully Automatic Washing Machine Check Up (Top Load)",
  "Window Hinge Installation (Upto 4)",
  "Semi-Automatic Washing Machine Check Up",
  "Fully Automatic Washing Machine Check Up (Front Load)",
  "Cushions Cleaning",
  "Switchbox Installation",
  "Water Purifier Check Up",
  "Single Door Refrigerator Check Up",
  "Water Purifier Uninstallation",
  "Water Purifier Filter Check Up",
  "Double Door Refrigerator Check Up (Inverter)",
  "AC Repair",
  "TV Installation",
  "Ceiling Mounted Hanger Installation",
  "Water Purifier Installation",
  "Dining Table & Chairs Cleaning",
  "Utensil Removal and Placing Back",
  "Washing Machine Installation",
  "Balcony Cleaning",
  "Washing Machine Uninstallation",
  "Double Door Refrigerator Check Up (Non-Inverter)",
  "Classic Bathroom Cleaning",
  "Geyser Installation",
  "Carpet Cleaning",
  "Intense Bathroom Cleaning",
  "Power Saver AC Service",
  "AC Uninstallation",
  "Side By Side Door Refrigerator Check Up",
  "Lite AC Service",
  "Fridge Cleaning",
  "Classic Cleaning (2 Bathrooms)",
  "Anti-Rust Deep Clean AC Service",
  "Chimney Cleaning",
  "Trolley & Shelves Cleaning",
  "Intense Cleaning (2 Bathrooms)",
  "Overhead Tank Cleaning (Open Placed)",
  "AC Installation",
  "Classic Cleaning (3 Bathrooms)",
  "Intense Cleaning (3 Bathroom)",
  "Normal Kitchen Cleaning",
  "Underground Tank Cleaning",
  "Toilet Pot Blockage Removal",
  "AC Gas Leak Fix and Refill",
  "Complete Kitchen Cleaning",
  "Sofa and Cushions Cleaning",
  "Other", // Added Other option
];

interface ProviderData {
  photo: string;
  servicePincodes: Array<{
    pincode: string;
    city?: string;
    state?: string;
  }>;
  services: string[];
}

interface ServiceRequest {
  id: string;
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  customerPincode: string;
  customerCity: string;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  status: "pending" | "accepted" | "rejected" | "completed";
  createdAt: Date;
  completedAt?: Date;
}

export default function ProviderDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [providerData, setProviderData] = useState<ProviderData>({
    photo: "",
    servicePincodes: [],
    services: [],
  });
  const [pincodeInput, setPincodeInput] = useState("");
  const [isValidatingPincode, setIsValidatingPincode] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [acceptedRequests, setAcceptedRequests] = useState<ServiceRequest[]>(
    []
  );

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/auth/login");
        return;
      }

      try {
        const db = getFirestore();
        const providerDoc = await getDoc(
          doc(db, "provider-applications", user.uid)
        );

        if (providerDoc.exists()) {
          const data = providerDoc.data();
          setProviderData({
            photo: data.photo || "",
            servicePincodes: data.servicePincodes || [],
            services: data.services || [],
          });
        }
      } catch (error) {
        console.error("Error fetching provider data:", error);
        toast({
          title: "Error",
          description: "Failed to load provider data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, toast]);

  const handlePincodeAdd = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const pincode = pincodeInput.trim();

      if (!pincode || !/^\d{6}$/.test(pincode)) {
        toast({
          title: "Invalid Pincode",
          description: "Please enter a valid 6-digit pincode",
          variant: "destructive",
        });
        return;
      }

      if (providerData.servicePincodes.some((p) => p.pincode === pincode)) {
        toast({
          title: "Duplicate Pincode",
          description: "This pincode has already been added",
          variant: "destructive",
        });
        return;
      }

      setIsValidatingPincode(true);
      try {
        const data = await getCityFromPincode(pincode);
        if (!data?.city) {
          toast({
            title: "Invalid Pincode",
            description: "Could not find location for this pincode",
            variant: "destructive",
          });
          return;
        }

        setProviderData((prev) => ({
          ...prev,
          servicePincodes: [
            ...prev.servicePincodes,
            {
              pincode,
              city: data.city,
              state: data.state,
            },
          ],
        }));
        setPincodeInput("");
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to validate pincode",
          variant: "destructive",
        });
      } finally {
        setIsValidatingPincode(false);
      }
    }
  };

  const handleServiceToggle = (service: string) => {
    setProviderData((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  const handleSaveChanges = () => {
    const user = auth.currentUser;
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save changes.",
        variant: "destructive",
      });
      router.push("/auth/login");
      return;
    }

    if (providerData.servicePincodes.length === 0) {
      toast({
        title: "Service area required",
        description:
          "Please add at least one pincode where you can provide services",
        variant: "destructive",
      });
      return;
    }

    if (providerData.services.length === 0) {
      toast({
        title: "Services required",
        description: "Please select at least one service you can provide",
        variant: "destructive",
      });
      return;
    }

    setShowSaveDialog(true);
  };

  const handleConfirmedSave = async () => {
    setShowSaveDialog(false);
    setIsSaving(true);
    try {
      const db = getFirestore();

      await updateDoc(doc(db, "provider-applications", auth.currentUser!.uid), {
        servicePincodes: providerData.servicePincodes,
        services: providerData.services,
        updatedAt: new Date(),
      });

      toast({
        title: "Changes saved",
        description: "Your provider profile has been updated successfully.",
      });

      router.push("/");
    } catch (error) {
      console.error("Error saving changes:", error);
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/auth/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleRequestAction = async (
    requestId: string,
    action: "accept" | "reject"
  ) => {
    try {
      const db = getFirestore();
      const request = serviceRequests.find((r) => r.id === requestId);

      if (!request) {
        throw new Error("Request not found");
      }

      const statusMap = {
        accept: "accepted",
        reject: "rejected",
      } as const;

      await updateDoc(doc(db, "serviceRequests", requestId), {
        status: statusMap[action],
        providerName: auth.currentUser?.displayName || "Service Provider",
        providerId: auth.currentUser?.uid,
        updatedAt: new Date(),
      });

      // Send email notification to customer when request is accepted
      if (action === "accept") {
        try {
          // Format service details with simple text formatting
          const formattedServiceDetails = request.items.map(item => 
            `${item.name}
            Quantity: ${item.quantity}
            Price: ₹${item.price} per unit
            Subtotal: ₹${item.price * item.quantity}
            ----------------------------------------`
          ).join('\n\n');

          await emailjs.send(
            process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
            process.env.NEXT_PUBLIC_EMAILJS_SERVICE_REQUEST_ACCEPTED_TEMPLATE_ID!,
            {
              to_email: request.customerEmail,
              to_name: request.customerName,
              provider_name: auth.currentUser?.displayName || "Service Provider",
              service_details: formattedServiceDetails,
              total_amount: request.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
              from_name: "DudhKela Support",
              reply_to: request.customerEmail
            },
            process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
          );

          toast({
            title: "Request Accepted",
            description: "Customer has been notified via email",
            variant: "default",
          });
        } catch (emailError) {
          console.error('Error sending acceptance email:', emailError);
          toast({
            title: "Request Accepted",
            description: "Request accepted but failed to send email notification",
            variant: "default",
          });
        }
      }

      toast({
        title: action === "accept" ? "Request Accepted" : "Request Rejected",
        description: `You have ${action}ed the service request`,
        variant: action === "accept" ? "default" : "destructive",
      });
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} request. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const handleServiceCompletion = async (requestId: string) => {
    try {
      const db = getFirestore();
      await updateDoc(doc(db, "serviceRequests", requestId), {
        status: "completed",
        completedAt: new Date(),
        updatedAt: new Date(),
      });

      toast({
        title: "Service Marked as Completed",
        description: "The service request has been marked as completed.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error marking service as completed:", error);
      toast({
        title: "Error",
        description: "Failed to mark service as completed. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!auth.currentUser) return;

    const db = getFirestore();
    const providerDoc = doc(db, "providers", auth.currentUser.uid);

    getDoc(providerDoc).then((doc) => {
      const providerPincodes =
        doc.data()?.servicePincodes?.map((p: any) => p.pincode) || [];
      const requestsRef = collection(db, "serviceRequests");

      // Create queries for both pending and accepted requests
      const pendingQuery = query(
        requestsRef,
        where("status", "==", "pending"),
        where("customerPincode", "in", providerPincodes)
      );

      const acceptedQuery = query(
        requestsRef,
        where("status", "==", "accepted"),
        where("providerId", "==", auth.currentUser!.uid)
      );

      // Set up listeners for both queries
      const unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
        const requests: ServiceRequest[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          customerName: doc.data().customerName,
          customerEmail: doc.data().customerEmail,
          customerAddress: doc.data().customerAddress,
          customerPincode: doc.data().customerPincode,
          customerCity: doc.data().customerCity,
          items: doc.data().items,
          status: doc.data().status,
          createdAt: doc.data().createdAt.toDate(),
        }));
        setServiceRequests(requests);
      });

      const unsubscribeAccepted = onSnapshot(acceptedQuery, (snapshot) => {
        const requests: ServiceRequest[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          customerName: doc.data().customerName,
          customerEmail: doc.data().customerEmail,
          customerAddress: doc.data().customerAddress,
          customerPincode: doc.data().customerPincode,
          customerCity: doc.data().customerCity,
          items: doc.data().items,
          status: doc.data().status,
          createdAt: doc.data().createdAt.toDate(),
        }));
        setAcceptedRequests(requests);
      });

      return () => {
        unsubscribePending();
        unsubscribeAccepted();
      };
    });
  }, [auth.currentUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black">
      <Header />

      <main className="flex-1 pt-24">
        <div className="container mx-auto px-4 py-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6 border border-black/10 dark:border-white/10">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-black/5 dark:bg-white/5">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-black/60 dark:text-white/60">
                    Today's Bookings
                  </p>
                  <p className="text-2xl font-semibold">0</p>
                </div>
              </div>
            </Card>
            <Card className="p-6 border border-black/10 dark:border-white/10">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-black/5 dark:bg-white/5">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-black/60 dark:text-white/60">
                    Total Customers
                  </p>
                  <p className="text-2xl font-semibold">0</p>
                </div>
              </div>
            </Card>
            <Card className="p-6 border border-black/10 dark:border-white/10">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-black/5 dark:bg-white/5">
                  <Star className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-black/60 dark:text-white/60">
                    Average Rating
                  </p>
                  <p className="text-2xl font-semibold">0.0</p>
                </div>
              </div>
            </Card>
            <Card className="p-6 border border-black/10 dark:border-white/10">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-black/5 dark:bg-white/5">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-black/60 dark:text-white/60">
                    Service Areas
                  </p>
                  <p className="text-2xl font-semibold">
                    {providerData.servicePincodes.length}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Service Requests */}
          <Card className="border border-black/10 dark:border-white/10 my-8">
            <div className="p-6 border-b border-black/10 dark:border-white/10">
              <h3 className="text-lg font-semibold">Service Requests</h3>
              <p className="text-sm text-black/60 dark:text-white/60 mt-1">
                Manage incoming service requests from customers
              </p>
            </div>

            <div className="p-6">
              {serviceRequests.length === 0 ? (
                <p className="text-center text-black/60 dark:text-white/60">
                  No pending service requests
                </p>
              ) : (
                <div className="space-y-4">
                  {serviceRequests.map((request) => (
                    <div
                      key={request.id}
                      className="p-4 border border-black/10 dark:border-white/10 rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-medium">
                            {request.customerName}
                          </h4>
                          <p className="text-sm text-black/60 dark:text-white/60">
                            {request.customerAddress}, {request.customerCity} -{" "}
                            {request.customerPincode}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleRequestAction(request.id, "reject")
                            }
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleRequestAction(request.id, "accept")
                            }
                          >
                            Accept
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {request.items.map((item, index) => (
                          <div
                            key={index}
                            className="flex justify-between text-sm"
                          >
                            <span>
                              {item.name} × {item.quantity}
                            </span>
                            <span>₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                        <div className="border-t border-black/10 dark:border-white/10 mt-2 pt-2 flex justify-between font-medium">
                          <span>Total</span>
                          <span>
                            ₹
                            {request.items.reduce(
                              (sum, item) => sum + item.price * item.quantity,
                              0
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Accepted Requests */}
          <Card className="border border-black/10 dark:border-white/10 my-8">
            <div className="p-6 border-b border-black/10 dark:border-white/10">
              <h3 className="text-lg font-semibold">Accepted Requests</h3>
              <p className="text-sm text-black/60 dark:text-white/60 mt-1">
                View and manage your accepted service requests
              </p>
            </div>

            <div className="p-6">
              {acceptedRequests.length === 0 ? (
                <p className="text-center text-black/60 dark:text-white/60">
                  No accepted service requests
                </p>
              ) : (
                <div className="space-y-4">
                  {acceptedRequests.map((request) => (
                    <div
                      key={request.id}
                      className="p-4 border border-black/10 dark:border-white/10 rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-medium">
                            {request.customerName}
                          </h4>
                          <p className="text-sm text-black/60 dark:text-white/60">
                            {request.customerAddress}, {request.customerCity} -{" "}
                            {request.customerPincode}
                          </p>
                        </div>
                        <Badge className="bg-blue-500/10 text-blue-500">
                          Accepted
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        {request.items.map((item, index) => (
                          <div
                            key={index}
                            className="flex justify-between text-sm"
                          >
                            <span>
                              {item.name} × {item.quantity}
                            </span>
                            <span>₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                        <div className="border-t border-black/10 dark:border-white/10 mt-2 pt-2 flex justify-between font-medium">
                          <span>Total</span>
                          <span>
                            ₹
                            {request.items.reduce(
                              (sum, item) => sum + item.price * item.quantity,
                              0
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4">
                        <Button
                          onClick={() => handleServiceCompletion(request.id)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white dark:bg-green-500 dark:hover:bg-green-600"
                        >
                          Mark Service as Completed
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Main Content */}
          <Card className="border border-black/10 dark:border-white/10">
            <div className="p-6 border-b border-black/10 dark:border-white/10">
              <h3 className="text-lg font-semibold">Provider Profile</h3>
              <p className="text-sm text-black/60 dark:text-white/60 mt-1">
                Manage your services and service areas
              </p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Service Areas Column */}
                <div>
                  <Label className="text-sm mb-2 block">Service Areas</Label>
                  <Input
                    value={pincodeInput}
                    onChange={(e) => setPincodeInput(e.target.value)}
                    onKeyDown={handlePincodeAdd}
                    placeholder="Enter pincode"
                    maxLength={6}
                    disabled={isValidatingPincode}
                    className="w-48 mb-4"
                  />
                  <div className="flex flex-wrap gap-2">
                    {providerData.servicePincodes.map(({ pincode, city }) => (
                      <div
                        key={pincode}
                        className="px-3 py-1 bg-black/5 dark:bg-white/5 rounded-full text-sm flex items-center gap-2"
                      >
                        <MapPin className="w-4 h-4" />
                        <span>{pincode}</span>
                        {city && (
                          <span className="text-black/60 dark:text-white/60">
                            ({city})
                          </span>
                        )}
                        <button
                          onClick={() =>
                            setProviderData((prev) => ({
                              ...prev,
                              servicePincodes: prev.servicePincodes.filter(
                                (p) => p.pincode !== pincode
                              ),
                            }))
                          }
                          className="hover:text-black dark:hover:text-white ml-1"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected Services Column */}
                <div>
                  <Label className="text-sm mb-2 block">
                    Selected Services ({providerData.services.length})
                  </Label>
                  <div className="h-[400px] overflow-y-auto rounded-lg bg-black/5 dark:bg-white/5 p-4">
                    {providerData.services.length === 0 ? (
                      <p className="text-sm text-black/60 dark:text-white/60">
                        No services selected yet
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {providerData.services.map((service) => (
                          <div
                            key={service}
                            className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-black"
                          >
                            <span className="text-sm">{service}</span>
                            <button
                              onClick={() => handleServiceToggle(service)}
                              className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Available Services Column */}
                <div>
                  <Label className="text-sm mb-2 block">
                    Available Services
                  </Label>
                  <div className="h-[400px] overflow-y-auto rounded-lg bg-black/5 dark:bg-white/5 p-4">
                    <div className="space-y-2">
                      {AVAILABLE_SERVICES.map((service) => (
                        <div
                          key={service}
                          className="flex items-center space-x-2 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                          <Checkbox
                            id={service}
                            checked={providerData.services.includes(service)}
                            onCheckedChange={() => handleServiceToggle(service)}
                          />
                          <label
                            htmlFor={service}
                            className="text-sm flex-1 cursor-pointer"
                          >
                            {service}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="w-full mt-8 bg-black hover:bg-black/90 text-white dark:bg-white dark:hover:bg-white/90 dark:text-black"
              >
                {isSaving ? "Saving Changes..." : "Save Changes"}
              </Button>
            </div>
          </Card>
        </div>
      </main>

      <Footer />

      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Changes</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to save these changes? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmedSave}>
              Save Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
