import React, { useEffect, useState } from 'react';
import { Store, Coordinates } from '../types';
import { fetchNearbyStores } from '../services/geminiService';
import { MapPin, Star, ChevronRight, Utensils, Clock } from 'lucide-react';

interface NearbyListProps {
  onViewAll: () => void;
  onStoreSelect: (storeId: string) => void;
}

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
            setStores(data);
            setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [coords]);

  if (loading) {
    return (
      <div className="flex flex-col h-full px-5 pt-2">
        <div className="flex justify-between items-center mb-6 mt-1">
            <div className="h-7 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
        <div className="space-y-6">
            {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-24 h-24 bg-gray-200 rounded-2xl shrink-0"></div>
                <div className="flex-1 space-y-3 py-1">
                <div className="h-5 bg-gray-200 rounded-md w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded-md w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded-md w-1/3"></div>
                </div>
            </div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pb-2 shrink-0">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Best Nearby</h2>
        <button 
            onClick={onViewAll} 
            className="text-xs font-bold text-orange-600 uppercase tracking-wide px-3 py-1.5 bg-orange-50 rounded-full active:bg-orange-100 transition-colors"
        >
            View All
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-5 pb-24 space-y-5 no-scrollbar overscroll-contain pt-2">
        {permissionDenied && (
            <div className="p-4 bg-white shadow-sm rounded-2xl border border-gray-100 flex items-start gap-3">
                <div className="p-2 bg-amber-50 rounded-full text-amber-600 shrink-0">
                   <MapPin className="w-4 h-4" />
                </div>
                <div>
                   <p className="text-sm font-semibold text-gray-900">Location Disabled</p>
                   <p className="text-xs text-gray-500 mt-0.5">Showing demo restaurants in New York.</p>
                </div>
            </div>
        )}
        
        {stores.map((store) => (
          <button 
            key={store.id} 
            onClick={() => onStoreSelect(store.id)}
            className="w-full text-left group flex items-start gap-4 p-3 pr-2 bg-white rounded-[1.5rem] shadow-[0_4px_20px_-8px_rgba(0,0,0,0.05)] border border-white active:scale-[0.98] transition-all duration-300 hover:shadow-lg"
          >
            {/* Image */}
            <div className="relative w-28 h-28 shrink-0 overflow-hidden rounded-2xl bg-gray-100 shadow-inner">
                {store.imageUrl ? (
                    <img src={store.imageUrl} alt={store.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Utensils className="w-8 h-8" />
                    </div>
                )}
                
                {/* Rating Badge */}
                {store.rating && (
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg flex items-center shadow-sm">
                        <span className="text-xs font-bold text-gray-900">{store.rating}</span>
                        <Star className="w-2.5 h-2.5 text-orange-500 fill-orange-500 ml-1" />
                    </div>
                )}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0 py-1 flex flex-col h-28 justify-between">
                <div>
                    <div className="flex justify-between items-start gap-2">
                       <h3 className="font-bold text-gray-900 text-[17px] truncate leading-tight tracking-tight">{store.name}</h3>
                    </div>
                    
                    {/* Categories / Meta */}
                    <p className="text-xs font-medium text-gray-500 mt-1.5 flex items-center gap-1.5">
                       <span className="text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">New</span>
                       <span className="w-0.5 h-0.5 bg-gray-300 rounded-full"></span>
                       <span>Italian</span>
                       <span className="w-0.5 h-0.5 bg-gray-300 rounded-full"></span>
                       <span>$$$</span>
                    </p>

                    <p className="text-xs text-gray-400 line-clamp-2 mt-2 leading-relaxed">
                        {store.description || "A wonderful place to dine with fresh ingredients and lovely atmosphere."}
                    </p>
                </div>
                
                <div className="flex items-center gap-3 mt-auto">
                    <div className="flex items-center text-gray-500 text-xs font-medium">
                        <Clock className="w-3 h-3 mr-1 text-gray-400" />
                        <span>15-20 min</span>
                    </div>
                    <div className="flex items-center text-gray-500 text-xs font-medium">
                        <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                        <span>{store.distance}</span>
                    </div>
                </div>
            </div>
            
            <div className="self-center pr-1 text-gray-300">
                 <ChevronRight className="w-5 h-5" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default NearbyList;