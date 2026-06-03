import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { formatINR } from "@/lib/format";
/// <reference types="google.maps" />

type Listing = {
  id: string;
  slug: string;
  business_name: string;
  tagline: string | null;
  city: string | null;
  cover_url: string | null;
  categories: string[];
  min_price_inr: number | null;
  places_rating: number | null;
  places_review_count: number | null;
  lat: number | null;
  lng: number | null;
};

declare global {
  interface Window {
    google?: typeof google;
    __gmapsReady?: Promise<void>;
    __gmapsInit?: () => void;
  }
}

function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps) return Promise.resolve();
  if (window.__gmapsReady) return window.__gmapsReady;

  window.__gmapsReady = new Promise<void>((resolve, reject) => {
    window.__gmapsInit = () => resolve();
    const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
    const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;
    if (!key) {
      reject(new Error("Missing Google Maps browser key"));
      return;
    }
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__gmapsInit${channel ? `&channel=${channel}` : ""}`;
    s.async = true;
    s.defer = true;
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });
  return window.__gmapsReady;
}

export function MarketplaceMap({
  listings,
  center,
  radiusKm,
  onSelect,
  selectedId,
}: {
  listings: Listing[];
  center: { lat: number; lng: number } | null;
  radiusKm?: number;
  onSelect: (l: Listing) => void;
  selectedId: string | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const circleRef = useRef<google.maps.Circle | null>(null);
  const centerMarkerRef = useRef<google.maps.Marker | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Init once
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !ref.current || mapRef.current) return;
        const fallback = { lat: 20.5937, lng: 78.9629 }; // India centroid
        mapRef.current = new google.maps.Map(ref.current, {
          center: center ?? fallback,
          zoom: center ? 11 : 5,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            { elementType: "geometry", stylers: [{ color: "#0f0f10" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#0f0f10" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#1f2024" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#0b1220" }] },
            { featureType: "poi", stylers: [{ visibility: "off" }] },
            { featureType: "transit", stylers: [{ visibility: "off" }] },
            { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#2a2b2f" }] },
          ],
        });
        setLoading(false);
      })
      .catch((e) => {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : "Map failed to load");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    let placed = 0;

    listings.forEach((l) => {
      if (l.lat == null || l.lng == null) return;
      const position = { lat: l.lat, lng: l.lng };
      const isSelected = l.id === selectedId;
      const marker = new google.maps.Marker({
        position,
        map,
        title: l.business_name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isSelected ? 10 : 7,
          fillColor: isSelected ? "#f5c563" : "#e0a94c",
          fillOpacity: 1,
          strokeColor: "#0f0f10",
          strokeWeight: 2,
        },
        zIndex: isSelected ? 999 : undefined,
      });
      marker.addListener("click", () => onSelect(l));
      markersRef.current.push(marker);
      bounds.extend(position);
      placed++;
    });

    if (center) bounds.extend(center);
    if (placed > 0) {
      map.fitBounds(bounds, 64);
      if (placed === 1) {
        google.maps.event.addListenerOnce(map, "idle", () => {
          if ((map.getZoom() ?? 0) > 14) map.setZoom(14);
        });
      }
    }
  }, [listings, selectedId, center, onSelect]);

  // Sync radius circle + user marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google) return;

    circleRef.current?.setMap(null);
    centerMarkerRef.current?.setMap(null);
    circleRef.current = null;
    centerMarkerRef.current = null;

    if (center) {
      centerMarkerRef.current = new google.maps.Marker({
        position: center,
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: "#3b82f6",
          fillOpacity: 1,
          strokeColor: "#0f0f10",
          strokeWeight: 2,
        },
        zIndex: 1,
      });
      if (radiusKm && radiusKm > 0) {
        circleRef.current = new google.maps.Circle({
          map,
          center,
          radius: radiusKm * 1000,
          strokeColor: "#3b82f6",
          strokeOpacity: 0.5,
          strokeWeight: 1,
          fillColor: "#3b82f6",
          fillOpacity: 0.08,
        });
      }
    }
  }, [center, radiusKm]);

  const selected = listings.find((l) => l.id === selectedId) ?? null;

  return (
    <div className="relative w-full h-[70vh] min-h-[480px] rounded-2xl overflow-hidden border border-border bg-card">
      <div ref={ref} className="absolute inset-0" />
      {loading && (
        <div className="absolute inset-0 grid place-items-center bg-card/60 backdrop-blur-sm">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      )}
      {err && (
        <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground p-6 text-center">
          {err}
        </div>
      )}
      {selected && (
        <a
          href={`/creators/${selected.slug}`}
          className="absolute left-3 right-3 bottom-3 sm:left-4 sm:right-auto sm:bottom-4 sm:w-[320px] rounded-xl border border-border bg-background/95 backdrop-blur shadow-lg p-3 flex gap-3 hover:border-primary/40 transition"
        >
          <div className="h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-secondary">
            {selected.cover_url ? (
              <img src={selected.cover_url} alt={selected.business_name} className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-sm truncate">{selected.business_name}</p>
              {selected.min_price_inr != null && (
                <span className="text-xs font-display shrink-0">{formatINR(selected.min_price_inr)}+</span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              {selected.tagline ?? selected.categories.join(" · ")}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {selected.city ?? "—"}
              {selected.places_rating != null && <> · ★ {selected.places_rating.toFixed(1)} ({selected.places_review_count ?? 0})</>}
            </p>
          </div>
        </a>
      )}
    </div>
  );
}