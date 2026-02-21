export type UserRole = 'customer' | 'driver' | 'admin'

export type RideStatus =
  | 'pending'
  | 'accepted'
  | 'arriving'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export type DriverStatus = 'pending' | 'approved' | 'rejected' | 'suspended'

export interface Profile {
  id: string
  role: UserRole
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface DriverProfile {
  id: string
  license_number: string | null
  vehicle_model: string | null
  vehicle_color: string | null
  vehicle_plate: string | null
  vehicle_class: string | null
  vehicle_year: number | null
  experience_years: number | null
  status: DriverStatus
  current_lat: number | null
  current_lng: number | null
  is_online: boolean
  rating_avg: number
  total_rides: number
  wallet_balance: number
  documents_url: string | null
  created_at: string
  updated_at: string
  // Joined fields
  profiles?: Profile
}

export interface Ride {
  id: string
  customer_id: string
  driver_id: string | null
  tariff_id: string | null
  pickup_address: string
  pickup_lat: number
  pickup_lng: number
  dropoff_address: string
  dropoff_lat: number
  dropoff_lng: number
  status: RideStatus
  estimated_fare: number | null
  fare_estimate: number | null
  fare_final: number | null
  distance_km: number | null
  duration_min: number | null
  created_at: string
  started_at: string | null
  completed_at: string | null
  // Joined fields
  profiles?: Profile
  driver_profiles?: DriverProfile & { profiles?: Profile }
  tariffs?: Tariff
}

export interface Rating {
  id: string
  ride_id: string
  from_user_id: string
  to_user_id: string
  rating: number
  comment: string | null
  created_at: string
}

export interface Tariff {
  id: string
  name: string
  icon: 'economy' | 'comfort' | 'business' | 'xl'
  description: string | null
  multiplier: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PromoCode {
  id: string
  code: string
  discount_percent: number
  discount_amount: number | null
  max_uses: number
  current_uses: number
  expires_at: string | null
  is_active: boolean
  created_at: string
}

export interface LatLng {
  lat: number
  lng: number
}

export interface RouteInfo {
  distance_km: number
  duration_min: number
  geometry: [number, number][]
}

export interface FareEstimate {
  base_fare: number
  distance_cost: number
  time_cost: number
  total: number
  distance_km: number
  duration_min: number
}

export interface DashboardStats {
  totalRides: number
  totalRevenue: number
  activeDrivers: number
  activeRiders: number
  ridesThisWeek: number
  revenueThisWeek: number
  pendingDrivers: number
  approvedDrivers: number
  ridesToday: number
  revenueToday: number
}
