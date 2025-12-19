import React, { useEffect, useState } from 'react';
import { Store, Coordinates } from '../types';
import { fetchNearbyStores } from '../services/geminiService';
import { MapPin, Star, ChevronRight, Utensils, Clock, Megaphone } from 'lucide-react';

interface NearbyListProps {
  onViewAll: () => void;
  onStoreSelect: (storeId: string) => void;
}

const PROMOTED_STORE: Store = {
    id: "promoted-1",
    name: "Urban Taco Grill",
    address: "240 West St",
    distance: "0.2 mi",
    rating: 4.6,
    imageUrl: "https://picsum.photos/seed/taco/200/200",
    description: "Authentic street tacos and craft margaritas. Try our new spicy shrimp taco!",
    isPromoted: true
};

const NearbyList: React.FC<NearbyListProps> = ({ onViewAll, onStoreSelect }) => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
          setPermissionDenied(true);
          setCoords({ latitude: 40.7580, longitude: -73.9855 }); 
        }
      );
    } else {
        setPermissionDenied(true);
        setCoords({ latitude: 40.7580, longitude: -73.9855 });
    }
  }, []);

  useEffect(() => {
    if (coords) {
      setLoading(true);
      fetchNearbyStores(coords)
        .then(data => {
            const storesWithAd = [...data];
            if (storesWithAd.length >= 2) {
                storesWithAd.splice(1, 0, PROMOTED_STORE);
            } else {
                storesWithAd.push(PROMOTED_STORE);
            }
            setStores(storesWithAd);
            setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [coords]);

  if (loading) {
    return (
      <div className="flex flex-col h-full px-5 pt-2 pb-10">
        <div className="flex justify-between items-center mb-6 mt-1 px-1">
            <div className="h-7 w-32 bg-gray-100 rounded-lg animate-pulse"></div>
        </div>
        <div className="space-y-6">
            {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-28 h-28 bg-gray-100 rounded-2xl shrink-0"></div>
                <div className="flex-1 space-y-3 py-1">
                <div className="h-5 bg-gray-100 rounded-md w-3/4"></div>
                <div className="h-3 bg-gray-100 rounded-md w-1/2"></div>
                <div className="h-3 bg-gray-100 rounded-md w-1/3"></div>
                </div>
            </div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Pull Handle */}
      <div className="flex justify-center py-2 mb-2">
         <div className="w-10 h-1.5 bg-gray-200 rounded-full" />
      </div>

      <div className="flex items-center justify-between px-6 pb-4 shrink-0">
        <h2 className="text-xl font-black text-gray-900 tracking-tight">Best Nearby</h2>
        <button 
            onClick={onViewAll} 
            className="text-xs font-bold text-orange-600 uppercase tracking-widest px-4 py-2 bg-orange-50 rounded-full active:bg-orange-100 transition-colors border border-orange-100/50"
        >
            View All
        </button>
      </div>

      <div className="flex-1 px-5 pb-32 space-y-6 pt-2">
        {permissionDenied && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3 mb-2">
                <div className="p-2 bg-white rounded-full text-amber-600 shrink-0 shadow-sm">
                   <MapPin className="w-4 h-4" />
                </div>
                <div>
                   <p className="text-sm font-bold text-gray-900">Location Access Limited</p>
                   <p className="text-xs text-amber-700 mt-0.5">Showing curated spots in New York City.</p>
                </div>
            </div>
        )}
        
        {stores.map((store) => (
          <button 
            key={store.id} 
            onClick={() => onStoreSelect(store.id)}
            className={`w-full text-left group flex items-start gap-5 p-4 rounded-[1.75rem] shadow-sm border active:scale-[0.98] transition-all duration-300 hover:shadow-md ${store.isPromoted ? 'bg-orange-50/40 border-orange-100/50' : 'bg-white border-gray-100'}`}
          >
            {/* Image Container */}
            <div className="relative w-28 h-28 shrink-0 overflow-hidden rounded-[1.25rem] bg-gray-100 shadow-inner">
                {store.imageUrl ? (
                    <img src={store.imageUrl} alt={store.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Utensils className="w-8 h-8" />
                    </div>
                )}
                
                {store.rating && (
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-lg flex items-center shadow-sm border border-black/5">
                        <span className="text-[11px] font-black text-gray-900">{store.rating}</span>
                        <Star className="w-2.5 h-2.5 text-orange-500 fill-orange-500 ml-1" />
                    </div>
                )}

                {store.isPromoted && (
                    <div className="absolute bottom-0 left-0 right-0 bg-orange-500/80 backdrop-blur-md py-1 flex justify-center">
                         <span className="text-[9px] font-black text-white uppercase tracking-widest">Sponsored</span>
                    </div>
                )}
            </div>
            
            {/* Details */}
            <div className="flex-1 min-w-0 py-0.5 flex flex-col h-28 justify-between">
                <div>
                    <div className="flex justify-between items-start gap-2">
                       <h3 className="font-bold text-gray-900 text-lg truncate leading-tight tracking-tight">{store.name}</h3>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                       {store.isPromoted ? (
                           <span className="text-orange-600 bg-orange-100/50 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border border-orange-200/50">Promoted</span>
                       ) : (
                           <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border border-emerald-100">Popular</span>
                       )}
                       <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                       <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Italian</span>
                       <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                       <span className="text-[11px] font-bold text-gray-400">$$$</span>
                    </div>

                    <p className="text-xs text-gray-400 line-clamp-2 mt-2 leading-relaxed font-medium">
                        {store.description || "Fresh local ingredients and signature recipes served in a vibrant atmosphere."}
                    </p>
                </div>
                
                <div className="flex items-center gap-4 mt-auto">
                    <div className="flex items-center text-gray-500 text-[10px] font-black uppercase tracking-wide">
                        <Clock className="w-3.5 h-3.5 mr-1 text-orange-400" />
                        <span>15-20 min</span>
                    </div>
                    <div className="flex items-center text-gray-500 text-[10px] font-black uppercase tracking-wide">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-gray-300" />
                        <span>{store.distance}</span>
                    </div>
                </div>
            </div>
            
            <div className="self-center text-gray-200 group-hover:text-orange-500 transition-colors">
                 <ChevronRight className="w-6 h-6" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default NearbyList;