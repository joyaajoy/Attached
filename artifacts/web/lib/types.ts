export type Station = {
  code: string;
  title: string;
  popular_title?: string;
  short_title?: string;
  region?: string | null;
};

export type Segment = {
  uid: string;
  number: string;
  title: string;
  departure: string; // ISO datetime
  arrival: string; // ISO datetime
  duration: number; // seconds
  from_station: Station;
  to_station: Station;
  price_min: number | null;
  price_max: number | null;
  transport_subtype: string | null;
  thread_express_type: string | null;
  has_transfers?: boolean;
};

export type ScheduleResponse = {
  date: string;
  from: Station;
  to: Station;
  segments: Segment[];
};

export type Ticket = {
  id: string;
  createdAt: string;
  travelDate: string;
  passenger: {
    fullName: string;
    document: string;
  };
  segment: {
    uid: string;
    number: string;
    title: string;
    departure: string;
    arrival: string;
    duration: number;
    fromTitle: string;
    fromCode: string;
    toTitle: string;
    toCode: string;
    transportSubtype: string | null;
    expressType: string | null;
  };
  price: number;
  seat: string;
  status: "paid" | "used" | "cancelled";
};
