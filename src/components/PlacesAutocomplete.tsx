import { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { MapPin, X } from 'lucide-react';

const API_KEY = (import.meta as { env: Record<string, string> }).env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

export type PlaceResult = {
  displayText: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  placeId: string;
};

type Props = {
  value: string;
  onSelect: (place: PlaceResult) => void;
  onClear: () => void;
  placeholder?: string;
  required?: boolean;
};

let initDone = false;

function initMaps() {
  if (initDone || !API_KEY) return;
  setOptions({ key: API_KEY, v: 'weekly', language: 'iw', region: 'IL' });
  initDone = true;
}

export default function PlacesAutocomplete({ value, onSelect, onClear, placeholder, required }: Props) {
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const serviceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const detailsServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const dummyDivRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync external value changes (e.g., clear)
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Load Google Maps API
  useEffect(() => {
    if (!API_KEY) return;
    initMaps();
    importLibrary('places')
      .then(() => {
        serviceRef.current = new google.maps.places.AutocompleteService();
        setLoaded(true);
      })
      .catch(() => setLoadError('שגיאה בטעינת Google Maps'));
  }, []);

  // Init PlacesService (needs a DOM element)
  useEffect(() => {
    if (loaded && dummyDivRef.current && !detailsServiceRef.current) {
      detailsServiceRef.current = new google.maps.places.PlacesService(dummyDivRef.current);
    }
  }, [loaded]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleInputChange(text: string) {
    setInputValue(text);
    if (!text.trim()) {
      setPredictions([]);
      setOpen(false);
      return;
    }
    if (!loaded || !serviceRef.current) return;

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      serviceRef.current!.getPlacePredictions(
        { input: text, componentRestrictions: { country: 'il' } },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            setPredictions(results);
            setOpen(true);
          } else {
            setPredictions([]);
            setOpen(false);
          }
        },
      );
    }, 300);
  }

  function handleSelect(prediction: google.maps.places.AutocompletePrediction) {
    if (!detailsServiceRef.current) return;
    setInputValue(prediction.description);
    setOpen(false);
    setPredictions([]);

    detailsServiceRef.current.getDetails(
      { placeId: prediction.place_id, fields: ['formatted_address', 'geometry', 'address_components'] },
      (result, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !result?.geometry?.location) return;

        const lat = result.geometry.location.lat();
        const lng = result.geometry.location.lng();
        const cityComp = result.address_components?.find(
          (c) => c.types.includes('locality') || c.types.includes('administrative_area_level_2'),
        );
        const city = cityComp?.long_name ?? '';

        onSelect({
          displayText: prediction.description,
          address: result.formatted_address ?? prediction.description,
          city,
          latitude: lat,
          longitude: lng,
          placeId: prediction.place_id,
        });
      },
    );
  }

  // Fallback if no API key configured
  if (!API_KEY) {
    return (
      <div>
        <div className="relative">
          <MapPin size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={value}
            onChange={(e) =>
              onSelect({ displayText: e.target.value, address: e.target.value, city: '', latitude: 0, longitude: 0, placeId: '' })
            }
            placeholder={placeholder}
            required={required}
            className="w-full ps-9 pe-3 border border-amber-200 rounded-xl py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-amber-50"
          />
        </div>
        <p className="text-xs text-amber-600 mt-1">
          ⚠ הוסף <code className="bg-amber-100 px-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> ל-.env.local להפעלת חיפוש מיקום חכם
        </p>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div ref={dummyDivRef} className="hidden" />
      <div className="relative">
        <MapPin size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          className="w-full ps-9 pe-8 border border-gray-200 rounded-xl py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent"
        />
        {inputValue && (
          <button
            type="button"
            onClick={() => {
              setInputValue('');
              setPredictions([]);
              setOpen(false);
              onClear();
            }}
            className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {loadError && <p className="text-xs text-red-500 mt-1">{loadError}</p>}

      {open && predictions.length > 0 && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {predictions.map((pred) => (
            <li
              key={pred.place_id}
              onMouseDown={() => handleSelect(pred)}
              className="flex items-start gap-3 px-4 py-3 hover:bg-primary-50 cursor-pointer border-b border-gray-50 last:border-0 first:rounded-t-xl last:rounded-b-xl"
            >
              <MapPin size={13} className="text-gray-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-gray-800 font-medium truncate">{pred.structured_formatting.main_text}</p>
                <p className="text-xs text-gray-400 truncate">{pred.structured_formatting.secondary_text}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
