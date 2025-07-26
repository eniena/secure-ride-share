import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, User, Menu } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="bg-card border-b border-border/50 px-4 py-3 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">ت</span>
          </div>
          <span className="text-xl font-bold text-primary">تشاركي</span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <a href="/" className="text-foreground hover:text-primary transition-colors">
            الرئيسية
          </a>
          <a href="/add-trip" className="text-foreground hover:text-primary transition-colors">
            إضافة رحلة
          </a>
          <a href="/my-trips" className="text-foreground hover:text-primary transition-colors">
            رحلاتي
          </a>
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {user.user_metadata?.name || user.email?.split('@')[0]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  الملف الشخصي
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-destructive"
                >
                  <LogOut className="w-4 h-4" />
                  تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="default" asChild>
              <a href="/auth">تسجيل الدخول</a>
            </Button>
          )}

          {/* Mobile Menu */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-border/50">
          <div className="flex flex-col gap-2">
            <a 
              href="/" 
              className="px-3 py-2 text-foreground hover:bg-accent rounded-md transition-colors"
            >
              الرئيسية
            </a>
            <a 
              href="/add-trip" 
              className="px-3 py-2 text-foreground hover:bg-accent rounded-md transition-colors"
            >
              إضافة رحلة
            </a>
            <a 
              href="/my-trips" 
              className="px-3 py-2 text-foreground hover:bg-accent rounded-md transition-colors"
            >
              رحلاتي
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};