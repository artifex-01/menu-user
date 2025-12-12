import React, { useState, useCallback, useMemo } from 'react';
import QRScanner from './components/QRScanner';
import NearbyList from './components/NearbyList';
import { 
  Search, ArrowLeft, SlidersHorizontal, Plus, ShoppingBag, 
  Minus, Trash2, CreditCard, Star, X
} from 'lucide-react';

// Mock Screens/Activities
enum Activity {
  HOME,
  MENU,
  NEARBY_LIST,
  CART
}

// Mock Data for Menu
const CATEGORIES = ['Popular', 'Starters', 'Mains', 'Desserts', 'Drinks'];

const MOCK_MENU_ITEMS = [
  { id: 101, name: "Truffle Pasta", description: "Fresh tagliatelle served with a rich black truffle cream sauce and aged parmesan.", price: "$24.00", category: "Mains", image: "https://picsum.photos/seed/truffle/200/200", isPopular: true },
  { id: 102, name: "Burrata Salad", description: "Creamy burrata with heirloom tomatoes, basil pesto, and balsamic glaze.", price: "$18.00", category: "Starters", image: "https://picsum.photos/seed/burrata/200/200", isPopular: true },
  { id: 103, name: "Wagyu Burger", description: "Double patty smash burger with cheddar, caramelized onions, and secret sauce.", price: "$22.00", category: "Mains", image: "https://picsum.photos/seed/burger/200/200", isPopular: true },
  { id: 104, name: "Tiramisu", description: "Classic Italian dessert with espresso-soaked ladyfingers and mascarpone cream.", price: "$12.00", category: "Desserts", image: "https://picsum.photos/seed/tira/200/200", isPopular: false },
  { id: 105, name: "Negroni Sbagliato", description: "Campari, Sweet Vermouth, and Prosecco.", price: "$14.00", category: "Drinks", image: "https://picsum.photos/seed/drink/200/200", isPopular: false },
  { id: 106, name: "Calamari Fritti", description: "Crispy fried squid served with a spicy marinara dipping sauce.", price: "$16.00", category: "Starters", image: "https://picsum.photos/seed/calamari/200/200", isPopular: false },
  { id: 107, name: "Margherita Pizza", description: "San Marzano tomato sauce, fresh mozzarella di bufala, and basil.", price: "$20.00", category: "Mains", image: "https://picsum.photos/seed/pizza/200/200", isPopular: false },
  { id: 108, name: "Espresso Martini", description: "Vodka, coffee liqueur, and fresh espresso.", price: "$15.00", category: "Drinks", image: "https://picsum.photos/seed/martini/200/200", isPopular: true },
];

