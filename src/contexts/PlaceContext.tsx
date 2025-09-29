import React, { createContext, useContext, useState } from 'react';

interface PlaceContextType {
  selectedPlace: any;
  setSelectedPlace: (place: any) => void;
}

const PlaceContext = createContext<PlaceContextType | undefined>(undefined);

export const PlaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedPlace, setSelectedPlace] = useState<any>(null);

  return (
    <PlaceContext.Provider value={{ selectedPlace, setSelectedPlace }}>
      {children}
    </PlaceContext.Provider>
  );
};

export const usePlace = () => {
  const context = useContext(PlaceContext);
  if (context === undefined) {
    throw new Error('usePlace must be used within a PlaceProvider');
  }
  return context;
};
