import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, MapPin, Calendar, Users, Star, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CitySelect } from "@/components/ui/city-select";

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
  driver: {
    name: string;
    rating: number;
    total_ratings: number;
  };
}

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchTrips();
  }, []);

  useEffect(() => {
    if (searchFrom || searchTo) {
      performSearch();
    } else {
      fetchTrips();
    }
  }, [searchFrom, searchTo]);

  const fetchTrips = async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          driver:users!trips_driver_id_fkey(name, rating, total_ratings)
        `)
        .gt('departure_time', new Date().toISOString())
        .gt('available_seats', 0)
        .order('departure_time', { ascending: true });

      if (error) throw error;
      setTrips(data || []);
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    if (!searchFrom && !searchTo) {
      fetchTrips();
      return;
    }

    setSearching(true);
    try {
      let query = supabase
        .from('trips')
        .select(`
          *,
          driver:users!trips_driver_id_fkey(name, rating, total_ratings)
        `)
        .gt('departure_time', new Date().toISOString())
        .gt('available_seats', 0);

      if (searchFrom) {
        query = query.ilike('from_location', `%${searchFrom}%`);
      }
      if (searchTo) {
        query = query.ilike('to_location', `%${searchTo}%`);
      }

      const { data, error } = await query.order('departure_time', { ascending: true });

      if (error) throw error;
      setTrips(data || []);
    } catch (error) {
      console.error('Error searching trips:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleBookTrip = async (tripId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    // Booking functionality will be implemented later
    console.log('Booking trip:', tripId);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/30">
      {/* Hero Section */}
      <div className="bg-gradient-hero text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            مرحباً بك في تشاركي
          </h1>
          <p className="text-xl mb-8 opacity-90">
            ابحث عن رحلات مشتركة آمنة ومريحة وبأسعار معقولة
          </p>
          
          {/* Search Form */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 max-w-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/90 rounded-lg">
                <CitySelect
                  value={searchFrom}
                  onChange={setSearchFrom}
                  placeholder="من"
                />
              </div>
              <div className="bg-white/90 rounded-lg">
                <CitySelect
                  value={searchTo}
                  onChange={setSearchTo}
                  placeholder="إلى"
                />
              </div>
              <Button 
                variant="secondary" 
                className="w-full bg-white text-primary hover:bg-white/90"
                onClick={performSearch}
                disabled={searching}
              >
                <Search className="w-4 h-4 ml-2" />
                {searching ? 'جارٍ البحث...' : 'بحث'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Available Trips */}
      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-foreground">الرحلات المتاحة</h2>
          <Button asChild variant="default">
            <a href="/add-trip">إضافة رحلة جديدة</a>
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : trips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <Card key={trip.id} className="hover:shadow-shadow-card transition-all duration-300 border-border/50">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">
                        {trip.from_location} ← {trip.to_location}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{trip.driver.rating.toFixed(1)}</span>
                        <span>({trip.driver.total_ratings})</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {trip.available_seats} مقاعد
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {formatDate(trip.departure_time)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      السائق: {trip.driver.name}
                    </div>
                    {trip.car_model && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        🚗 {trip.car_model}
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1 text-lg font-bold text-primary">
                      <DollarSign className="w-4 h-4" />
                      {trip.price_per_seat} درهم
                    </div>
                    <Button 
                      onClick={() => handleBookTrip(trip.id)}
                      size="sm"
                      className="shadow-shadow-button"
                    >
                      احجز الآن
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">لا توجد رحلات متاحة</h3>
            <p className="text-muted-foreground mb-6">
              لم نجد رحلات تطابق بحثك. جرب معايير بحث مختلفة أو أضف رحلة جديدة.
            </p>
            <Button asChild>
              <a href="/add-trip">إضافة رحلة جديدة</a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;