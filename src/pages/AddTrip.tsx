import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Calendar, Users, Car, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { CitySelect } from "@/components/ui/city-select";

const AddTrip = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchUserProfile();
  }, [user, navigate]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
      
      // Check if user can create trips (is a driver)
      if (data.user_type !== 'driver') {
        toast({
          title: "غير مسموح",
          description: "يجب أن تكون سائقاً لإضافة رحلة جديدة",
          variant: "destructive"
        });
        navigate('/');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !userProfile) return;

    // Validation
    if (!fromCity.trim()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى اختيار مدينة الانطلاق",
        variant: "destructive"
      });
      return;
    }

    if (!toCity.trim()) {
      toast({
        title: "خطأ في البيانات", 
        description: "يرجى اختيار مدينة الوصول",
        variant: "destructive"
      });
      return;
    }

    if (fromCity === toCity) {
      toast({
        title: "خطأ في البيانات",
        description: "مدينة الانطلاق يجب أن تختلف عن مدينة الوصول",
        variant: "destructive"
      });
      return;
    }

    const formData = new FormData(e.currentTarget);
    const departureTime = formData.get('departure_time') as string;
    
    if (!departureTime) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى تحديد تاريخ ووقت الانطلاق",
        variant: "destructive"
      });
      return;
    }

    // Check if date is in the future
    const departureDate = new Date(departureTime);
    if (departureDate <= new Date()) {
      toast({
        title: "خطأ في التاريخ",
        description: "يجب أن يكون تاريخ الانطلاق في المستقبل",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const tripData = {
        driver_id: userProfile.id,
        from_location: fromCity,
        to_location: toCity,
        departure_time: departureTime,
        total_seats: parseInt(formData.get('total_seats') as string),
        available_seats: parseInt(formData.get('total_seats') as string),
        price_per_seat: parseFloat(formData.get('price_per_seat') as string),
        car_model: (formData.get('car_model') as string) || null,
        car_plate: (formData.get('car_plate') as string) || null,
        notes: (formData.get('notes') as string) || null,
        gender_preference: formData.get('gender_preference') as any
      };

      console.log('Submitting trip data:', tripData);

      const { data, error } = await supabase
        .from('trips')
        .insert([tripData])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Trip created successfully:', data);

      toast({
        title: "تم إنشاء الرحلة بنجاح",
        description: "تم إضافة رحلتك وهي متاحة الآن للحجز"
      });

      navigate('/my-trips');
    } catch (error: any) {
      console.error('Error creating trip:', error);
      toast({
        title: "خطأ في إنشاء الرحلة",
        description: error.message || "حدث خطأ أثناء إنشاء الرحلة",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/30 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-shadow-card border-border/50">
          <CardHeader>
            <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
              <Car className="w-6 h-6 text-primary" />
              إضافة رحلة جديدة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Trip Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  معلومات الرحلة
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="from_location">من *</Label>
                    <CitySelect
                      value={fromCity}
                      onChange={setFromCity}
                      placeholder="مدينة الانطلاق"
                      name="from_location"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="to_location">إلى *</Label>
                    <CitySelect
                      value={toCity}
                      onChange={setToCity}
                      placeholder="مدينة الوصول"
                      name="to_location"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="departure_time">تاريخ ووقت الانطلاق *</Label>
                  <Input
                    id="departure_time"
                    name="departure_time"
                    type="datetime-local"
                    required
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              </div>

              {/* Car Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Car className="w-5 h-5 text-primary" />
                  معلومات السيارة والمقاعد
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="total_seats">عدد المقاعد المتاحة *</Label>
                    <Select name="total_seats" required>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر عدد المقاعد" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map(num => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} مقاعد
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price_per_seat">السعر لكل مقعد (درهم) *</Label>
                    <Input
                      id="price_per_seat"
                      name="price_per_seat"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="100"
                      required
                      className="text-right"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="car_model">موديل السيارة</Label>
                    <Input
                      id="car_model"
                      name="car_model"
                      placeholder="تويوتا كامري 2020"
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="car_plate">رقم اللوحة</Label>
                    <Input
                      id="car_plate"
                      name="car_plate"
                      placeholder="أ ب ج 1234"
                      className="text-right"
                    />
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  التفضيلات
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="gender_preference">تفضيل الجنس</Label>
                  <Select name="gender_preference" defaultValue="any">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">لا يهم</SelectItem>
                      <SelectItem value="male_only">رجال فقط</SelectItem>
                      <SelectItem value="female_only">نساء فقط</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">ملاحظات إضافية</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="أي معلومات إضافية عن الرحلة..."
                    className="text-right"
                    rows={3}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full shadow-shadow-button" 
                disabled={loading || !fromCity || !toCity}
              >
                {loading ? 'جارٍ النشر...' : 'نشر الرحلة'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddTrip;