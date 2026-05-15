import p1 from "@/assets/pro-1.jpg";
import p2 from "@/assets/pro-2.jpg";
import p3 from "@/assets/pro-3.jpg";
import p4 from "@/assets/pro-4.jpg";
import p5 from "@/assets/pro-5.jpg";
import p6 from "@/assets/pro-6.jpg";

export type Category = "photographer" | "videographer" | "editor";
export type Availability = "today" | "this-week" | "this-month";

export interface Professional {
  id: string;
  name: string;
  handle: string;
  category: Category;
  specialty: string;
  city: string;
  country: string;
  rating: number;
  reviews: number;
  hourly: number; // USD
  experience: number; // years
  languages: string[];
  availability: Availability;
  image: string;
}

export const PROFESSIONALS: Professional[] = [
  { id: "1", name: "Lior Avraham", handle: "lior.shoots", category: "photographer", specialty: "Editorial · Portrait", city: "New York", country: "USA", rating: 4.9, reviews: 218, hourly: 320, experience: 8, languages: ["English", "Hebrew"], availability: "this-week", image: p1 },
  { id: "2", name: "Marta Esposito", handle: "marta.films", category: "videographer", specialty: "Wedding · Cinematic", city: "Florence", country: "Italy", rating: 5.0, reviews: 142, hourly: 480, experience: 10, languages: ["Italian", "English"], availability: "this-month", image: p2 },
  { id: "3", name: "Daniel Kaur", handle: "kaur.cuts", category: "editor", specialty: "Color · Retouching", city: "London", country: "UK", rating: 4.8, reviews: 96, hourly: 95, experience: 5, languages: ["English"], availability: "today", image: p3 },
  { id: "4", name: "Ines Romero", handle: "ines.weds", category: "photographer", specialty: "Wedding · Documentary", city: "Barcelona", country: "Spain", rating: 4.9, reviews: 311, hourly: 260, experience: 7, languages: ["Spanish", "English"], availability: "this-week", image: p4 },
  { id: "5", name: "Adam Kovac", handle: "adam.studio", category: "photographer", specialty: "Fashion · Studio", city: "Berlin", country: "Germany", rating: 4.7, reviews: 174, hourly: 410, experience: 12, languages: ["German", "English"], availability: "this-month", image: p5 },
  { id: "6", name: "Sora Tanaka", handle: "sora.grade", category: "editor", specialty: "Video · Color grading", city: "Tokyo", country: "Japan", rating: 4.9, reviews: 88, hourly: 140, experience: 6, languages: ["Japanese", "English"], availability: "today", image: p6 },
  { id: "7", name: "Studio Kuro", handle: "kuro.shoots", category: "photographer", specialty: "Product · Commercial", city: "Tokyo", country: "Japan", rating: 4.8, reviews: 203, hourly: 380, experience: 9, languages: ["Japanese", "English"], availability: "this-week", image: p1 },
  { id: "8", name: "Reel Collective", handle: "reel.co", category: "videographer", specialty: "Brand · Documentary", city: "Los Angeles", country: "USA", rating: 4.6, reviews: 67, hourly: 520, experience: 11, languages: ["English", "Spanish"], availability: "this-month", image: p2 },
  { id: "9", name: "Priya Raman", handle: "priya.edits", category: "editor", specialty: "Photo · Cull & Retouch", city: "Mumbai", country: "India", rating: 5.0, reviews: 154, hourly: 70, experience: 4, languages: ["English", "Hindi"], availability: "today", image: p3 },
  { id: "10", name: "Camille Roux", handle: "camille.r", category: "photographer", specialty: "Lifestyle · Travel", city: "Paris", country: "France", rating: 4.7, reviews: 129, hourly: 290, experience: 6, languages: ["French", "English"], availability: "this-week", image: p4 },
  { id: "11", name: "Noah Becker", handle: "noah.films", category: "videographer", specialty: "Music · Live", city: "Berlin", country: "Germany", rating: 4.5, reviews: 54, hourly: 360, experience: 5, languages: ["German", "English"], availability: "this-month", image: p5 },
  { id: "12", name: "Hana Park", handle: "hana.color", category: "editor", specialty: "Cinema · DI Color", city: "Seoul", country: "South Korea", rating: 4.9, reviews: 112, hourly: 160, experience: 7, languages: ["Korean", "English"], availability: "this-week", image: p6 },
];

export const CITIES = Array.from(new Set(PROFESSIONALS.map((p) => p.city))).sort();

export function getProfessional(handle: string): Professional | undefined {
  return PROFESSIONALS.find((p) => p.handle === handle);
}