const App: React.FC = () => {
  const [currentActivity, setCurrentActivity] = useState<Activity>(Activity.HOME);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  
  // Rating State
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState(0);

  // Menu State
  const [selectedCategory, setSelectedCategory] = useState<string>("Popular");
  
  // Cart State
  const [cart, setCart] = useState<{ item: typeof MOCK_MENU_ITEMS[0]; quantity: number }[]>([]);

  // Filter Menu Items
  const filteredItems = useMemo(() => {
    if (selectedCategory === "Popular") {
      return MOCK_MENU_ITEMS.filter(item => item.isPopular);
    }
    return MOCK_MENU_ITEMS.filter(item => item.category === selectedCategory);
  }, [selectedCategory]);

  // Cart Logic
  const handleAddToCart = (item: typeof MOCK_MENU_ITEMS[0]) => {
    if (navigator.vibrate) navigator.vibrate(20);
    setCart(prev => {
      const existing = prev.find(i => i.item.id === item.id);
      if (existing) {
        return prev.map(i => i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (itemId: number, change: number) => {
      if (navigator.vibrate) navigator.vibrate(10);
      setCart(prev => {
          return prev.map(item => {
              if (item.item.id === itemId) {
                  return { ...item, quantity: Math.max(0, item.quantity + change) };
              }
              return item;
          }).filter(item => item.quantity > 0);
      });
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, current) => {
        return sum + (parseFloat(current.item.price.replace('$', '')) * current.quantity);
    }, 0);
  }, [cart]);
  
  const cartItemCount = cart.reduce((acc, curr) => acc + curr.quantity, 0);

  // Handlers
  const handleScan = useCallback((data: string) => {
    if (scanResult === data) return;
    
    // Haptic feedback if available
    if (navigator.vibrate) navigator.vibrate(50);

    setScanResult(data);
    const storeId = data.includes(':') ? data.split(':')[1] : 'unknown-store';
    
    setTimeout(() => {
        setSelectedStoreId(storeId);
        setCurrentActivity(Activity.MENU);
        setScanResult(null);
    }, 400);
  }, [scanResult]);

  const handleStoreSelect = (storeId: string) => {
    setSelectedStoreId(storeId);
    setCurrentActivity(Activity.MENU);
  };

  const goBack = () => {
    if (currentActivity === Activity.CART) {
        setCurrentActivity(Activity.MENU);
    } else {
        setCurrentActivity(Activity.HOME);
        setSelectedStoreId(null);
        setSelectedCategory("Popular"); // Reset category
    }
  };
  
  const handleSubmitRating = () => {
      // Logic to process rating
      setShowRatingModal(false);
      alert(`Thank you for rating us ${userRating} stars!`);
      // Reset after a moment if desired, or keep logic simple
      setTimeout(() => setUserRating(0), 500);
  };

  // --- RENDERERS ---

  if (currentActivity === Activity.CART) {
    return (
        <div className="h-full w-full bg-gray-50 flex flex-col animate-in slide-in-from-right duration-300 relative">
            {/* Header */}
            <header className="bg-white px-6 py-4 pt-safe-top flex items-center justify-between shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] z-10 sticky top-0">
                <button onClick={() => setCurrentActivity(Activity.MENU)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95">
                    <ArrowLeft className="w-6 h-6 text-gray-900" />
                </button>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">My Order</h1>
                <div className="w-10"></div> 
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar pb-32">
                {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[60%] text-gray-400">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                           <ShoppingBag className="w-10 h-10 opacity-30" />
                        </div>
                        <p className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</p>
                        <p className="text-sm text-gray-500 mb-8 max-w-[200px] text-center">Looks like you haven't added anything to your order yet.</p>
                        <button 
                            onClick={() => setCurrentActivity(Activity.MENU)} 
                            className="text-orange-600 font-bold px-8 py-3 bg-orange-50 rounded-full active:scale-95 transition-transform"
                        >
                            Browse Menu
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4">
                            {cart.map(({ item, quantity }) => (
                                <div key={item.id} className="flex gap-4 bg-white p-4 rounded-[1.5rem] shadow-sm border border-gray-100">
                                    <img src={item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover bg-gray-100 shrink-0" />
                                    <div className="flex-1 flex flex-col justify-between min-w-0">
                                        <div>
                                            <div className="flex justify-between items-start gap-2">
                                                <h3 className="font-bold text-gray-900 leading-tight truncate">{item.name}</h3>
                                                <p className="font-bold text-gray-900 text-sm">{item.price}</p>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">{item.category}</p>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 mt-2 self-start bg-gray-50 rounded-full p-1 border border-gray-100">
                                            <button 
                                                onClick={() => handleUpdateQuantity(item.id, -1)} 
                                                className="w-7 h-7 flex items-center justify-center bg-white rounded-full shadow-sm text-gray-600 active:scale-90 transition-transform"
                                            >
                                                {quantity === 1 ? <Trash2 className="w-3.5 h-3.5 text-red-500" /> : <Minus className="w-3.5 h-3.5" />}
                                            </button>
                                            <span className="text-sm font-bold w-5 text-center text-gray-900">{quantity}</span>
                                            <button 
                                                onClick={() => handleUpdateQuantity(item.id, 1)} 
                                                className="w-7 h-7 flex items-center justify-center bg-white rounded-full shadow-sm text-gray-900 active:scale-90 transition-transform"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary */}
                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-3.5">
                            <h3 className="font-bold text-gray-900 mb-3 text-lg">Order Summary</h3>
                            <div className="flex justify-between text-gray-500 text-sm font-medium">
                                <span>Subtotal</span>
                                <span className="text-gray-900">${cartTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-500 text-sm font-medium">
                                <span>Service Fee (5%)</span>
                                <span className="text-gray-900">${(cartTotal * 0.05).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-500 text-sm font-medium">
                                <span>Tax (8%)</span>
                                <span className="text-gray-900">${(cartTotal * 0.08).toFixed(2)}</span>
                            </div>
                            <div className="border-t border-dashed border-gray-200 pt-4 mt-2 flex justify-between items-center">
                                <span className="font-extrabold text-gray-900 text-lg">Total</span>
                                <span className="font-extrabold text-gray-900 text-2xl">${(cartTotal * 1.13).toFixed(2)}</span>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-white p-6 pb-10 border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] rounded-t-[2rem] z-20">
                    <button 
                        onClick={() => setShowRatingModal(true)}
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-orange-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                    >
                        <Star className="w-5 h-5 fill-white/20" />
                        <span>Give Rating</span>
                        <ArrowLeft className="w-5 h-5 rotate-180 opacity-90" />
                    </button>
                </div>
            )}
            
            {/* Rating Modal */}
            {showRatingModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
                        onClick={() => setShowRatingModal(false)}
                    />
                    
                    {/* Modal Content */}
                    <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <button 
                            onClick={() => setShowRatingModal(false)}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="text-center mb-8 mt-2">
                            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Rate your experience</h3>
                            <p className="text-gray-500 text-sm mt-2">How was your meal at The Golden Spoon?</p>
                        </div>
                        
                        <div className="flex justify-center gap-3 mb-10">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setUserRating(star)}
                                    className="p-1 focus:outline-none transition-transform active:scale-95 group"
                                >
                                    <Star 
                                        className={`w-10 h-10 transition-colors duration-200 ${star <= userRating ? 'fill-orange-500 text-orange-500 drop-shadow-sm' : 'text-gray-200 fill-gray-50'}`} 
                                        strokeWidth={star <= userRating ? 0 : 1.5}
                                    />
                                </button>
                            ))}
                        </div>

                        <div className="space-y-3">
                            <button 
                                onClick={handleSubmitRating}
                                disabled={userRating === 0}
                                className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-lg ${userRating > 0 ? 'bg-orange-600 text-white shadow-orange-200 active:scale-[0.98]' : 'bg-gray-100 text-gray-400 shadow-none cursor-not-allowed'}`}
                            >
                                Submit Review
                            </button>
                            <button 
                                onClick={() => setShowRatingModal(false)}
                                className="w-full py-3 rounded-2xl font-bold text-gray-400 hover:text-gray-600 active:scale-[0.98] text-sm"
                            >
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
  }

  if (currentActivity === Activity.MENU) {
      return (
          <div className="h-full w-full bg-white flex flex-col animate-in slide-in-from-right duration-300 relative">
              {/* Hero Image Header */}
              <div className="h-64 w-full bg-gray-200 relative shrink-0">
                  <img 
                    src={`https://picsum.photos/seed/${selectedStoreId || 'hero'}/800/600`} 
                    alt="Restaurant Hero" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  
                  <button 
                    onClick={goBack} 
                    className="absolute top-0 left-0 m-4 mt-safe-top p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/20 transition-colors active:scale-95"
                  >
                      <ArrowLeft className="w-6 h-6" />
                  </button>

                  <div className="absolute bottom-0 left-0 p-6 w-full pb-8">
                      <h1 className="text-4xl font-bold text-white tracking-tight leading-none shadow-sm mb-2">The Golden Spoon</h1>
                      <div className="flex flex-wrap items-center gap-3">
                         <span className="bg-orange-500 text-white px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider">Open</span>
                         <span className="text-white/90 text-sm font-medium">• Italian Cuisine • 0.2 mi</span>
                      </div>
                  </div>
              </div>

              {/* Menu Content */}
              <div className="flex-1 bg-white relative -mt-6 rounded-t-[2rem] overflow-hidden flex flex-col shadow-[0_-5px_20px_rgba(0,0,0,0.15)] isolate">
                  
                  {/* Categories */}
                  <div className="pt-6 pb-2 pl-6 overflow-x-auto no-scrollbar mask-linear-gradient">
                      <div className="flex items-center gap-3 pr-6">
                        {CATEGORIES.map((cat) => (
                            <button 
                                key={cat} 
                                onClick={() => setSelectedCategory(cat)}
                                className={`
                                    px-6 py-2.5 rounded-full text-base font-bold whitespace-nowrap transition-all duration-300 border
                                    ${selectedCategory === cat 
                                        ? 'bg-gray-900 text-white border-gray-900 shadow-lg scale-[1.02]' 
                                        : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100'}
                                `}
                            >
                                {cat}
                            </button>
                        ))}
                      </div>
                  </div>

                  {/* Menu Items List */}
                  <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 no-scrollbar pb-32">
                      <div className="flex items-center justify-between mb-2">
                          <h2 className="text-xl font-bold text-gray-900">{selectedCategory}</h2>
                          <span className="text-sm text-gray-400 font-medium">{filteredItems.length} items</span>
                      </div>

                      {filteredItems.length === 0 ? (
                          <div className="py-10 text-center text-gray-400">
                              <p>No items in this category yet.</p>
                          </div>
                      ) : (
                          filteredItems.map((item) => (
                              <div key={item.id} className="flex gap-4 group">
                                  <div className="flex-1 py-1">
                                      <h3 className="font-bold text-gray-900 text-[17px] leading-tight">{item.name}</h3>
                                      <p className="text-gray-500 text-sm mt-1.5 leading-relaxed line-clamp-2">
                                          {item.description}
                                      </p>
                                      <div className="mt-3 flex items-center gap-3">
                                          <span className="font-bold text-gray-900 text-base">{item.price}</span>
                                      </div>
                                  </div>
                                  <div className="w-28 h-28 bg-gray-100 rounded-2xl overflow-hidden relative shrink-0 shadow-sm">
                                      <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                                      <button 
                                          onClick={() => handleAddToCart(item)}
                                          className="absolute bottom-2 right-2 w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center text-orange-600 active:scale-90 transition-transform hover:bg-gray-50 z-10"
                                      >
                                          <Plus className="w-5 h-5 stroke-[3]" />
                                      </button>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>

              {/* Floating Action Button for Cart */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 w-full px-6 max-w-[440px]">
                  <button 
                      onClick={() => setCurrentActivity(Activity.CART)}
                      className="w-full bg-gray-900 text-white p-4 rounded-full shadow-2xl flex items-center justify-between active:scale-[0.98] transition-transform"
                  >
                      <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-full relative">
                            <ShoppingBag className="w-5 h-5" />
                            {cartItemCount > 0 && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-gray-900 text-[9px] flex items-center justify-center font-bold">
                                    {cartItemCount}
                                </div>
                            )}
                        </div>
                        <span className="font-bold text-lg">View Order</span>
                      </div>
                      <span className="font-bold text-lg opacity-90">${cartTotal.toFixed(2)}</span>
                  </button>
              </div>
          </div>
      );
  }

  // --- NEARBY LIST ACTIVITY ---
  if (currentActivity === Activity.NEARBY_LIST) {
    return (
        <div className="h-full w-full bg-gray-50 flex flex-col animate-in slide-in-from-bottom duration-300 relative">
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200/50 px-4 py-3 pt-safe-top flex items-center gap-4 shadow-sm">
                <button 
                  onClick={() => setCurrentActivity(Activity.HOME)} 
                  className="p-2 -ml-2 hover:bg-gray-100 rounded-full active:scale-95 transition-all"
                >
                    <ArrowLeft className="w-6 h-6 text-gray-900" />
                </button>
                <h1 className="font-bold text-xl text-gray-900 tracking-tight">Discover Nearby</h1>
            </header>
            <div className="flex-1 overflow-hidden relative">
               <NearbyList onViewAll={() => {}} onStoreSelect={handleStoreSelect} />
            </div>
        </div>
    );
  }

  // --- HOME ACTIVITY (Hybrid Split Screen) ---
  return (
    <div className="relative h-full w-full flex flex-col bg-black overflow-hidden touch-none">
      
      {/* Search Bar Overlay - Premium Frosted Glass */}
      <div className="absolute top-0 left-0 right-0 z-30 px-5 pt-safe-top mt-4 pointer-events-none">
         <div className="pointer-events-auto bg-white/10 backdrop-blur-xl shadow-lg rounded-full flex items-center px-2 py-2 border border-white/20 transition-all active:scale-[0.99]">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
                 <Search className="w-5 h-5 text-orange-500" />
            </div>
            <input 
                type="text" 
                placeholder="Find a restaurant..." 
                className="bg-transparent border-none outline-none text-white placeholder-white/70 flex-1 px-3 text-base font-medium"
            />
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors">
                <SlidersHorizontal className="w-5 h-5" />
            </button>
         </div>
      </div>

      {/* Upper Half: Camera */}
      {/* Expanded slightly to 58% for better view */}
      <div className="h-[58%] relative w-full bg-zinc-900 shrink-0">
         <QRScanner 
            onScan={handleScan} 
            isScanning={currentActivity === Activity.HOME} 
         />
         
         {/* Smooth gradient blend */}
         <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none z-10"></div>
         
         {/* Connection Curve */}
         <div className="absolute bottom-0 left-0 right-0 h-10 bg-gray-50 rounded-t-[2.5rem] z-20 shadow-[0_-10px_50px_rgba(0,0,0,0.5)]"></div>
      </div>

      {/* Lower Half: Nearby List */}
      <div className="flex-1 bg-gray-50 relative -mt-8 z-20 rounded-t-[2.5rem] overflow-hidden flex flex-col isolate">
          {/* Pull Handle Area */}
          <div className="w-full flex justify-center pt-3 pb-2">
             <div className="w-10 h-1 bg-gray-300/80 rounded-full" />
          </div>
          
          <div className="flex-1 overflow-hidden relative">
             <NearbyList 
                onViewAll={() => setCurrentActivity(Activity.NEARBY_LIST)} 
                onStoreSelect={handleStoreSelect} 
             />
          </div>
      </div>
    </div>
  );
};

export default App;