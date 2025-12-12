import { GoogleGenAI } from "@google/genai";
import { Store, Coordinates } from "../types";

const parseGeminiResponseToStores = (groundingChunks: any[]): Store[] => {
  if (!groundingChunks || groundingChunks.length === 0) return [];

  // Extract places from Google Maps grounding chunks
  const stores: Store[] = [];
  
  groundingChunks.forEach((chunk, index) => {
    if (chunk.web?.uri) {
        // Handle web chunks if necessary, but we prioritize maps
    }
    
    // Note: The structure of grounding chunks can vary. 
    // We look for specific map data if available in the chunk structure provided by the Live API docs/examples
    // For this implementation, we will try to extract relevant info from the available data structure.
    // As per standard grounding response, we might get a list of sources.
    
    // Since the actual grounding chunk structure for maps can be complex, 
    // we will simulate extraction based on the guideline's description:
    // "groundingChunks.maps.uri" and "groundingChunks.maps.placeAnswerSources.reviewSnippets"
    
    if (chunk.maps) {
        const title = chunk.maps.title || `Nearby Place ${index + 1}`;
        const address = chunk.maps.address || "Address not available"; // Simplification
        const uri = chunk.maps.uri;
        
        stores.push({
            id: `gemini-place-${index}`,
            name: title,
            address: address, // This might need refinement based on actual API return
            distance: "0.5 mi", // Placeholder as distance calculation requires user lat/long vs place lat/long
            rating: 4.5,
            description: "Found via Google Maps Grounding",
            imageUrl: `https://picsum.photos/seed/${index}/200/200`
        });
    }
  });

  return stores;
};

// Fallback mock data if API fails or no key
const MOCK_STORES: Store[] = [
  {
    id: "1",
    name: "The Golden Spoon",
    address: "123 Main St, New York",
    distance: "0.1 mi",
    rating: 4.8,
    description: "Authentic Italian cuisine with a modern twist.",
    imageUrl: "https://picsum.photos/seed/spoon/200/200"
  },
  {
    id: "2",
    name: "Burger & Brew",
    address: "456 Market Ave, New York",
    distance: "0.3 mi",
    rating: 4.5,
    description: "Craft burgers and local beers.",
    imageUrl: "https://picsum.photos/seed/burger/200/200"
  },
  {
    id: "3",
    name: "Sushi Zen",
    address: "789 Broadway, New York",
    distance: "0.4 mi",
    rating: 4.7,
    description: "Fresh sushi and japanese tapas.",
    imageUrl: "https://picsum.photos/seed/sushi/200/200"
  },
  {
    id: "4",
    name: "Morning Glory Cafe",
    address: "101 1st Ave, New York",
    distance: "0.6 mi",
    rating: 4.2,
    description: "Best brunch in town.",
    imageUrl: "https://picsum.photos/seed/cafe/200/200"
  }
];

export const fetchNearbyStores = async (coords: Coordinates): Promise<Store[]> => {
  if (!process.env.API_KEY) {
    console.warn("No API_KEY found, returning mock data.");
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    return MOCK_STORES;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // We use Gemini to get real places using Google Maps Grounding
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find 5 popular restaurants near latitude ${coords.latitude}, longitude ${coords.longitude}. Return a list.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
            retrievalConfig: {
                latLng: {
                    latitude: coords.latitude,
                    longitude: coords.longitude
                }
            }
        }
      },
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (groundingChunks) {
       // Map the grounding chunks to our Store interface
       // Note: In a real prod environment, we would do more robust parsing of the text 
       // to associate the specific chunk with the description.
       // Here we map directly if chunks exist.
       const stores = groundingChunks.map((chunk: any, i: number) => {
         // Determine if it is a map chunk
         if (chunk.maps) {
             return {
                 id: `gemini-${i}`,
                 name: chunk.maps.title,
                 address: "See details in Maps", // The address isn't always directly top-level in simple chunks
                 distance: "Nearby", // Grounding doesn't always return distance directly relative to user
                 rating: 4.5,
                 imageUrl: `https://picsum.photos/seed/${chunk.maps.resourceId || i}/200/200`,
                 description: "Identified via Google Maps"
             } as Store;
         }
         return null;
       }).filter((s): s is Store => s !== null);

       if (stores.length > 0) return stores;
    }

    // If grounding didn't give us structured map chunks we can use, fallback to mock 
    // (or if the model just returned text without chunks).
    return MOCK_STORES;

  } catch (error) {
    console.error("Error fetching stores from Gemini:", error);
    return MOCK_STORES;
  }
};
