import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Calendar, MapPin, Users, Star, DollarSign, Car, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Trip {
  id: string;
  from_location: string;
  to_location: string;
  departure_time: string;
  available_seats: number;
  total_seats: number;
  price_per_seat: number;
  car_model?: string;
  car_plate?: string;
  notes?: string;
  created_at: string;
}

interface Booking {
  id: string;
  seats_booked: number;
  status: string;
  created_at: string;
  trip: Trip & {
    driver: {
      name: string;
      phone_number?: string;
    };
  };
}

const MyTrips = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [myTrips, setMyTrips] = useState<Trip[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchUserData();
  }, [user, navigate]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Fetch user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (userError) throw userError;
      setUserProfile(userData);

      // Fetch user's trips (as driver)
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select('*')
        .eq('driver_id', userData.id)
        .order('created_at', { ascending: false });

      if (tripsError) throw tripsError;
      setMyTrips(tripsData || []);

      // Fetch user's bookings (as passenger)
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          trip:trips(
            *,
            driver:users!trips_driver_id_fkey(name, phone_number)
          )
        `)
        .eq('passenger_id', userData.id)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;
      setMyBookings(bookingsData || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل بياناتك",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الرحلة؟')) return;

    try {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId);

      if (error) throw error;

      setMyTrips(prev => prev.filter(trip => trip.id !== tripId));
      toast({
        title: "تم حذف الرحلة",
        description: "تم حذف الرحلة بنجاح"
      });
    } catch (error: any) {
      console.error('Error deleting trip:', error);
      toast({
        title: "خطأ في حذف الرحلة",
        description: error.message || "حدث خطأ أثناء حذف الرحلة",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: 'قيد الانتظار', variant: 'outline' },
      confirmed: { label: 'مؤكد', variant: 'default' },
      cancelled: { label: 'ملغي', variant: 'destructive' }
    };

    const statusInfo = statusMap[status] || statusMap.pending;
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">جارٍ تحميل بياناتك...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/30 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">رحلاتي</h1>
          <p className="text-muted-foreground">إدارة رحلاتك وحجوزاتك</p>
        </div>

        <Tabs defaultValue="my-trips" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
            <TabsTrigger value="my-trips">رحلاتي كسائق</TabsTrigger>
            <TabsTrigger value="my-bookings">حجوزاتي كراكب</TabsTrigger>
          </TabsList>

          <TabsContent value="my-trips" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">الرحلات التي أنشأتها</h2>
              <Button asChild>
                <a href="/add-trip">إضافة رحلة جديدة</a>
              </Button>
            </div>

            {myTrips.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myTrips.map((trip) => (
                  <Card key={trip.id} className="hover:shadow-shadow-card transition-all duration-300 border-border/50">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">
                          {trip.from_location} ← {trip.to_location}
                        </CardTitle>
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          {trip.available_seats}/{trip.total_seats} مقاعد
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {formatDate(trip.departure_time)}
                        </div>
                        {trip.car_model && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Car className="w-4 h-4" />
                            {trip.car_model}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <DollarSign className="w-4 h-4" />
                          {trip.price_per_seat} درهم لكل مقعد
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Edit className="w-4 h-4 ml-1" />
                          تعديل
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => handleDeleteTrip(trip.id)}
                          className="flex-1"
                        >
                          <Trash2 className="w-4 h-4 ml-1" />
                          حذف
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Car className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">لا توجد رحلات</h3>
                <p className="text-muted-foreground mb-6">
                  لم تقم بإنشاء أي رحلات بعد. ابدأ بإضافة رحلة جديدة!
                </p>
                <Button asChild>
                  <a href="/add-trip">إضافة رحلة جديدة</a>
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-bookings" className="space-y-6">
            <h2 className="text-xl font-semibold">الرحلات التي حجزتها</h2>

            {myBookings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myBookings.map((booking) => (
                  <Card key={booking.id} className="hover:shadow-shadow-card transition-all duration-300 border-border/50">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">
                          {booking.trip.from_location} ← {booking.trip.to_location}
                        </CardTitle>
                        {getStatusBadge(booking.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {formatDate(booking.trip.departure_time)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          السائق: {booking.trip.driver.name}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          {booking.seats_booked} مقاعد محجوزة
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <DollarSign className="w-4 h-4" />
                          {(booking.trip.price_per_seat * booking.seats_booked).toFixed(2)} درهم إجمالي
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="text-xs text-muted-foreground">
                        تم الحجز في: {formatDate(booking.created_at)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">لا توجد حجوزات</h3>
                <p className="text-muted-foreground mb-6">
                  لم تقم بحجز أي رحلات بعد. تصفح الرحلات المتاحة واحجز رحلتك!
                </p>
                <Button asChild>
                  <a href="/">تصفح الرحلات</a>
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyTrips;