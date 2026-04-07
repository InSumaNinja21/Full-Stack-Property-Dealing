const Property = require("../models/Property");
const axios = require("axios");

// Simple keyword detection for property-related queries
function isPropertySearchQuery(message) {
  const propertyKeywords = [
    "property", "properties", "house", "home", "apartment", "flat",
    "rent", "buy", "sell", "price", "location", "area", "search",
    "find", "looking for", "available", "listing", "real estate"
  ];
  
  const lowerMessage = message.toLowerCase();
  return propertyKeywords.some(keyword => lowerMessage.includes(keyword));
}

// Extract search parameters from message
function extractSearchParams(message) {
  const params = {};
  const lowerMessage = message.toLowerCase();
  
  // Extract location - more precise matching
  const locationPatterns = [
    /(?:properties|houses|homes|apartments|flats)\s+(?:in|at)\s+([a-zA-Z\s]+)/i,
    /(?:in|at)\s+([a-zA-Z\s]+)(?:\s+(?:area|location|city))/i,
    /([a-zA-Z\s]+)(?:\s+area|location|city)/i,
    /show\s+me\s+(?:properties|houses|homes|apartments|flats)\s+(?:in|at)\s+([a-zA-Z\s]+)/i,
    /find\s+(?:properties|houses|homes|apartments|flats)\s+(?:in|at)\s+([a-zA-Z\s]+)/i,
    /looking\s+for\s+(?:properties|houses|homes|apartments|flats)\s+(?:in|at)\s+([a-zA-Z\s]+)/i
  ];
  
  for (const pattern of locationPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      let location = match[1].trim();
      // Clean up common words from location
      location = location.replace(/\b(the|and|or|with|for|of|in|at|area|location|city)\b/gi, '').trim();
      if (location.length > 0) {
        params.location = location;
        break;
      }
    }
  }
  
  // Extract price range
  const priceMatch = message.match(/(\d+(?:,\d+)*)\s*(?:to|-)\s*(\d+(?:,\d+)*)/i);
  if (priceMatch) {
    params.minPrice = priceMatch[1].replace(/,/g, '');
    params.maxPrice = priceMatch[2].replace(/,/g, '');
  } else {
    const maxPriceMatch = message.match(/(?:under|below|less than)\s+(\d+(?:,\d+)*)/i);
    if (maxPriceMatch) {
      params.maxPrice = maxPriceMatch[1].replace(/,/g, '');
    }
    
    const minPriceMatch = message.match(/(?:over|above|more than)\s+(\d+(?:,\d+)*)/i);
    if (minPriceMatch) {
      params.minPrice = minPriceMatch[1].replace(/,/g, '');
    }
  }
  
  return params;
}

// Format property results for chat
function formatPropertyResults(properties) {
  if (properties.length === 0) {
    return "I couldn't find any properties matching your criteria. Try adjusting your search terms.";
  }
  
  let response = `I found ${properties.length} propert${properties.length === 1 ? 'y' : 'ies'} matching your search:\n\n`;
  
  properties.slice(0, 5).forEach((property, index) => {
    response += `${index + 1}. **${property.title}**\n`;
    response += `   📍 ${property.location}\n`;
    response += `   💰 ₹${property.price?.toLocaleString('en-IN') || 'Price not specified'}\n`;
    if (property.description) {
      response += `   📝 ${property.description.substring(0, 100)}...\n`;
    }
    response += `\n`;
  });
  
  if (properties.length > 5) {
    response += `...and ${properties.length - 5} more properties. Visit the website to see all results.`;
  }
  
  return response;
}

// Simple AI response for non-property queries
function getGeneralAIResponse(message) {
  const responses = [
    "I'm here to help you with property searches and real estate questions. Try asking about properties in a specific location or price range!",
    "I can help you find properties, but for general questions, I'm still learning. How about searching for a property?",
    "I specialize in helping you find real estate. Try asking something like 'show me properties under 50 lakhs' or 'find homes in Mumbai'.",
    "I'm your property assistant! Ask me about houses, apartments, or real estate in any location you're interested in."
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

exports.chat = async (req, res) => {
  try {
    console.log("Chat request received:", req.body);
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    
    // Check if it's a property-related query
    if (isPropertySearchQuery(message)) {
      console.log("Property search query detected");
      const searchParams = extractSearchParams(message);
      console.log("Extracted search params:", searchParams);
      
      // Build MongoDB query
      const query = {};
      if (searchParams.location) {
        // More precise location matching - exact word boundary
        const locationRegex = new RegExp(`\\b${searchParams.location}\\b`, 'i');
        query.location = locationRegex;
      }
      if (searchParams.minPrice || searchParams.maxPrice) {
        query.price = {};
        if (searchParams.minPrice) query.price.$gte = Number(searchParams.minPrice);
        if (searchParams.maxPrice) query.price.$lte = Number(searchParams.maxPrice);
      }
      
      console.log("MongoDB query:", query);
      
      // Search properties
      const properties = await Property.find(query).limit(10);
      console.log("Found properties:", properties.length);
      
      const response = formatPropertyResults(properties);
      
      return res.json({ response, type: "property_search" });
    } else {
      // For non-property queries, return a simple response
      // In a real implementation, you would call an AI API here
      console.log("General query detected");
      const response = getGeneralAIResponse(message);
      return res.json({ response, type: "general" });
    }
    
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
