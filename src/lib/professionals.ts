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
  { id: "1",  name: "Aarav Mehta",      handle: "aarav.shoots",  category: "photographer", specialty: "Editorial · Portrait",      city: "Mumbai",     country: "India", rating: 4.9, reviews: 218, hourly: 12000, experience: 8,  languages: ["English", "Hindi", "Marathi"],   availability: "this-week",  image: p1 },
  { id: "2",  name: "Ishita Kapoor",    handle: "ishita.films",  category: "videographer", specialty: "Wedding · Cinematic",       city: "Udaipur",    country: "India", rating: 5.0, reviews: 142, hourly: 28000, experience: 10, languages: ["Hindi", "English"],              availability: "this-month", image: p2 },
  { id: "3",  name: "Daniel Kaur",      handle: "kaur.cuts",     category: "editor",       specialty: "Color · Retouching",        city: "Bengaluru",  country: "India", rating: 4.8, reviews: 96,  hourly: 3500,  experience: 5,  languages: ["English", "Punjabi"],            availability: "today",      image: p3 },
  { id: "4",  name: "Ines Fernandes",   handle: "ines.weds",     category: "photographer", specialty: "Wedding · Documentary",     city: "Goa",        country: "India", rating: 4.9, reviews: 311, hourly: 18000, experience: 7,  languages: ["English", "Konkani"],            availability: "this-week",  image: p4 },
  { id: "5",  name: "Arjun Khanna",     handle: "arjun.studio",  category: "photographer", specialty: "Fashion · Studio",          city: "New Delhi",  country: "India", rating: 4.7, reviews: 174, hourly: 22000, experience: 12, languages: ["Hindi", "English"],              availability: "this-month", image: p5 },
  { id: "6",  name: "Sora Tanaka",      handle: "sora.grade",    category: "editor",       specialty: "Video · Color grading",     city: "Pune",       country: "India", rating: 4.9, reviews: 88,  hourly: 5500,  experience: 6,  languages: ["English", "Hindi"],              availability: "today",      image: p6 },
  { id: "7",  name: "Studio Kuro",      handle: "kuro.shoots",   category: "photographer", specialty: "Product · Commercial",      city: "Hyderabad",  country: "India", rating: 4.8, reviews: 203, hourly: 16000, experience: 9,  languages: ["English", "Telugu", "Hindi"],    availability: "this-week",  image: p1 },
  { id: "8",  name: "Reel Collective",  handle: "reel.co",       category: "videographer", specialty: "Brand · Documentary",       city: "Chennai",    country: "India", rating: 4.6, reviews: 67,  hourly: 32000, experience: 11, languages: ["English", "Tamil"],              availability: "this-month", image: p2 },
  { id: "9",  name: "Priya Raman",      handle: "priya.edits",   category: "editor",       specialty: "Photo · Cull & Retouch",    city: "Coimbatore", country: "India", rating: 5.0, reviews: 154, hourly: 2800,  experience: 4,  languages: ["English", "Hindi", "Tamil"],     availability: "today",      image: p3 },
  { id: "10", name: "Camille D'Souza",  handle: "camille.r",     category: "photographer", specialty: "Lifestyle · Travel",        city: "Rishikesh",  country: "India", rating: 4.7, reviews: 129, hourly: 14000, experience: 6,  languages: ["English", "Hindi"],              availability: "this-week",  image: p4 },
  { id: "11", name: "Noah Bennett",     handle: "noah.films",    category: "videographer", specialty: "Music · Live",              city: "Shillong",   country: "India", rating: 4.5, reviews: 54,  hourly: 19000, experience: 5,  languages: ["English", "Khasi"],              availability: "this-month", image: p5 },
  { id: "12", name: "Hana Park",        handle: "hana.color",    category: "editor",       specialty: "Cinema · DI Color",         city: "Kolkata",    country: "India", rating: 4.9, reviews: 112, hourly: 6500,  experience: 7,  languages: ["English", "Bengali"],            availability: "this-week",  image: p6 },
];

export const CITIES = Array.from(new Set(PROFESSIONALS.map((p) => p.city))).sort();

export function getProfessional(handle: string): Professional | undefined {
  return PROFESSIONALS.find((p) => p.handle === handle);
}
