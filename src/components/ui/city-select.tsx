import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, ChevronDown } from "lucide-react";
import { moroccanCities, getFilteredCities } from "@/data/moroccanCities";

interface CitySelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  name?: string;
  required?: boolean;
}

export const CitySelect = ({ value, onChange, placeholder, name, required }: CitySelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFilteredCities(getFilteredCities(searchTerm));
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCitySelect = (city: string) => {
    onChange(city);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
    if (!isOpen) setIsOpen(true);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <MapPin className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          name={name}
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          className="pr-10 pl-10 text-right"
          autoComplete="off"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute left-1 top-1 h-8 w-8 p-0"
          onClick={() => setIsOpen(!isOpen)}
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto z-50 bg-background border shadow-lg">
          <div className="p-2">
            {filteredCities.length > 0 ? (
              <div className="space-y-1">
                {filteredCities.map((city, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-start text-right h-10 px-3"
                    onClick={() => handleCitySelect(city)}
                  >
                    <MapPin className="w-4 h-4 ml-2 text-muted-foreground" />
                    {city}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                لا توجد مدن مطابقة
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};