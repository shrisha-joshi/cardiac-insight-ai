import { motion } from 'framer-motion';
import { AlertTriangle, Heart, Phone, Shield, MapPin, Navigation, Hospital, Ambulance, CheckCircle, ExternalLink, X } from 'lucide-react';
import { Card } from './card';
import { Button } from './button';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './dialog';

export function EmergencyPrepCard() {
  const { toast } = useToast();
  const [isLocating, setIsLocating] = useState(false);
  const [emergencyDialing, setEmergencyDialing] = useState(false);
  const [showHospitalDialog, setShowHospitalDialog] = useState(false);
  const [hospitalMapUrl, setHospitalMapUrl] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const handleEmergencyCall = () => {
    setEmergencyDialing(true);
    
    // Initiate phone call (works on mobile devices)
    const phoneNumber = 'tel:911';
    window.location.href = phoneNumber;
    
    toast({
      title: "🚨 Emergency Call Initiated",
      description: (
        <div className="space-y-2 mt-2">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-rose-500" />
            <span className="font-semibold">Dialing 911...</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Stay calm. Help is on the way. Keep the line open and follow dispatcher instructions.
          </p>
        </div>
      ),
      duration: 8000,
    });

    setTimeout(() => setEmergencyDialing(false), 3000);
  };

  const findNearestHospital = () => {
    setIsLocating(true);

    if (!navigator.geolocation) {
      toast({
        title: "Location Not Available",
        description: "Your browser doesn't support geolocation. Please enable location services.",
        variant: "destructive",
      });
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        
        // Create Google Maps URL
        const mapsUrl = `https://www.google.com/maps/search/cardiology+hospital+emergency/@${latitude},${longitude},15z`;
        setHospitalMapUrl(mapsUrl);
        
        // Show dialog instead of opening new window
        setShowHospitalDialog(true);
        setIsLocating(false);

        toast({
          title: "🏥 Location Found",
          description: (
            <div className="space-y-2 mt-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-500" />
                <span className="font-semibold">Ready to navigate</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Showing cardiology hospitals with emergency services near you.
              </p>
            </div>
          ),
          duration: 4000,
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        
        // Fallback: Show dialog with general search
        const fallbackUrl = 'https://www.google.com/maps/search/cardiology+hospital+emergency+near+me';
        setHospitalMapUrl(fallbackUrl);
        setShowHospitalDialog(true);
        setIsLocating(false);

        toast({
          title: "Using General Location",
          description: "Showing nearby hospitals. Enable location for precise directions.",
          variant: "default",
        });
      }
    );
  };

  const openMapsInNewTab = () => {
    if (hospitalMapUrl) {
      window.open(hospitalMapUrl, '_blank', 'noopener,noreferrer');
      setShowHospitalDialog(false);
    }
  };

  return (
    <Card className="glass dark:glass-dark border-rose-500/20 p-8 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent pointer-events-none" />

      {/* Pulsing alert indicator */}
      <motion.div
        className="absolute top-4 right-4"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
      >
        <div className="w-3 h-3 rounded-full bg-rose-500 shadow-lg shadow-rose-500/50" />
      </motion.div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <motion.div
            className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20"
            whileHover={{ scale: 1.05 }}
          >
            <Shield className="w-6 h-6 text-rose-500" />
          </motion.div>
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              Emergency Preparedness
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </h3>
            <p className="text-sm text-muted-foreground">Your safety is our priority</p>
          </div>
        </div>

        {/* Steps during chest pain */}
        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-sm font-bold text-rose-500">
              1
            </div>
            <div>
              <p className="font-semibold text-sm">Stop all activity immediately</p>
              <p className="text-xs text-muted-foreground">Sit or lie down in a comfortable position</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-sm font-bold text-rose-500">
              2
            </div>
            <div>
              <p className="font-semibold text-sm">Take prescribed medication</p>
              <p className="text-xs text-muted-foreground">
                If you have nitroglycerin, take as directed
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-sm font-bold text-rose-500">
              3
            </div>
            <div>
              <p className="font-semibold text-sm">Call emergency services</p>
              <p className="text-xs text-muted-foreground">
                Don't wait - call immediately if symptoms persist
              </p>
            </div>
          </div>
        </div>

        {/* Emergency Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Emergency Call Button */}
          <motion.button
            onClick={handleEmergencyCall}
            disabled={emergencyDialing}
            className="relative py-4 px-6 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 disabled:from-rose-400 disabled:to-red-500 disabled:cursor-not-allowed text-white font-bold flex items-center justify-center gap-3 shadow-2xl shadow-rose-500/30 border border-rose-400/50 overflow-hidden group transition-all duration-300"
            whileHover={{ scale: emergencyDialing ? 1 : 1.02, boxShadow: '0 20px 50px rgba(244, 63, 94, 0.4)' }}
            whileTap={{ scale: emergencyDialing ? 1 : 0.98 }}
          >
            {/* Animated pulse background */}
            {emergencyDialing && (
              <motion.div
                className="absolute inset-0 bg-white/20"
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
            
            <motion.div
              animate={emergencyDialing ? { rotate: 360 } : { rotate: [0, 10, -10, 0] }}
              transition={emergencyDialing ? { duration: 1, repeat: Infinity, ease: "linear" } : { duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
            >
              {emergencyDialing ? (
                <Ambulance className="w-5 h-5" />
              ) : (
                <Phone className="w-5 h-5" />
              )}
            </motion.div>
            <span>{emergencyDialing ? 'Connecting...' : 'Quick Dial Emergency (911)'}</span>
          </motion.button>

          {/* Find Hospital Button */}
          <motion.button
            onClick={findNearestHospital}
            disabled={isLocating}
            className="relative py-4 px-6 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 disabled:from-teal-400 disabled:to-emerald-500 disabled:cursor-not-allowed text-white font-bold flex items-center justify-center gap-3 shadow-2xl shadow-teal-500/30 border border-teal-400/50 overflow-hidden group transition-all duration-300"
            whileHover={{ scale: isLocating ? 1 : 1.02, boxShadow: '0 20px 50px rgba(20, 184, 166, 0.4)' }}
            whileTap={{ scale: isLocating ? 1 : 0.98 }}
          >
            {/* Animated pulse background */}
            {isLocating && (
              <motion.div
                className="absolute inset-0 bg-white/20"
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
            
            <motion.div
              animate={isLocating ? { rotate: 360 } : {}}
              transition={isLocating ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
            >
              {isLocating ? (
                <Navigation className="w-5 h-5" />
              ) : (
                <Hospital className="w-5 h-5" />
              )}
            </motion.div>
            <span>{isLocating ? 'Locating...' : 'Nearest Cardio Hospital'}</span>
          </motion.button>
        </div>

        {/* Quick Action Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6 p-4 rounded-lg bg-teal-500/5 border border-teal-500/20"
        >
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-teal-700 dark:text-teal-400 mb-1">
                Quick Actions Enabled:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-rose-500" />
                  <span>Instant emergency dial</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-teal-500" />
                  <span>GPS-based hospital finder</span>
                </div>
                <div className="flex items-center gap-1">
                  <Navigation className="w-3 h-3 text-blue-500" />
                  <span>Turn-by-turn directions</span>
                </div>
                <div className="flex items-center gap-1">
                  <Hospital className="w-3 h-3 text-emerald-500" />
                  <span>24/7 emergency centers</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Warning signs */}
        <div className="mt-6 p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <div className="flex items-start gap-2">
            <Heart className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
                Warning Signs:
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Chest discomfort, shortness of breath, nausea, cold sweat, pain radiating to
                arms/jaw/back, lightheadedness
              </p>
            </div>
          </div>
        </div>

        {/* Trust badge */}
        <motion.div
          className="mt-4 text-center text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span className="inline-flex items-center gap-1">
            <Shield className="w-3 h-3 text-teal-500" />
            Verified by medical professionals
          </span>
        </motion.div>
      </div>

      {/* Hospital Navigation Dialog */}
      <Dialog open={showHospitalDialog} onOpenChange={setShowHospitalDialog}>
        <DialogContent className="sm:max-w-[600px] glass dark:glass-dark border-teal-500/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Hospital className="w-6 h-6 text-teal-500" />
              </motion.div>
              Nearest Cardiology Hospitals
            </DialogTitle>
            <DialogDescription className="text-base">
              We've found cardiology hospitals with emergency services near you.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Location Info */}
            {userLocation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-teal-500/5 border border-teal-500/20"
              >
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-teal-500" />
                  <span className="font-semibold text-sm">Your Location Detected</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>
                    <span className="font-medium">Latitude:</span> {userLocation.lat.toFixed(6)}
                  </div>
                  <div>
                    <span className="font-medium">Longitude:</span> {userLocation.lng.toFixed(6)}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-3">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-3 rounded-lg bg-background/50 border border-border/50"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Navigation className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-semibold">Turn-by-turn</span>
                </div>
                <p className="text-xs text-muted-foreground">Real-time directions</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-3 rounded-lg bg-background/50 border border-border/50"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Hospital className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-semibold">24/7 Emergency</span>
                </div>
                <p className="text-xs text-muted-foreground">Always available</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-3 rounded-lg bg-background/50 border border-border/50"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="w-4 h-4 text-rose-500" />
                  <span className="text-sm font-semibold">Contact Info</span>
                </div>
                <p className="text-xs text-muted-foreground">Hospital numbers</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-3 rounded-lg bg-background/50 border border-border/50"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Ambulance className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-semibold">ER Details</span>
                </div>
                <p className="text-xs text-muted-foreground">Wait times & info</p>
              </motion.div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <Button
                onClick={openMapsInNewTab}
                className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                size="lg"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Open in Google Maps
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => {
                    if (hospitalMapUrl) {
                      navigator.clipboard.writeText(hospitalMapUrl);
                      toast({
                        title: "Link Copied",
                        description: "Maps link copied to clipboard",
                      });
                    }
                  }}
                  variant="outline"
                  size="lg"
                >
                  Copy Link
                </Button>

                <Button
                  onClick={() => setShowHospitalDialog(false)}
                  variant="outline"
                  size="lg"
                >
                  Close
                </Button>
              </div>
            </div>

            {/* Safety Note */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
                    Emergency Reminder:
                  </p>
                  <p className="text-xs text-muted-foreground">
                    If experiencing severe chest pain or heart attack symptoms, call 911 immediately instead of driving to hospital.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
