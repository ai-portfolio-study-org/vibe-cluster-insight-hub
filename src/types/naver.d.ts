declare namespace naver.maps {
  class Map {
    constructor(element: HTMLElement, options: MapOptions);
  }

  class LatLng {
    constructor(lat: number, lng: number);
    lat(): number;
    lng(): number;
  }

  class Marker {
    constructor(options: MarkerOptions);
  }

  class Size {
    constructor(width: number, height: number);
  }

  class Point {
    constructor(x: number, y: number);
  }

  class Service {
    static reverseGeocode(
      options: { coords: LatLng; orders: string },
      callback: (status: string, response: ReverseGeocodeResponse) => void
    ): void;

    static OrderType: {
      LEGAL_CODE: string;
      ADDR: string;
    };

    static Status: {
      OK: string;
    };
  }

  interface MapOptions {
    center: LatLng;
    zoom: number;
    zoomControl?: boolean;
    zoomControlOptions?: {
      position: Position;
    };
  }

  interface MarkerOptions {
    position: LatLng;
    map: Map;
    icon?: {
      content: string;
      size: Size;
      anchor: Point;
    };
  }

  interface ReverseGeocodeResponse {
    v2: {
      results: Array<{
        region: {
          area1: { name: string };
          area2: { name: string };
        };
      }>;
    };
  }

  enum Position {
    TOP_RIGHT = "TOP_RIGHT",
  }

  namespace Event {
    function addListener(
      instance: Map | Marker,
      eventName: string,
      handler: (e: PointerEvent) => void
    ): void;
  }

  interface PointerEvent {
    coord: LatLng;
  }
}

interface Window {
  naver: {
    maps: typeof naver.maps & {
      onJSContentLoaded?: () => void;
    };
  };
} 